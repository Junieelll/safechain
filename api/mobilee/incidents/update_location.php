<?php
// api/mobilee/incidents/update_location.php

require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../../helpers/jwt_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

$user = mobile_authenticate();

$body        = json_decode(file_get_contents('php://input'), true) ?? [];
$incident_id = trim($body['incident_id'] ?? '');
$latitude    = isset($body['latitude'])  ? (float) $body['latitude']  : null;
$longitude   = isset($body['longitude']) ? (float) $body['longitude'] : null;
$heading     = isset($body['heading'])   ? (float) $body['heading']   : null;
$speed       = isset($body['speed'])     ? (float) $body['speed']     : null;

if (!$incident_id || $latitude === null || $longitude === null) {
    ResponseHelper::validationError(
        ['fields' => ['incident_id, latitude, longitude are required']],
        'Missing required fields'
    );
}

// Verify incident exists and responder is assigned
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

// Upsert location
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

// Trigger Pusher event via raw HTTP (Pusher PHP SDK has hanging issues on this host)
$pusher_app_id  = $config['pusher']['app_id'];
$pusher_key     = $config['pusher']['key'];
$pusher_secret  = $config['pusher']['secret'];
$pusher_cluster = $config['pusher']['cluster'];

$timestamp = time();

$post_body = json_encode([
    'name'    => 'responder.location',
    'channel' => 'incident.' . $incident_id,
    'data'    => json_encode([
        'user_id'     => $user_id,
        'incident_id' => $incident_id,
        'latitude'    => $latitude,
        'longitude'   => $longitude,
        'heading'     => $heading,
        'speed'       => $speed,
        'updated_at'  => date('Y-m-d H:i:s'),
    ]),
]);

$md5_body = md5($post_body);

$string_to_sign = "POST\n/apps/{$pusher_app_id}/events\n"
    . "auth_key={$pusher_key}"
    . "&auth_timestamp={$timestamp}"
    . "&auth_version=1.0"
    . "&body_md5={$md5_body}";

$auth_signature = hash_hmac('sha256', $string_to_sign, $pusher_secret);

$pusher_url = "https://api-{$pusher_cluster}.pusher.com/apps/{$pusher_app_id}/events"
    . "?auth_key={$pusher_key}"
    . "&auth_timestamp={$timestamp}"
    . "&auth_version=1.0"
    . "&body_md5={$md5_body}"
    . "&auth_signature={$auth_signature}";

$ch = curl_init($pusher_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post_body);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($post_body),
]);
curl_exec($ch);
curl_close($ch);

ResponseHelper::success(null, 'Location updated');