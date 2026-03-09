<?php
// api/profile/upload-avatar.php



if (session_status() === PHP_SESSION_NONE)
    session_start();

require_once $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/auth_helper.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/api/helpers/response_helper.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

if (!AuthChecker::isLoggedIn()) {
    ResponseHelper::unauthorized('Not authenticated');
}

$userId = AuthChecker::getUserId();

// ── Validate file was sent ────────────────────────────────────────────────────
if (empty($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit.',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form upload limit.',
        UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        UPLOAD_ERR_EXTENSION  => 'Upload blocked by extension.',
    ];
    $code = $_FILES['avatar']['error'] ?? UPLOAD_ERR_NO_FILE;
    ResponseHelper::error($uploadErrors[$code] ?? 'Upload failed.', 400);
}

$file     = $_FILES['avatar'];
$maxBytes = 5 * 1024 * 1024; // 5 MB raw upload limit

if ($file['size'] > $maxBytes) {
    ResponseHelper::error('File is too large. Maximum size is 5 MB.', 400);
}

// ── Validate MIME type (check actual bytes, not just extension) ───────────────
$allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jfif', 'image/pjpeg'];
$finfo        = finfo_open(FILEINFO_MIME_TYPE);
$mimeType     = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedMimes, true)) {
    ResponseHelper::error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.', 400);
}

// ── Load image into GD ────────────────────────────────────────────────────────
$source = match ($mimeType) {
    'image/jpeg',
    'image/jfif',
    'image/pjpeg' => imagecreatefromjpeg($file['tmp_name']),  // JFIF is just JPEG under the hood
    'image/png'   => imagecreatefrompng($file['tmp_name']),
    'image/gif'   => imagecreatefromgif($file['tmp_name']),
    'image/webp'  => imagecreatefromwebp($file['tmp_name']),
    default       => null,
};

if (!$source) {
    ResponseHelper::error('Could not process image.', 400);
}

// ── Auto-rotate based on EXIF (JPEG only) ────────────────────────────────────
if (in_array($mimeType, ['image/jpeg', 'image/jfif', 'image/pjpeg'], true) && function_exists('exif_read_data')) {
    $exif        = @exif_read_data($file['tmp_name']);
    $orientation = $exif['Orientation'] ?? 1;

    $source = match ($orientation) {
        3       => imagerotate($source, 180, 0),
        6       => imagerotate($source, -90, 0),
        8       => imagerotate($source, 90, 0),
        default => $source,
    };
}

// ── Smart square crop + resize to 400×400 ────────────────────────────────────
$outputSize = 400;

$srcW = imagesx($source);
$srcH = imagesy($source);

// Find the largest centered square
$squareSize = min($srcW, $srcH);
$srcX       = (int)(($srcW - $squareSize) / 2);
$srcY       = (int)(($srcH - $squareSize) / 2);

$canvas = imagecreatetruecolor($outputSize, $outputSize);

// Preserve transparency for PNG/GIF/WebP
if (in_array($mimeType, ['image/png', 'image/gif', 'image/webp'], true)) {
    imagealphablending($canvas, false);
    imagesavealpha($canvas, true);
    $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
    imagefilledrectangle($canvas, 0, 0, $outputSize, $outputSize, $transparent);
}

imagecopyresampled(
    $canvas, $source,
    0, 0,           // dst x, y
    $srcX, $srcY,   // src x, y (centered crop)
    $outputSize, $outputSize,   // dst w, h
    $squareSize, $squareSize    // src w, h
);

imagedestroy($source);

// ── Save to disk ──────────────────────────────────────────────────────────────
$uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/uploads/profiles/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Delete old profile picture if it exists
$stmt = $conn->prepare("SELECT profile_picture FROM users WHERE user_id = ?");
$stmt->bind_param("s", $userId);
$stmt->execute();
$old = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!empty($old['profile_picture'])) {
    $oldPath = $_SERVER['DOCUMENT_ROOT'] . '/' . $old['profile_picture'];
    if (file_exists($oldPath)) {
        unlink($oldPath);
    }
}

// Always save as JPEG for consistency (smaller file size)
$filename    = 'profile_' . $userId . '_' . time() . '.jpg';
$destination = $uploadDir . $filename;

$saved = imagejpeg($canvas, $destination, 88); // 88% quality — good balance
imagedestroy($canvas);

if (!$saved) {
    ResponseHelper::error('Failed to save image.', 500);
}

// ── Update DB ─────────────────────────────────────────────────────────────────
$relativePath = 'uploads/profiles/' . $filename;

$stmt = $conn->prepare("UPDATE users SET profile_picture = ?, updated_at = NOW() WHERE user_id = ?");
$stmt->bind_param("ss", $relativePath, $userId);
$success = $stmt->execute();
$stmt->close();

if (!$success) {
    // Clean up saved file if DB update fails
    unlink($destination);
    ResponseHelper::error('Failed to update profile picture in database.', 500);
}

ResponseHelper::success([
    'profile_picture_url' => rtrim(BASE_URL, '/') . '/' . $relativePath,
], 'Profile picture updated successfully.');