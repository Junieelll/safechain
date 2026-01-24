<?php
require_once '../../includes/auth_helper.php';

header('Content-Type: application/json');

try {
    // Check if user is logged in
    if (!AuthChecker::isLoggedIn()) {
        throw new Exception('Not authenticated');
    }
    
    echo json_encode([
        'success' => true,
        'admin_name' => AuthChecker::getName(),
        'user_id' => AuthChecker::getUserId(),
        'username' => AuthChecker::getUsername(),
        'role' => AuthChecker::getUserRole()
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>