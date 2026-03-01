<?php
// api/mobilee/auth/logout.php

require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../helpers/jwt_helper.php';
require_once __DIR__ . '/../../helpers/response_helper.php';

error_reporting(0);
ini_set('display_errors', '0');

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

try {
    $token = JWTHelper::getTokenFromHeader();

    if ($token) {
        $payload = JWTHelper::verifyToken($token);

        if ($payload && isset($payload['user_id'])) {
            // Delete device token on logout
            $stmt = $conn->prepare("DELETE FROM device_tokens WHERE user_id = ?");
            $stmt->bind_param("s", $payload['user_id']);
            $stmt->execute();
            $stmt->close();
        }
    }

    ResponseHelper::success(null, 'Logout successful');

} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    ResponseHelper::success(null, 'Logout successful');
}