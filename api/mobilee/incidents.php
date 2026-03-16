<?php
// api/mobilee/incidents.php

require_once __DIR__ . '/../../config/conn.php';           // provides $conn (mysqli)
require_once __DIR__ . '/../helpers/response_helper.php';  // ResponseHelper + setCorsHeaders()
require_once __DIR__ . '/middleware/mobile_auth.php';       // mobile_authenticate()

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

// ─── Authenticate ──────────────────────────────────────────────────────────
// Reads JWT from Authorization header, returns user array or exits with 401
$user = mobile_authenticate();
$role = strtolower($user['role'] ?? '');
$allowed_types = get_allowed_types($role);

// ─── Route ─────────────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$incident_id = $_GET['id'] ?? null;

match ($method) {
    'GET' => $incident_id
    ? handle_get_single($conn, $incident_id, $allowed_types)
    : handle_get_list($conn, $allowed_types),
    'PUT' => $incident_id
    ? handle_update_status($conn, $incident_id, $user)
    : ResponseHelper::error('Incident ID is required', 400),
    'POST' => handle_create($conn, $user),
    default => ResponseHelper::error('Method not allowed', 405),
};


// ─── Helpers ───────────────────────────────────────────────────────────────

function get_allowed_types(string $role): array
{
    return match ($role) {
        'bpso' => ['crime'],
        'bdrrm' => ['flood'],
        'bfp' => ['fire'],
        'admin' => ['fire', 'flood', 'crime'],
        default => [],
    };
}

function format_incident(array $row, array $extra = []): array
{
    return array_merge([
        'id' => $row['id'],
        'type' => $row['type'],
        'location' => $row['location'],
        'latitude' => $row['latitude'] !== null ? (float) $row['latitude'] : null,
        'longitude' => $row['longitude'] !== null ? (float) $row['longitude'] : null,
        'device_id' => $row['device_id'],
        'reporter' => $row['reporter'],
        'reporter_id' => $row['reporter_id'],
        'date_time' => $row['date_time'],
        'status' => $row['status'],
        'dispatched_to' => $row['dispatched_to'],
        'dispatched_at' => $row['dispatched_at'],
        'dispatched_by' => $row['dispatched_by'],
        'is_archived' => (bool) $row['is_archived'],
        'archived_at' => $row['archived_at'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'confidence_score' => intval($row['confidence_score'] ?? 1),
        'needs_rescue' => (bool) ($row['needs_rescue'] ?? false),
    ], $extra);
}

function get_rescue_data(mysqli $conn, string $incident_id): array
{
    // ── Check reporter rescue (stored on incident itself) ─────
    $stmt = $conn->prepare("
        SELECT COALESCE(needs_rescue, 0) AS reporter_rescue
        FROM incidents
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->bind_param('s', $incident_id);
    $stmt->execute();
    $reporterRescue = intval($stmt->get_result()->fetch_assoc()['reporter_rescue'] ?? 0);
    $stmt->close();

    // ── Check corroborator rescues ────────────────────────────
    $stmt = $conn->prepare("
        SELECT COALESCE(SUM(needs_rescue), 0) AS rescue_count
        FROM incident_corroborations
        WHERE incident_id = ?
    ");
    $stmt->bind_param('s', $incident_id);
    $stmt->execute();
    $corroRescue = intval($stmt->get_result()->fetch_assoc()['rescue_count'] ?? 0);
    $stmt->close();

    $totalRescue = $reporterRescue + $corroRescue;

    return [
        'rescue' => [
            'count' => $totalRescue,
        ],
    ];
}
// ═══════════════════════════════════════════════════════════════════════════
// GET /incidents.php — paginated list filtered by responder role
// ═══════════════════════════════════════════════════════════════════════════
function handle_get_list(mysqli $conn, array $allowed_types): void
{
    if (empty($allowed_types)) {
        ResponseHelper::success(
            ['data' => [], 'pagination' => ['current_page' => 1, 'total_pages' => 0, 'per_page' => 20, 'total' => 0]],
            'Incidents fetched successfully'
        );
    }

    $status = $_GET['status'] ?? null;
    $type = $_GET['type'] ?? null;
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 10))); // ← was 20
    $offset = ($page - 1) * $limit;

    // Build WHERE
    $conditions = ['is_archived = 0'];
    $params = [];
    $types = '';

    // Role-based type filter
    $placeholders = implode(',', array_fill(0, count($allowed_types), '?'));
    $conditions[] = "type IN ($placeholders)";
    foreach ($allowed_types as $t) {
        $params[] = $t;
        $types .= 's';
    }

    // Optional status filter
    $valid_statuses = ['pending', 'responding', 'resolved', 'false_alarm'];
    if ($status && in_array($status, $valid_statuses, true)) {
        $conditions[] = 'status = ?';
        $params[] = $status;
        $types .= 's';
    }

    if (!empty($_GET['dispatched_to'])) {
        $conditions[] = 'dispatched_to = ?';
        $params[] = $_GET['dispatched_to'];
        $types .= 's';
    }

    // Optional type filter (within allowed)
    if ($type && in_array($type, $allowed_types, true)) {
        $conditions[] = 'type = ?';
        $params[] = $type;
        $types .= 's';
    }

    $where = 'WHERE ' . implode(' AND ', $conditions);

    // Count total
    $count_stmt = $conn->prepare("SELECT COUNT(*) AS total FROM incidents $where");
    if (!empty($params))
        $count_stmt->bind_param($types, ...$params);
    $count_stmt->execute();
    $total = (int) $count_stmt->get_result()->fetch_assoc()['total'];
    $total_pages = (int) ceil($total / $limit);
    $count_stmt->close();

    // Fetch page
    $stmt = $conn->prepare("SELECT * FROM incidents $where ORDER BY created_at DESC LIMIT ? OFFSET ?");
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';
    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    $incidents = [];
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $extra = get_rescue_data($conn, $row['id']);
        $incidents[] = format_incident($row);
    }
    $stmt->close();

    // Match PaginatedResponse shape expected by React Native
    ResponseHelper::success([
        'data' => $incidents,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $total_pages,
            'per_page' => $limit,
            'total' => $total,
        ],
    ], 'Incidents fetched successfully');
}


