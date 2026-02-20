<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);   
require_once __DIR__ . '/../helpers/response_helper.php';

setCorsHeaders();

ResponseHelper::success([
    'message' => 'API is working!',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_time' => time()
], 'Connection successful');
?>