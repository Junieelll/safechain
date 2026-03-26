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
$data = json_decode($input, true);

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

// Get device + resident info joined from the devices side
$device_id = mysqli_real_escape_string($conn, $data['device_id']);
$query = "SELECT d.status AS device_status,
                 r.resident_id, r.name, r.address, r.contact,
                 r.status AS resident_status, r.false_report_count
          FROM devices d
          LEFT JOIN residents r ON d.resident_id = r.resident_id
          WHERE d.device_id = '$device_id'
            AND (r.is_archived = 0 OR r.is_archived IS NULL)
          LIMIT 1";
$result = mysqli_query($conn, $query);

if (!$result || mysqli_num_rows($result) == 0) {
    echo json_encode([
        'success' => false,
        'message' => "Device '$device_id' not registered",
    ]);
    exit;
}

$row = mysqli_fetch_assoc($result);

// Deactivated device — hard reject, no incident created
if ($row['device_status'] === 'deactivated') {
    echo json_encode([
        'success' => false,
        'message' => "Device '$device_id' is deactivated",
    ]);
    exit;
}

// Missing device — tagged lost by resident, reject all signals
if ($row['device_status'] === 'missing') {
    echo json_encode([
        'success' => false,
        'message' => "Device '$device_id' has been reported missing",
    ]);
    exit;
}

// Device unlinked (resident_id is NULL) — drop silently
if (empty($row['resident_id'])) {
    echo json_encode([
        'success' => false,
        'message' => "Device '$device_id' is not linked to any resident",
    ]);
    exit;
}

$resident = $row;

// Restricted resident — too many false reports, reject incoming signal
if ($row['resident_status'] === 'restricted') {
    echo json_encode([
        'success'  => false,
        'message'  => "Resident is restricted due to {$row['false_report_count']} false report(s)",
        'priority' => 'restricted',
    ]);
    exit;
}

// ── Geofence check ────────────────────────────────────────────────────────
// Read the setting once here so both handlers can use it
$geofenceRow = mysqli_query($conn, "SELECT setting_value FROM system_settings WHERE setting_key = 'geofence_enabled' LIMIT 1");
$geofenceEnabled = ($geofenceRow && ($r = mysqli_fetch_assoc($geofenceRow))) ? $r['setting_value'] === '1' : false;

/**
 * Ray-casting point-in-polygon for the Gulod boundary.
 * Coords are [lng, lat] pairs as stored in the GeoJSON.
 */
