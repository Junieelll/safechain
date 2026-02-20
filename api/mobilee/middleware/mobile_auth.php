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
    // ── 1. Extract token from Authorization header ─────────────────────────
    $token = JWTHelper::getTokenFromHeader();

    if (!$token) {
        ResponseHelper::unauthorized('Authorization token is missing. Please log in.');
    }

    // ── 2. Verify & decode the JWT ─────────────────────────────────────────
    $payload = JWTHelper::verifyToken($token);

    if (!$payload) {
        ResponseHelper::unauthorized('Invalid or expired token. Please log in again.');
    }

    // ── 3. Return user array in the shape the rest of the code expects ─────
    return [
        'id' => $payload['user_id'],
        'name' => $payload['username'],
        'username' => $payload['username'],
        'role' => $payload['role'],
    ];
}