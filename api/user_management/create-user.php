<?php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/user_functions.php';

// Require admin authentication
AuthChecker::requireApiAdmin();

header('Content-Type: application/json');

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

$fullName = $input['fullName'] ?? '';
$username = $input['username'] ?? '';
$role = $input['role'] ?? '';
$password = $input['password'] ?? '';

// Validation
if (empty($fullName) || empty($username) || empty($role) || empty($password)) {
    echo json_encode([
        'success' => false,
        'error' => 'All fields are required'
    ]);
    exit;
}

try {
    // Check if username already exists
    if (usernameExists($conn, $username)) {
        echo json_encode([
            'success' => false,
            'error' => 'Username already exists'
        ]);
        exit;
    }
    
    // Create user using helper function
    $user = createUser($conn, $fullName, $username, $password, $role);
    
    echo json_encode([
        'success' => true,
        'data' => $user
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}