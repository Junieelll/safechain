<?php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/user_functions.php';

// Require admin authentication
AuthChecker::requireApiAdmin();

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? '';
$newPassword = $input['newPassword'] ?? '';

if (empty($userId) || empty($newPassword)) {
    echo json_encode([
        'success' => false,
        'error' => 'User ID and new password are required'
    ]);
    exit;
}

if (strlen($newPassword) < 8) {
    echo json_encode([
        'success' => false,
        'error' => 'Password must be at least 8 characters'
    ]);
    exit;
}

try {
    // Update password using helper function
    $result = updatePassword($conn, $userId, $newPassword);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to change password'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}