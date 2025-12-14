#!/usr/bin/env python3
"""
SafeChain LoRa Gateway Listener
Reads LoRa packets from serial and sends to PHP API
"""

import serial
import json
import requests
import time
from datetime import datetime

# ============================================
# CONFIGURATION - CHANGE THESE FOR YOUR SETUP
# ============================================
SERIAL_PORT = 'COM3'  # Windows: COM3, COM4, etc. | Linux: /dev/ttyUSB0, /dev/ttyACM0
BAUD_RATE = 115200
API_ENDPOINT = 'http://localhost/safechain/api/receive_incident.php'

# ============================================
# FUNCTIONS
# ============================================

def init_serial():
    """Initialize serial connection to LoRa gateway"""
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"✓ Connected to LoRa Gateway on {SERIAL_PORT}")
        time.sleep(2)  # Wait for connection to stabilize
        return ser
    except Exception as e:
        print(f"✗ Error connecting to serial port: {e}")
        print(f"\nTroubleshooting:")
        print(f"  - Check if {SERIAL_PORT} is correct (Device Manager on Windows)")
        print(f"  - Make sure no other program is using this port")
        print(f"  - Try unplugging and replugging the LoRa gateway")
        return None

def parse_lora_packet(data):
    """Parse incoming LoRa data - supports JSON or CSV format"""
    try:
        data = data.strip()
        
        # Try JSON format first
        if data.startswith('{'):
            packet = json.loads(data)
            return packet
        
        # Fallback to CSV format: device_id,button,lat,lng
        elif ',' in data:
            parts = data.split(',')
            if len(parts) >= 4:
                return {
                    'device_id': parts[0].strip(),
                    'button': parts[1].strip(),
                    'lat': float(parts[2]),
                    'lng': float(parts[3]),
                    'type': 'INCIDENT',
                    'timestamp': int(time.time())
                }
    except Exception as e:
        print(f"✗ Parse error: {e}")
    return None

def send_to_api(packet):
    """Send parsed data to PHP API"""
    try:
        response = requests.post(API_ENDPOINT, json=packet, timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                incident_id = result.get('incident_id')
                reporter = result.get('reporter', 'Unknown')
                print(f"✓ Saved: {incident_id} - {reporter}")
                return True
            else:
                print(f"✗ API Error: {result.get('message')}")
        else:
            print(f"✗ HTTP Error: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print(f"✗ Cannot connect to {API_ENDPOINT}")
        print(f"   Make sure XAMPP Apache is running!")
    except Exception as e:
        print(f"✗ Request failed: {e}")
    return False

def main():
    """Main loop"""
    print("=" * 60)
    print("         SafeChain LoRa Gateway Listener v1.0")
    print("=" * 60)
    print()
    
    # Initialize serial connection
    ser = init_serial()
    if not ser:
        print("\n❌ Failed to connect to serial port. Exiting.")
        input("Press Enter to exit...")
        return
    
    print(f"📡 Listening for LoRa packets...\n")
    print("Waiting for emergency button press...\n")
    
    buffer = ""
    packet_count = 0
    
    try:
        while True:
            # Read incoming data
            if ser.in_waiting > 0:
                chunk = ser.read(ser.in_waiting).decode('utf-8', errors='ignore')
                buffer += chunk
                
                # Process complete lines
                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    line = line.strip()
                    
                    # Skip empty lines
                    if not line:
                        continue
                    
                    # Skip debug messages from ESP32
                    if line.startswith('===') or 'GPS' in line or 'Sent:' in line:
                        print(f"[DEBUG] {line}")
                        continue
                    
                    packet_count += 1
                    timestamp = datetime.now().strftime('%H:%M:%S')
                    print(f"\n[{timestamp}] 📦 Packet #{packet_count}")
                    print(f"Raw: {line}")
                    
                    # Parse packet
                    packet = parse_lora_packet(line)
                    if packet:
                        print(f"→ Device: {packet['device_id']}")
                        print(f"→ Type: {packet['button'].upper()}")
                        print(f"→ Location: ({packet['lat']:.6f}, {packet['lng']:.6f})")
                        
                        # Send to API
                        send_to_api(packet)
                    else:
                        print("⚠ Could not parse packet")
            
            time.sleep(0.1)  # Prevent CPU overuse
            
    except KeyboardInterrupt:
        print("\n\n⏹ Stopping listener...")
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
    finally:
        if ser and ser.is_open:
            ser.close()
            print("✓ Serial connection closed")
        print("\nGoodbye! 👋")

if __name__ == "__main__":
    main()