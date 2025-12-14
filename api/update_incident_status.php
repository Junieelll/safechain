<?php
require_once '../config/conn.php';

header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['id']) || !isset($data['status'])) {
        throw new Exception('Incident ID and status are required');
    }
    
    $incidentId = mysqli_real_escape_string($conn, $data['id']);
    $status = mysqli_real_escape_string($conn, $data['status']);
    
    // Validate status
    if (!in_array($status, ['pending', 'responding', 'resolved'])) {
        throw new Exception('Invalid status');
    }
    
    // Update incident status
    $query = "UPDATE incidents SET status = '$status' WHERE id = '$incidentId'";
    
    if (mysqli_query($conn, $query)) {
        echo json_encode([
            'success' => true,
            'message' => 'Status updated successfully'
        ]);
    } else {
        throw new Exception(mysqli_error($conn));
    }
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>