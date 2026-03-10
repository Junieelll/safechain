<?php
date_default_timezone_set('Asia/Manila');
session_start();

$route = isset($_GET['route']) ? trim($_GET['route'], '/') : '';
// Handle root/empty route based on authentication
if ($route === '') {
    if (isset($_SESSION['user_id'])) {
        $route = 'home';
    } else {
        $route = 'auth/login';
    }
}
$route = preg_replace('/[^a-zA-Z0-9_\/-]/', '', $route);
$userRole = $_SESSION['user_role'] ?? 'guest';

// ===== Define public routes accessible to everyone =====
$publicRoutes = [
    'auth/login',
    'auth/register',
    'auth/logout',
    'reset-password-page',  // Password reset page — no login required
];

// ===== Look for the page file in /pages/ first, then /page/ =====
$pagesDir = __DIR__ . '/pages/';
$pageDir  = __DIR__ . '/page/';

$pageFile = null;
if (file_exists($pagesDir . $route . '.php')) {
    $pageFile = $pagesDir . $route . '.php';
} elseif (file_exists($pageDir . $route . '.php')) {
    $pageFile = $pageDir . $route . '.php';
}

// Check if page file was found
if (!$pageFile) {
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
require $pageFile;
exit;
?>
