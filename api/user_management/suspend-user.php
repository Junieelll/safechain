<?php
// api/user-management/suspend-user.php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/user_functions.php';

AuthChecker::requireApiAdmin();

header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = trim($input['userId'] ?? '');
    $duration = $input['duration'] ?? 'indefinite';
    $reason = trim($input['reason'] ?? '');
    
    if (empty($userId)) {
        throw new Exception('User ID is required');
    }
    
    if (empty($reason)) {
        throw new Exception('Suspension reason is required');
    }
    
    $validDurations = ['1day', '3days', '1week', '1month', 'indefinite'];
    if (!in_array($duration, $validDurations)) {
        throw new Exception('Invalid duration');
    }
    
    if ($userId === AuthChecker::getUserId()) {
        throw new Exception('You cannot suspend your own account');
    }
    
    // Suspend user
    $result = suspendUser($conn, $userId, $duration, $reason);
    
    if (!$result) {
        throw new Exception('Failed to suspend user');
    }
    
    // Invalidate all tokens for this user
    $stmt = mysqli_prepare($conn,
        "INSERT INTO token_invalidations (user_id, invalidated_at, reason) 
         VALUES (?, NOW(), ?)
         ON DUPLICATE KEY UPDATE invalidated_at = NOW(), reason = VALUES(reason)"
    );
    
    if (!$stmt) {
        throw new Exception('Failed to prepare token invalidation: ' . mysqli_error($conn));
    }
    
    mysqli_stmt_bind_param($stmt, 'ss', $userId, $reason);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('Failed to invalidate tokens: ' . mysqli_stmt_error($stmt));
    }
    
    mysqli_stmt_close($stmt);
    
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