function isInsideGulod(float $lat, float $lng): bool
{
    $coords = [[121.0334848,14.711682],[121.0334957,14.7115454],[121.0335308,14.7114846],[121.0335862,14.7114333],[121.0337882,14.7112641],[121.0339523,14.7111092],[121.0340751,14.7109148],[121.0341028,14.7108099],[121.0340604,14.7106753],[121.0339774,14.7105621],[121.0338543,14.7105114],[121.0336751,14.7104859],[121.0335323,14.710492],[121.033562,14.7101886],[121.0338342,14.709774],[121.0339713,14.7095436],[121.0345597,14.7094757],[121.0350814,14.7094277],[121.0362553,14.7093446],[121.0363582,14.7092669],[121.0364442,14.709162],[121.0366244,14.7089794],[121.036688,14.7089056],[121.03699,14.7091458],[121.0372903,14.7091637],[121.0375888,14.709336],[121.0382147,14.7094565],[121.0384845,14.709263],[121.03848,14.7091378],[121.0384375,14.7090308],[121.0387608,14.708583],[121.0387662,14.7084187],[121.0389081,14.7083563],[121.0396347,14.7080226],[121.0400809,14.7080861],[121.0401844,14.7080705],[121.0415248,14.7075016],[121.0415217,14.7066561],[121.0418078,14.7058151],[121.0419812,14.7052453],[121.0440479,14.7052824],[121.0454888,14.7052707],[121.0455003,14.704594],[121.0468975,14.7050443],[121.0474573,14.7053168],[121.0472436,14.7061441],[121.0472437,14.7061633],[121.0471759,14.7063696],[121.047172,14.7070541],[121.0468812,14.7074933],[121.0468267,14.7079836],[121.0467387,14.7084147],[121.0466027,14.7087975],[121.0465728,14.7088616],[121.0465237,14.708988],[121.0465472,14.7090729],[121.0466418,14.7091216],[121.0467319,14.7091885],[121.0467944,14.7093433],[121.0467645,14.709431],[121.0466762,14.7095276],[121.0464922,14.709637],[121.0459681,14.7097706],[121.0459465,14.7098262],[121.0459745,14.7099749],[121.0459659,14.7100253],[121.0460252,14.7100798],[121.045984,14.7102054],[121.0460574,14.7104115],[121.046219,14.7105981],[121.046361,14.7107014],[121.0467486,14.7109051],[121.0469001,14.7110597],[121.0470558,14.7112651],[121.0470603,14.7113701],[121.0468657,14.7118121],[121.04668,14.7120473],[121.0463628,14.7122458],[121.0461321,14.7125295],[121.0459071,14.712751],[121.04565,14.7128774],[121.0452638,14.7129189],[121.0449875,14.7128681],[121.0446371,14.7126643],[121.0444294,14.7125356],[121.0441094,14.7122657],[121.0436705,14.7119655],[121.0434184,14.7119718],[121.0432508,14.7120946],[121.0431034,14.7122324],[121.0429966,14.7123962],[121.0429383,14.7125755],[121.0429079,14.7127791],[121.0429966,14.7130402],[121.0431543,14.7133731],[121.0432095,14.7135],[121.0432103,14.7136163],[121.0430658,14.7139198],[121.0428879,14.7146356],[121.0428612,14.7148887],[121.0429258,14.7150544],[121.0430697,14.7151967],[121.0434241,14.7154815],[121.0438905,14.7157166],[121.0442338,14.7158245],[121.0443492,14.7159932],[121.0443099,14.7161024],[121.0441341,14.7162898],[121.0440041,14.7165224],[121.0438154,14.7173538],[121.0437188,14.717601],[121.0436498,14.7178396],[121.0434931,14.7184845],[121.0434293,14.7185908],[121.0433855,14.7186606],[121.0433491,14.718696],[121.0432445,14.7187068],[121.0430669,14.7186606],[121.0427013,14.7184907],[121.042527,14.7184298],[121.0421883,14.7183594],[121.0420877,14.7183753],[121.0418588,14.7185368],[121.0416664,14.7186873],[121.0414534,14.7188422],[121.0411207,14.7190733],[121.0409713,14.7190759],[121.0404672,14.7188598],[121.0401682,14.7187086],[121.039773,14.7184233],[121.0391703,14.7176617],[121.0390905,14.7175646],[121.0389286,14.7174147],[121.0388499,14.7173238],[121.0387788,14.7172294],[121.0387494,14.7171469],[121.0387334,14.7170159],[121.0387279,14.7168797],[121.0387239,14.7167954],[121.0386924,14.7167398],[121.0386199,14.7166645],[121.0383958,14.7164802],[121.0374912,14.7159739],[121.0374116,14.7159302],[121.0373821,14.7159069],[121.0373667,14.7158693],[121.0373533,14.7158368],[121.0373462,14.7157973],[121.0373377,14.7157255],[121.0373544,14.715513],[121.0373727,14.7153563],[121.0373694,14.7152856],[121.0373586,14.7152214],[121.0373378,14.7151652],[121.0372433,14.71503],[121.0370918,14.7148582],[121.0369087,14.7146629],[121.0368524,14.7146156],[121.0368115,14.7145884],[121.0367752,14.7145735],[121.0367116,14.7145637],[121.0366505,14.7145624],[121.0365533,14.7145683],[121.0361651,14.714615],[121.0357641,14.7146798],[121.0351744,14.7147687],[121.0351244,14.7147602],[121.0350697,14.7147391],[121.035004,14.7146952],[121.0348887,14.7145509],[121.0344099,14.7140667],[121.0342536,14.7138862],[121.0341839,14.7136913],[121.0341969,14.7135132],[121.0342312,14.7133827],[121.0342965,14.7132461],[121.0344816,14.7130565],[121.0345607,14.7129008],[121.0345812,14.7127621],[121.0345279,14.712633],[121.0341479,14.7122626],[121.0339345,14.712102],[121.0335527,14.7118143],[121.0334848,14.711682]];

    $inside = false;
    $n = count($coords);
    for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
        $xi = $coords[$i][0]; $yi = $coords[$i][1]; // lng, lat
        $xj = $coords[$j][0]; $yj = $coords[$j][1];
        if ((($yi > $lat) !== ($yj > $lat)) &&
            ($lng < ($xj - $xi) * ($lat - $yi) / ($yj - $yi) + $xi)) {
            $inside = !$inside;
        }
    }
    return $inside;
}

