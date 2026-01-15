<?php
require_once __DIR__ . '/../config/conn.php';
require_once __DIR__ . '/../includes/auth_helper.php';
require_once __DIR__ . '/../includes/user_functions.php';

// Require admin authentication
AuthChecker::requireApiAdmin();

header('Content-Type: application/json');

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = trim($input['userId'] ?? '');
    
    // Validation
    if (empty($userId)) {
        throw new Exception('User ID is required');
    }
    
    // Lift suspension using helper function
    $result = activateUser($conn, $userId);
    
    if (!$result) {
        throw new Exception('Failed to lift suspension');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Suspension lifted successfully'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>