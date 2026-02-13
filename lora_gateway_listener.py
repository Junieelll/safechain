#!/usr/bin/env python3
"""
SafeChain LoRa Gateway Bridge Server
Compatible with gateway that outputs decoded text format
Format: FOB01 FIRE 14.7158 121.0403
"""

import serial
import json
import requests
import time
import re
from datetime import datetime
import sqlite3  # added for offline db
import os

# ============================================
# CONFIGURATION - CHANGE THESE FOR YOUR SETUP
# ============================================
SERIAL_PORT = 'COM11'  # Windows: COM3, COM4, etc. | Linux: /dev/ttyUSB0, /dev/ttyACM0
BAUD_RATE = 115200

# API Endpoints
LOCAL_API = 'http://localhost/safechain/api/receive_incident.php'
REMOTE_API = 'https://safechain.site/api/receive_incident.php'  # ← FIXED: Added second slash

# Mode: 'local', 'remote', or 'both'
MODE = 'remote'  # Start with 'both' for testing

# Queue settings
DB_FILE = 'offline_queue.db'
RETRY_INTERVAL = 30  # seconds
MAX_RETRIES = 10

# Device ID mapping (FOB01 -> SC-KC-001)
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

# Type mapping
TYPE_MAP = {
    'FIRE': 'fire',
    'CRIME': 'crime',
    'FLOOD': 'flood',
    'SAFE': 'crime',     # Gateway may send SAFE
    'TEST': 'crime'      # Gateway may send TEST
}

# ============================================
# QUEUE DATABASE FUNCTIONS
# ============================================

