<?php
require_once '../../config/conn.php';
require_once '../../includes/auth_helper.php';

header('Content-Type: application/json');

ini_set('upload_max_filesize', '50M');
ini_set('post_max_size', '50M');

AuthChecker::requireAuth('/auth/login.php');
$uploaded_by = AuthChecker::getName();

try {
    if (!isset($_GET['incident_id'])) throw new Exception('Incident ID is required');
    if (empty($_FILES['file']))       throw new Exception('No file uploaded');

    $incident_id = mysqli_real_escape_string($conn, $_GET['incident_id']);
    $file        = $_FILES['file'];
    $file_name   = basename($file['name']);
    $file_type   = $file['type'];
    $ext         = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

    $allowed = ['jpg', 'jpeg', 'png', 'jfif', 'gif', 'mp4', 'mov', 'mp3', 'm4a', 'pdf', 'doc', 'docx'];
    if (!in_array($ext, $allowed, true)) throw new Exception('File type not allowed');

    $upload_dir = __DIR__ . "/../../uploads/evidence/{$incident_id}/";
    if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);

    $unique_name = uniqid() . '_' . $file_name;
    $file_path   = "uploads/evidence/{$incident_id}/{$unique_name}";
    $full_path   = __DIR__ . "/../../{$file_path}";

    if (!move_uploaded_file($file['tmp_name'], $full_path)) {
        throw new Exception('Failed to save file');
    }

    $stmt = $conn->prepare("
        INSERT INTO incident_evidence (incident_id, file_name, file_type, file_path, uploaded_by)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('sssss', $incident_id, $file_name, $file_type, $file_path, $uploaded_by);
    $stmt->execute();
    $new_id = $conn->insert_id;
    $stmt->close();

    $row = $conn->query("SELECT * FROM incident_evidence WHERE id = $new_id")->fetch_assoc();

    echo json_encode([
        'success' => true,
        'data'    => [
            'id'          => (int) $row['id'],
            'file_name'   => $row['file_name'],
            'file_type'   => $row['file_type'],
            'file_url'    => rtrim(BASE_URL, '/') . '/' . $row['file_path'],
            'uploaded_by' => $row['uploaded_by'],
            'uploaded_at' => $row['uploaded_at'],
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}