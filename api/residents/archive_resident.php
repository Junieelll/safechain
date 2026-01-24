<?php
require_once '../../config/conn.php';

header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['id'])) {
        throw new Exception('Resident ID is required');
    }
    
    $residentId = mysqli_real_escape_string($conn, $data['id']);
    
    // Update resident to archived with timestamp
    $query = "UPDATE residents SET 
              is_archived = 1,
              archived_at = NOW()
              WHERE resident_id = '$residentId'";
    
    if (mysqli_query($conn, $query)) {
        echo json_encode([
            'success' => true,
            'message' => 'Resident archived successfully'
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
