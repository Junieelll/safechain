<?php
require_once '../../config/conn.php';

header('Content-Type: application/json');

try {
    if (!isset($_GET['incident_id'])) {
        throw new Exception('Incident ID is required');
    }

    $incident_id = mysqli_real_escape_string($conn, $_GET['incident_id']);
    $method = $_SERVER['REQUEST_METHOD'];

    // ← Add this block
    if ($method === 'DELETE') {
        if (!isset($_GET['id'])) throw new Exception('Evidence ID is required');

        $id = (int) $_GET['id'];

        // Get file path first
        $row = mysqli_fetch_assoc(mysqli_query($conn, "SELECT file_path FROM incident_evidence WHERE id = $id AND incident_id = '$incident_id'"));

        if (!$row) throw new Exception('Evidence not found');

        // Delete physical file
        $full_path = __DIR__ . '/../../' . $row['file_path'];
        if (file_exists($full_path)) unlink($full_path);

        // Delete from DB
        $deleted = mysqli_query($conn, "DELETE FROM incident_evidence WHERE id = $id AND incident_id = '$incident_id'");

        if (!$deleted) throw new Exception(mysqli_error($conn));

        echo json_encode(['success' => true, 'message' => 'Evidence deleted']);
        exit;
    }

    // GET — existing code unchanged
    $result = mysqli_query($conn, "SELECT * FROM incident_evidence WHERE incident_id = '$incident_id' ORDER BY uploaded_at DESC");
    if (!$result) throw new Exception(mysqli_error($conn));

    $evidence = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $evidence[] = [
            'id'          => (int) $row['id'],
            'incident_id' => $row['incident_id'],
            'file_name'   => $row['file_name'],
            'file_type'   => $row['file_type'],
            'file_path'   => $row['file_path'],
            'file_url'    => rtrim(BASE_URL, '/') . '/' . $row['file_path'],
            'uploaded_by' => $row['uploaded_by'],
            'uploaded_at' => $row['uploaded_at'],
        ];
    }

    echo json_encode(['success' => true, 'data' => $evidence]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

mysqli_close($conn);