// Handle different packet types
if ($data['type'] === 'INCIDENT') {
    handleNewIncident($conn, $data, $resident, $geofenceEnabled);
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
    $url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng";
    $opts = ['http' => ['header' => "User-Agent: SafeChain/1.0\r\n"]];
    $response = @file_get_contents($url, false, stream_context_create($opts));

    if ($response) {
        $json = json_decode($response, true);
        $a = $json['address'] ?? [];
        $parts = array_filter([
            $a['road'] ?? $a['pedestrian'] ?? $a['path'] ?? null,
            $a['suburb'] ?? $a['village'] ?? $a['neighbourhood'] ?? $a['quarter'] ?? null,
            $a['city'] ?? $a['town'] ?? $a['municipality'] ?? null,
        ]);
        return implode(', ', $parts) ?: "$lat, $lng";
    }

    return "$lat, $lng";
}

// ============================================================
// INCIDENT HANDLER
// ============================================================

function handleNewIncident($conn, $data, $resident, bool $geofenceEnabled = false)
{
    $type = mysqli_real_escape_string($conn, $data['button'] ?? 'fire');
    $lat = floatval($data['lat']);
    $lng = floatval($data['lng']);
    $reporter_id = mysqli_real_escape_string($conn, $resident['resident_id']);
    $device_id = mysqli_real_escape_string($conn, $data['device_id']);
    $reporter_name = mysqli_real_escape_string($conn, $resident['name']);

    // ── Geofence rejection ────────────────────────────────────
    if ($geofenceEnabled && !isInsideGulod($lat, $lng)) {
        echo json_encode([
            'success' => false,
            'message' => 'Incident location is outside Barangay Gulod boundary (geofence is enabled)',
            'lat' => $lat,
            'lng' => $lng,
        ]);
        exit;
    }

    // Validate type
    $validTypes = ['fire', 'crime', 'flood'];
    if (!in_array($type, $validTypes)) {
        echo json_encode(['success' => false, 'message' => 'Invalid incident type']);
        exit;
    }

    // ── Type-specific proximity thresholds ────────────────────
    $proximityThresholds = [
        'fire' => 0.00045,  // ~50 m
        'flood' => 0.0018,   // ~200 m
        'crime' => 0.00027,  // ~30 m
    ];
    $proximityThreshold = $proximityThresholds[$type] ?? 0.00045;

    // ── Type-specific time windows ────────────────────────────
    $timeWindows = [
        'fire' => 15,
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
        $existing = mysqli_fetch_assoc($nearbyResult);
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

        $alreadyResult = mysqli_query($conn, $alreadyQuery);
        // Fetch the row immediately — num_rows check then fetch_assoc both advance cursor
        $alreadyRow = ($alreadyResult && mysqli_num_rows($alreadyResult) > 0)
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

        // ── 6. FCM notifications ──────────────────────────────
        $newConfidence = intval($existing['confidence_score']) + 1;

        if ($needs_rescue) {
            sendFCMToAllResponders($conn, [
                'id' => $incident_id,
                'type' => $type,
                'location' => "$lat, $lng",
                'extra' => " RESCUE NEEDED: {$resident['name']} (Device: {$data['device_id']})",
            ]);
            error_log(sprintf(
                "[SafeChain] ⚠️ RESCUE SIGNAL: %s needs rescue at incident %s (%.6f, %.6f)",
                $resident['name'],
                $incident_id,
                $lat,
                $lng
            ));
        } elseif ($newConfidence === 3) {
            sendFCMToAllResponders($conn, [
                'id' => $incident_id,
                'type' => $type,
                'location' => "$lat, $lng",
                'extra' => " HIGH CONFIDENCE: {$newConfidence} residents reporting",
            ]);
            error_log(sprintf(
                "[SafeChain]  HIGH CONFIDENCE: Incident %s now has %d reports",
                $incident_id,
                $newConfidence
            ));
        }

        // ── 7. Response ───────────────────────────────────────
        echo json_encode([
            'success' => true,
            'action' => $alreadyReported ? 'rescue_signal' : 'corroborated',
            'incident_id' => $incident_id,
            'confidence_score' => $newConfidence,
            'needs_rescue' => (bool) $needs_rescue,
            'reporter' => $resident['name'],
            'reporter_id' => $reporter_id,
            'timestamp' => date('Y-m-d H:i:s'),
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
    $location = mysqli_real_escape_string($conn, $geocodedAddress);

    // ── 10. Insert new incident ───────────────────────────────
    // Use date_time from Python if provided (for queued offline incidents
    // that were recorded locally but pushed later). Falls back to NOW().
    $incidentDateTime = !empty($data['date_time'])
        ? "'" . mysqli_real_escape_string($conn, $data['date_time']) . "'"
        : 'NOW()';

    $insertQuery = "
        INSERT INTO incidents
            (id, type, location, reporter, reporter_id, device_id,
             date_time, status, is_archived, latitude, longitude,
             confidence_score, corroborated_by, is_false_alarm)
        VALUES
            ('$incidentId', '$type', '$location', '$reporter_name',
             '$reporter_id', '$device_id', $incidentDateTime, 'pending', 0,
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
    $initDesc = mysqli_real_escape_string(
        $conn,
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
        'id' => $incidentId,
        'type' => $type,
        'location' => $geocodedAddress,
    ]);

    error_log(sprintf(
        "[SafeChain] New %s: %s by %s (%s) at (%.6f, %.6f) — %s",
        strtoupper($type),
        $incidentId,
        $resident['name'],
        $reporter_id,
        $lat,
        $lng,
        $geocodedAddress
    ));

    // ── 13. Response ──────────────────────────────────────────
    echo json_encode([
        'success' => true,
        'action' => 'created',
        'incident_id' => $incidentId,
        'type' => $type,
        'confidence_score' => 1,
        'needs_rescue' => false,
        'reporter' => $resident['name'],
        'reporter_id' => $reporter_id,
        'device_id' => $device_id,
        'location' => [
            'lat' => $lat,
            'lng' => $lng,
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
    // Gate: deactivated device cannot update GPS
    if ($resident['device_status'] === 'deactivated') {
        echo json_encode(['success' => false, 'message' => 'Device is deactivated']);
        return;
    }

    // Gate: missing device cannot update GPS
    if ($resident['device_status'] === 'missing') {
        echo json_encode(['success' => false, 'message' => 'Device has been reported missing']);
        return;
    }

    // Gate: restricted resident cannot update GPS
    if ($resident['resident_status'] === 'restricted') {
        echo json_encode(['success' => false, 'message' => 'Resident is restricted']);
        return;
    }

    $reporter_id = mysqli_real_escape_string($conn, $resident['resident_id']);
    $device_id = mysqli_real_escape_string($conn, $data['device_id']);

    $query = "SELECT id FROM incidents
              WHERE reporter_id = '$reporter_id'
                AND device_id   = '$device_id'
                AND status      IN ('pending', 'responding')
                AND is_archived = 0
              ORDER BY created_at DESC
              LIMIT 1";

    $result = mysqli_query($conn, $query);

    if ($result && mysqli_num_rows($result) > 0) {
        $incident = mysqli_fetch_assoc($result);
        $incident_id = mysqli_real_escape_string($conn, $incident['id']);
        $lat = floatval($data['lat']);
        $lng = floatval($data['lng']);

        // Only update coordinates — location string stays as initial geocoded address
        $updateQuery = "UPDATE incidents SET
                            latitude   = $lat,
                            longitude  = $lng,
                            updated_at = NOW()
                        WHERE id = '$incident_id'";

        if (mysqli_query($conn, $updateQuery)) {
            echo json_encode([
                'success' => true,
                'type' => 'GPS_UPDATE',
                'incident_id' => $incident_id,
                'reporter_id' => $reporter_id,
                'location' => ['lat' => $lat, 'lng' => $lng],
                'timestamp' => date('Y-m-d H:i:s'),
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