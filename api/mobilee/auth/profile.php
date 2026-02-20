<?php
require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

$user   = mobile_authenticate();
$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'GET' => handle_get($conn, $user),
    'PUT' => handle_update($conn, $user),
    default => ResponseHelper::error('Method not allowed', 405),
};

function handle_get(mysqli $conn, array $user): void
{
    $stmt = $conn->prepare('SELECT user_id, name, username, role, status, profile_picture, created_at, updated_at, last_login FROM users WHERE user_id = ? LIMIT 1');
    $stmt->bind_param('s', $user['id']);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) ResponseHelper::notFound('User not found');
    ResponseHelper::success(format_user($row), 'Profile fetched');
}

function handle_update(mysqli $conn, array $user): void
{
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $name     = trim($body['name']     ?? '');
    $username = trim($body['username'] ?? '');

    $errors = [];
    if (empty($name))     $errors['name']     = ['Full name is required'];
    if (empty($username)) $errors['username'] = ['Username is required'];
    if (!empty($errors))  ResponseHelper::validationError($errors, 'Validation failed');

    // Check username uniqueness (exclude current user)
    $check = $conn->prepare('SELECT user_id FROM users WHERE username = ? AND user_id != ? LIMIT 1');
    $check->bind_param('ss', $username, $user['id']);
    $check->execute();
    $exists = $check->get_result()->fetch_assoc();
    $check->close();

    if ($exists) {
        ResponseHelper::validationError(
            ['username' => ['Username is already taken']],
            'Validation failed'
        );
    }

    $stmt = $conn->prepare('UPDATE users SET name = ?, username = ?, updated_at = NOW() WHERE user_id = ?');
    $stmt->bind_param('sss', $name, $username, $user['id']);

    if (!$stmt->execute()) {
        $stmt->close();
        ResponseHelper::error('Failed to update profile', 500);
    }
    $stmt->close();

    // Return updated user
    $fetch = $conn->prepare('SELECT user_id, name, username, role, status, profile_picture, created_at, updated_at, last_login FROM users WHERE user_id = ? LIMIT 1');
    $fetch->bind_param('s', $user['id']);
    $fetch->execute();
    $updated = $fetch->get_result()->fetch_assoc();
    $fetch->close();

    ResponseHelper::success(format_user($updated), 'Profile updated successfully');
}

function format_user(array $row): array
{
    return [
        'user_id'             => $row['user_id'],
        'name'                => $row['name'],
        'username'            => $row['username'],
        'role'                => $row['role'],
        'status'              => $row['status'],
        'profile_picture'     => $row['profile_picture'],
        'profile_picture_url' => !empty($row['profile_picture'])
                                    ? rtrim(BASE_URL, '/') . '/' . $row['profile_picture']
                                    : null,
        'created_at'          => $row['created_at'],
        'updated_at'          => $row['updated_at'],
        'last_login'          => $row['last_login'] ?? null,
    ];
}