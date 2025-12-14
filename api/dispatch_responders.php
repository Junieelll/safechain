<?php
require_once '../config/conn.php';

header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['incident_id']) || !isset($data['responder_id'])) {
        throw new Exception('Incident ID and responder ID are required');
    }
    
    $incidentId = mysqli_real_escape_string($conn, $data['incident_id']);
    $responderId = mysqli_real_escape_string($conn, $data['responder_id']);
    $adminName = mysqli_real_escape_string($conn, $data['admin_name'] ?? 'Admin');
    
    // Get responder details
    $responderQuery = "SELECT name FROM emergency_responders WHERE id = '$responderId'";
    $responderResult = mysqli_query($conn, $responderQuery);
    $responder = mysqli_fetch_assoc($responderResult);
    
    if (!$responder) {
        throw new Exception('Responder not found');
    }
    
    // Update incident with dispatch info
    $query = "UPDATE incidents SET 
              dispatched_to = '{$responder['name']}',
              dispatched_at = NOW(),
              dispatched_by = '$adminName',
              status = 'responding'
              WHERE id = '$incidentId'";
    
    if (mysqli_query($conn, $query)) {
        // Add to timeline
        $timelineQuery = "INSERT INTO incident_timeline (incident_id, title, description, actor) 
                         VALUES ('$incidentId', 
                                 'Emergency Responders Dispatched', 
                                 '{$responder['name']} dispatched to location', 
                                 '$adminName')";
        mysqli_query($conn, $timelineQuery);
        
        echo json_encode([
            'success' => true,
            'message' => 'Responders dispatched successfully',
            'responder' => $responder['name']
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