<?php
require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

$user = mobile_authenticate();
$body = json_decode(file_get_contents('php://input'), true) ?? [];

$current_password          = trim($body['current_password'] ?? '');
$new_password              = trim($body['new_password'] ?? '');
$new_password_confirmation = trim($body['new_password_confirmation'] ?? '');

// ── Validate ───────────────────────────────────────────────────────────────
$errors = [];
if (empty($current_password))          $errors['current_password']          = ['Current password is required'];
if (empty($new_password))              $errors['new_password']              = ['New password is required'];
if (strlen($new_password) < 8) $errors['new_password'][] = 'Must be at least 8 characters';
if ($new_password !== $new_password_confirmation) {
    $errors['new_password_confirmation'] = ['Passwords do not match'];
}
if (!empty($errors)) ResponseHelper::validationError($errors, 'Validation failed');

// ── Fetch current hashed password ─────────────────────────────────────────
$stmt = $conn->prepare('SELECT password FROM users WHERE user_id = ? LIMIT 1');
$stmt->bind_param('s', $user['id']);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row) ResponseHelper::notFound('User not found');

if (!password_verify($current_password, $row['password'])) {
    ResponseHelper::validationError(
        ['current_password' => ['Current password is incorrect']],
        'Validation failed'
    );
}

if (password_verify($new_password, $row['password'])) {
    ResponseHelper::validationError(
        ['new_password' => ['New password must be different from current password']],
        'Validation failed'
    );
}

// ── Update ─────────────────────────────────────────────────────────────────
$hashed = password_hash($new_password, PASSWORD_BCRYPT);
$stmt   = $conn->prepare('UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?');
$stmt->bind_param('ss', $hashed, $user['id']);

if (!$stmt->execute()) {
    $stmt->close();
    ResponseHelper::error('Failed to update password', 500);
}
$stmt->close();

ResponseHelper::success(null, 'Password changed successfully');