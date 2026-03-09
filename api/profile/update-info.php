<?php
// api/profile/update-info.php

if (session_status() === PHP_SESSION_NONE) session_start();

header('Content-Type: application/json');

require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/auth_helper.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/user_functions.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';

// Must be logged in
if (!AuthChecker::isLoggedIn()) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Parse JSON body
$body = json_decode(file_get_contents('php://input'), true);

$name     = trim($body['name']     ?? '');
$username = trim($body['username'] ?? '');
$userId   = AuthChecker::getUserId(); // Always use session — never trust client-sent userId

// Validate
if (!$name || !$username) {
    echo json_encode(['success' => false, 'error' => 'Name and username are required.']);
    exit;
}

if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    echo json_encode(['success' => false, 'error' => 'Username may only contain letters, numbers, and underscores.']);
    exit;
}

if (strlen($name) > 100) {
    echo json_encode(['success' => false, 'error' => 'Name is too long.']);
    exit;
}

if (strlen($username) > 50) {
    echo json_encode(['success' => false, 'error' => 'Username is too long.']);
    exit;
}

// Check if username is taken by someone else
if (usernameExists($conn, $username, $userId)) {
    echo json_encode(['success' => false, 'error' => 'That username is already taken.']);
    exit;
}

// Update
try {
    $result = updateUser($conn, $userId, $name, $username);

    if ($result) {
        // Refresh session values so the sidebar stays in sync
        $_SESSION['name']     = $name;
        $_SESSION['username'] = $username;

        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'No changes were made.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}