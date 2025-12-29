<?php
require_once __DIR__ . '/../config/conn.php';
require_once __DIR__ . '/../includes/auth_helper.php';
require_once __DIR__ . '/../includes/user_functions.php';

// Require admin authentication
AuthChecker::requireApiAdmin();

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? '';
$fullName = $input['fullName'] ?? '';
$username = $input['username'] ?? '';
$role = $input['role'] ?? '';

if (empty($userId) || empty($fullName) || empty($username) || empty($role)) {
    echo json_encode([
        'success' => false,
        'error' => 'All fields are required'
    ]);
    exit;
}

try {
    // Check if username exists for other users
    if (usernameExists($conn, $username, $userId)) {
        echo json_encode([
            'success' => false,
            'error' => 'Username already exists'
        ]);
        exit;
    }
    
    // Update user using helper function
    $result = updateUser($conn, $userId, $fullName, $username, $role);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to update user'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}