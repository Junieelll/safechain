<?php
require_once '../../config/conn.php';

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');

if (!isset($_GET['incident_id'])) {
    echo "event: error\ndata: {\"message\":\"No incident ID\"}\n\n";
    exit;
}

$incident_id = mysqli_real_escape_string($conn, $_GET['incident_id']);

$lastTimelineId = 0;
$lastNoteId     = 0;
$lastEvidenceId = 0;

function query($conn, $sql)
{
    $result = mysqli_query($conn, $sql);
    return $result ? mysqli_fetch_all($result, MYSQLI_ASSOC) : [];
}

function format_evidence(array $row): array
{
    return [
        'id'          => (int) $row['id'],
        'incident_id' => $row['incident_id'],
        'file_name'   => $row['file_name'],
        'file_type'   => $row['file_type'],
        'file_path'   => $row['file_path'],
        'file_url'    => rtrim(BASE_URL, '/') . '/' . $row['file_path'],
        'uploaded_by' => $row['uploaded_by'],
        'uploaded_at' => $row['uploaded_at'],
    ];
}

function timelineQuery($conn, $incident_id, $afterId = null)
{
    $where = "incident_id = '$incident_id'";
    $order = "DESC";

    if ($afterId !== null) {
        $where .= " AND id > $afterId";
        $order  = "ASC"; // new items come in ascending so appendTimelineItems prepends correctly
    }

    return query($conn, "
        SELECT 
            id,
            incident_id,
            title,
            description,
            actor,
            created_at,
            DATE_FORMAT(created_at, '%h:%i %p') as time,
            DATE_FORMAT(created_at, '%M %e, %Y') as date_only,
            DATE(created_at) as raw_date
        FROM incident_timeline
        WHERE $where
        ORDER BY created_at $order
    ");
}

function notesQuery($conn, $incident_id, $afterId = null)
{
    $where = "incident_id = '$incident_id'";

    if ($afterId !== null) {
        $where .= " AND id > $afterId";
    }

    return query($conn, "
        SELECT
            id,
            incident_id,
            admin_name,
            note,
            created_at,
            DATE_FORMAT(created_at, '%h:%i %p') as time,
            DATE_FORMAT(created_at, '%M %e, %Y') as date_only,
            DATE(created_at) as raw_date
        FROM incident_notes
        WHERE $where
        ORDER BY created_at DESC
    ");
}

function send(string $event, mixed $data): void
{
    echo "event: {$event}\n";
    echo "data: " . json_encode($data) . "\n\n";
    ob_flush();
    flush();
}

// ── Initial load ──────────────────────────────────────────────
$timeline = timelineQuery($conn, $incident_id);
$notes    = notesQuery($conn, $incident_id);
$evidence = array_map('format_evidence', query(
    $conn,
    "SELECT * FROM incident_evidence 
     WHERE incident_id = '$incident_id' 
     ORDER BY uploaded_at DESC"
));

if (!empty($timeline)) $lastTimelineId = max(array_column($timeline, 'id'));
if (!empty($notes))    $lastNoteId     = max(array_column($notes, 'id'));
if (!empty($evidence)) $lastEvidenceId = max(array_column($evidence, 'id'));

send('timeline', $timeline);
send('notes',    $notes);
send('evidence', $evidence);

// ── Polling loop ──────────────────────────────────────────────
while (true) {
    if (connection_aborted()) break;

    mysqli_ping($conn);

    $newTimeline = timelineQuery($conn, $incident_id, $lastTimelineId);
    $newNotes    = notesQuery($conn, $incident_id, $lastNoteId);
    $newEvidence = array_map('format_evidence', query(
        $conn,
        "SELECT * FROM incident_evidence 
         WHERE incident_id = '$incident_id' AND id > $lastEvidenceId 
         ORDER BY uploaded_at ASC"
    ));

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

    send('heartbeat', ['ts' => time()]);
    sleep(5);
}
