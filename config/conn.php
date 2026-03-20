<?php
if (!defined('BASE_URL')) {
    define('BASE_URL', 'https://safechain.site');
}
date_default_timezone_set('Asia/Manila');

// Load secure config
$config = require $_SERVER['DOCUMENT_ROOT'] . '/../secure/secrets.php';

$conn = mysqli_connect(
    $config['db']['host'],
    $config['db']['user'],
    $config['db']['pass'],
    $config['db']['name']
);

if (!$conn) {
    die('Database connection failed: ' . mysqli_connect_error());
}

// Set MySQL timezone
mysqli_query($conn, "SET time_zone = '+08:00'");
