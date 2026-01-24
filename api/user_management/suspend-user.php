<?php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/user_functions.php';

// Require admin authentication
AuthChecker::requireApiAdmin();

header('Content-Type: application/json');

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = trim($input['userId'] ?? '');
    $duration = $input['duration'] ?? 'indefinite';
    $reason = trim($input['reason'] ?? '');
    
    // Validation
    if (empty($userId)) {
        throw new Exception('User ID is required');
    }
    
    if (empty($reason)) {
        throw new Exception('Suspension reason is required');
    }
    
    // Validate duration
    $validDurations = ['1day', '3days', '1week', '1month', 'indefinite'];
    if (!in_array($duration, $validDurations)) {
        throw new Exception('Invalid duration');
    }
    
    // Prevent admin from suspending themselves
    if ($userId === AuthChecker::getUserId()) {
        throw new Exception('You cannot suspend your own account');
    }
    
    // Suspend user using helper function
    $result = suspendUser($conn, $userId, $duration, $reason);
    
    if (!$result) {
        throw new Exception('Failed to suspend user');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'User suspended successfully'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>