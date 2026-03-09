<?php
// api/profile/check-username.php

if (session_status() === PHP_SESSION_NONE) session_start();

header('Content-Type: application/json');

require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/auth_helper.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/user_functions.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';

if (!AuthChecker::isLoggedIn()) {
    echo json_encode(['taken' => false]);
    exit;
}

$username = trim($_GET['username'] ?? '');

if (!$username || !preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    echo json_encode(['taken' => false]);
    exit;
}

$currentUserId = AuthChecker::getUserId();
$taken = usernameExists($conn, $username, $currentUserId);

echo json_encode(['taken' => $taken]);