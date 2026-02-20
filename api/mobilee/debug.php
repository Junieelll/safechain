<?php
// api/mobilee/debug.php
// TEMPORARY - delete this file after debugging!

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

echo json_encode([
    'HTTP_AUTHORIZATION'          => $_SERVER['HTTP_AUTHORIZATION']          ?? 'NOT SET',
    'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'NOT SET',
    'getallheaders'               => function_exists('getallheaders') ? getallheaders() : 'function not available',
    'all_server_keys_with_auth'   => array_filter(
        $_SERVER,
        fn($key) => stripos($key, 'auth') !== false,
        ARRAY_FILTER_USE_KEY
    ),
]);