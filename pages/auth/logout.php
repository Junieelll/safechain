<?php
// auth/logout.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../../includes/auth_helper.php';

// Use the AuthChecker logout method
AuthChecker::logout();

// Set logout success message for login page
session_start();
$_SESSION['logout_message'] = 'You have been successfully logged out.';

// Redirect to login page
header('Location: /safechain/auth/login');
exit;