def init_queue_db():
    """Initialize SQLite database for offline queue"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS incident_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            packet_data TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            retry_count INTEGER DEFAULT 0,
            sent INTEGER DEFAULT 0,
            last_error TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print(f"✓ Offline queue database initialized: {DB_FILE}")

def add_to_queue(packet):
    """Add packet to offline queue"""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('INSERT INTO incident_queue (packet_data, created_at) VALUES (?, ?)',
                  (json.dumps(packet), int(time.time())))
        conn.commit()
        queue_id = c.lastrowid
        conn.close()
        return queue_id
    except Exception as e:
        print(f"  ✗ Failed to add to queue: {e}")
        return None

def get_pending_queue():
    """Get all unsent packets from queue"""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''
            SELECT id, packet_data, retry_count 
            FROM incident_queue 
            WHERE sent = 0 AND retry_count < ? 
            ORDER BY created_at
        ''', (MAX_RETRIES,))
        items = c.fetchall()
        conn.close()
        return [(row[0], json.loads(row[1]), row[2]) for row in items]
    except Exception as e:
        print(f"  ✗ Failed to get queue: {e}")
        return []

def mark_sent(queue_id):
    """Mark packet as successfully sent"""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('UPDATE incident_queue SET sent = 1 WHERE id = ?', (queue_id,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"  ✗ Failed to mark as sent: {e}")

def increment_retry(queue_id, error_msg=""):
    """Increment retry count"""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''
            UPDATE incident_queue 
            SET retry_count = retry_count + 1,
                last_error = ?
            WHERE id = ?
        ''', (error_msg, queue_id))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"  ✗ Failed to update retry count: {e}")

def get_queue_stats():
    """Get queue statistics"""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('SELECT COUNT(*) FROM incident_queue WHERE sent = 0')
        pending = c.fetchone()[0]
        c.execute('SELECT COUNT(*) FROM incident_queue WHERE sent = 1')
        sent = c.fetchone()[0]
        conn.close()
        return {'pending': pending, 'sent': sent}
    except:
        return {'pending': 0, 'sent': 0}

# ============================================
# SERIAL & PARSING
# ============================================

def init_serial():
    """Initialize serial connection to LoRa gateway"""
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"✓ Connected to LoRa Gateway on {SERIAL_PORT}")
        time.sleep(2)
        return ser
    except Exception as e:
        print(f"✗ Error connecting to serial port: {e}")
        print(f"\nTroubleshooting:")
        print(f"  - Check if {SERIAL_PORT} is correct (Device Manager on Windows)")
        print(f"  - Make sure no other program is using this port (Arduino IDE, etc.)")
        print(f"  - Try unplugging and replugging the gateway")
        return None

def parse_gateway_output(line):
    """
    Parse gateway output format: FOB01 FIRE 14.7158 121.0403
    Returns dict with device_id, button, lat, lng
    """
    try:
        # Look for lines that match the packet format
        # Format: FOBXX TYPE LAT LNG
        match = re.match(r'(FOB\d+)\s+(\w+)\s+([\d\.-]+)\s+([\d\.-]+)', line)
        
        if match:
            fob_id = match.group(1)
            alert_type = match.group(2)
            lat = float(match.group(3))
            lng = float(match.group(4))
            
            # Get device ID from mapping
            device_id = DEVICE_MAP.get(fob_id)
            if not device_id:
                print(f"⚠ Unknown FOB ID: {fob_id} - Add to DEVICE_MAP")
                return None
            
            # Get incident type from mapping
            incident_type = TYPE_MAP.get(alert_type, 'crime')
            
            return {
                'device_id': device_id,
                'type': 'INCIDENT',
                'button': incident_type,
                'lat': lat,
                'lng': lng,
                'fob_id': fob_id,
                'alert_type': alert_type,
                'timestamp': int(time.time())
            }
    except Exception as e:
        print(f"✗ Parse error: {e}")
    
    return None

# ============================================
# API COMMUNICATION
# ============================================

def send_to_server(packet, api_url, server_name):
    """Send packet to specified API endpoint"""
    try:
        # Extract only needed fields for API
        api_packet = {
            'device_id': packet['device_id'],
            'type': packet['type'],
            'button': packet['button'],
            'lat': packet['lat'],
            'lng': packet['lng']
        }
        
        response = requests.post(
            api_url, 
            json=api_packet, 
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                incident_id = result.get('incident_id', 'N/A')
                reporter = result.get('reporter', 'Unknown')
                reporter_id = result.get('reporter_id', '')
                print(f"  ✓ [{server_name}] Saved: {incident_id} - {reporter} ({reporter_id})")
                return True
            else:
                error_msg = result.get('message', 'Unknown error')
                print(f"  ✗ [{server_name}] API Error: {error_msg}")
                return False
        else:
            print(f"  ✗ [{server_name}] HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"  ✗ [{server_name}] Connection failed (offline?)")
        return False
    except requests.exceptions.Timeout:
        print(f"  ✗ [{server_name}] Request timeout")
        return False
    except Exception as e:
        print(f"  ✗ [{server_name}] Error: {e}")
        return False

def process_packet(packet):
    """Process new packet - send to server(s) and queue if needed"""
    local_success = False
    remote_success = False
    
    # Send to local API (XAMPP)
    if MODE in ['local', 'both']:
        print("  → Sending to LOCAL server...")
        local_success = send_to_server(packet, LOCAL_API, 'LOCAL')
    
    # Send to remote API (Hostinger)
    if MODE in ['remote', 'both']:
        print("  → Sending to REMOTE server...")
        remote_success = send_to_server(packet, REMOTE_API, 'REMOTE')
        
        # If remote failed, add to queue
        if not remote_success:
            queue_id = add_to_queue(packet)
            if queue_id:
                print(f"  📥 Added to offline queue (ID: {queue_id})")
    
    return local_success or remote_success

def process_queue():
    """Try to send queued packets"""
    pending = get_pending_queue()
    
    if not pending:
        return
    
    print(f"\n{'='*70}")
    print(f"📤 Processing {len(pending)} queued packets...")
    print(f"{'='*70}")
    
    success_count = 0
    
    for queue_id, packet, retry_count in pending:
        print(f"\nQueue ID {queue_id} (Retry {retry_count + 1}/{MAX_RETRIES}):")
        
        if send_to_server(packet, REMOTE_API, 'REMOTE'):
            mark_sent(queue_id)
            success_count += 1
            print(f"  ✓ Successfully sent!")
        else:
            increment_retry(queue_id, "Connection failed")
            print(f"  ✗ Failed (will retry later)")
    
    if success_count > 0:
        print(f"\n✓ Sent {success_count}/{len(pending)} queued packets")
    
    stats = get_queue_stats()
    print(f"📊 Queue Status: {stats['pending']} pending, {stats['sent']} sent total")

# ============================================
# MAIN LOOP
# ============================================

def main():
    """Main loop"""
    print("=" * 70)
    print("         SafeChain Bridge Server v1.0")
    print("         Local Gateway → Cloud Server")
    print("=" * 70)
    print()
    print(f"Mode: {MODE.upper()}")
    print(f"Local API:  {LOCAL_API}")
    print(f"Remote API: {REMOTE_API}")
    print()
    
    # Initialize queue database
    init_queue_db()

    # Check for existing queued packets
    stats = get_queue_stats()
    if stats['pending'] > 0:
        print(f"⚠ Found {stats['pending']} pending packets in queue")
        print(f"  Will attempt to send them every {RETRY_INTERVAL} seconds")

    # Initialize serial connection
    ser = init_serial()
    if not ser:
        print("\n❌ Failed to connect to serial port. Exiting.")
        input("Press Enter to exit...")
        return
    
    print(f"\n📡 Listening for gateway packets...\n")
    print("Device Mapping:")
    for fob, device in DEVICE_MAP.items():
        print(f"  {fob} → {device}")
    print()
    
    packet_count = 0
    last_queue_check = time.time()  # Track last queue check

    try:
        while True:
            if ser.in_waiting > 0:
                # Read line from gateway
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                
                # Skip empty lines
                if not line:
                    continue
                
                # Show all output for debugging
                print(f"[Gateway] {line}")
                
                # Try to parse as incident packet
                packet = parse_gateway_output(line)
                
                if packet:
                    packet_count += 1
                    timestamp = datetime.now().strftime('%H:%M:%S')
                    
                    print(f"\n{'='*70}")
                    print(f"[{timestamp}] 📦 ALERT #{packet_count} DETECTED")
                    print(f"{'='*70}")
                    print(f"FOB ID:      {packet['fob_id']}")
                    print(f"Device ID:   {packet['device_id']}")
                    print(f"Alert Type:  {packet['alert_type']} → {packet['button'].upper()}")
                    print(f"Location:    ({packet['lat']:.6f}, {packet['lng']:.6f})")
                    print(f"{'='*70}")
                    
                    # Process packet (send to APIs)
                    process_packet(packet)
                    print()
            
            # ← FIXED: Added queue processing check
            # Process queue every RETRY_INTERVAL seconds
            if time.time() - last_queue_check > RETRY_INTERVAL:
                process_queue()
                last_queue_check = time.time()
            
            time.sleep(0.05)  # Small delay to prevent CPU overuse
            
    except KeyboardInterrupt:
        print("\n\n⏹ Stopping bridge server...")
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if ser and ser.is_open:
            ser.close()
            print("✓ Serial connection closed")

        # Show final queue stats
        stats = get_queue_stats()
        if stats['pending'] > 0:
            print(f"\n⚠ Warning: {stats['pending']} packets still in queue")
            print(f"   Run this script again when internet is available to retry")
        
        print("\nGoodbye! 👋")

if __name__ == "__main__":
    main()