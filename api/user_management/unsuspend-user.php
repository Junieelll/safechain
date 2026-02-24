<?php
// api/user-management/unsuspend-user.php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/user_functions.php';

AuthChecker::requireApiAdmin();

header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = trim($input['userId'] ?? '');
    
    if (empty($userId)) {
        throw new Exception('User ID is required');
    }
    
    // Lift suspension
    $result = activateUser($conn, $userId);
    
    if (!$result) {
        throw new Exception('Failed to lift suspension');
    }
    
    // Remove token invalidation so user can log in again with existing token
    $stmt = mysqli_prepare($conn,
        "DELETE FROM token_invalidations WHERE user_id = ?"
    );
    
    if (!$stmt) {
        throw new Exception('Failed to prepare token restoration: ' . mysqli_error($conn));
    }
    
    mysqli_stmt_bind_param($stmt, 's', $userId);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('Failed to restore tokens: ' . mysqli_stmt_error($stmt));
    }
    
    mysqli_stmt_close($stmt);
    
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