<?php
// api/settings/toggle_geofence.php
if (session_status() === PHP_SESSION_NONE)
    session_start();

require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/auth_helper.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/api/helpers/response_helper.php';

setCorsHeaders();

if (!AuthChecker::isLoggedIn() || AuthChecker::getUserRole() !== 'admin') {
    ResponseHelper::unauthorized('Admin access required');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!isset($body['enabled'])) {
    ResponseHelper::error('Missing enabled field', 400);
}

$value = $body['enabled'] ? '1' : '0';

$conn->query("CREATE TABLE IF NOT EXISTS `system_settings` (
    `setting_key`   varchar(100) NOT NULL,
    `setting_value` text NOT NULL,
    `updated_at`    timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

$stmt = $conn->prepare("INSERT INTO system_settings (setting_key, setting_value)
    VALUES ('geofence_enabled', ?)
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
$stmt->bind_param('s', $value);
$stmt->execute();
$stmt->close();

ResponseHelper::success(['geofence_enabled' => $body['enabled']], 'Geofence setting updated');