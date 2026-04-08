#!/usr/bin/env python3
"""
SafeChain LoRa Gateway Bridge v2.0
===================================
Improvements over v1.0:
  - CSV_V1 / HB_V1 direct parsing  (replaces fragile multi-line state machine)
  - Serial auto-reconnect           (survives cable bumps and Gateway reboots)
  - Offline queue retry loop        (actually retries — v1 queued but never sent)
  - Proper logging                  (timestamps, file + console, log levels)
  - SAFE packets skipped correctly  (receive_incident.php rejects them anyway)
  - Heartbeat forwarding            (updates device battery/last_seen)
  - CLI config                      (--port, --baud, --mode, --debug)
  - Graceful SIGTERM shutdown       (safe for systemd / Windows services)
"""

import argparse
import json
import logging
import re
import signal
import sqlite3
import sys
import time
from typing import Optional

import requests
import serial

# ============================================================
# LOGGING  — file + console, timestamps on every line
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('safechain_gateway.log', encoding='utf-8'),
    ],
)
log = logging.getLogger('SafeChain')

# ============================================================
# DEFAULTS  — overridden by CLI args at runtime
# ============================================================
DEFAULT_PORT      = 'COM11'
DEFAULT_BAUD      = 115200
DEFAULT_MODE      = 'both'
LOCAL_API         = 'http://localhost/safechain/api/receive_incident.php'
REMOTE_API        = 'https://safechain.site/api/receive_incident.php'
RECONNECT_DELAY   = 5    # seconds to wait before re-opening a dead serial port
RETRY_INTERVAL    = 30   # seconds between offline-queue flush attempts
REQUEST_TIMEOUT   = 10   # seconds for each HTTP request
DB_FILE           = 'offline_queue.db'

# SAFE is intentionally absent — it is not a valid incident type in the backend.
# receive_incident.php only accepts: fire | flood | crime
TYPE_MAP = {
    'FIRE':  'fire',
    'FLOOD': 'flood',
    'CRIME': 'crime',
    'SOS':   'crime',   # SOS is treated as a crime/distress incident
}

# ============================================================
# OFFLINE QUEUE  — SQLite-backed, with real retry
# ============================================================

