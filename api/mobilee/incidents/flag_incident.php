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

if (!in_array($role, ['bpso', 'bhert', 'firefighter'], true)) {
    ResponseHelper::forbidden('Only responders can flag incidents');
}

// ─── Input ─────────────────────────────────────────────────────────────────
$body       = json_decode(file_get_contents('php://input'), true) ?? [];
$incidentId = trim($body['incidentId'] ?? '');
$reason     = trim($body['reason']     ?? '');

if (empty($incidentId)) ResponseHelper::validationError(['incidentId' => ['Incident ID is required']]);
if (empty($reason))     ResponseHelper::validationError(['reason'     => ['Reason is required']]);

// ─── Fetch incident + resident ─────────────────────────────────────────────
$stmt = $conn->prepare(
    "SELECT i.id, i.status, i.is_false_alarm, i.reporter_id,
            i.dispatched_to,
            r.resident_id, r.false_report_count, r.status AS resident_status
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
    ResponseHelper::error('This incident is already flagged as false alarm', 422);
}

if (empty($incident['resident_id'])) {
    ResponseHelper::error('This incident has no registered reporter to flag', 422);
}

// ─── Begin flagging ────────────────────────────────────────────────────────
$residentId = $incident['reporter_id'];
$newCount   = (int)($incident['false_report_count'] ?? 0) + 1;

// 1. Insert into incident_flags
$stmt = $conn->prepare(
    "INSERT INTO incident_flags (incident_id, user_id, flagged_by, flag_reason)
     VALUES (?, ?, ?, ?)"
);
$stmt->bind_param('ssss', $incidentId, $residentId, $flaggedBy, $reason);
if (!$stmt->execute()) {
    $stmt->close();
    ResponseHelper::error('Failed to record flag', 500);
}
$stmt->close();

// 2. Update incident — set is_false_alarm + change status to false_alarm
$stmt = $conn->prepare(
    "UPDATE incidents 
     SET is_false_alarm = 1, status = 'false_alarm', updated_at = NOW()
     WHERE id = ?"
);
$stmt->bind_param('s', $incidentId);
$stmt->execute();
$stmt->close();

// 3. Increment false_report_count on resident
$stmt = $conn->prepare(
    "UPDATE residents SET false_report_count = ? WHERE resident_id = ?"
);
$stmt->bind_param('is', $newCount, $residentId);
$stmt->execute();
$stmt->close();

// 4. Restrict resident if 3+ false reports
$autoRestricted = false;
if ($newCount >= 3) {
    $stmt = $conn->prepare(
        "UPDATE residents SET status = 'restricted' WHERE resident_id = ?"
    );
    $stmt->bind_param('s', $residentId);
    $stmt->execute();
    $stmt->close();
    $autoRestricted = true;
}

// 5. Log to incident_timeline
$timelineTitle = 'Flagged as False Alarm';
$timelineDesc  = "{$actorName} flagged this incident as a false alarm. Reason: {$reason}";
$stmt = $conn->prepare(
    "INSERT INTO incident_timeline (incident_id, title, description, actor, user_id)
     VALUES (?, ?, ?, ?, ?)"
);
$stmt->bind_param('sssss', $incidentId, $timelineTitle, $timelineDesc, $actorName, $flaggedBy);
$stmt->execute();
$stmt->close();

// ─── Priority ──────────────────────────────────────────────────────────────
$priority = match(true) {
    $newCount >= 3 => 'restricted',
    $newCount === 2 => 'very_low',
    default         => 'low',
};

// ─── Response ──────────────────────────────────────────────────────────────
ResponseHelper::success([
    'incidentId'     => $incidentId,
    'falseCount'     => $newCount,
    'priority'       => $priority,
    'autoRestricted' => $autoRestricted,
], $autoRestricted
    ? 'Incident flagged. Resident restricted after 3 false reports.'
    : "Incident flagged. Resident now has {$newCount} false report(s)."
);