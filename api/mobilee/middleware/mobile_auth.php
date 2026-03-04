<?php
// api/mobilee/middleware/mobile_auth.php
// 
// NOTE: Do NOT require jwt_helper.php or response_helper.php here.
// The parent endpoint (incidents.php etc.) already requires them.
// Adding them here causes "Cannot redeclare" fatal errors.

/**
 * Mobile API Authentication Middleware
 * Validates JWT Bearer tokens sent from the React Native app.
 * */

require_once __DIR__ . '/../middleware/mobile_auth.php';
require_once __DIR__ .'/../../helpers/jwt_helper.php';
require_once __DIR__ .'/../../helpers/response_helper.php';
$user = mobile_authenticate();
function mobile_authenticate(): array
{
    // ── 1. Extract token ───────────────────────────────────────────────────
    $token = JWTHelper::getTokenFromHeader();
    if (!$token) {
        ResponseHelper::unauthorized('Authorization token is missing. Please log in.');
    }

    // ── 2. Verify JWT ──────────────────────────────────────────────────────
    $payload = JWTHelper::verifyToken($token);
    if (!$payload) {
        ResponseHelper::unauthorized('Invalid or expired token. Please log in again.');
    }

    // ── 3. Check live user status from DB ──────────────────────────────────
    require_once __DIR__ . '/../../../config/conn.php';

    $stmt = mysqli_prepare($conn,
        "SELECT status, suspension_reason, suspended_until FROM users WHERE user_id = ?"
    );
    mysqli_stmt_bind_param($stmt, "s", $payload['user_id']);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if (!$user) {
        ResponseHelper::unauthorized('Account not found.');
    }

    if ($user['status'] === 'suspended') {
        // Check if suspension has expired
        if ($user['suspended_until'] && strtotime($user['suspended_until']) < time()) {
            // Auto-lift expired suspension
            require_once __DIR__ . '/../../../includes/user_functions.php';
            activateUser($conn, $payload['user_id']);
        } else {
            // Still suspended — return structured 401 for the mobile app to handle
            http_response_code(401);
            echo json_encode([
                'success'         => false,
                'code'            => 'ACCOUNT_SUSPENDED',
                'message'         => 'Your account has been suspended.',
                'reason'          => $user['suspension_reason'],
                'suspended_until' => $user['suspended_until'],
            ]);
            exit;
        }
    }

    // ── 4. Return user payload ─────────────────────────────────────────────
    return [
        'id'       => $payload['user_id'],
        'name'     => $payload['username'],
        'username' => $payload['username'],
        'role'     => $payload['role'],
    ];
}