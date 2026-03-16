<?php
// api/mobilee/auth/login.php

require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../../includes/user_functions.php';
require_once __DIR__ . '/../../helpers/jwt_helper.php';
require_once __DIR__ . '/../../helpers/response_helper.php';

// Set error reporting for production (hide warnings)
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

// Set CORS headers
setCorsHeaders();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate input
    if (!isset($input['username']) || !isset($input['password'])) {
        ResponseHelper::validationError(
            ['username' => ['Username is required'], 'password' => ['Password is required']],
            'Please provide username and password'
        );
    }

    $username = trim($input['username']);
    $password = $input['password'];

    if (empty($username) || empty($password)) {
        ResponseHelper::validationError(
            ['username' => ['Username cannot be empty'], 'password' => ['Password cannot be empty']],
            'Please fill in all fields'
        );
    }

    // Check if user exists
    $user = getUserByUsername($conn, $username);

    if (!$user) {
        ResponseHelper::error('Invalid username or password', 401);
    }

    // Check if user is suspended
    $userStatus = $user['status'] ?? 'active';
    if ($userStatus === 'suspended') {
        $suspendedUntil = isset($user['suspended_until']) && $user['suspended_until']
            ? strtotime($user['suspended_until'])
            : null;

        // Check if suspension has expired
        if ($suspendedUntil && $suspendedUntil < time()) {
            // Automatically lift suspension
            activateUser($conn, $user['user_id']);
            $userStatus = 'active';
        } else {
            $suspendedUntilText = $suspendedUntil
                ? date('F j, Y', $suspendedUntil)
                : 'indefinitely';

            $suspensionReason = $user['suspension_reason'] ?? 'No reason provided';

            ResponseHelper::error(
                "Your account has been suspended until {$suspendedUntilText}. Reason: {$suspensionReason}",
                403
            );
        }
    }

    // Check if user role is allowed (not admin - mobile app is for responders and residents only)
    $allowedRoles = ['bpso', 'bdrrm', 'bfp', 'resident'];
    if (!in_array($user['role'], $allowedRoles)) {
        ResponseHelper::error('Access denied. This platform is for responders and residents only.', 403);
    }

    // Verify password
    if (!password_verify($password, $user['password'])) {
        ResponseHelper::error('Invalid username or password', 401);
    }

    // Update last login
    updateLastLogin($conn, $user['user_id']);

    // Generate JWT token
    $token = JWTHelper::generateToken($user['user_id'], $user['username'], $user['role'], $user['name']);

    // Prepare user data (remove sensitive information and handle missing fields)
    $userData = [
        'user_id' => $user['user_id'],
        'name' => $user['name'],
        'username' => $user['username'],
        'role' => $user['role'],
        'status' => $userStatus,
        'suspended_until' => $user['suspended_until'] ?? null,
        'suspension_reason' => $user['suspension_reason'] ?? null,
        'created_at' => $user['created_at'] ?? date('Y-m-d H:i:s'),
        'updated_at' => $user['updated_at'] ?? date('Y-m-d H:i:s'),
        'last_login' => date('Y-m-d H:i:s')
    ];

    // Send success response
    ResponseHelper::success([
        'token' => $token,
        'user' => $userData
    ], 'Login successful');

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    ResponseHelper::error('An error occurred. Please try again later.', 500);
}
?>