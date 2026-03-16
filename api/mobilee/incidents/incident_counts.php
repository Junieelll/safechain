<?php
require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ResponseHelper::error('Method not allowed', 405);
}

$user          = mobile_authenticate();
$role          = strtolower($user['role'] ?? '');
$allowed_types = match ($role) {
    'bpso'        => ['crime'],
    'bdrrm'       => ['flood'],
    'bfp' => ['fire'],
    'admin'       => ['fire', 'flood', 'crime'],
    default       => [],
};

if (empty($allowed_types)) {
    ResponseHelper::success([
        'total'      => 0,
        'pending'    => 0,
        'responding' => 0,
        'resolved'   => 0,
        'false_alarm'=> 0,
    ]);
}

$placeholders = implode(',', array_fill(0, count($allowed_types), '?'));
$types        = str_repeat('s', count($allowed_types));

$stmt = $conn->prepare("
    SELECT 
        COUNT(*)                                            AS total,
        SUM(status = 'pending')                            AS pending,
        SUM(status = 'responding')                         AS responding,
        SUM(status = 'resolved')                           AS resolved,
        SUM(status = 'false_alarm')                        AS false_alarm
    FROM incidents
    WHERE is_archived = 0
      AND type IN ($placeholders)
");
$stmt->bind_param($types, ...$allowed_types);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

ResponseHelper::success([
    'total'       => (int)($row['total']       ?? 0),
    'pending'     => (int)($row['pending']     ?? 0),
    'responding'  => (int)($row['responding']  ?? 0),
    'resolved'    => (int)($row['resolved']    ?? 0),
    'false_alarm' => (int)($row['false_alarm'] ?? 0),
]);