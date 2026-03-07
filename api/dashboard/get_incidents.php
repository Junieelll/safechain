<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../config/conn.php';

$type = isset($_GET['type']) ? mysqli_real_escape_string($conn, $_GET['type']) : 'all';
$since = isset($_GET['since']) ? mysqli_real_escape_string($conn, $_GET['since']) : null;

// ============================================================
// LIVE INCIDENTS QUERY
// Now includes confidence_score, corroborated_by, and rescue data
// ============================================================
$sql = "SELECT 
    i.id,
    i.type,
    i.location,
    i.reporter,
    i.reporter_id,
    i.device_id,
    i.date_time,
    i.status,
    i.latitude  AS lat,
    i.longitude AS lng,
    i.created_at,
    i.confidence_score,
    i.corroborated_by,
    r.contact,
    r.resident_id,
    r.address,
    COUNT(c.id)                                         AS corroboration_count,
    COALESCE(SUM(c.needs_rescue), 0)                    AS rescue_needed_count,
    GROUP_CONCAT(
        CASE WHEN c.needs_rescue = 1 
        THEN res.name END 
        ORDER BY c.reported_at ASC
        SEPARATOR ', '
    )                                                   AS rescue_needed_names
FROM incidents i
LEFT JOIN residents r   ON i.reporter_id  = r.resident_id
LEFT JOIN incident_corroborations c ON c.incident_id = i.id
LEFT JOIN residents res ON c.resident_id  = res.resident_id
WHERE i.is_archived     = 0
  AND i.status         != 'resolved'
  AND i.status         != 'false_alarm'
  AND (i.is_false_alarm = 0 OR i.is_false_alarm IS NULL)";

if ($type !== 'all' && in_array($type, ['fire', 'crime', 'flood'])) {
    $sql .= " AND i.type = '$type'";
}
if ($since) {
    $sql .= " AND i.created_at > '$since'";
}

$sql .= " GROUP BY i.id ORDER BY i.created_at DESC LIMIT 100";

$result = mysqli_query($conn, $sql);

if (!$result) {
    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
    exit;
}

$formatted = ['fire' => [], 'crime' => [], 'flood' => []];
$allIncidents = [];

while ($incident = mysqli_fetch_assoc($result)) {
    $incidentType = $incident['type'];
    $confidenceScore = intval($incident['confidence_score'] ?? 1);
    $rescueCount = intval($incident['rescue_needed_count'] ?? 0);
    $rescueNames = $incident['rescue_needed_names'] ?? '';

    // Confidence label
    if ($confidenceScore >= 5) {
        $confidenceLabel = 'Very High';
        $confidenceColor = 'critical';
    } elseif ($confidenceScore >= 3) {
        $confidenceLabel = 'High';
        $confidenceColor = 'high';
    } elseif ($confidenceScore >= 2) {
        $confidenceLabel = 'Moderate';
        $confidenceColor = 'moderate';
    } else {
        $confidenceLabel = 'Unverified';
        $confidenceColor = 'low';
    }

    $formattedIncident = [
        'id' => $incident['id'],
        'type' => ucfirst($incidentType) . ' Emergency',
        'icon' => $incidentType === 'fire' ? 'uil-fire' :
            ($incidentType === 'crime' ? 'uil-shield-plus' : 'uil-water'),
        'color' => $incidentType === 'fire' ? 'red' :
            ($incidentType === 'crime' ? 'yellow' : 'blue'),
        'time' => date('g:i A', strtotime($incident['date_time'])),
        'datetime' => $incident['date_time'],
        'user' => [
            'name' => $incident['reporter'],
            'contact' => $incident['contact'] ?? 'N/A',
            'id' => $incident['resident_id'] ?? $incident['reporter_id'] ?? 'N/A',
        ],
        'location' => [
            'address' => $incident['address'] ?? $incident['location'],
            'barangay' => 'Gulod',
            'city' => 'Quezon City',
            'coords' => sprintf("%.4f° N, %.4f° E", $incident['lat'], $incident['lng']),
        ],
        'lat' => floatval($incident['lat']),
        'lng' => floatval($incident['lng']),
        'status' => $incident['status'],
        'device_id' => $incident['device_id'],

        // ── New corroboration fields ──
        'confidence' => [
            'score' => $confidenceScore,
            'label' => $confidenceLabel,
            'color' => $confidenceColor,
        ],
        'rescue' => [
            'count' => $rescueCount,
            'names' => $rescueNames ? explode(', ', $rescueNames) : [],
        ],

        'timeline' => [
            [
                'time' => date('g:i A', strtotime($incident['date_time'])),
                'event' => 'Emergency reported by ' . $incident['reporter'],
            ],
            [
                'time' => date('g:i A', strtotime($incident['date_time']) + 60),
                'event' => 'Location verified',
            ],
            [
                'time' => date('g:i A', strtotime($incident['date_time']) + 120),
                'event' => $incident['status'] === 'pending' ? 'Awaiting response' :
                    ($incident['status'] === 'responding' ? 'Response team dispatched' : 'Incident resolved'),
                'pending' => $incident['status'] === 'pending',
            ],
        ],
    ];

    $formatted[$incidentType][] = $formattedIncident;
    $allIncidents[] = $formattedIncident;
}

