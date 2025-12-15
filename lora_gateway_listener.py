#!/usr/bin/env python3
"""
SafeChain LoRa Gateway Listener
Compatible with gateway that outputs decoded text format
Format: FOB01 FIRE 14.7158 121.0403
"""

import serial
import json
import requests
import time
import re
from datetime import datetime

# ============================================
# CONFIGURATION - CHANGE THESE FOR YOUR SETUP
# ============================================
SERIAL_PORT = 'COM3'  # Windows: COM3, COM4, etc. | Linux: /dev/ttyUSB0, /dev/ttyACM0
BAUD_RATE = 115200
API_ENDPOINT = 'http://localhost/safechain/api/receive_incident.php'

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
    'MEDICAL': 'flood',  # Map medical to flood for now
    'FALL': 'crime',     # Map fall to crime for now
    'SOS': 'crime',
    'PANIC': 'crime',
    'FLOOD': 'flood'
}

# ============================================
# FUNCTIONS
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
    print("=" * 70)
    print("         SafeChain LoRa Gateway Listener v2.0")
    print("         Compatible with Multi-Alert Gateway Format")
    print("=" * 70)
    print()
    
    # Initialize serial connection
    ser = init_serial()
    if not ser:
        print("\n❌ Failed to connect to serial port. Exiting.")
        input("Press Enter to exit...")
        return
    
    print(f"📡 Listening for gateway packets...\n")
    print("Waiting for alerts from FOB devices...\n")
    print("Device Mapping:")
    for fob, device in DEVICE_MAP.items():
        print(f"  {fob} → {device}")
    print()
    
    packet_count = 0
    
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
                    print(f"→ FOB ID: {packet['fob_id']}")
                    print(f"→ Device: {packet['device_id']}")
                    print(f"→ Alert Type: {packet['alert_type']} → {packet['button'].upper()}")
                    print(f"→ Location: ({packet['lat']:.6f}, {packet['lng']:.6f})")
                    print(f"{'='*70}")
                    
                    # Send to API
                    if send_to_api(packet):
                        print(f"✓ Incident saved to database!")
                    print()
            
            time.sleep(0.05)  # Small delay to prevent CPU overuse
            
    except KeyboardInterrupt:
        print("\n\n⏹ Stopping listener...")
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if ser and ser.is_open:
            ser.close()
            print("✓ Serial connection closed")
        print("\nGoodbye! 👋")

if __name__ == "__main__":
    main()