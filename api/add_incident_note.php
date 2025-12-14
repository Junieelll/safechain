<?php
require_once '../config/conn.php';

header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['incident_id']) || !isset($data['note'])) {
        throw new Exception('Incident ID and note are required');
    }
    
    $incidentId = mysqli_real_escape_string($conn, $data['incident_id']);
    $note = mysqli_real_escape_string($conn, $data['note']);
    $adminName = mysqli_real_escape_string($conn, $data['admin_name'] ?? 'Admin');
    
    $query = "INSERT INTO incident_notes (incident_id, admin_name, note) 
              VALUES ('$incidentId', '$adminName', '$note')";
    
    if (mysqli_query($conn, $query)) {
        // Also add to timeline
        $timelineQuery = "INSERT INTO incident_timeline (incident_id, title, description, actor) 
                         VALUES ('$incidentId', 'Admin Note Added', '$note', '$adminName')";
        mysqli_query($conn, $timelineQuery);
        
        echo json_encode([
            'success' => true,
            'message' => 'Note added successfully',
            'time' => date('h:i A')
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