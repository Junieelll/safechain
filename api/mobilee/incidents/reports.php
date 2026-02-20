<?php
require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

setCorsHeaders();

$user = mobile_authenticate();
$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'GET' => handle_get($conn, $user),
    'POST' => handle_create($conn, $user),
    default => ResponseHelper::error('Method not allowed', 405),
};

function handle_get(mysqli $conn, array $user): void
{
    // Fetch by report's own primary key
    if (isset($_GET['id'])) {
        $stmt = $conn->prepare('SELECT * FROM incident_reports WHERE id = ? LIMIT 1');
        $stmt->bind_param('i', $_GET['id']);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        ResponseHelper::success($row, 'Report fetched');
        return;
    }

    // Fetch by incident_id
    $incident_id = $_GET['incident_id'] ?? null;

    if ($incident_id) {
        $stmt = $conn->prepare('SELECT * FROM incident_reports WHERE incident_id = ? LIMIT 1');
        $stmt->bind_param('s', $incident_id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        ResponseHelper::success($row, 'Report fetched');
        return;
    }

    $stmt = $conn->prepare('
        SELECT r.*, i.type as incident_type, i.location, i.date_time
        FROM incident_reports r
        LEFT JOIN incidents i ON i.id = r.incident_id
        WHERE r.submitted_by = ?
        ORDER BY r.created_at DESC
    ');
    $stmt->bind_param('s', $user['username']);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    ResponseHelper::success($rows, 'Reports fetched');
}

function handle_create(mysqli $conn, array $user): void
{
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?? [];

    // ── Validation ─────────────────────────────────────────────────────────
    $errors = [];
    foreach (['incident_id', 'description', 'severity_level', 'resolution_status', 'summary'] as $field) {
        if (empty(trim((string) ($body[$field] ?? '')))) {
            $errors[$field] = ["The $field field is required"];
        }
    }
    if (!empty($errors)) {
        ResponseHelper::validationError($errors, 'Validation failed');
        return;
    }

    // ── Duplicate check ────────────────────────────────────────────────────
    $check = $conn->prepare('SELECT id FROM incident_reports WHERE incident_id = ? LIMIT 1');
    $check->bind_param('s', $body['incident_id']);
    $check->execute();
    $exists = $check->get_result()->fetch_assoc();
    $check->close();

    if ($exists) {
        ResponseHelper::error('A report already exists for this incident', 422);
        return;
    }

    // ── Map fields ─────────────────────────────────────────────────────────
    $incident_id = $body['incident_id'];
    $submitted_by = $user['username'];
    $submitted_by_id = $user['id'];
    $description = $body['description'];
    $severity_level = $body['severity_level'];
    $casualties = (int) ($body['casualties'] ?? 0);
    $injuries = (int) ($body['injuries'] ?? 0);
    $rescued = (int) ($body['rescued'] ?? 0);
    $evacuated = (int) ($body['evacuated'] ?? 0);
    $property_damage = ($body['property_damage'] ?? 'none');
    $estimated_cost = (float) ($body['estimated_cost'] ?? 0);
    $response_time_minutes = (int) ($body['response_time_minutes'] ?? 0);
    $response_time_seconds = (int) ($body['response_time_seconds'] ?? 0);
    $resolution_time_minutes = (int) ($body['resolution_time_minutes'] ?? 0);
    $resolution_time_seconds = (int) ($body['resolution_time_seconds'] ?? 0);
    $response_team = json_encode($body['response_team'] ?? []);
    $actions_taken = json_encode($body['actions_taken'] ?? []);
    $resolution_status = $body['resolution_status'];
    $summary = $body['summary'];
    $follow_up_required = (int) ($body['follow_up_required'] ?? 0);
    $follow_up_notes = ($body['follow_up_notes'] ?? null);
    $recommendations = ($body['recommendations'] ?? null);

    // ── Insert ─────────────────────────────────────────────────────────────
    $stmt = $conn->prepare('
        INSERT INTO incident_reports (
            incident_id, submitted_by, submitted_by_id, description, severity_level,
            casualties, injuries, rescued, evacuated,
            property_damage, estimated_cost,
            response_time_minutes, response_time_seconds,
            resolution_time_minutes, resolution_time_seconds,
            response_team, actions_taken,
            resolution_status, summary,
            follow_up_required, follow_up_notes, recommendations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');

    if (!$stmt) {
        ResponseHelper::error('Query prepare failed: ' . $conn->error, 500);
        return;
    }

    // 21 params: s s s s i i i i s d i i i i s s s s i s s
    $stmt->bind_param(
        'sssssiiiisdiiiisssiiss',
        $incident_id,
        $submitted_by,
        $submitted_by_id,
        $description,
        $severity_level,
        $casualties,
        $injuries,
        $rescued,
        $evacuated,
        $property_damage,
        $estimated_cost,
        $response_time_minutes,
        $response_time_seconds,
        $resolution_time_minutes,
        $resolution_time_seconds,
        $response_team,
        $actions_taken,
        $resolution_status,
        $summary,
        $follow_up_required,
        $follow_up_notes,
        $recommendations
    );

    if (!$stmt->execute()) {
        $mysql_error = $stmt->error;
        $stmt->close();
        ResponseHelper::error('Failed to save report: ' . $mysql_error, 500);
        return;
    }

    $id = $stmt->insert_id;
    $stmt->close();

    // ── Update incident status to resolved ─────────────────────────────────
    $update = $conn->prepare('UPDATE incidents SET status = ? WHERE id = ?');
    if ($update) {
        $resolved = 'resolved';
        $update->bind_param('ss', $resolved, $incident_id);
        $update->execute();
        $update->close();
    }

    // ── Timeline entry ─────────────────────────────────────────────────────────
    $timeline_stmt = $conn->prepare('
    INSERT INTO incident_timeline (incident_id, title, description, actor, user_id)
    VALUES (?, ?, ?, ?, ?)
');

    if ($timeline_stmt) {
        $title = 'Report Submitted';
        $tl_desc = 'An incident report has been submitted by ' . $submitted_by . '.';
        $user_id = $user['id'];
        $timeline_stmt->bind_param('sssss', $incident_id, $title, $tl_desc, $submitted_by, $user_id);
        $timeline_stmt->execute();
        $timeline_stmt->close();
    }

    // ── Return created report ──────────────────────────────────────────────
    $fetch = $conn->prepare('SELECT * FROM incident_reports WHERE id = ? LIMIT 1');
    $fetch->bind_param('i', $id);
    $fetch->execute();
    $report = $fetch->get_result()->fetch_assoc();
    $fetch->close();

    ResponseHelper::success($report, 'Report submitted successfully', 201);
}