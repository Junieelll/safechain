<?php
require_once '../config/conn.php';

header('Content-Type: application/json');

try {
    // Get the raw POST data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['id'])) {
        throw new Exception('Incident ID is required');
    }
    
    $incidentId = mysqli_real_escape_string($conn, $data['id']);
    
    // Update incident to archived
    $query = "UPDATE incidents SET is_archived = 1 WHERE id = '$incidentId'";
    
    if (mysqli_query($conn, $query)) {
        echo json_encode([
            'success' => true,
            'message' => 'Incident archived successfully'
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