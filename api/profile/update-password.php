<?php
// api/profile/update-password.php

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

$currentPassword = $body['currentPassword'] ?? '';
$newPassword     = $body['newPassword']     ?? '';
$userId          = AuthChecker::getUserId(); // Always use session

// Validate inputs
if (!$currentPassword || !$newPassword) {
    echo json_encode(['success' => false, 'error' => 'All password fields are required.']);
    exit;
}

if (strlen($newPassword) < 8) {
    echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters.']);
    exit;
}

if (!preg_match('/[A-Z]/', $newPassword)) {
    echo json_encode(['success' => false, 'error' => 'Password must contain at least one uppercase letter.']);
    exit;
}

if (!preg_match('/[0-9]/', $newPassword)) {
    echo json_encode(['success' => false, 'error' => 'Password must contain at least one number.']);
    exit;
}

// Fetch user's current hashed password from DB
$stmt = mysqli_prepare($conn, "SELECT password FROM users WHERE user_id = ?");
mysqli_stmt_bind_param($stmt, 's', $userId);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$row    = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

if (!$row) {
    echo json_encode(['success' => false, 'error' => 'User not found.']);
    exit;
}

// Verify current password
if (!password_verify($currentPassword, $row['password'])) {
    echo json_encode(['success' => false, 'error' => 'Current password is incorrect.']);
    exit;
}

// Prevent reusing the same password
if (password_verify($newPassword, $row['password'])) {
    echo json_encode(['success' => false, 'error' => 'New password must be different from your current password.']);
    exit;
}

// Update password using existing helper
try {
    $result = updatePassword($conn, $userId, $newPassword);

    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update password.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}