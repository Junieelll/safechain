<?php
// api/mobilee/incidents/notes.php
// POST — insert a new note into incident_notes

require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

$user   = mobile_authenticate();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

handle_create($conn, $user);

// ═══════════════════════════════════════════════════════════════════════════
// POST /incidents/notes.php
// Body: { incident_id, admin_name, note }
// ═══════════════════════════════════════════════════════════════════════════
function handle_create(mysqli $conn, array $user): void
{
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    // ── Validate ──────────────────────────────────────────────────────────
    $errors = [];
    foreach (['incident_id', 'admin_name', 'note'] as $field) {
        if (empty(trim($body[$field] ?? ''))) {
            $errors[$field] = ["The $field field is required"];
        }
    }
    if (!empty($errors)) {
        ResponseHelper::validationError($errors, 'Validation failed');
    }

    $incident_id = trim($body['incident_id']);
    $admin_name  = trim($body['admin_name']);
    $note        = trim($body['note']);

    // ── Check incident exists ─────────────────────────────────────────────
    $check = $conn->prepare('SELECT id FROM incidents WHERE id = ? LIMIT 1');
    $check->bind_param('s', $incident_id);
    $check->execute();
    $exists = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$exists) {
        ResponseHelper::notFound('Incident not found');
    }

    // ── Insert ────────────────────────────────────────────────────────────
    $stmt = $conn->prepare(
        'INSERT INTO incident_notes (incident_id, admin_name, note)
         VALUES (?, ?, ?)'
    );
    $stmt->bind_param('sss', $incident_id, $admin_name, $note);

    if (!$stmt->execute()) {
        $stmt->close();
        ResponseHelper::error('Failed to save note', 500);
    }

    $insert_id = $stmt->insert_id;
    $stmt->close();

    // ── Return the created note ───────────────────────────────────────────
    $fetch = $conn->prepare('SELECT * FROM incident_notes WHERE id = ? LIMIT 1');
    $fetch->bind_param('i', $insert_id);
    $fetch->execute();
    $row = $fetch->get_result()->fetch_assoc();
    $fetch->close();

    ResponseHelper::success([
        'id'          => $row['id'],
        'incident_id' => $row['incident_id'],
        'admin_name'  => $row['admin_name'],
        'note'        => $row['note'],
        'created_at'  => $row['created_at'],
    ], 'Note saved successfully', 201);
}