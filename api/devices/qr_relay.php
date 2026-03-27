<?php
/**
 * SafeChain — QR Relay API
 * Place at:  api/devices/qr_relay.php
 *
 * GET  ?session=xxx          → check if phone has submitted a MAC
 * POST {session, mac, batch} → phone submits scanned MAC
 *
 * Uses a simple DB table `qr_sessions` or just a temp file (easier).
 * We use the /tmp folder with session files — zero DB dependency.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$method = $_SERVER['REQUEST_METHOD'];

// Sessions live in /tmp/sc_qr_<session_id>.json  (TTL: 10 minutes)
define('SESSION_TTL', 600);
define('SESSION_DIR', sys_get_temp_dir());

function sessionFile(string $id): string {
    // Sanitize session id — only alphanum/dash
    $safe = preg_replace('/[^a-zA-Z0-9\-]/', '', $id);
    return SESSION_DIR . '/sc_qr_' . $safe . '.json';
}

function isValidMac(string $mac): bool {
    return (bool) preg_match('/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i', $mac);
}

// ── GET — poll for result ─────────────────────────────────────────────────────
if ($method === 'GET') {
    $session = trim($_GET['session'] ?? '');
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'session required']);
        exit;
    }

    $file = sessionFile($session);
    if (!file_exists($file)) {
        echo json_encode(['success' => false, 'pending' => true]);
        exit;
    }

    $data = json_decode(file_get_contents($file), true);

    // Expire check
    if (!$data || time() - ($data['created_at'] ?? 0) > SESSION_TTL) {
        @unlink($file);
        echo json_encode(['success' => false, 'pending' => true, 'expired' => true]);
        exit;
    }

    // Return result
    echo json_encode([
        'success' => true,
        'mac'     => $data['mac'],
        'batch'   => $data['batch'] ?? '',
    ]);

    // Clean up once consumed
    @unlink($file);
    exit;
}

// ── POST — phone submits scanned MAC ──────────────────────────────────────────
if ($method === 'POST') {
    $input   = json_decode(file_get_contents('php://input'), true);
    $session = trim($input['session'] ?? '');
    $mac     = strtoupper(trim($input['mac'] ?? ''));
    $batch   = trim($input['batch'] ?? '');

    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'session required']);
        exit;
    }
    if (!isValidMac($mac)) {
        echo json_encode(['success' => false, 'message' => 'invalid MAC address']);
        exit;
    }

    // Clean up any previous file for this session
    $file = sessionFile($session);
    file_put_contents($file, json_encode([
        'session'    => $session,
        'mac'        => $mac,
        'batch'      => $batch,
        'created_at' => time(),
    ]));

    echo json_encode(['success' => true, 'message' => 'MAC received']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Method not allowed']);