<?php
// api/profile/delete-account.php

if (session_status() === PHP_SESSION_NONE)
    session_start();

require_once $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/auth_helper.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/api/helpers/response_helper.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

if (!AuthChecker::isLoggedIn()) {
    ResponseHelper::unauthorized('Not authenticated');
}

$userId = AuthChecker::getUserId();

$body = json_decode(file_get_contents('php://input'), true);
$password = trim($body['password'] ?? '');

if (empty($password)) {
    ResponseHelper::error('Password is required to delete your account.', 422);
}

// ── Verify password before deleting ──────────────────────────────────────────
$stmt = $conn->prepare("SELECT password, profile_picture FROM users WHERE user_id = ?");
$stmt->bind_param("s", $userId);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user) {
    ResponseHelper::error('Account not found.', 404);
}

if (!password_verify($password, $user['password'])) {
    ResponseHelper::error('Incorrect password. Please try again.', 401);
}

// ── Delete profile picture from disk if it exists ─────────────────────────────
if (!empty($user['profile_picture'])) {
    $picPath = $_SERVER['DOCUMENT_ROOT'] . '/' . $user['profile_picture'];
    if (file_exists($picPath)) {
        unlink($picPath);
    }
}

// ── Delete the user (cascades to device_tokens, token_invalidations, announcements) ──
$stmt = $conn->prepare("DELETE FROM users WHERE user_id = ?");
$stmt->bind_param("s", $userId);
$deleted = $stmt->execute();
$stmt->close();

if (!$deleted) {
    ResponseHelper::error('Failed to delete account. Please try again.', 500);
}

// ── Destroy session ───────────────────────────────────────────────────────────
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params['path'], $params['domain'],
        $params['secure'], $params['httponly']
    );
}
session_destroy();

ResponseHelper::success(null, 'Account deleted successfully.');