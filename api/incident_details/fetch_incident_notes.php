<?php
require_once '../../config/conn.php';

header('Content-Type: application/json');

try {
    if (!isset($_GET['incident_id'])) {
        throw new Exception('Incident ID is required');
    }
    
    $incidentId = mysqli_real_escape_string($conn, $_GET['incident_id']);
    
    $query = "
        SELECT 
            id,
            admin_name,
            note,
            DATE_FORMAT(created_at, '%h:%i %p') as time
        FROM incident_notes
        WHERE incident_id = '$incidentId'
        ORDER BY created_at DESC
    ";
    
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        throw new Exception(mysqli_error($conn));
    }
    
    $notes = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $notes[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $notes
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>