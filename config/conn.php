<?php
date_default_timezone_set('Asia/Manila');

// Load secure config
$config = require $_SERVER['DOCUMENT_ROOT'] . '/../secure/db_config.php';

// Connect to database
$conn = mysqli_connect(
    $config['host'],
    $config['user'],
    $config['pass'],
    $config['name']
);

if (!$conn) {
    die('Database connection failed: ' . mysqli_connect_error());
}

// Set MySQL timezone
mysqli_query($conn, "SET time_zone = '+08:00'");
