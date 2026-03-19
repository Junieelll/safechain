<?php
require_once '../../config/conn.php';
header('Content-Type: application/json');

try {
    if (!isset($_GET['id'])) throw new Exception('Incident ID is required');

    $incidentId = mysqli_real_escape_string($conn, $_GET['id']);

    $query = "
        SELECT 
            i.id,
            i.type,
            i.location,
            i.reporter,
            i.reporter_id,
            i.device_id,
            DATE_FORMAT(i.date_time, '%M %e, %Y')  AS date_reported,
            DATE_FORMAT(i.date_time, '%h:%i %p')    AS time_reported,
            i.date_time,
            i.status,
            i.dispatched_to,
            i.dispatched_at,
            i.dispatched_by,
            i.latitude                              AS lat,
            i.longitude                             AS lng,
            i.confidence_score,
            i.corroborated_by,
            i.is_false_alarm,

            -- Reporter info (joined on reporter_id for accuracy)
            r.name              AS reporter_name,
            r.resident_id       AS reporter_user_id,
            r.contact           AS reporter_contact,
            r.address           AS reporter_address,
            r.registered_date,
            r.medical_conditions,
            r.profile_picture_url AS reporter_avatar,

            -- Incident report
            ir.description      AS report_description,

            -- Dispatched responder
            u.name              AS responder_name,
            u.profile_picture   AS responder_avatar,

            -- Corroboration summary
            COUNT(c.id)                                      AS corroboration_count,
            COALESCE(SUM(c.needs_rescue), 0)                 AS rescue_needed_count,
            GROUP_CONCAT(
                CASE WHEN c.needs_rescue = 1
                THEN res.name END
                ORDER BY c.reported_at ASC
                SEPARATOR ', '
            )                                                AS rescue_needed_names,
            GROUP_CONCAT(
                res.name
                ORDER BY c.reported_at ASC
                SEPARATOR ', '
            )                                                AS all_corroborators

        FROM incidents i
        LEFT JOIN residents r             ON i.reporter_id    = r.resident_id
        LEFT JOIN incident_reports ir     ON ir.incident_id   = i.id
        LEFT JOIN users u                 ON u.user_id        = i.dispatched_to
        LEFT JOIN incident_corroborations c   ON c.incident_id = i.id
        LEFT JOIN residents res           ON c.resident_id    = res.resident_id
        WHERE i.id          = '$incidentId'
          AND i.is_archived = 0
        GROUP BY i.id
        LIMIT 1
    ";

    $result = mysqli_query($conn, $query);
    if (!$result) throw new Exception(mysqli_error($conn));

    $incident = mysqli_fetch_assoc($result);
    if (!$incident) throw new Exception('Incident not found');

    // ── Time since reported ───────────────────────────────────────────
    $diff    = time() - strtotime($incident['date_time']);
    $hours   = floor($diff / 3600);
    $minutes = floor(($diff % 3600) / 60);
    $incident['time_since'] = $hours > 0
        ? $hours   . ' hour'   . ($hours   > 1 ? 's' : '') . ' ago'
        : ($minutes > 0
            ? $minutes . ' minute' . ($minutes > 1 ? 's' : '') . ' ago'
            : 'Just now');

    // ── Resident since ────────────────────────────────────────────────
    $incident['resident_since'] = $incident['registered_date']
        ? (new DateTime($incident['registered_date']))->format('F Y')
        : 'N/A';

    // ── Medical conditions as array ───────────────────────────────────
    $incident['medical_conditions'] = $incident['medical_conditions']
        ? json_decode($incident['medical_conditions'], true)
        : [];

    // ── Confidence label ──────────────────────────────────────────────
    $score = intval($incident['confidence_score'] ?? 1);
    $incident['confidence'] = [
        'score' => $score,
        'label' => $score >= 5 ? 'Very High'
                 : ($score >= 3 ? 'High'
                 : ($score >= 2 ? 'Moderate' : 'Unverified')),
        'color' => $score >= 5 ? 'critical'
                 : ($score >= 3 ? 'high'
                 : ($score >= 2 ? 'moderate' : 'low')),
    ];

    // ── Rescue summary ────────────────────────────────────────────────
    $incident['rescue'] = [
        'count' => intval($incident['rescue_needed_count']),
        'names' => $incident['rescue_needed_names']
            ? explode(', ', $incident['rescue_needed_names'])
            : [],
    ];

    // ── Corroborators list ────────────────────────────────────────────
    $incident['corroborators'] = $incident['all_corroborators']
        ? explode(', ', $incident['all_corroborators'])
        : [];

    // ── Per-corroborator locations for the map ────────────────────────
    $corroQuery = "
        SELECT
            c.resident_id,
            c.lat,
            c.lng,
            c.needs_rescue,
            c.reported_at,
            res.name,
            res.contact,
            res.medical_conditions
        FROM incident_corroborations c
        LEFT JOIN residents res ON c.resident_id = res.resident_id
        WHERE c.incident_id = '$incidentId'
        ORDER BY c.reported_at ASC
    ";
    $corroResult = mysqli_query($conn, $corroQuery);
    $corroLocations = [];

    if ($corroResult) {
        while ($row = mysqli_fetch_assoc($corroResult)) {
            $row['medical_conditions'] = $row['medical_conditions']
                ? json_decode($row['medical_conditions'], true)
                : [];
            $corroLocations[] = $row;
        }
    }
    $incident['corroborator_locations'] = $corroLocations;

    // ── Responder live location from DB (seed for map on initial load) ──────
    $locQuery = "
        SELECT latitude, longitude, heading, speed, updated_at
        FROM responder_locations
        WHERE incident_id = '$incidentId'
        LIMIT 1
    ";
    $locResult = mysqli_query($conn, $locQuery);
    $incident['responder_location'] = null;
    if ($locResult && $row = mysqli_fetch_assoc($locResult)) {
        $incident['responder_location'] = [
            'latitude'   => (float) $row['latitude'],
            'longitude'  => (float) $row['longitude'],
            'heading'    => $row['heading'] !== null ? (float) $row['heading'] : null,
            'speed'      => $row['speed']   !== null ? (float) $row['speed']   : null,
            'updated_at' => $row['updated_at'],
        ];
    }

    echo json_encode(['success' => true, 'data' => $incident]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

mysqli_close($conn);