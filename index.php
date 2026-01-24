<?php
date_default_timezone_set('Asia/Manila');
session_start();

// Test auto deployment - 2026-01-24

// Restore session from cookies if not already set
if (!isset($_SESSION['user_id']) && isset($_COOKIE['user_id'])) {
    $_SESSION['user_id'] = $_COOKIE['user_id'];
    $_SESSION['name'] = $_COOKIE['name'] ?? '';
    $_SESSION['username'] = $_COOKIE['username'] ?? '';
    $_SESSION['user_role'] = $_COOKIE['user_role'];
}

$route = isset($_GET['route']) ? trim($_GET['route'], '/') : '';

// Handle root/empty route based on authentication
if ($route === '') {
    if (isset($_SESSION['user_id'])) {
        $route = 'home';
    } else {
        $route = 'auth/login';
    }
}

$pagesDir = __DIR__ . '/pages/';
$route = preg_replace('/[^a-zA-Z0-9_\/-]/', '', $route);
$pageFile = $pagesDir . $route . '.php';
$userRole = $_SESSION['user_role'] ?? 'guest';

// ===== Define public routes accessible to everyone =====
$publicRoutes = [
    'auth/login',
    'auth/register',
    'auth/logout'
];

// Check if page file exists
if (!file_exists($pageFile)) {
    http_response_code(404);
    require __DIR__ . '/errors/404.php';
    exit;
}

// ===== Simple Access Control =====

// Allow public routes for everyone
if (in_array($route, $publicRoutes)) {
    require $pageFile;
    exit;
}

// For protected pages, user must be logged in
if ($userRole === 'guest') {
    header('Location: /auth/login');
    exit;
}

// All authenticated users can attempt to access any page
// (Your login.php already ensures only admins can log in via web)
require $pageFile;
exit;
?>