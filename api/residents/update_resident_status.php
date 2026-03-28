<?php
require_once '../../config/conn.php';
header('Content-Type: application/json');

try {
    $body   = json_decode(file_get_contents('php://input'), true);
    $id     = mysqli_real_escape_string($conn, $body['id']     ?? '');
    $status = mysqli_real_escape_string($conn, $body['status'] ?? '');
    $reset  = !empty($body['resetFalseCount']);

    if (empty($id)) {
        throw new Exception('Resident ID is required');
    }

    if (!in_array($status, ['active', 'restricted'])) {
        throw new Exception('Invalid status value');
    }

    $countClause = $reset ? ", false_report_count = 0" : "";
    $query = "UPDATE residents SET status = '$status'$countClause, updated_at = NOW() WHERE resident_id = '$id'";

    if (!mysqli_query($conn, $query)) {
        throw new Exception(mysqli_error($conn));
    }

    echo json_encode(['success' => true, 'message' => 'Resident status updated successfully']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

mysqli_close($conn);
?>