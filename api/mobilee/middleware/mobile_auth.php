<?php
// api/mobilee/middleware/mobile_auth.php
//
// NOTE: Do NOT require jwt_helper.php or response_helper.php here.
// The parent endpoint (incidents.php etc.) already requires them.
// Adding them here causes "Cannot redeclare" fatal errors.

/**
 * Mobile API Authentication Middleware
 * Validates JWT Bearer tokens sent from the React Native app.
 */

function mobile_authenticate(): array
{
    global $conn;

    // ── 1. Extract token from Authorization header ─────────────────────────
    $token = JWTHelper::getTokenFromHeader();

    if (!$token) {
        ResponseHelper::unauthorized('Authorization token is missing. Please log in.');
    }

    // ── 2. Verify & decode the JWT (also checks token_invalidations table) ─
    $payload = JWTHelper::verifyToken($token, $conn);

    if (!$payload) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Session expired. Please log in again.',
            'code' => 'TOKEN_INVALIDATED'
        ]);
        exit;
    }

    // ── 3. Re-check suspension status on every request ────────────────────
    $stmt = mysqli_prepare($conn,
        "SELECT status, suspension_reason, suspended_until 
         FROM users WHERE user_id = ?"
    );
    mysqli_stmt_bind_param($stmt, 's', $payload['user_id']);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'User not found. Please log in again.',
            'code' => 'USER_NOT_FOUND'
        ]);
        exit;
    }

    if ($user['status'] === 'suspended') {
        // Check if suspension has expired
        $suspendedUntil = $user['suspended_until'] 
            ? strtotime($user['suspended_until']) 
            : null;

        if ($suspendedUntil && $suspendedUntil < time()) {
            // Auto-lift expired suspension
            $lift = mysqli_prepare($conn,
                "UPDATE users SET status = 'active', suspended_until = NULL, 
                 suspension_reason = NULL WHERE user_id = ?"
            );
            mysqli_stmt_bind_param($lift, 's', $payload['user_id']);
            mysqli_stmt_execute($lift);
            mysqli_stmt_close($lift);

            // Also clear token invalidation
            $clear = mysqli_prepare($conn,
                "DELETE FROM token_invalidations WHERE user_id = ?"
            );
            mysqli_stmt_bind_param($clear, 's', $payload['user_id']);
            mysqli_stmt_execute($clear);
            mysqli_stmt_close($clear);

        } else {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Your account has been suspended.',
                'code' => 'ACCOUNT_SUSPENDED',
                'reason' => $user['suspension_reason'] ?? 'No reason provided',
                'suspended_until' => $user['suspended_until'] ?? null
            ]);
            exit;
        }
    }

    // ── 4. Return user array in the shape the rest of the code expects ─────
    return [
        'id'       => $payload['user_id'],
        'name'     => $payload['username'],
        'username' => $payload['username'],
        'role'     => $payload['role'],
    ];
}