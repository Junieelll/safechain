#!/usr/bin/env python3
"""
SafeChain LoRa Gateway Bridge Server
Updated for Multi-line Gateway Output (with Emojis)
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

# API Endpoints
LOCAL_API = 'http://localhost/safechain/api/receive_incident.php'
REMOTE_API = 'https://safechain.site/api/receive_incident.php'

MODE = 'both'  # 'local', 'remote', or 'both'

# Device ID mapping
DEVICE_MAP = {
    'FOB01': 'SC-KC-001',
    'FOB02': 'SC-KC-002',
    'FOB03': 'SC-KC-003',
    'FOB04': 'SC-KC-004',
    'FOB05': 'SC-KC-005',
    'FOB06': 'SC-KC-006',
    'FOB07': 'SC-KC-007',
    'FOB08': 'SC-KC-008',
    'FOB09': 'SC-KC-009',
    'FOB10': 'SC-KC-010',
}

# Type mapping for API
TYPE_MAP = {
    'FIRE': 'fire',
    'FLOOD': 'flood',
    'CRIME': 'crime',
    'SOS': 'crime'
}

# ============================================
# QUEUE & DATABASE (Unchanged)
# ============================================
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
# PARSING LOGIC (COMPLETELY REWRITTEN)
# ============================================

# State variable to hold data while reading multiple lines
current_alert_state = {
    'active': False,
    'type': None,     # FIRE, FLOOD, etc.
    'fob_id': None,   # FOB01
    'lat': None,
    'lng': None,
    'start_time': 0
}

def process_gateway_line(line):
    """
    Parses multi-line output.
    Returns a PACKET dict if an alert is fully assembled, otherwise None.
    """
    global current_alert_state
    
    # 1. Detect Start of Alarm (Keywords in the emoji lines)
    if "FIRE ALARM" in line:
        current_alert_state = {'active': True, 'type': 'FIRE', 'fob_id': None, 'lat': None, 'lng': None, 'start_time': time.time()}
        return None
        
    if "FLOOD ALERT" in line:
        current_alert_state = {'active': True, 'type': 'FLOOD', 'fob_id': None, 'lat': None, 'lng': None, 'start_time': time.time()}
        return None

    # 2. Extract Data if inside an active alert block
    if current_alert_state['active']:
        
        # Check for timeout (if we found a header but no data for 2 seconds, reset)
        if time.time() - current_alert_state['start_time'] > 2:
            current_alert_state['active'] = False
            return None

        # Extract Node ID (e.g., "NODE ID : FOB01")
        if "NODE ID" in line:
            match = re.search(r'(FOB\d+)', line)
            if match:
                current_alert_state['fob_id'] = match.group(1)

        # Extract Location (e.g., "LOCATION : 14.123, 121.123")
        if "LOCATION" in line:
            try:
                # Split by ':' then by ','
                coords_str = line.split(':')[1].strip()
                lat_str, lng_str = coords_str.split(',')
                current_alert_state['lat'] = float(lat_str)
                current_alert_state['lng'] = float(lng_str)
                
                # TRIGGER CONDITION: We have Type, ID, and Location
                if current_alert_state['fob_id'] and current_alert_state['lat'] is not None:
                    return finalize_packet()
                    
            except Exception as e:
                print(f"Error parsing location: {line} -> {e}")

    return None

def finalize_packet():
    """Builds the final packet and resets state"""
    global current_alert_state
    
    fob_id = current_alert_state['fob_id']
    raw_type = current_alert_state['type']
    
    # Map to real values
    device_id = DEVICE_MAP.get(fob_id)
    button_type = TYPE_MAP.get(raw_type, 'crime')
    
    packet = None
    
    if device_id:
        packet = {
            'device_id': device_id,
            'type': 'INCIDENT',
            'button': button_type,
            'lat': current_alert_state['lat'],
            'lng': current_alert_state['lng'],
            'fob_id': fob_id,
            'alert_type': raw_type,
            'timestamp': int(time.time())
        }
    else:
        print(f"⚠ Unknown FOB ID: {fob_id} (Not in DEVICE_MAP)")

    # Reset state
    current_alert_state = {'active': False, 'type': None, 'fob_id': None, 'lat': None, 'lng': None, 'start_time': 0}
    return packet

# ============================================
# API SENDING
# ============================================

def send_to_server(packet, api_url, name):
    try:
        # Headers needed for Hostinger/Cloudflare
        headers = {
            'User-Agent': 'SafeChain-Gateway/1.0',
            'Content-Type': 'application/json'
        }
        
        # Strip internal fields before sending
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
            print(f"  ✓ {name} Success: Incident ID {resp.json().get('incident_id')}")
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
    print("   (Waiting for 'FIRE ALARM' or 'FLOOD ALERT' headers)")

    while True:
        try:
            if ser.in_waiting:
                raw_line = ser.readline().decode('utf-8', errors='ignore').strip()
                if not raw_line: continue
                
                print(f"[Gateway] {raw_line}")
                
                # Process the line
                packet = process_gateway_line(raw_line)
                
                if packet:
                    print("\n" + "="*50)
                    print(f"📦 ALERT DETECTED: {packet['alert_type']} from {packet['fob_id']}")
                    
                    if packet['lat'] == 0 and packet['lng'] == 0:
                        print("⚠ WARNING: GPS IS 0.0, 0.0 (No GPS Fix)")
                        # We still send it, relying on resident address lookup in PHP
                    
                    # Send
                    if MODE in ['local', 'both']:
                        send_to_server(packet, LOCAL_API, 'Local')
                    if MODE in ['remote', 'both']:
                        if not send_to_server(packet, REMOTE_API, 'Remote'):
                            add_to_queue(packet)
                            print("  📥 Saved to offline queue")
                    print("="*50 + "\n")
                    
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}")

    ser.close()

if __name__ == "__main__":
    main()