def init_queue_db() -> None:
    """Create the offline-queue table if it does not exist."""
    conn = sqlite3.connect(DB_FILE)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS incident_queue (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            packet     TEXT    NOT NULL,
            created_at INTEGER NOT NULL,
            attempts   INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()
    log.info('Offline queue ready (%s)', DB_FILE)


def enqueue(packet: dict) -> bool:
    """Persist a packet to the offline queue for later retry."""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.execute(
            'INSERT INTO incident_queue (packet, created_at) VALUES (?, ?)',
            (json.dumps(packet), int(time.time())),
        )
        conn.commit()
        conn.close()
        log.info('Queued offline  device=%s  type=%s', packet['device_id'], packet['button'])
        return True
    except Exception as exc:
        log.error('Queue write failed: %s', exc)
        return False


def _delete_row(row_id: int) -> None:
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.execute('DELETE FROM incident_queue WHERE id = ?', (row_id,))
        conn.commit()
        conn.close()
    except Exception as exc:
        log.error('Queue delete failed (id=%s): %s', row_id, exc)


def _bump_attempts(row_id: int) -> None:
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.execute(
            'UPDATE incident_queue SET attempts = attempts + 1 WHERE id = ?',
            (row_id,),
        )
        conn.commit()
        conn.close()
    except Exception as exc:
        log.error('Queue bump failed (id=%s): %s', row_id, exc)


def flush_queue(ser: Optional[serial.Serial], mode: str) -> None:
    """
    Retry every unsent packet in the offline queue.
    Called every RETRY_INTERVAL seconds from the main loop.
    """
    try:
        conn = sqlite3.connect(DB_FILE)
        rows = conn.execute(
            'SELECT id, packet FROM incident_queue ORDER BY created_at ASC'
        ).fetchall()
        conn.close()
    except Exception as exc:
        log.error('Queue read failed: %s', exc)
        return

    if not rows:
        return

    log.info('Flushing offline queue: %d packet(s)...', len(rows))
    for row_id, raw in rows:
        try:
            packet = json.loads(raw)
        except json.JSONDecodeError:
            log.warning('Corrupt queue entry %d — discarding', row_id)
            _delete_row(row_id)
            continue

        if _dispatch_incident(packet, ser, mode):
            _delete_row(row_id)
            log.info('  ✓ Queued packet %d delivered', row_id)
        else:
            _bump_attempts(row_id)
            log.warning('  ✗ Queued packet %d still failing', row_id)


# ============================================================
# LINE PARSER  — CSV_V1 and HB_V1 (single-line, deterministic)
# ============================================================
#
# The Gateway C++ (event_manager.cpp) already writes structured CSV to Serial:
#
#   CSV_V1,<origin_id>,<event_id>,<TYPE>,<lat>,<lng>,<batt>,<rssi>,<hops>,<attempt>
#   REPLAY_CSV_V1,<origin_id>,<event_id>,<TYPE>,<lat>,<lng>,<batt>,<rssi>,<hops>,<attempt>
#   HB_V1,<origin_id>,<lat>,<lng>,<batt>,<rssi>
#
# Parsing these is O(1), race-free, and immune to timing issues.
# The old multi-line state machine parsed the human-readable alert block
# which relied on a 2-second window and fragile string matching.

_CSV_V1_RE = re.compile(
    r'^(?:REPLAY_)?CSV_V1'
    r',([^,]+)'          # 1 origin_id
    r',(\d+)'            # 2 event_id
    r',(FIRE|FLOOD|CRIME|SOS|SAFE|TEST)'  # 3 type
    r',(-?[\d.]+)'       # 4 lat
    r',(-?[\d.]+)'       # 5 lng
    r',(\d+)'            # 6 battery %
    r',(-?\d+)'          # 7 rssi dBm
    r',(\d+)'            # 8 hops
    r',(\d+)$'           # 9 attempt
)

_HB_V1_RE = re.compile(
    r'^HB_V1'
    r',([^,]+)'          # 1 origin_id
    r',(-?[\d.]+)'       # 2 lat
    r',(-?[\d.]+)'       # 3 lng
    r',(\d+)'            # 4 battery %
    r',(-?\d+)$'         # 5 rssi dBm
)


def parse_line(line: str) -> Optional[dict]:
    """
    Returns a structured dict or None.
    dict['kind'] is one of: 'incident' | 'heartbeat'
    """

    # ── CSV_V1 / REPLAY_CSV_V1 ─────────────────────────────────────────────
    m = _CSV_V1_RE.match(line)
    if m:
        origin_id, event_id, raw_type, lat, lng, batt, rssi, hops, attempt = m.groups()

        button = TYPE_MAP.get(raw_type)
        if button is None:
            # SAFE and TEST frames arrive here but are not incident types.
            log.debug('Skipping non-incident frame  type=%s  origin=%s', raw_type, origin_id)
            return None

        return {
            'kind':      'incident',
            'device_id': origin_id,
            'event_id':  event_id,
            'button':    button,
            'lat':       float(lat),
            'lng':       float(lng),
            'battery':   int(batt),
            'rssi':      int(rssi),
            'hops':      int(hops),
            'attempt':   int(attempt),
        }

    # ── HB_V1 ──────────────────────────────────────────────────────────────
    m = _HB_V1_RE.match(line)
    if m:
        origin_id, lat, lng, batt, rssi = m.groups()
        return {
            'kind':      'heartbeat',
            'device_id': origin_id,
            'lat':       float(lat),
            'lng':       float(lng),
            'battery':   int(batt),
            'rssi':      int(rssi),
        }

    return None


# ============================================================
# HTTP  — shared headers, per-endpoint POST, commit helper
# ============================================================

_HTTP_HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent':   'SafeChain-Gateway/2.0',   # Required — OpenResty WAF blocks requests without this
    'Accept':       'application/json',
}


