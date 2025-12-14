<?php
session_start();
require_once '../config/conn.php';
require_once '../includes/auth_helper.php';

// Require authentication
AuthChecker::requireAuth();

header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['id']) || !isset($data['status'])) {
        throw new Exception('Incident ID and status are required');
    }
    
    $incidentId = mysqli_real_escape_string($conn, $data['id']);
    $status = mysqli_real_escape_string($conn, $data['status']);
    
    // Get admin name from session via AuthChecker
    // If admin_name is provided in request, use it, otherwise get from session
    $adminName = isset($data['admin_name']) 
        ? mysqli_real_escape_string($conn, $data['admin_name'])
        : 'Admin ' . AuthChecker::getName();
    
    $notes = isset($data['notes']) ? mysqli_real_escape_string($conn, $data['notes']) : '';
    
    // Validate status
    if (!in_array($status, ['pending', 'responding', 'resolved'])) {
        throw new Exception('Invalid status');
    }
    
    // Status labels for timeline
    $statusLabels = [
        'pending' => 'Pending - Awaiting Dispatch',
        'responding' => 'Active Response - On Scene',
        'resolved' => 'Resolved'
    ];
    
    // Update incident status
    $query = "UPDATE incidents SET status = '$status' WHERE id = '$incidentId'";
    
    if (mysqli_query($conn, $query)) {
        // Add timeline entry for status update
        $timelineTitle = 'Status Updated';
        $timelineDescription = 'Status changed to: ' . $statusLabels[$status];
        
        $timelineQuery = "INSERT INTO incident_timeline (incident_id, title, description, actor) 
                         VALUES ('$incidentId', '$timelineTitle', '$timelineDescription', '$adminName')";
        mysqli_query($conn, $timelineQuery);
        
        // If notes were provided, add them as a separate timeline entry
        if (!empty($notes)) {
            $notesTimelineQuery = "INSERT INTO incident_timeline (incident_id, title, description, actor) 
                                  VALUES ('$incidentId', 'Admin Note Added', '$notes', '$adminName')";
            mysqli_query($conn, $notesTimelineQuery);
            
            // Also add to incident_notes table
            $notesQuery = "INSERT INTO incident_notes (incident_id, admin_name, note) 
                          VALUES ('$incidentId', '$adminName', '$notes')";
            mysqli_query($conn, $notesQuery);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Status updated successfully',
            'status' => $status,
            'admin_name' => $adminName
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