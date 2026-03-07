<?php
header('Content-Type: application/json');
require_once '../../config/conn.php';

$data = json_decode(file_get_contents('php://input'), true);

$resident_id = $data['resident_id'] ?? '';
$fcm_token   = $data['fcm_token']   ?? '';
$platform    = $data['platform']    ?? 'android';

if (empty($resident_id) || empty($fcm_token)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing fields']);
    exit;
}

try {
    // Insert or update token for this resident
    $stmt = $conn->prepare("
        INSERT INTO fcm_tokens (resident_id, fcm_token, platform, updated_at)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            fcm_token  = VALUES(fcm_token),
            platform   = VALUES(platform),
            updated_at = NOW()
    ");
    $stmt->bind_param("sss", $resident_id, $fcm_token, $platform);
    $stmt->execute();

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>