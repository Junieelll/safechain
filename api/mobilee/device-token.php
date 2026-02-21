<?php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../helpers/response_helper.php';
require_once __DIR__ . '/middleware/mobile_auth.php';

setCorsHeaders();
$user = mobile_authenticate();

$body  = json_decode(file_get_contents('php://input'), true) ?? [];
$token = $body['token'] ?? null;

if (!$token) {
    ResponseHelper::error('Token required', 400);
    return;
}

$user_id = $user['id'];
$role    = $user['role'] ?? '';

$stmt = $conn->prepare('
    INSERT INTO device_tokens (user_id, role, token, updated_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE role = VALUES(role), token = VALUES(token), updated_at = NOW()
');
$stmt->bind_param('sss', $user_id, $role, $token);
$stmt->execute();
$stmt->close();

ResponseHelper::success(null, 'Token saved');