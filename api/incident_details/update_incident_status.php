<?php
session_start();
require_once '../../config/conn.php';
require_once '../../includes/auth_helper.php';

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
    
    $adminName = isset($data['admin_name']) 
        ? mysqli_real_escape_string($conn, $data['admin_name'])
        : 'Admin ' . AuthChecker::getName();
    
    $notes = isset($data['notes']) ? mysqli_real_escape_string($conn, $data['notes']) : '';
    
    // Validate status
    if (!in_array($status, ['pending', 'responding', 'resolved'])) {
        throw new Exception('Invalid status');
    }

    // ── Server-side guards ────────────────────────────────────────────────────

    // 1. Check incident exists and get current status
    $checkQuery = "SELECT status FROM incidents WHERE id = '$incidentId' AND is_archived = 0";
    $checkResult = mysqli_query($conn, $checkQuery);

    if (!$checkResult || mysqli_num_rows($checkResult) === 0) {
        throw new Exception('Incident not found');
    }

    $currentIncident = mysqli_fetch_assoc($checkResult);
    $currentStatus   = $currentIncident['status'];

    // 2. Block any changes to already-resolved incidents
    if ($currentStatus === 'resolved') {
        throw new Exception('This incident is already resolved and cannot be modified');
    }

    // 3. Prevent setting the same status
    if ($currentStatus === $status) {
        throw new Exception('Incident is already set to this status');
    }

    // ─────────────────────────────────────────────────────────────────────────
    
    // Status labels for timeline
    $statusLabels = [
        'pending'    => 'Pending - Awaiting Dispatch',
        'responding' => 'Active Response - On Scene',
        'resolved'   => 'Resolved'
    ];
    
    // Update incident status
    $query = "UPDATE incidents SET status = '$status' WHERE id = '$incidentId'";
    
    if (!mysqli_query($conn, $query)) {
        throw new Exception(mysqli_error($conn));
    }

    // Add timeline entry for status update
    $timelineTitle       = mysqli_real_escape_string($conn, 'Status Updated');
    $timelineDescription = mysqli_real_escape_string($conn, 'Status changed to: ' . $statusLabels[$status]);

    $timelineQuery = "INSERT INTO incident_timeline (incident_id, title, description, actor) 
                      VALUES ('$incidentId', '$timelineTitle', '$timelineDescription', '$adminName')";

    if (!mysqli_query($conn, $timelineQuery)) {
        throw new Exception('Failed to log timeline: ' . mysqli_error($conn));
    }

    // If notes were provided, add them as a note + separate timeline entry
    if (!empty($notes)) {
        // Insert into incident_notes
        $notesQuery = "INSERT INTO incident_notes (incident_id, admin_name, note) 
                       VALUES ('$incidentId', '$adminName', '$notes')";

        if (!mysqli_query($conn, $notesQuery)) {
            throw new Exception('Failed to save note: ' . mysqli_error($conn));
        }

        // Insert into timeline
        $notesTimelineQuery = "INSERT INTO incident_timeline (incident_id, title, description, actor) 
                               VALUES ('$incidentId', 'Admin Note Added', '$notes', '$adminName')";

        if (!mysqli_query($conn, $notesTimelineQuery)) {
            throw new Exception('Failed to log note in timeline: ' . mysqli_error($conn));
        }
    }

    // If resolved, record the resolved timestamp
    if ($status === 'resolved') {
        $resolvedQuery = "UPDATE incidents SET updated_at = CURRENT_TIMESTAMP WHERE id = '$incidentId'";
        mysqli_query($conn, $resolvedQuery);
    }

    echo json_encode([
        'success'    => true,
        'message'    => 'Status updated successfully',
        'status'     => $status,
        'admin_name' => $adminName,
        'previous_status' => $currentStatus
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>