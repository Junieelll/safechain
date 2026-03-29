<?php
require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

// ─── Authenticate ──────────────────────────────────────────────────────────
$user      = mobile_authenticate();
$role      = strtolower($user['role'] ?? '');
$flaggedBy = $user['id']   ?? '';
$actorName = $user['name'] ?? $user['username'] ?? 'Responder';

if (!in_array($role, ['bpso', 'bdrrm', 'bfp'], true)) {
    ResponseHelper::forbidden('Only responders can flag incidents');
}

// ─── Input ─────────────────────────────────────────────────────────────────
$body       = json_decode(file_get_contents('php://input'), true) ?? [];
$incidentId = trim($body['incidentId'] ?? '');
$reason     = trim($body['reason']     ?? '');

if (empty($incidentId)) ResponseHelper::validationError(['incidentId' => ['Incident ID is required']]);
if (empty($reason))     ResponseHelper::validationError(['reason'     => ['Reason is required']]);

// ─── Fetch incident ────────────────────────────────────────────────────────
$stmt = $conn->prepare(
    "SELECT i.id, i.status, i.is_false_alarm, i.is_wrong_type,
            i.reporter_id, i.dispatched_to,
            r.resident_id
     FROM incidents i
     LEFT JOIN residents r ON i.reporter_id = r.resident_id
     WHERE i.id = ? AND i.is_archived = 0
     LIMIT 1"
);
$stmt->bind_param('s', $incidentId);
$stmt->execute();
$incident = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$incident) {
    ResponseHelper::notFound('Incident not found');
}

// ─── Guards ────────────────────────────────────────────────────────────────
if ($incident['status'] !== 'resolved') {
    ResponseHelper::error('You can only flag resolved incidents', 422);
}

if ($incident['dispatched_to'] !== $flaggedBy) {
    ResponseHelper::forbidden('Only the assigned responder can flag this incident');
}

if ((int)$incident['is_false_alarm'] === 1) {
    ResponseHelper::error('This incident is already flagged as a false alarm', 422);
}

if ((int)$incident['is_wrong_type'] === 1) {
    ResponseHelper::error('This incident is already flagged as wrong emergency type', 422);
}

$residentId = $incident['reporter_id'];

// ─── 1. Insert into incident_flags ────────────────────────────────────────
$flagType = 'wrong_type';
$stmt = $conn->prepare(
    "INSERT INTO incident_flags (incident_id, user_id, flagged_by, flag_reason, flag_type)
     VALUES (?, ?, ?, ?, ?)"
);
$stmt->bind_param('sssss', $incidentId, $residentId, $flaggedBy, $reason, $flagType);
if (!$stmt->execute()) {
    $stmt->close();
    ResponseHelper::error('Failed to record flag', 500);
}
$stmt->close();

// ─── 2. Update incident — set is_wrong_type
$stmt = $conn->prepare(
    "UPDATE incidents 
     SET is_wrong_type = 1, updated_at = NOW()
     WHERE id = ?"
);
$stmt->bind_param('s', $incidentId);
$stmt->execute();
$stmt->close();

// ─── 3. Log to incident_timeline ──────────────────────────────────────────
$timelineTitle = 'Flagged as Wrong Emergency';
$timelineDesc  = "{$actorName} flagged this incident as the wrong emergency type. Reason: {$reason}";
$stmt = $conn->prepare(
    "INSERT INTO incident_timeline (incident_id, title, description, actor, user_id)
     VALUES (?, ?, ?, ?, ?)"
);
$stmt->bind_param('sssss', $incidentId, $timelineTitle, $timelineDesc, $actorName, $flaggedBy);
$stmt->execute();
$stmt->close();

// ─── Response ──────────────────────────────────────────────────────────────
ResponseHelper::success([
    'incidentId' => $incidentId,
    'flagType'   => 'wrong_type',
], 'Incident flagged as wrong emergency type.');