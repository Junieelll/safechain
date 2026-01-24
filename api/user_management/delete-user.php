<?php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/user_functions.php';

AuthChecker::requireApiAdmin();

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? '';

if (empty($userId)) {
    echo json_encode([
        'success' => false,
        'error' => 'User ID is required'
    ]);
    exit;
}

// Prevent admin from deleting themselves
if ($userId === AuthChecker::getUserId()) {
    echo json_encode([
        'success' => false,
        'error' => 'You cannot delete your own account'
    ]);
    exit;
}

try {
    // Delete user using helper function
    $result = deleteUser($conn, $userId);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to delete user'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}