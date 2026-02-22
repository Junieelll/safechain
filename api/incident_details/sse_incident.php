<?php
require_once '../../config/conn.php';

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no'); // important for nginx

if (!isset($_GET['incident_id'])) {
    echo "event: error\ndata: {\"message\":\"No incident ID\"}\n\n";
    exit;
}

$incident_id = mysqli_real_escape_string($conn, $_GET['incident_id']);

// Track last seen IDs to only send new data
$lastTimelineId = 0;
$lastNoteId = 0;
$lastEvidenceId = 0;

function query($conn, $sql) {
    $result = mysqli_query($conn, $sql);
    return $result ? mysqli_fetch_all($result, MYSQLI_ASSOC) : [];
}

function send(string $event, mixed $data): void {
    echo "event: {$event}\n";
    echo "data: " . json_encode($data) . "\n\n";
    ob_flush();
    flush();
}

// Send initial state immediately on connect
$timeline = query($conn, "SELECT * FROM incident_timeline WHERE incident_id = '$incident_id' ORDER BY created_at ASC");
$notes    = query($conn, "SELECT * FROM incident_notes WHERE incident_id = '$incident_id' ORDER BY created_at ASC");
$evidence = query($conn, "SELECT * FROM incident_evidence WHERE incident_id = '$incident_id' ORDER BY uploaded_at DESC");

if (!empty($timeline)) $lastTimelineId = max(array_column($timeline, 'id'));
if (!empty($notes))    $lastNoteId     = max(array_column($notes, 'id'));
if (!empty($evidence)) $lastEvidenceId = max(array_column($evidence, 'id'));

send('timeline', $timeline);
send('notes',    $notes);
send('evidence', $evidence);

// Poll DB and push only new rows
while (true) {
    if (connection_aborted()) break;

    mysqli_ping($conn); // keep connection alive

    $newTimeline = query($conn, "SELECT * FROM incident_timeline WHERE incident_id = '$incident_id' AND id > $lastTimelineId ORDER BY created_at ASC");
    $newNotes    = query($conn, "SELECT * FROM incident_notes    WHERE incident_id = '$incident_id' AND id > $lastNoteId    ORDER BY created_at ASC");
    $newEvidence = query($conn, "SELECT * FROM incident_evidence WHERE incident_id = '$incident_id' AND id > $lastEvidenceId ORDER BY uploaded_at ASC");

    if (!empty($newTimeline)) {
        $lastTimelineId = max(array_column($newTimeline, 'id'));
        send('timeline_update', $newTimeline);
    }

    if (!empty($newNotes)) {
        $lastNoteId = max(array_column($newNotes, 'id'));
        send('notes_update', $newNotes);
    }

    if (!empty($newEvidence)) {
        $lastEvidenceId = max(array_column($newEvidence, 'id'));
        send('evidence_update', $newEvidence);
    }

    // Heartbeat every 30s to keep connection alive
    send('heartbeat', ['ts' => time()]);

    sleep(5); // check every 5 seconds
}