// ============================================================
// HEATMAP QUERY — now also boosts intensity by confidence_score
// ============================================================
$heatmapQuery = "SELECT 
    i.type,
    i.latitude,
    i.longitude,
    i.status,
    i.confidence_score,
    TIMESTAMPDIFF(HOUR, i.date_time, NOW()) AS hours_ago,
    ir.severity_level
FROM incidents i
LEFT JOIN incident_reports ir ON ir.incident_id = i.id
WHERE i.latitude      IS NOT NULL
  AND i.longitude     IS NOT NULL
  AND i.latitude       != 0
  AND i.longitude      != 0
  AND i.is_archived    = 0
  AND (i.is_false_alarm = 0 OR i.is_false_alarm IS NULL)
  AND i.date_time     >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY i.date_time DESC
LIMIT 500";

$heatResult = mysqli_query($conn, $heatmapQuery);
$heatmapData = ['fire' => [], 'crime' => [], 'flood' => []];

if ($heatResult) {
    while ($heat = mysqli_fetch_assoc($heatResult)) {
        $hoursAgo = intval($heat['hours_ago']);
        $confidenceScore = intval($heat['confidence_score'] ?? 1);

        // Base intensity from severity_level
        if (!empty($heat['severity_level'])) {
            switch ($heat['severity_level']) {
                case 'critical':
                    $intensity = 1.00;
                    break;
                case 'severe':
                    $intensity = 0.85;
                    break;
                case 'moderate':
                    $intensity = 0.70;
                    break;
                case 'minor':
                    $intensity = 0.55;
                    break;
                default:
                    $intensity = 0.65;
            }
        } else {
            switch ($heat['type']) {
                case 'fire':
                    $intensity = 0.85;
                    break;
                case 'crime':
                    $intensity = 0.75;
                    break;
                case 'flood':
                    $intensity = 0.75;
                    break;
                default:
                    $intensity = 0.70;
            }
        }

        // Boost intensity based on confidence (corroborated incidents burn hotter)
        // Caps at 1.0 — each additional report adds 5% up to +25%
        $confidenceBoost = min(0.25, ($confidenceScore - 1) * 0.05);
        $intensity = min(1.0, $intensity + $confidenceBoost);

        // Age decay
        if ($heat['status'] === 'resolved') {
            $decayFactor = max(0.20, 1.0 - ($hoursAgo / 48) * 0.80);
        } else {
            $daysAgo = $hoursAgo / 24;
            $decayFactor = max(0.40, 1.0 - ($daysAgo / 30) * 0.60);
        }

        $intensity = round($intensity * $decayFactor, 3);
        if ($intensity < 0.10)
            continue;

        $heatmapData[$heat['type']][] = [
            'lat' => floatval($heat['latitude']),
            'lng' => floatval($heat['longitude']),
            'intensity' => $intensity,
        ];
    }
}

echo json_encode([
    'success' => true,
    'data' => $formatted,
    'all_incidents' => $allIncidents,
    'heatmap' => $heatmapData,
    'timestamp' => date('Y-m-d H:i:s'),
    'count' => [
        'fire' => count($formatted['fire']),
        'crime' => count($formatted['crime']),
        'flood' => count($formatted['flood']),
        'total' => count($allIncidents),
    ],
]);

mysqli_close($conn);