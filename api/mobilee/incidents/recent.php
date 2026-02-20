<?php
require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

setCorsHeaders();
mobile_authenticate();

$limit = min(20, (int) ($_GET['limit'] ?? 5));

$stmt = $conn->prepare("
    SELECT t.*, i.type as incident_type
    FROM incident_timeline t
    LEFT JOIN incidents i ON i.id = t.incident_id
    ORDER BY t.created_at DESC
    LIMIT ?
");
$stmt->bind_param('i', $limit);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

ResponseHelper::success(array_map(function($row) {
    return [
        'id'             => $row['id'],
        'incident_id'    => $row['incident_id'],
        'incident_type'  => $row['incident_type'],
        'title'          => $row['title'],
        'description'    => $row['description'],
        'actor'          => $row['actor'],
        'created_at'     => $row['created_at'],
    ];
}, $rows), 'Timeline fetched');