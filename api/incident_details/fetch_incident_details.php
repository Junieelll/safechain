<?php
require_once '../../config/conn.php';

header('Content-Type: application/json');

try {
    if (!isset($_GET['id'])) {
        throw new Exception('Incident ID is required');
    }

    $incidentId = mysqli_real_escape_string($conn, $_GET['id']);

    // Fetch incident details
    $query = "
        SELECT 
            i.id,
            i.type,
            i.location,
            i.reporter,
            DATE_FORMAT(i.date_time, '%M %e, %Y') as date_reported,
            DATE_FORMAT(i.date_time, '%h:%i %p') as time_reported,
            i.date_time,
            i.status,
            i.dispatched_to,
            i.dispatched_at,
            i.dispatched_by,
            i.latitude as lat, 
            i.longitude as lng,
            r.name as reporter_name,
            r.resident_id as reporter_user_id,
            r.contact as reporter_contact,
            r.address as reporter_address,
            r.registered_date
        FROM incidents i
        LEFT JOIN residents r ON i.reporter = r.name
        WHERE i.id = '$incidentId' AND i.is_archived = 0
    ";

    $result = mysqli_query($conn, $query);

    if (!$result) {
        throw new Exception(mysqli_error($conn));
    }

    $incident = mysqli_fetch_assoc($result);

    if (!$incident) {
        throw new Exception('Incident not found');
    }

    // Calculate time since reported
    $reportedTime = strtotime($incident['date_time']);
    $now = time();
    $diff = $now - $reportedTime;

    $hours = floor($diff / 3600);
    $minutes = floor(($diff % 3600) / 60);

    if ($hours > 0) {
        $timeSince = $hours . ' hour' . ($hours > 1 ? 's' : '') . ' ago';
    } elseif ($minutes > 0) {
        $timeSince = $minutes . ' minute' . ($minutes > 1 ? 's' : '') . ' ago';
    } else {
        $timeSince = 'Just now';
    }

    $incident['time_since'] = $timeSince;

    // Format registered date if available
    if ($incident['registered_date']) {
        $regDate = new DateTime($incident['registered_date']);
        $incident['resident_since'] = $regDate->format('F Y');
    } else {
        $incident['resident_since'] = 'N/A';
    }

    echo json_encode([
        'success' => true,
        'data' => $incident
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
