<?php
session_start();

// Restore session from cookies if not already set
if (!isset($_SESSION['user_id']) && isset($_COOKIE['user_id'])) {
    $_SESSION['user_id'] = $_COOKIE['user_id'];
    $_SESSION['name'] = $_COOKIE['name'] ?? '';
    $_SESSION['username'] = $_COOKIE['username'] ?? '';
    $_SESSION['user_role'] = $_COOKIE['user_role'];
}

$route = isset($_GET['route']) ? trim($_GET['route'], '/') : 'auth/login';

$pagesDir = __DIR__ . '/pages/';

$route = preg_replace('/[^a-zA-Z0-9_\/-]/', '', $route);

$pageFile = $pagesDir . $route . '.php';

$userRole = $_SESSION['user_role'] ?? 'guest';

function getAllowedRoutes($baseDir, $prefix = '') {
    $allowedRoutes = [];

    foreach (glob($baseDir . '*', GLOB_ONLYDIR) as $folder) {
        $role = basename($folder);
        $allowedRoutes[$role] = [];

        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($folder));
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $relativePath = str_replace([$baseDir, '\\'], ['', '/'], $file->getPathname());
                $relativePath = trim($relativePath, '/');
                $relativePath = preg_replace('/\.php$/', '', $relativePath);
                $allowedRoutes[$role][] = $relativePath;
            }
        }
    }
    return $allowedRoutes;
}

$allowedRoutes = getAllowedRoutes($pagesDir);

// ===== NEW: Define shared routes accessible to all authenticated users =====
$sharedAuthenticatedRoutes = [
    'home',
    'profile',
    'settings',
    // Add any other pages that all authenticated users should access
];

// ===== NEW: Define public routes accessible to everyone (including guests) =====
$publicRoutes = [
    'auth/login',
    'auth/register',
    'auth/logout'
];

// Ensure guest role exists in allowedRoutes
if (!isset($allowedRoutes['guest'])) {
    $allowedRoutes['guest'] = [];
}

// Add public routes to all roles (including guest)
foreach ($publicRoutes as $publicPage) {
    foreach (array_keys($allowedRoutes) as $role) {
        if (!in_array($publicPage, $allowedRoutes[$role])) {
            $allowedRoutes[$role][] = $publicPage;
        }
    }
}

// Add all auth pages to guest role
foreach (glob($pagesDir . 'auth/*.php') as $authFile) {
    $fileName = pathinfo($authFile, PATHINFO_FILENAME);
    $authRoute = "auth/$fileName";
    if (!in_array($authRoute, $allowedRoutes['guest'])) {
        $allowedRoutes['guest'][] = $authRoute;
    }
}

$authenticatedRoles = ['admin', 'responder', 'operator']; // Add all your authenticated roles here

foreach ($authenticatedRoles as $role) {
    if (!isset($allowedRoutes[$role])) {
        $allowedRoutes[$role] = [];
    }
    
    foreach ($sharedAuthenticatedRoutes as $sharedRoute) {
        if (!in_array($sharedRoute, $allowedRoutes[$role])) {
            $allowedRoutes[$role][] = $sharedRoute;
        }
    }
}

// Show 404 if page is not found
if (!file_exists($pageFile)) {
    http_response_code(404);
    require __DIR__ . '/errors/404.php';
    exit;
}

if ($userRole === 'guest' && !in_array($route, $allowedRoutes['guest'])) {
    header('Location: /safechain/');
    exit;
}

// Show 403 if page is forbidden
if (!isset($allowedRoutes[$userRole]) || !in_array($route, $allowedRoutes[$userRole])) {
    http_response_code(403);
    require __DIR__ . '/errors/403.php';
    exit;
}

require $pageFile;
?>