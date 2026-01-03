<?php
/**
 * api/generate_report.php
 * Generate a printable PDF based on incident id and the Barangay report template.
 *
 * Requires: composer require dompdf/dompdf
 */

require_once '../config/conn.php';

// Check for Dompdf
try {
    require_once __DIR__ . '/../vendor/autoload.php';
    $dompdfAvailable = class_exists('\Dompdf\Dompdf');
} catch (Exception $e) {
    $dompdfAvailable = false;
}

if (!$dompdfAvailable) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Dompdf is not installed. Run: composer require dompdf/dompdf'
    ]);
    exit;
}

use Dompdf\Dompdf;

// Get params
$incidentId = isset($_GET['id']) ? mysqli_real_escape_string($conn, $_GET['id']) : null;
$download = isset($_GET['download']) ? boolval($_GET['download']) : false;

if (!$incidentId) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Missing incident id']);
    exit;
}

// Fetch incident details (similar to fetch_incident_details.php)
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
        r.contact as reporter_contact,
        r.address as reporter_address
    FROM incidents i
    LEFT JOIN residents r ON i.reporter = r.name
    WHERE i.id = '$incidentId' AND i.is_archived = 0
";

$result = mysqli_query($conn, $query);
if (!$result) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => mysqli_error($conn)]);
    exit;
}

$incident = mysqli_fetch_assoc($result);
if (!$incident) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Incident not found']);
    exit;
}

// Fetch notes
$notes = [];
$notesQ = "SELECT admin_name, note, DATE_FORMAT(created_at, '%M %e, %Y %h:%i %p') as created_at FROM incident_notes WHERE incident_id = '$incidentId' ORDER BY created_at ASC";
$nr = mysqli_query($conn, $notesQ);
if ($nr) {
    while ($row = mysqli_fetch_assoc($nr)) {
        $notes[] = $row;
    }
}

// Fetch timeline
$timeline = [];
$tlQ = "SELECT title, description, actor, DATE_FORMAT(created_at, '%M %e, %Y %h:%i %p') as created_at FROM incident_timeline WHERE incident_id = '$incidentId' ORDER BY created_at ASC";
$tr = mysqli_query($conn, $tlQ);
if ($tr) {
    while ($row = mysqli_fetch_assoc($tr)) {
        $timeline[] = $row;
    }
}

// Render HTML via template
ob_start();
$report_incident = $incident; // local variable used in template
$report_notes = $notes;
$report_timeline = $timeline;
include __DIR__ . '/../templates/report-template.php';
$html = ob_get_clean();

// Generate PDF
$dompdf = new Dompdf();
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

$filename = "incident_report_{$incident['id']}.pdf";

// Stream with attachment option based on download param
$dompdf->stream($filename, ['Attachment' => $download ? 1 : 0]);

exit;