// ═══════════════════════════════════════════════════════════════════════════
// GET /incidents.php?id=xxx — single incident
// ═══════════════════════════════════════════════════════════════════════════
function handle_get_single(mysqli $conn, string $id, array $allowed_types): void
{
    $stmt = $conn->prepare('SELECT * FROM incidents WHERE id = ? AND is_archived = 0 LIMIT 1');
    $stmt->bind_param('s', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        ResponseHelper::notFound('Incident not found');
    }

    if (!empty($allowed_types) && !in_array($row['type'], $allowed_types, true)) {
        ResponseHelper::forbidden('You do not have access to this incident type');
    }

    $extra = get_rescue_data($conn, $row['id']);
    ResponseHelper::success(format_incident($row, $extra), 'Incident fetched successfully');
}


// ═══════════════════════════════════════════════════════════════════════════
// PUT /incidents.php?id=xxx — responder marks incident as responding/resolved
// ═══════════════════════════════════════════════════════════════════════════
function handle_update_status(mysqli $conn, string $id, array $user): void
{
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $status = trim($body['status'] ?? '');

    $valid_statuses = ['pending', 'responding', 'resolved'];
    if (!in_array($status, $valid_statuses, true)) {
        ResponseHelper::validationError(
            ['status' => ['Must be: pending, responding, or resolved']],
            'Invalid status value'
        );
    }

    // ── Use client timestamp if provided (offline sync accuracy) ──────────
    // Client sends ISO 8601 e.g. "2025-02-18T10:35:00.000Z"
    // Validate and convert to MySQL datetime, fall back to server time
    $now = date('Y-m-d H:i:s'); // server fallback

    if (!empty($body['updated_at'])) {
        // Fix: + signs become spaces in URL transit
        $raw_ts = str_replace(' ', '+', trim($body['updated_at']));

        $parsed = DateTime::createFromFormat(DateTime::ATOM, $raw_ts);

        if (!$parsed) {
            $parsed = DateTime::createFromFormat(
                'Y-m-d\TH:i:s\Z',
                $raw_ts,
                new DateTimeZone('UTC')
            );
        }

        if (!$parsed) {
            $parsed = DateTime::createFromFormat(
                'Y-m-d H:i:s',
                $raw_ts,
                new DateTimeZone('Asia/Manila')
            );
        }

        if ($parsed) {
            $parsed->setTimezone(new DateTimeZone('Asia/Manila'));
            $candidate = $parsed->format('Y-m-d H:i:s');
            $candidateTs = $parsed->getTimestamp();
            $nowTs = time();

            if ($candidateTs <= ($nowTs + 86400) && $candidateTs >= ($nowTs - 604800)) {
                $now = $candidate;
            }
        }
    }
    // Fetch existing incident
    $stmt = $conn->prepare('SELECT * FROM incidents WHERE id = ? AND is_archived = 0 LIMIT 1');
    $stmt->bind_param('s', $id);
    $stmt->execute();
    $incident = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$incident)
        ResponseHelper::notFound('Incident not found');

    // Prevent backwards status changes
    $order = ['pending' => 0, 'responding' => 1, 'resolved' => 2, 'false_alarm' => 2];
    $current = $order[$incident['status']] ?? 0;
    $new = $order[$status] ?? 0;

    if ($new < $current) {
        ResponseHelper::error(
            "Cannot revert status from '{$incident['status']}' to '$status'",
            422
        );
    }

    $responder_name = $user['name'] ?? $user['username'] ?? 'Unknown';
    $responder_id = $user['id'] ?? '';

    if ($status === 'responding' && $incident['status'] === 'pending') {
        // $now used for both dispatched_at and updated_at — same accurate time
        $stmt = $conn->prepare(
            'UPDATE incidents SET status=?, dispatched_to=?, dispatched_at=?, dispatched_by=?, updated_at=? WHERE id=?'
        );
        $stmt->bind_param('ssssss', $status, $responder_id, $now, $responder_name, $now, $id);
    } elseif ($status === 'resolved') {
        // Clear rescue flags on the incident itself
        $stmt = $conn->prepare(
            'UPDATE incidents SET status=?, needs_rescue=0, updated_at=? WHERE id=?'
        );
        $stmt->bind_param('sss', $status, $now, $id);
        $stmt->execute();
        $stmt->close();

        // Also clear rescue flags on all corroborators
        $stmt = $conn->prepare(
            'UPDATE incident_corroborations SET needs_rescue=0 WHERE incident_id=?'
        );
        $stmt->bind_param('s', $id);
    } else {
        $stmt = $conn->prepare('UPDATE incidents SET status=?, updated_at=? WHERE id=?');
        $stmt->bind_param('sss', $status, $now, $id);
    }

    if (!$stmt->execute()) {
        $stmt->close();
        ResponseHelper::error('Failed to update incident status', 500);
    }
    $stmt->close();

    // Return updated record
    $stmt = $conn->prepare('SELECT * FROM incidents WHERE id=? LIMIT 1');
    $stmt->bind_param('s', $id);
    $stmt->execute();
    $updated = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    ResponseHelper::success(format_incident($updated), 'Incident status updated successfully');
}


