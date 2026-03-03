<?php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../helpers/response_helper.php';
require_once __DIR__ . '/middleware/mobile_auth.php';

setCorsHeaders();
$user = mobile_authenticate();

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$on_duty    = isset($body['on_duty']) ? (int)$body['on_duty'] : 1;
$duty_start = $body['duty_start'] ?? null; // "08:00"
$duty_end   = $body['duty_end']   ?? null; // "17:00"
$duty_until = $body['duty_until'] ?? null; // "2026-03-10"

$stmt = $conn->prepare("
    UPDATE device_tokens 
    SET on_duty = ?, duty_start = ?, duty_end = ?, duty_until = ?
    WHERE user_id = ?
");
$stmt->bind_param("issss", $on_duty, $duty_start, $duty_end, $duty_until, $user['id']);
$stmt->execute();
$stmt->close();

ResponseHelper::success(null, 'Duty status updated');