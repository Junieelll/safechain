<?php
require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

$user   = mobile_authenticate();
$role   = strtolower($user['role'] ?? '');
$limit  = min(20, (int) ($_GET['limit'] ?? 5));

// Match allowed incident types per role — same as incidents.php
$allowed_types = match ($role) {
    'bpso'        => ['crime'],
    'bhert'       => ['flood'],
    'firefighter' => ['fire'],
    'admin'       => ['fire', 'flood', 'crime'],
    default       => [],
};

if (empty($allowed_types)) {
    ResponseHelper::success([], 'No timeline entries');
}

$placeholders = implode(',', array_fill(0, count($allowed_types), '?'));
$types        = str_repeat('s', count($allowed_types));
$types       .= 'i'; // for limit

$params   = $allowed_types;
$params[] = $limit;

$stmt = $conn->prepare("
    SELECT t.*, i.type AS incident_type, i.status AS incident_status
    FROM incident_timeline t
    LEFT JOIN incidents i ON i.id = t.incident_id
    WHERE i.type IN ($placeholders)
    ORDER BY t.created_at DESC
    LIMIT ?
");
$stmt->bind_param($types, ...$params);
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
}, $rows), 'Timeline fetched');