<?php
require_once __DIR__ . '/../config/conn.php';
require_once __DIR__ . '/../includes/auth_helper.php';
require_once __DIR__ . '/../includes/user_functions.php';

AuthChecker::requireApiAdmin();

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';

if (empty($username)) {
    echo json_encode(['exists' => false]);
    exit;
}

try {
    $exists = usernameExists($conn, $username);
    echo json_encode(['exists' => $exists]);
} catch (Exception $e) {
    echo json_encode(['exists' => false]);
}