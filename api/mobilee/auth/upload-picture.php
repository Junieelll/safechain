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

if (empty($_FILES['photo'])) {
    ResponseHelper::validationError(['photo' => ['No file uploaded']], 'Validation failed');
}

$file    = $_FILES['photo'];
$ext     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
$maxSize = 3 * 1024 * 1024;

if (!in_array($ext, $allowed)) {
    ResponseHelper::validationError(['photo' => ['Only JPG, PNG, WEBP allowed']], 'Validation failed');
}
if ($file['size'] > $maxSize) {
    ResponseHelper::validationError(['photo' => ['File too large (max 3MB)']], 'Validation failed');
}

// Delete old picture if exists
$check = $conn->prepare('SELECT profile_picture FROM users WHERE user_id = ? LIMIT 1');
$check->bind_param('s', $user['id']);
$check->execute();
$row = $check->get_result()->fetch_assoc();
$check->close();

if (!empty($row['profile_picture'])) {
    $oldPath = __DIR__ . "/../../../{$row['profile_picture']}";
    if (file_exists($oldPath)) unlink($oldPath);
}

// Save to /uploads/profiles/ — same pattern as evidence
$uploadDir = __DIR__ . '/../../../uploads/profiles/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$filename     = 'profile_' . $user['id'] . '_' . time() . '.' . $ext;
$relativePath = 'uploads/profiles/' . $filename;
$fullPath     = __DIR__ . '/../../../' . $relativePath;

if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
    ResponseHelper::error('Failed to save file', 500);
}

$stmt = $conn->prepare('UPDATE users SET profile_picture = ?, updated_at = NOW() WHERE user_id = ?');
$stmt->bind_param('ss', $relativePath, $user['id']);
$stmt->execute();
$stmt->close();

ResponseHelper::success([
    'profile_picture' => $relativePath,
    'profile_picture_url' => rtrim(BASE_URL, '/') . '/' . $relativePath,
], 'Profile picture updated');