<?php
/**
 * SafeChain - Receive Incident API
 * Receives LoRa data from Python listener and saves to database
 * Place in: api/receive_incident.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config/conn.php';
require_once 'helpers/fcm_helper.php';

// Get JSON data from Python script
$input = file_get_contents('php://input');
$data  = json_decode($input, true);

// Validate input
if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
$required = ['device_id', 'button', 'lat', 'lng', 'type'];
foreach ($required as $field) {
    if (!isset($data[$field])) {
        echo json_encode(['success' => false, 'message' => "Missing field: $field"]);
        exit;
    }
}

// Get resident info from device_id
$device_id = mysqli_real_escape_string($conn, $data['device_id']);
$query     = "SELECT resident_id, name, address, contact 
              FROM residents 
              WHERE device_id = '$device_id' AND is_archived = 0 
              LIMIT 1";
$result    = mysqli_query($conn, $query);

if (!$result || mysqli_num_rows($result) == 0) {
    echo json_encode([
        'success' => false,
        'message' => "Device '$device_id' not registered",
    ]);
    exit;
}

$resident = mysqli_fetch_assoc($result);

// Handle different packet types
if ($data['type'] === 'INCIDENT') {
    handleNewIncident($conn, $data, $resident);
} elseif ($data['type'] === 'GPS_UPDATE') {
    handleGPSUpdate($conn, $data, $resident);
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Reverse geocode lat/lng → street, barangay, city via Nominatim
 */
function reverseGeocode($lat, $lng): string
{
    $url      = "https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng";
    $opts     = ['http' => ['header' => "User-Agent: SafeChain/1.0\r\n"]];
    $response = @file_get_contents($url, false, stream_context_create($opts));

    if ($response) {
        $json  = json_decode($response, true);
        $a     = $json['address'] ?? [];
        $parts = array_filter([
            $a['road']         ?? $a['pedestrian'] ?? $a['path']         ?? null,
            $a['suburb']       ?? $a['village']    ?? $a['neighbourhood'] ?? $a['quarter'] ?? null,
            $a['city']         ?? $a['town']       ?? $a['municipality']  ?? null,
        ]);
        return implode(', ', $parts) ?: "$lat, $lng";
    }

    return "$lat, $lng";
}

// ============================================================
// INCIDENT HANDLER
// ============================================================

