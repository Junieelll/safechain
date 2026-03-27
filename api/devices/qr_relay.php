<?php
/**
 * api/devices/qr_relay.php
 *
 * Tiny relay between the mobile QR scanner page and the admin dashboard.
 *
 * GET  ?session=X          → poll: returns { success, mac, batch } if a result
 *                            was stored for that session, { success:false } otherwise.
 * POST { session, mac, batch } → store: phone page posts the scanned MAC here.
 * DELETE { session }       → reset: admin dashboard calls this when the user
 *                            clicks "Clear & re-scan" so the old MAC is wiped
 *                            and the same session link can be reused.
 *
 * Storage: one small JSON file per session in the system temp directory.
 * Files older than 30 minutes are treated as expired.
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Pre-flight
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }

define("RELAY_TTL",    1800);   // seconds a session file lives (30 min)
define("SESSION_DIR",  sys_get_temp_dir());
define("FILE_PREFIX",  "sc_relay_");

// ── helpers ──────────────────────────────────────────────────────────────────

function sessionFile(string $session): string {
    // Sanitise: only allow the characters our JS generates
    $safe = preg_replace('/[^a-zA-Z0-9\-]/', '', $session);
    if (!$safe) return "";
    return SESSION_DIR . DIRECTORY_SEPARATOR . FILE_PREFIX . $safe . ".json";
}

function respond(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// ── route ─────────────────────────────────────────────────────────────────────

$method = $_SERVER["REQUEST_METHOD"];

// ── GET — poll ────────────────────────────────────────────────────────────────
if ($method === "GET") {
    $session = trim($_GET["session"] ?? "");
    if (!$session) respond(["success" => false, "message" => "Missing session"], 400);

    $file = sessionFile($session);
    if (!$file || !file_exists($file)) respond(["success" => false]);

    $data = json_decode(file_get_contents($file), true);
    if (!$data) respond(["success" => false]);

    // Expire old sessions
    if ((time() - ($data["ts"] ?? 0)) > RELAY_TTL) {
        @unlink($file);
        respond(["success" => false]);
    }

    respond(["success" => true, "mac" => $data["mac"], "batch" => $data["batch"] ?? ""]);
}

// ── POST — store ──────────────────────────────────────────────────────────────
if ($method === "POST") {
    $body    = json_decode(file_get_contents("php://input"), true) ?? [];
    $session = trim($body["session"] ?? "");
    $mac     = strtoupper(trim($body["mac"]   ?? ""));
    $batch   = trim($body["batch"]  ?? "");

    if (!$session) respond(["success" => false, "message" => "Missing session"], 400);
    if (!preg_match('/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/', $mac))
        respond(["success" => false, "message" => "Invalid MAC address"], 400);

    $file = sessionFile($session);
    if (!$file) respond(["success" => false, "message" => "Invalid session"], 400);

    $ok = file_put_contents($file, json_encode([
        "mac"   => $mac,
        "batch" => $batch,
        "ts"    => time(),
    ]));

    respond($ok !== false ? ["success" => true] : ["success" => false, "message" => "Storage error"], $ok !== false ? 200 : 500);
}

// ── DELETE — reset (same session, wipe stored MAC so it can be reused) ────────
if ($method === "DELETE") {
    $body    = json_decode(file_get_contents("php://input"), true) ?? [];
    $session = trim($body["session"] ?? "");

    if (!$session) respond(["success" => false, "message" => "Missing session"], 400);

    $file = sessionFile($session);
    if ($file && file_exists($file)) @unlink($file);

    respond(["success" => true]);
}

respond(["success" => false, "message" => "Method not allowed"], 405);