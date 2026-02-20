<?php
require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../../helpers/jwt_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

ini_set('max_execution_time', 60);
ini_set('upload_max_filesize', '50M');
ini_set('post_max_size', '50M');

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

$user = mobile_authenticate();
$method = $_SERVER['REQUEST_METHOD'];
$incident_id = $_GET['incident_id'] ?? null;

if (!$incident_id) {
    ResponseHelper::error('Incident ID is required', 400);
}

match ($method) {
    'GET'    => handle_get($conn, $incident_id),
    'POST'   => handle_post($conn, $incident_id, $user),
    'DELETE' => handle_delete($conn, $incident_id),
    default  => ResponseHelper::error('Method not allowed', 405),
};

function handle_delete(mysqli $conn, string $incident_id): void
{
    $id = $_GET['id'] ?? null;
    if (!$id) ResponseHelper::error('Evidence ID is required', 400);

    // Get file path first so we can delete the file
    $stmt = $conn->prepare("SELECT file_path FROM incident_evidence WHERE id = ? AND incident_id = ?");
    $stmt->bind_param('is', $id, $incident_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) ResponseHelper::notFound('Evidence not found');

    // Delete physical file
    $full_path = __DIR__ . "/../../../{$row['file_path']}";
    if (file_exists($full_path)) unlink($full_path);

    // Delete from DB
    $stmt = $conn->prepare("DELETE FROM incident_evidence WHERE id = ? AND incident_id = ?");
    $stmt->bind_param('is', $id, $incident_id);
    $stmt->execute();
    $stmt->close();

    ResponseHelper::success(null, 'Evidence deleted');
}

// GET — fetch all evidence for an incident
function handle_get(mysqli $conn, string $incident_id): void
{
    $stmt = $conn->prepare("
        SELECT * FROM incident_evidence
        WHERE incident_id = ?
        ORDER BY uploaded_at DESC
    ");
    $stmt->bind_param('s', $incident_id);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    ResponseHelper::success(array_map('format_evidence', $rows), 'Evidence fetched');
}

// POST — upload a file
function handle_post(mysqli $conn, string $incident_id, array $user): void
{
    if (empty($_FILES['file'])) {
        ResponseHelper::error('No file uploaded', 400);
    }

    $file = $_FILES['file'];
    $file_name = basename($file['name']);
    $file_type = $file['type'];
    $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

    $allowed = ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'mp3', 'm4a', 'pdf', 'doc', 'docx'];
    if (!in_array($ext, $allowed, true)) {
        ResponseHelper::error('File type not allowed', 422);
    }

    // Save to /uploads/evidence/{incident_id}/
    $upload_dir = __DIR__ . "/../../../uploads/evidence/{$incident_id}/";
    if (!is_dir($upload_dir))
        mkdir($upload_dir, 0755, true);

    $unique_name = uniqid() . "_" . $file_name;
    $file_path = "uploads/evidence/{$incident_id}/{$unique_name}";
    $full_path = __DIR__ . "/../../../{$file_path}";

    if (!move_uploaded_file($file['tmp_name'], $full_path)) {
        ResponseHelper::error('Failed to save file', 500);
    }

    $uploaded_by = $user['name'] ?? 'Responder';

    $stmt = $conn->prepare("
        INSERT INTO incident_evidence (incident_id, file_name, file_type, file_path, uploaded_by)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('sssss', $incident_id, $file_name, $file_type, $file_path, $uploaded_by);
    $stmt->execute();
    $new_id = $conn->insert_id;
    $stmt->close();

    $row = $conn->query("SELECT * FROM incident_evidence WHERE id = $new_id")->fetch_assoc();
    ResponseHelper::success(format_evidence($row), 'Evidence uploaded');
}

function format_evidence(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'incident_id' => $row['incident_id'],
        'file_name' => $row['file_name'],
        'file_type' => $row['file_type'],
        'file_path' => $row['file_path'],
        'file_url' => rtrim(BASE_URL, '/') . '/' . $row['file_path'], // define BASE_URL in conn.php
        'uploaded_by' => $row['uploaded_by'],
        'uploaded_at' => $row['uploaded_at'],
    ];
}