function handleNewIncident($conn, $data, $resident)
{
    $type          = mysqli_real_escape_string($conn, $data['button'] ?? 'fire');
    $lat           = floatval($data['lat']);
    $lng           = floatval($data['lng']);
    $reporter_id   = mysqli_real_escape_string($conn, $resident['resident_id']);
    $device_id     = mysqli_real_escape_string($conn, $data['device_id']);
    $reporter_name = mysqli_real_escape_string($conn, $resident['name']);

    // Validate type
    $validTypes = ['fire', 'crime', 'flood'];
    if (!in_array($type, $validTypes)) {
        echo json_encode(['success' => false, 'message' => 'Invalid incident type']);
        exit;
    }

    // ── Type-specific proximity thresholds ────────────────────
    $proximityThresholds = [
        'fire'  => 0.00045,  // ~50 m
        'flood' => 0.0018,   // ~200 m
        'crime' => 0.00027,  // ~30 m
    ];
    $proximityThreshold = $proximityThresholds[$type] ?? 0.00045;

    // ── Type-specific time windows ────────────────────────────
    $timeWindows = [
        'fire'  => 15,
        'flood' => 30,
        'crime' => 5,
    ];
    $timeWindow = $timeWindows[$type] ?? 15;

    // ── 1. Look for a nearby active incident to corroborate ───
    $nearbyQuery = "
        SELECT id, confidence_score, corroborated_by
        FROM incidents
        WHERE type           = '$type'
          AND status         IN ('pending', 'responding')
          AND is_archived    = 0
          AND is_false_alarm = 0
          AND latitude       != 0
          AND longitude      != 0
          AND ABS(latitude  - $lat) < $proximityThreshold
          AND ABS(longitude - $lng) < $proximityThreshold
          AND created_at    >= DATE_SUB(NOW(), INTERVAL $timeWindow MINUTE)
        ORDER BY created_at DESC
        LIMIT 1
    ";

    $nearbyResult = mysqli_query($conn, $nearbyQuery);

    if ($nearbyResult && mysqli_num_rows($nearbyResult) > 0) {

        // ── CORROBORATION PATH ────────────────────────────────
        $existing    = mysqli_fetch_assoc($nearbyResult);
        $incident_id = mysqli_real_escape_string($conn, $existing['id']);

        // ── 2. Check if this resident already reported / corroborated ──
        $alreadyQuery = "
            SELECT 'original' AS source
            FROM incidents
            WHERE id          = '$incident_id'
              AND reporter_id = '$reporter_id'

            UNION

            SELECT 'corroboration' AS source
            FROM incident_corroborations
            WHERE incident_id = '$incident_id'
              AND resident_id = '$reporter_id'
            LIMIT 1
        ";

        $alreadyResult   = mysqli_query($conn, $alreadyQuery);
        // Fetch the row immediately — num_rows check then fetch_assoc both advance cursor
        $alreadyRow      = ($alreadyResult && mysqli_num_rows($alreadyResult) > 0)
                           ? mysqli_fetch_assoc($alreadyResult)
                           : null;
        $alreadyReported = $alreadyRow !== null;

        // Rescue = only when they re-trigger (already reported before)
        $needs_rescue = $alreadyReported ? 1 : 0;

        // ── 3. INSERT or UPDATE corroboration record ──────────
        if ($alreadyReported) {
            if ($alreadyRow['source'] === 'original') {
    // Update GPS + flag rescue directly on the incident
    mysqli_query($conn, "
        UPDATE incidents SET
            latitude     = $lat,
            longitude    = $lng,
            needs_rescue = 1,
            updated_at   = NOW()
        WHERE id = '$incident_id'
    ");
} else {
                // Corroborator re-triggered — update their corroboration GPS
                mysqli_query($conn, "
                    UPDATE incident_corroborations SET
                        lat          = $lat,
                        lng          = $lng,
                        needs_rescue = 1,
                        reported_at  = NOW()
                    WHERE incident_id = '$incident_id'
                      AND resident_id = '$reporter_id'
                ");
            }
        } else {
            // Brand-new corroborator — insert fresh record
            mysqli_query($conn, "
                INSERT INTO incident_corroborations
                    (incident_id, resident_id, device_id, lat, lng, needs_rescue)
                VALUES
                    ('$incident_id', '$reporter_id', '$device_id', $lat, $lng, 0)
            ");
        }

        // ── 4. Bump confidence score ONLY for new corroborators ──────
if (!$alreadyReported) {
    mysqli_query($conn, "
        UPDATE incidents SET
            confidence_score = confidence_score + 1,
            corroborated_by  = corroborated_by  + 1,
            updated_at       = NOW()
        WHERE id = '$incident_id'
    ");
}

        // ── 5. Timeline entry ─────────────────────────────────
        $rescueNote    = $needs_rescue
                         ? ' — ⚠️ RESIDENT MAY NEED RESCUE'
                         : '';
        $timelineDesc  = mysqli_real_escape_string($conn,
            "Corroborated by {$resident['name']} via device {$data['device_id']}{$rescueNote}"
        );
        $timelineTitle = mysqli_real_escape_string($conn,
            $needs_rescue ? '⚠️ Rescue signal received' : 'Additional report received'
        );

        mysqli_query($conn, "
            INSERT INTO incident_timeline
                (incident_id, title, description, actor, user_id)
            VALUES (
                '$incident_id',
                '$timelineTitle',
                '$timelineDesc',
                '$reporter_name',
                '$reporter_id'
            )
        ");

        // ── 6. FCM notifications ──────────────────────────────
        $newConfidence = intval($existing['confidence_score']) + 1;

        if ($needs_rescue) {
            sendFCMToAllResponders($conn, [
                'id'       => $incident_id,
                'type'     => $type,
                'location' => "$lat, $lng",
                'extra'    => "⚠️ RESCUE NEEDED: {$resident['name']} (Device: {$data['device_id']})",
            ]);
            error_log(sprintf(
                "[SafeChain] ⚠️ RESCUE SIGNAL: %s needs rescue at incident %s (%.6f, %.6f)",
                $resident['name'], $incident_id, $lat, $lng
            ));
        } elseif ($newConfidence === 3) {
            sendFCMToAllResponders($conn, [
                'id'       => $incident_id,
                'type'     => $type,
                'location' => "$lat, $lng",
                'extra'    => "🔴 HIGH CONFIDENCE: {$newConfidence} residents reporting",
            ]);
            error_log(sprintf(
                "[SafeChain] 🔴 HIGH CONFIDENCE: Incident %s now has %d reports",
                $incident_id, $newConfidence
            ));
        }

        // ── 7. Response ───────────────────────────────────────
        echo json_encode([
            'success'          => true,
            'action'           => $alreadyReported ? 'rescue_signal' : 'corroborated',
            'incident_id'      => $incident_id,
            'confidence_score' => $newConfidence,
            'needs_rescue'     => (bool) $needs_rescue,
            'reporter'         => $resident['name'],
            'reporter_id'      => $reporter_id,
            'timestamp'        => date('Y-m-d H:i:s'),
        ]);
        return;
    }

    // ── NEW INCIDENT PATH ─────────────────────────────────────

    // ── 8. Generate incident ID ───────────────────────────────
    $lastResult = mysqli_query($conn, "
        SELECT id FROM incidents
        ORDER BY created_at DESC
        LIMIT 1
    ");

    if ($lastResult && mysqli_num_rows($lastResult) > 0) {
        $lastIncident = mysqli_fetch_assoc($lastResult);
        preg_match('/(\d+)$/', $lastIncident['id'], $matches);
        $newNumber = intval($matches[1]) + 1;
    } else {
        $newNumber = 1001;
    }

    $incidentId = 'EMG-' . date('Y') . '-' . $newNumber;

    // ── 9. Reverse geocode ────────────────────────────────────
    $geocodedAddress = reverseGeocode($lat, $lng);
    $location        = mysqli_real_escape_string($conn, $geocodedAddress);

    // ── 10. Insert new incident ───────────────────────────────
    $insertQuery = "
        INSERT INTO incidents
            (id, type, location, reporter, reporter_id, device_id,
             date_time, status, is_archived, latitude, longitude,
             confidence_score, corroborated_by, is_false_alarm)
        VALUES
            ('$incidentId', '$type', '$location', '$reporter_name',
             '$reporter_id', '$device_id', NOW(), 'pending', 0,
             $lat, $lng, 1, 0, 0)
    ";

    if (!mysqli_query($conn, $insertQuery)) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save incident: ' . mysqli_error($conn),
        ]);
        exit;
    }

    // ── 11. Initial timeline entry ────────────────────────────
    $initDesc = mysqli_real_escape_string($conn,
        "Emergency reported by {$resident['name']} via device {$data['device_id']}"
    );
    mysqli_query($conn, "
        INSERT INTO incident_timeline
            (incident_id, title, description, actor, user_id)
        VALUES (
            '$incidentId',
            'Incident reported',
            '$initDesc',
            '$reporter_name',
            '$reporter_id'
        )
    ");

    // ── 12. Notify responders ─────────────────────────────────
    sendFCMToAllResponders($conn, [
        'id'       => $incidentId,
        'type'     => $type,
        'location' => $geocodedAddress,
    ]);

    error_log(sprintf(
        "[SafeChain] New %s: %s by %s (%s) at (%.6f, %.6f) — %s",
        strtoupper($type), $incidentId,
        $resident['name'], $reporter_id,
        $lat, $lng, $geocodedAddress
    ));

    // ── 13. Response ──────────────────────────────────────────
    echo json_encode([
        'success'          => true,
        'action'           => 'created',
        'incident_id'      => $incidentId,
        'type'             => $type,
        'confidence_score' => 1,
        'needs_rescue'     => false,
        'reporter'         => $resident['name'],
        'reporter_id'      => $reporter_id,
        'device_id'        => $device_id,
        'location'         => [
            'lat'     => $lat,
            'lng'     => $lng,
            'address' => $geocodedAddress,
        ],
        'timestamp' => date('Y-m-d H:i:s'),
    ]);
}

// ============================================================
// GPS UPDATE HANDLER
// ============================================================

function handleGPSUpdate($conn, $data, $resident)
{
    $reporter_id = mysqli_real_escape_string($conn, $resident['resident_id']);
    $device_id   = mysqli_real_escape_string($conn, $data['device_id']);

    $query = "SELECT id FROM incidents
              WHERE reporter_id = '$reporter_id'
                AND device_id   = '$device_id'
                AND status      IN ('pending', 'responding')
                AND is_archived = 0
              ORDER BY created_at DESC
              LIMIT 1";

    $result = mysqli_query($conn, $query);

    if ($result && mysqli_num_rows($result) > 0) {
        $incident    = mysqli_fetch_assoc($result);
        $incident_id = mysqli_real_escape_string($conn, $incident['id']);
        $lat         = floatval($data['lat']);
        $lng         = floatval($data['lng']);

        // Only update coordinates — location string stays as initial geocoded address
        $updateQuery = "UPDATE incidents SET
                            latitude   = $lat,
                            longitude  = $lng,
                            updated_at = NOW()
                        WHERE id = '$incident_id'";

        if (mysqli_query($conn, $updateQuery)) {
            echo json_encode([
                'success'     => true,
                'type'        => 'GPS_UPDATE',
                'incident_id' => $incident_id,
                'reporter_id' => $reporter_id,
                'location'    => ['lat' => $lat, 'lng' => $lng],
                'timestamp'   => date('Y-m-d H:i:s'),
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update location: ' . mysqli_error($conn),
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No active incident found for this device',
        ]);
    }
}

mysqli_close($conn);