// ═══════════════════════════════════════════════════════════════════════════
// POST /incidents.php — create new incident
// ═══════════════════════════════════════════════════════════════════════════
function handle_create(mysqli $conn, array $user): void
{
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    // Validate required fields
    $errors = [];
    foreach (['type', 'location', 'reporter', 'date_time'] as $field) {
        if (empty($body[$field])) {
            $errors[$field] = ["The $field field is required"];
        }
    }
    if (!empty($errors)) {
        ResponseHelper::validationError($errors, 'Validation failed');
    }

    $valid_types = ['fire', 'flood', 'crime'];
    if (!in_array($body['type'], $valid_types, true)) {
        ResponseHelper::validationError(
            ['type' => ['Must be: fire, flood, or crime']],
            'Invalid incident type'
        );
    }

    // Generate ID e.g. INC-20250218-0001
    $date_part = date('Ymd');
    $cnt_stmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM incidents WHERE DATE(created_at) = CURDATE()");
    $cnt_stmt->execute();
    $cnt = (int) $cnt_stmt->get_result()->fetch_assoc()['cnt'] + 1;
    $cnt_stmt->close();
    $new_id = 'INC-' . $date_part . '-' . str_pad($cnt, 4, '0', STR_PAD_LEFT);

    $type = $body['type'];
    $location = $body['location'];
    $latitude = isset($body['latitude']) ? (float) $body['latitude'] : null;
    $longitude = isset($body['longitude']) ? (float) $body['longitude'] : null;
    $device_id = $body['device_id'] ?? null;
    $reporter = $body['reporter'];
    $reporter_id = $user['id'] ?? null;
    $date_time = $body['date_time'];
    $status = 'pending';

    $stmt = $conn->prepare(
        'INSERT INTO incidents (id,type,location,latitude,longitude,device_id,reporter,reporter_id,date_time,status)
         VALUES (?,?,?,?,?,?,?,?,?,?)'
    );
    $stmt->bind_param(
        'sssddsssss',
        $new_id,
        $type,
        $location,
        $latitude,
        $longitude,
        $device_id,
        $reporter,
        $reporter_id,
        $date_time,
        $status
    );

    if (!$stmt->execute()) {
        $stmt->close();
        ResponseHelper::error('Failed to create incident', 500);
    }
    $stmt->close();

    $stmt = $conn->prepare('SELECT * FROM incidents WHERE id=? LIMIT 1');
    $stmt->bind_param('s', $new_id);
    $stmt->execute();
    $created = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    ResponseHelper::success(format_incident($created), 'Incident created successfully', 201);
}