def _post(url: str, payload: dict, label: str) -> bool:
    """POST payload to url. Returns True on HTTP 200 + success:true."""
    try:
        resp = requests.post(url, json=payload, headers=_HTTP_HEADERS, timeout=REQUEST_TIMEOUT)
        data = resp.json()
        if resp.status_code == 200 and data.get('success'):
            log.info('  ✓ %s  →  %s', label, data.get('action', 'ok'))
            return True
        log.warning('  ✗ %s  [%d]  %s', label, resp.status_code, resp.text[:150])
        return False
    except requests.exceptions.ConnectionError:
        log.warning('  ✗ %s unreachable', label)
        return False
    except requests.exceptions.Timeout:
        log.warning('  ✗ %s timed out (%ds)', label, REQUEST_TIMEOUT)
        return False
    except Exception as exc:
        log.error('  ✗ %s error: %s', label, exc)
        return False


def _commit_nvs(ser: serial.Serial, device_id: str, event_id: str) -> None:
    """
    Write `commit <device_id> <event_id>` to the Gateway over Serial.
    This tells the Gateway to clear the event from its NVS journal so
    it won't be replayed on the next Gateway reboot.
    Only called after at least one API endpoint has confirmed persistence.
    """
    try:
        cmd = f'commit {device_id} {event_id}\n'
        ser.write(cmd.encode('utf-8'))
        log.info('  → NVS commit: %s', cmd.strip())
    except Exception as exc:
        log.error('  → NVS commit failed: %s', exc)


def _dispatch_incident(packet: dict, ser: Optional[serial.Serial], mode: str) -> bool:
    """
    Send an incident packet to the configured API endpoints.
    Returns True if at least one endpoint accepted it.
    On success, sends the NVS commit to the Gateway.
    """
    payload = {
        'device_id': packet['device_id'],
        'type':      'INCIDENT',
        'button':    packet['button'],
        'lat':       packet['lat'],
        'lng':       packet['lng'],
    }

    saved = False

    if mode in ('local', 'both'):
        if _post(LOCAL_API, payload, 'Local'):
            saved = True

    if mode in ('remote', 'both'):
        if _post(REMOTE_API, payload, 'Remote'):
            saved = True

    # Commit NVS only after confirmed server-side persistence.
    # Guard: event_id '0' means the Gateway didn't have a journal entry.
    if saved and ser and ser.is_open:
        event_id = packet.get('event_id', '0')
        if event_id and event_id != '0':
            _commit_nvs(ser, packet['device_id'], event_id)

    return saved


def _dispatch_heartbeat(packet: dict, mode: str) -> None:
    """
    Forward a heartbeat to the backend to update device battery and last_seen.
    Fire-and-forget — heartbeat failures are non-critical.
    """
    payload = {
        'device_id': packet['device_id'],
        'type':      'HEARTBEAT',
        'lat':       packet['lat'],
        'lng':       packet['lng'],
        'battery':   packet['battery'],
        'rssi':      packet['rssi'],
    }
    if mode in ('local', 'both'):
        _post(LOCAL_API, payload, 'Local HB')
    if mode in ('remote', 'both'):
        _post(REMOTE_API, payload, 'Remote HB')


# ============================================================
# SERIAL  — open with retry, is_open guard
# ============================================================

def open_serial(port: str, baud: int) -> Optional[serial.Serial]:
    """Attempt to open the serial port. Returns None on failure (caller retries)."""
    try:
        ser = serial.Serial(port, baud, timeout=1)
        log.info('Serial connected: %s @ %d baud', port, baud)
        return ser
    except serial.SerialException as exc:
        log.warning('Serial open failed (%s): %s', port, exc)
        return None


# ============================================================
# GRACEFUL SHUTDOWN
# ============================================================

_running = True


def _handle_signal(sig, _frame) -> None:
    global _running
    log.info('Signal %d received — shutting down gracefully...', sig)
    _running = False


signal.signal(signal.SIGINT,  _handle_signal)
signal.signal(signal.SIGTERM, _handle_signal)


# ============================================================
# MAIN
# ============================================================

