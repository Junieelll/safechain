#!/usr/bin/env python3
"""
SafeChain LoRa Gateway Bridge Server
Updated for Dynamic Integer IDs, Multi-line Parsing, & NVS Commits
"""

import serial
import json
import requests
import time
import re
from datetime import datetime
import sqlite3
import os

# ============================================
# CONFIGURATION
# ============================================
SERIAL_PORT = 'COM11'  
BAUD_RATE = 115200

LOCAL_API = 'http://localhost/safechain/api/receive_incident.php'
REMOTE_API = 'https://safechain.site/api/receive_incident.php'
MODE = 'both'

TYPE_MAP = {
    'FIRE': 'fire',
    'FLOOD': 'flood',
    'CRIME': 'crime',
    'SOS': 'crime',
    'SAFE': 'safe'
}

DB_FILE = 'offline_queue.db'

def init_queue_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS incident_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            packet_data TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            sent INTEGER DEFAULT 0
        )''')
    conn.commit()
    conn.close()

def add_to_queue(packet):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('INSERT INTO incident_queue (packet_data, created_at) VALUES (?, ?)',
                  (json.dumps(packet), int(time.time())))
        conn.commit()
        conn.close()
        return True
    except:
        return False

# ============================================
# PARSING LOGIC
# ============================================
current_alert_state = {
    'active': False,
    'type': None,
    'fob_id': None,   # Stores integers like '105'
    'event_id': None, # 🚀 NEW: Added to track the NVS ID
    'lat': None,
    'lng': None,
    'start_time': 0
}

def process_gateway_line(line):
    global current_alert_state
    
    if "FIRE ALARM" in line:
        current_alert_state = {'active': True, 'type': 'FIRE', 'fob_id': None, 'event_id': None, 'lat': None, 'lng': None, 'start_time': time.time()}
        return None
        
    if "FLOOD ALERT" in line:
        current_alert_state = {'active': True, 'type': 'FLOOD', 'fob_id': None, 'event_id': None, 'lat': None, 'lng': None, 'start_time': time.time()}
        return None

    if "CRIME ALERT" in line or "SOS ALERT" in line:
        current_alert_state = {'active': True, 'type': 'CRIME', 'fob_id': None, 'event_id': None, 'lat': None, 'lng': None, 'start_time': time.time()}
        return None

    if "MARKED SAFE" in line:
        current_alert_state = {'active': True, 'type': 'SAFE', 'fob_id': None, 'event_id': None, 'lat': None, 'lng': None, 'start_time': time.time()}
        return None

    if current_alert_state['active']:
        if time.time() - current_alert_state['start_time'] > 2:
            current_alert_state['active'] = False
            return None

        # Dynamically grabs whatever follows "NODE ID :" (e.g. 105)
        if "NODE ID" in line:
            parts = line.split(':')
            if len(parts) > 1:
                current_alert_state['fob_id'] = parts[1].strip()

        # 🚀 NEW: Grab the Event ID so we can commit/delete it from the Gateway's memory
        if "EVENT ID" in line or "EventID=" in line:
            match = re.search(r'(?:EVENT ID\s*[:=]\s*|EventID=)(\d+)', line, re.IGNORECASE)
            if match:
                current_alert_state['event_id'] = match.group(1)

        if "LOCATION" in line:
            try:
                coords_str = line.split(':')[1].strip()
                lat_str, lng_str = coords_str.split(',')
                current_alert_state['lat'] = float(lat_str)
                current_alert_state['lng'] = float(lng_str)
                
                if current_alert_state['fob_id'] and current_alert_state['lat'] is not None:
                    return finalize_packet()
                    
            except Exception as e:
                print(f"Error parsing location: {line} -> {e}")

    return None

def finalize_packet():
    global current_alert_state
    
    fob_id = current_alert_state['fob_id']
    event_id = current_alert_state['event_id']
    raw_type = current_alert_state['type']
    
    device_id = fob_id 
    button_type = TYPE_MAP.get(raw_type, 'crime')
    
    packet = {
        'device_id': device_id, 
        'event_id': event_id if event_id else '0', # 🚀 NEW: Add event_id to the payload
        'type': 'INCIDENT',
        'button': button_type,
        'lat': current_alert_state['lat'],
        'lng': current_alert_state['lng'],
        'fob_id': fob_id,
        'alert_type': raw_type,
        'timestamp': int(time.time())
    }

    current_alert_state = {'active': False, 'type': None, 'fob_id': None, 'event_id': None, 'lat': None, 'lng': None, 'start_time': 0}
    return packet

# ============================================
# API SENDING
# ============================================
def send_to_server(packet, api_url, name):
    try:
        headers = {
            'User-Agent': 'SafeChain-Gateway/1.0',
            'Content-Type': 'application/json'
        }
        
        api_payload = {
            'device_id': packet['device_id'],
            'type': packet['type'],
            'button': packet['button'],
            'lat': packet['lat'],
            'lng': packet['lng']
        }
        
        print(f"  → Sending to {name}...")
        resp = requests.post(api_url, json=api_payload, headers=headers, timeout=10)
        
        if resp.status_code == 200 and resp.json().get('success'):
            print(f"  ✓ {name} Success")
            return True
        else:
            print(f"  ✗ {name} Failed: {resp.text[:100]}")
            return False
    except Exception as e:
        print(f"  ✗ {name} Error: {e}")
        return False

# ============================================
# MAIN
# ============================================
def main():
    init_queue_db()
    
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"✓ Connected to {SERIAL_PORT}")
    except:
        print(f"❌ Could not open {SERIAL_PORT}")
        return

    print("📡 Listening for multi-line gateway packets...")

    while True:
        try:
            if ser.in_waiting:
                raw_line = ser.readline().decode('utf-8', errors='ignore').strip()
                if not raw_line: continue
                
                print(f"[Gateway] {raw_line}")
                packet = process_gateway_line(raw_line)
                
                if packet:
                    print("\n" + "="*50)
                    print(f"📦 ALERT DETECTED: {packet['alert_type']} from Node {packet['device_id']}")
                    
                    if packet['lat'] == 0.0 and packet['lng'] == 0.0:
                        print("⚠ WARNING: GPS IS 0.0, 0.0 (No GPS Fix)")
                    
                    securely_saved = False # Track if it made it to the server or local DB

                    if MODE in ['local', 'both']:
                        if send_to_server(packet, LOCAL_API, 'Local'):
                            securely_saved = True
                    if MODE in ['remote', 'both']:
                        if send_to_server(packet, REMOTE_API, 'Remote'):
                            securely_saved = True
                        else:
                            if add_to_queue(packet):
                                print("  📥 Saved to offline queue")
                                securely_saved = True
                    
                    # 🚀 THE NVS WIPE: Tell the Gateway the data is safely on the server!
                    if securely_saved and packet.get('event_id') and packet['event_id'] != '0':
                        commit_cmd = f"commit {packet['device_id']} {packet['event_id']}\n"
                        ser.write(commit_cmd.encode('utf-8'))
                        print(f"  [Gateway] Sent confirmation: {commit_cmd.strip()}")
                        
                    print("="*50 + "\n")
                    
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}")

    ser.close()

if __name__ == "__main__":
    main()