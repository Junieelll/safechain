<?php
// api/mobilee/incidents/update_location.php

require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../../helpers/jwt_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

// ── Pusher PHP SDK — loaded from root vendor (shared with rest of project) ──
require_once __DIR__ . '/../../../vendor/autoload.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

$user = mobile_authenticate();

$body = json_decode(file_get_contents('php://input'), true) ?? [];

$incident_id = trim($body['incident_id'] ?? '');
$latitude    = isset($body['latitude'])  ? (float) $body['latitude']  : null;
$longitude   = isset($body['longitude']) ? (float) $body['longitude'] : null;
$heading     = isset($body['heading'])   ? (float) $body['heading']   : null;
$speed       = isset($body['speed'])     ? (float) $body['speed']     : null;

// ── Validate ──────────────────────────────────────────────────────────────
if (!$incident_id || $latitude === null || $longitude === null) {
    ResponseHelper::validationError(
        ['fields' => ['incident_id, latitude, longitude are required']],
        'Missing required fields'
    );
}

// ── Verify incident exists and responder is assigned to it ────────────────
$stmt = $conn->prepare("
    SELECT id, status, dispatched_to
    FROM incidents
    WHERE id = ? AND is_archived = 0
    LIMIT 1
");
$stmt->bind_param('s', $incident_id);
$stmt->execute();
$incident = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$incident) {
    ResponseHelper::notFound('Incident not found');
}

if ($incident['dispatched_to'] !== $user['id']) {
    ResponseHelper::forbidden('You are not assigned to this incident');
}

if ($incident['status'] !== 'responding') {
    ResponseHelper::error('Location tracking only active while responding', 422);
}

// ── Upsert location (one row per responder per incident) ──────────────────
$user_id = $user['id'];
$stmt = $conn->prepare("
    INSERT INTO responder_locations (user_id, incident_id, latitude, longitude, heading, speed, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
        latitude   = VALUES(latitude),
        longitude  = VALUES(longitude),
        heading    = VALUES(heading),
        speed      = VALUES(speed),
        updated_at = NOW()
");
$stmt->bind_param('ssdddd', $user_id, $incident_id, $latitude, $longitude, $heading, $speed);

if (!$stmt->execute()) {
    $stmt->close();
    ResponseHelper::error('Failed to save location', 500);
}
$stmt->close();

// ── Trigger Pusher event ──────────────────────────────────────────────────
try {
    $pusher = new Pusher\Pusher(
        'e5c099a8d626646ef327',   // key
        '99d94b39121f95c241e5',   // secret
        '2129743',                 // app_id
        [
            'cluster' => 'ap1',
            'useTLS'  => true,
        ]
    );

    $pusher->trigger(
        'incident.' . $incident_id,   // channel — one per incident
        'responder.location',          // event name
        [
            'user_id'     => $user_id,
            'incident_id' => $incident_id,
            'latitude'    => $latitude,
            'longitude'   => $longitude,
            'heading'     => $heading,
            'speed'       => $speed,
            'updated_at'  => date('Y-m-d H:i:s'),
        ]
    );
} catch (Exception $e) {
    // Don't fail the request if Pusher is down — location was already saved to DB
    error_log('Pusher trigger failed: ' . $e->getMessage());
}

ResponseHelper::success(null, 'Location updated');