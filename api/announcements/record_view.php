<?php
// api/announcements/record_view.php
header('Content-Type: application/json');
require_once '../../config/conn.php';

$data = json_decode(file_get_contents('php://input'), true);

$announcement_id = isset($data['announcement_id']) ? (int)$data['announcement_id'] : 0;
$user_id         = isset($data['user_id'])         ? $data['user_id']               : '';

if (!$announcement_id || empty($user_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing announcement_id or user_id']);
    exit;
}

try {
    $stmt = $conn->prepare("
        INSERT IGNORE INTO announcement_views (announcement_id, user_id)
        VALUES (?, ?)
    ");
    $stmt->bind_param("is", $announcement_id, $user_id);
    $stmt->execute();

    $count_stmt = $conn->prepare("
        SELECT COUNT(*) AS view_count
        FROM announcement_views
        WHERE announcement_id = ?
    ");
    $count_stmt->bind_param("i", $announcement_id);
    $count_stmt->execute();
    $count = $count_stmt->get_result()->fetch_assoc()['view_count'];

    echo json_encode([
        'success'    => true,
        'view_count' => (int)$count,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
