<?php
// api/settings/save.php
if (session_status() === PHP_SESSION_NONE)
    session_start();

require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/auth_helper.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/helpers/response_helper.php';

setCorsHeaders();

if (!AuthChecker::isLoggedIn() || AuthChecker::getUserRole() !== 'admin') {
    ResponseHelper::unauthorized('Admin access required');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHelper::error('Method not allowed', 405);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) ResponseHelper::error('Invalid request body', 400);

$tab = $body['tab'] ?? '';

// ── Ensure settings table exists ─────────────────────────────────────────
$conn->query("CREATE TABLE IF NOT EXISTS `system_settings` (
    `setting_key`   varchar(100) NOT NULL,
    `setting_value` text NOT NULL,
    `updated_at`    timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

// ── Allowed keys per tab ─────────────────────────────────────────────────
$allowedKeys = [
    'barangay' => ['barangay_name','barangay_address','barangay_contact','barangay_email','barangay_logo'],
    'reports'  => ['report_left_logo','report_right_logo',
                   'report_republic_line','report_barangay_line','report_address_line','report_tel_line',
                   'report_punong_name','report_punong_position',
                   'report_officials',
                   'report_sk_name','report_secretary_name','report_treasurer_name',
                   'report_signatory_name','report_signatory_pos','report_footer_note'],
    'system'   => ['force_resolve_hours','maintenance_mode','dashboard_banner','dashboard_banner_type',
                   'notification_sound','notification_volume','notification_duration'],
];

if (!isset($allowedKeys[$tab])) {
    ResponseHelper::error('Invalid tab', 400);
}

$keys = $allowedKeys[$tab];

// ── Handle image uploads (base64) ────────────────────────────────────────
function saveBase64Image(string $base64Data, string $prefix, mysqli $conn): ?string
{
    if (empty($base64Data)) return null;

    // Parse data URI
    if (!preg_match('/^data:(image\/[a-zA-Z+]+);base64,(.+)$/', $base64Data, $m)) return null;

    $mime    = $m[1];
    $imgData = base64_decode($m[2]);
    if (!$imgData) return null;

    $ext = match ($mime) {
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
        'image/svg+xml' => 'svg',
        default      => 'jpg',
    };

    $dir = $_SERVER['DOCUMENT_ROOT'] . '/uploads/settings/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $filename = $prefix . '_' . time() . '.' . $ext;
    $path     = $dir . $filename;

    if (file_put_contents($path, $imgData) === false) return null;

    return 'uploads/settings/' . $filename;
}

// Barangay logo
if ($tab === 'barangay' && !empty($body['barangay_logo_data'])) {
    // Delete old logo
    $old = $conn->query("SELECT setting_value FROM system_settings WHERE setting_key='barangay_logo'")->fetch_assoc();
    if ($old && !empty($old['setting_value'])) {
        $oldPath = $_SERVER['DOCUMENT_ROOT'] . '/' . $old['setting_value'];
        if (file_exists($oldPath)) @unlink($oldPath);
    }

    $logoPath = saveBase64Image($body['barangay_logo_data'], 'logo', $conn);
    if ($logoPath) $body['barangay_logo'] = $logoPath;
}

// Report logos (left + right)
if ($tab === 'reports') {
    foreach (['report_left_logo', 'report_right_logo'] as $slot) {
        // Clear if requested
        if (($body[$slot . '_cleared'] ?? '0') === '1') {
            $old = $conn->query("SELECT setting_value FROM system_settings WHERE setting_key='$slot'")->fetch_assoc();
            if ($old && !empty($old['setting_value'])) {
                $p = $_SERVER['DOCUMENT_ROOT'] . '/' . $old['setting_value'];
                if (file_exists($p)) @unlink($p);
            }
            $body[$slot] = '';
        }
        // Upload new
        if (!empty($body[$slot . '_data'])) {
            $old = $conn->query("SELECT setting_value FROM system_settings WHERE setting_key='$slot'")->fetch_assoc();
            if ($old && !empty($old['setting_value'])) {
                $p = $_SERVER['DOCUMENT_ROOT'] . '/' . $old['setting_value'];
                if (file_exists($p)) @unlink($p);
            }
            $path = saveBase64Image($body[$slot . '_data'], $slot, $conn);
            if ($path) $body[$slot] = $path;
        }
    }

    // Validate officials JSON
    if (isset($body['report_officials'])) {
        $decoded = json_decode($body['report_officials'], true);
        $body['report_officials'] = json_encode(is_array($decoded) ? $decoded : []);
    }
}

// Notification sound
if ($tab === 'system') {
    // If cleared, delete old file and blank the value
    if (($body['notification_sound_cleared'] ?? '0') === '1') {
        $old = $conn->query("SELECT setting_value FROM system_settings WHERE setting_key='notification_sound'")->fetch_assoc();
        if ($old && !empty($old['setting_value'])) {
            $oldPath = $_SERVER['DOCUMENT_ROOT'] . '/' . $old['setting_value'];
            if (file_exists($oldPath)) @unlink($oldPath);
        }
        $body['notification_sound'] = '';
    }

    // If a new sound file was uploaded
    if (!empty($body['notification_sound_data'])) {
        $soundData = $body['notification_sound_data'];
        if (preg_match('/^data:(audio\/[a-zA-Z+\-]+);base64,(.+)$/', $soundData, $m)) {
            $mime     = $m[1];
            $rawAudio = base64_decode($m[2]);
            $ext = match ($mime) {
                'audio/mpeg', 'audio/mp3' => 'mp3',
                'audio/wav'               => 'wav',
                'audio/ogg'               => 'ogg',
                default                   => 'mp3',
            };

            $dir = $_SERVER['DOCUMENT_ROOT'] . '/uploads/settings/sounds/';
            if (!is_dir($dir)) mkdir($dir, 0755, true);

            // Delete old custom sound
            $old = $conn->query("SELECT setting_value FROM system_settings WHERE setting_key='notification_sound'")->fetch_assoc();
            if ($old && !empty($old['setting_value'])) {
                $oldPath = $_SERVER['DOCUMENT_ROOT'] . '/' . $old['setting_value'];
                if (file_exists($oldPath)) @unlink($oldPath);
            }

            // Sanitize filename from client hint
            $origName = preg_replace('/[^a-zA-Z0-9_\-.]/', '_', $body['notification_sound_name'] ?? 'alert');
            $filename  = 'sound_' . time() . '_' . $origName;
            $filePath  = $dir . $filename;

            if (file_put_contents($filePath, $rawAudio) !== false) {
                $body['notification_sound'] = 'uploads/settings/sounds/' . $filename;
            }
        }
    }
}

// ── Validate system-specific fields ─────────────────────────────────────
if ($tab === 'system') {
    $hours = (int)($body['force_resolve_hours'] ?? 6);
    if ($hours < 1 || $hours > 48) {
        ResponseHelper::error('Force-resolve threshold must be between 1 and 48 hours', 422);
    }
    $body['force_resolve_hours'] = (string)$hours;
    $body['maintenance_mode'] = in_array($body['maintenance_mode'] ?? '0', ['0','1']) ? $body['maintenance_mode'] : '0';
    $body['dashboard_banner_type'] = in_array($body['dashboard_banner_type'] ?? 'info', ['info','warning','danger'])
        ? $body['dashboard_banner_type'] : 'info';

    $vol = (int)($body['notification_volume'] ?? 70);
    $body['notification_volume'] = (string)max(0, min(100, $vol));

    $dur = (int)($body['notification_duration'] ?? 3);
    $body['notification_duration'] = (string)max(1, min(30, $dur));
}

// ── Upsert each key ───────────────────────────────────────────────────────
$stmt = $conn->prepare("INSERT INTO system_settings (setting_key, setting_value)
    VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");

foreach ($keys as $key) {
    if (!isset($body[$key])) continue;
    $value = trim((string)$body[$key]);
    $stmt->bind_param('ss', $key, $value);
    $stmt->execute();
}
$stmt->close();

// ── Return fresh settings ─────────────────────────────────────────────────
$updated = [];
$result = $conn->query("SELECT setting_key, setting_value FROM system_settings");
while ($row = $result->fetch_assoc()) {
    $updated[$row['setting_key']] = $row['setting_value'];
}

ResponseHelper::success($updated, 'Settings saved successfully');