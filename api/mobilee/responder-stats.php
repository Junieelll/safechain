<?php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../helpers/response_helper.php';
require_once __DIR__ . '/middleware/mobile_auth.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ResponseHelper::error('Method not allowed', 405);
}

$user       = mobile_authenticate();
$responderId = $user['id'] ?? '';

$stmt = $conn->prepare("
    SELECT
        COUNT(*)                             AS total,
        SUM(status = 'resolved')             AS resolved
    FROM incidents
    WHERE dispatched_to = ?
      AND is_archived   = 0
");
$stmt->bind_param('s', $responderId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

$total    = (int)($row['total']    ?? 0);
$resolved = (int)($row['resolved'] ?? 0);
$rate     = $total === 0 ? 0 : round(($resolved / $total) * 100);

ResponseHelper::success([
    'total'           => $total,
    'resolved'        => $resolved,
    'resolution_rate' => $rate,
]);