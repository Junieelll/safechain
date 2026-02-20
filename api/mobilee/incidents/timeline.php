<?php
// api/mobilee/incidents/timeline.php

require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

$user   = mobile_authenticate();
$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'GET'  => handle_get_recent($conn, $user),
    'POST' => handle_create($conn, $user),
    default => ResponseHelper::error('Method not allowed', 405),
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /incidents/timeline.php?limit=5
// ═══════════════════════════════════════════════════════════════════════════
function handle_get_recent(mysqli $conn, array $user): void
{
    $limit   = min(20, (int) ($_GET['limit'] ?? 5));
    $user_id = $user['id'] ?? null;

    $stmt = $conn->prepare("
        SELECT t.*, i.type AS incident_type, i.status AS incident_status
        FROM incident_timeline t
        LEFT JOIN incidents i ON i.id = t.incident_id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
        LIMIT ?
    ");
    $stmt->bind_param('si', $user_id, $limit);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    ResponseHelper::success(array_map(function ($row) {
        return [
            'id'            => (int) $row['id'],
            'incident_id'   => $row['incident_id'],
            'incident_type' => $row['incident_type'] ?? 'unknown',
            'status'        => $row['incident_status'] ?? 'pending',
            'title'         => $row['title'],
            'description'   => $row['description'],
            'actor'         => $row['actor'],
            'created_at'    => $row['created_at'],
        ];
    }, $rows), 'Recent timeline fetched');
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /incidents/timeline.php
// Body: { incident_id, title, description, actor }
// ═══════════════════════════════════════════════════════════════════════════
function handle_create(mysqli $conn, array $user): void
{
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $errors = [];
    foreach (['incident_id', 'title', 'description', 'actor'] as $field) {
        if (empty(trim($body[$field] ?? ''))) {
            $errors[$field] = ["The $field field is required"];
        }
    }
    if (!empty($errors)) {
        ResponseHelper::validationError($errors, 'Validation failed');
    }

    $incident_id = trim($body['incident_id']);
    $title       = trim($body['title']);
    $description = trim($body['description']);
    $actor       = trim($body['actor']);
    $user_id     = $user['id'] ?? null; // ← get user_id from authenticated user

    $check = $conn->prepare('SELECT id FROM incidents WHERE id = ? LIMIT 1');
    $check->bind_param('s', $incident_id);
    $check->execute();
    $exists = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$exists) {
        ResponseHelper::notFound('Incident not found');
    }

    $stmt = $conn->prepare(
        'INSERT INTO incident_timeline (incident_id, title, description, actor, user_id)
         VALUES (?, ?, ?, ?, ?)'  // ← added user_id
    );
    $stmt->bind_param('sssss', $incident_id, $title, $description, $actor, $user_id); // ← added

    if (!$stmt->execute()) {
        $stmt->close();
        ResponseHelper::error('Failed to save timeline entry', 500);
    }

    $insert_id = $stmt->insert_id;
    $stmt->close();

    $fetch = $conn->prepare('SELECT * FROM incident_timeline WHERE id = ? LIMIT 1');
    $fetch->bind_param('i', $insert_id);
    $fetch->execute();
    $row = $fetch->get_result()->fetch_assoc();
    $fetch->close();

    ResponseHelper::success([
        'id'          => (int) $row['id'],
        'incident_id' => $row['incident_id'],
        'title'       => $row['title'],
        'description' => $row['description'],
        'actor'       => $row['actor'],
        'created_at'  => $row['created_at'],
    ], 'Timeline entry saved', 201);
}