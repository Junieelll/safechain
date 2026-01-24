<?php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/user_functions.php';

AuthChecker::requireApiAdmin();

header('Content-Type: application/json');

try {
    $users = getAllUsers($conn);
    
    // Format users for frontend
    $formattedUsers = array_map(function($user) {
        return [
            'userId' => $user['user_id'],
            'name' => $user['name'],
            'username' => $user['username'],
            'role' => $user['role'],
            'status' => $user['status'],
            'lastLogin' => $user['last_login'],
            'createdAt' => $user['created_at']
        ];
    }, $users);
    
    echo json_encode([
        'success' => true,
        'data' => $formattedUsers
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}