def main() -> None:
    global _running

    # ── CLI arguments ──────────────────────────────────────────────────────
    parser = argparse.ArgumentParser(
        description='SafeChain LoRa Gateway Bridge v2.0',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument('--port',  default=DEFAULT_PORT,
                        help='Serial port the Gateway is connected to')
    parser.add_argument('--baud',  default=DEFAULT_BAUD, type=int,
                        help='Serial baud rate')
    parser.add_argument('--mode',  default=DEFAULT_MODE,
                        choices=['local', 'remote', 'both'],
                        help='Which API endpoint(s) to send incidents to')
    parser.add_argument('--debug', action='store_true',
                        help='Enable DEBUG-level serial output logging')
    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    log.info('SafeChain Gateway Bridge v2.0')
    log.info('  port=%-8s  baud=%d  mode=%s', args.port, args.baud, args.mode)
    log.info('  local  → %s', LOCAL_API)
    log.info('  remote → %s', REMOTE_API)

    init_queue_db()

    ser:          Optional[serial.Serial] = None
    last_flush_t: float = 0.0

    while _running:

        # ── Serial reconnect ───────────────────────────────────────────────
        if ser is None or not ser.is_open:
            ser = open_serial(args.port, args.baud)
            if ser is None:
                log.info('Retrying serial in %ds...', RECONNECT_DELAY)
                time.sleep(RECONNECT_DELAY)
                continue

        # ── Offline queue flush (every RETRY_INTERVAL seconds) ─────────────
        now = time.time()
        if now - last_flush_t >= RETRY_INTERVAL:
            last_flush_t = now
            flush_queue(ser, args.mode)

        # ── Read one line from the Gateway ─────────────────────────────────
        try:
            if not ser.in_waiting:
                time.sleep(0.01)
                continue

            raw = ser.readline().decode('utf-8', errors='ignore').strip()
            if not raw:
                continue

            # Print every raw line at DEBUG level so --debug shows full output
            log.debug('[GW] %s', raw)

            parsed = parse_line(raw)
            if parsed is None:
                continue  # Not a line we act on — pass through silently

            # ── Incident ───────────────────────────────────────────────────
            if parsed['kind'] == 'incident':
                sep = '=' * 54
                log.info(sep)
                log.info('ALERT  type=%-6s  device=%s  event=%s',
                         parsed['button'].upper(), parsed['device_id'], parsed['event_id'])
                log.info('       lat=%-11s  lng=%-11s  batt=%d%%  rssi=%ddBm  hops=%d',
                         parsed['lat'], parsed['lng'],
                         parsed['battery'], parsed['rssi'], parsed['hops'])

                if parsed['lat'] == 0.0 and parsed['lng'] == 0.0:
                    log.warning('GPS coordinates are 0.0, 0.0 — device has no fix yet')

                sent = _dispatch_incident(parsed, ser, args.mode)

                # Only queue if remote was the intended target and it failed.
                # Local failures mean the local server is down — no point queueing.
                if not sent and args.mode in ('remote', 'both'):
                    enqueue(parsed)

                log.info(sep)

            # ── Heartbeat ──────────────────────────────────────────────────
            elif parsed['kind'] == 'heartbeat':
                log.info('HEARTBEAT  device=%s  batt=%d%%  rssi=%ddBm  lat=%s  lng=%s',
                         parsed['device_id'], parsed['battery'], parsed['rssi'],
                         parsed['lat'], parsed['lng'])
                _dispatch_heartbeat(parsed, args.mode)

        except serial.SerialException as exc:
            log.error('Serial error: %s — will reconnect', exc)
            try:
                ser.close()
            except Exception:
                pass
            ser = None
            time.sleep(RECONNECT_DELAY)

        except Exception as exc:
            log.error('Unexpected error: %s', exc, exc_info=args.debug)

    # ── Cleanup ────────────────────────────────────────────────────────────
    if ser and ser.is_open:
        ser.close()
        log.info('Serial port closed')
    log.info('SafeChain Gateway Bridge stopped.')


if __name__ == '__main__':
    main()