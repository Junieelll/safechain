<?php
// api/settings/get.php
if (session_status() === PHP_SESSION_NONE)
    session_start();

require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/auth_helper.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/api/helpers/response_helper.php';

setCorsHeaders();

if (!AuthChecker::isLoggedIn()) {
    ResponseHelper::unauthorized('Login required');
}

$key = $_GET['key'] ?? '';
if (empty($key)) {
    ResponseHelper::error('Missing key parameter', 400);
}

$key = $conn->real_escape_string($key);
$result = $conn->query("SELECT setting_value FROM system_settings WHERE setting_key = '$key' LIMIT 1");

if ($result && $row = $result->fetch_assoc()) {
    ResponseHelper::success(['key' => $key, 'value' => $row['setting_value']]);
} else {
    ResponseHelper::success(['key' => $key, 'value' => null]);
}