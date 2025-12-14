<?php
require_once '../config/conn.php';

header('Content-Type: application/json');

try {
    if (!isset($_GET['incident_id'])) {
        throw new Exception('Incident ID is required');
    }
    
    $incidentId = mysqli_real_escape_string($conn, $_GET['incident_id']);
    
    $query = "
        SELECT 
            id,
            title,
            description,
            actor,
            DATE_FORMAT(created_at, '%h:%i %p') as time,
            created_at
        FROM incident_timeline
        WHERE incident_id = '$incidentId'
        ORDER BY created_at ASC
    ";
    
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        throw new Exception(mysqli_error($conn));
    }
    
    $timeline = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $timeline[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $timeline
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>