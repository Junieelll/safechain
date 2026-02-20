<?php
// api/mobilee/auth/logout.php

require_once __DIR__ . '/../../helpers/jwt_helper.php';
require_once __DIR__ . '/../../helpers/response_helper.php';

// Suppress warnings
error_reporting(0);
ini_set('display_errors', '0');

// Set CORS headers
setCorsHeaders();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

try {
    // Get token from header (optional for logout)
    $token = JWTHelper::getTokenFromHeader();
    
    if ($token) {
        // Verify token if provided
        $payload = JWTHelper::verifyToken($token);
        
        if (!$payload) {
            // Token invalid but still allow logout
            ResponseHelper::success(null, 'Logout successful');
            exit;
        }
    }
    
    // In a real app, you might want to:
    // 1. Add token to a blacklist in database
    // 2. Clear any server-side sessions
    // For now, we just send success response
    
    ResponseHelper::success(null, 'Logout successful');
    
} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    // Even if there's an error, allow logout (client-side cleanup is what matters)
    ResponseHelper::success(null, 'Logout successful');
}
?>