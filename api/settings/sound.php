<?php
// api/settings/sound.php
// Public-ish endpoint — only needs a valid session (any logged-in user).
// Returns the current notification sound URL, volume, and duration.
// The JS polling script calls this once on page load.

if (session_status() === PHP_SESSION_NONE) session_start();

require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/auth_helper.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/helpers/response_helper.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/helpers/settings_helper.php';

setCorsHeaders();

if (!AuthChecker::isLoggedIn()) {
    ResponseHelper::unauthorized();
}

$soundPath = SystemSettings::value('notification_sound');
$soundUrl  = !empty($soundPath)
    ? rtrim(BASE_URL, '/') . '/' . ltrim($soundPath, '/')
    : rtrim(BASE_URL, '/') . '/assets/sounds/alert.mp3';   // fallback default

ResponseHelper::success([
    'src'      => $soundUrl,
    'volume'   => SystemSettings::notificationVolume(),      // 0.0–1.0
    'duration' => (int) SystemSettings::value('notification_duration', '3'), // seconds
]);