<?php
/**
 * SafeChain - Get Incidents API
 * Returns live incidents and heatmap data for dashboard
 * Place in: api/get_incidents.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../config/conn.php';

// Get filter parameters
$type = isset($_GET['type']) ? mysqli_real_escape_string($conn, $_GET['type']) : 'all';
$since = isset($_GET['since']) ? mysqli_real_escape_string($conn, $_GET['since']) : null;

// Build query
$sql = "SELECT 
    i.id,
    i.type,
    i.location,
    i.reporter,
    i.reporter_id,
    i.device_id,
    i.date_time,
    i.status,
    i.latitude as lat,
    i.longitude as lng,
    i.created_at,
    r.contact,
    r.resident_id,
    r.address
FROM incidents i
LEFT JOIN residents r ON i.reporter_id = r.resident_id
WHERE i.is_archived = 0
AND i.status != 'resolved'";

// Filter by type
if ($type !== 'all' && in_array($type, ['fire', 'crime', 'flood'])) {
    $sql .= " AND i.type = '$type'";
}

// Filter by timestamp (for polling - only get new incidents)
if ($since) {
    $sql .= " AND i.created_at > '$since'";
}

$sql .= " ORDER BY i.created_at DESC LIMIT 100";

$result = mysqli_query($conn, $sql);

if (!$result) {
    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
    exit;
}

// Format incidents - keep both formats for compatibility
$formatted = [
    'fire' => [],
    'crime' => [],
    'flood' => []
];

$allIncidents = []; // New flat array for proper sorting

while ($incident = mysqli_fetch_assoc($result)) {
    $incidentType = $incident['type'];
    
    $formattedIncident = [
        'id' => $incident['id'],
        'type' => ucfirst($incidentType) . ' Emergency',
        'icon' => $incidentType === 'fire' ? 'uil-fire' : 
                  ($incidentType === 'crime' ? 'uil-shield-plus' : 'uil-water'),
        'color' => $incidentType === 'fire' ? 'red' : 
                   ($incidentType === 'crime' ? 'yellow' : 'blue'),
        'time' => date('g:i A', strtotime($incident['date_time'])),
        'datetime' => $incident['date_time'], // Add full datetime for sorting
        'user' => [
            'name' => $incident['reporter'],
            'contact' => $incident['contact'] ?? 'N/A',
            'id' => $incident['resident_id'] ?? $incident['reporter_id'] ?? 'N/A'
        ],
        'location' => [
            'address' => $incident['address'] ?? $incident['location'],
            'barangay' => 'Gulod',
            'city' => 'Quezon City',
            'coords' => sprintf("%.4f° N, %.4f° E", $incident['lat'], $incident['lng'])
        ],
        'lat' => floatval($incident['lat']),
        'lng' => floatval($incident['lng']),
        'status' => $incident['status'],
        'device_id' => $incident['device_id'],
        'timeline' => [
            [
                'time' => date('g:i A', strtotime($incident['date_time'])),
                'event' => 'Emergency reported by ' . $incident['reporter']
            ],
            [
                'time' => date('g:i A', strtotime($incident['date_time']) + 60),
                'event' => 'Location verified'
            ],
            [
                'time' => date('g:i A', strtotime($incident['date_time']) + 120),
                'event' => $incident['status'] === 'pending' ? 'Awaiting response' : 
                          ($incident['status'] === 'responding' ? 'Response team dispatched' : 'Incident resolved'),
                'pending' => $incident['status'] === 'pending'
            ]
        ]
    ];
    
    // Add to both formats
    $formatted[$incidentType][] = $formattedIncident;
    $allIncidents[] = $formattedIncident;
}

// Get heatmap data with severity from incident_reports
$heatmapQuery = "SELECT 
    i.type, 
    i.latitude, 
    i.longitude,
    i.status,
    DATEDIFF(NOW(), i.date_time) as days_ago,
    ir.severity_level,
    ir.casualties,
    ir.injuries
FROM incidents i
LEFT JOIN incident_reports ir ON ir.incident_id = i.id
WHERE i.latitude IS NOT NULL 
  AND i.longitude IS NOT NULL
  AND i.latitude != 0
  AND i.longitude != 0
  AND i.is_archived = 0
  AND i.date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY i.date_time DESC
LIMIT 500";

$heatResult = mysqli_query($conn, $heatmapQuery);
$heatmapData = [
    'fire' => [],
    'crime' => [],
    'flood' => []
];

if ($heatResult) {
    while ($heat = mysqli_fetch_assoc($heatResult)) {
        $daysAgo = intval($heat['days_ago']);

        // If incident has a report, use severity_level for intensity
        if (!empty($heat['severity_level'])) {
            switch ($heat['severity_level']) {
                case 'critical': $intensity = 1.0; break;
                case 'major':    $intensity = 0.85; break;
                case 'moderate': $intensity = 0.65; break;
                case 'minor':    $intensity = 0.45; break;
                default:         $intensity = 0.5;
            }
        } else {
            // No report yet (pending/responding) — use type-based default
            switch ($heat['type']) {
                case 'fire':  $intensity = 0.6; break;
                case 'crime': $intensity = 0.5; break;
                case 'flood': $intensity = 0.5; break;
                default:      $intensity = 0.4;
            }
        }

        // Apply age decay — older incidents fade (min 20% of original)
        $decayFactor = max(0.2, 1.0 - ($daysAgo / 30) * 0.8);
        $intensity = round($intensity * $decayFactor, 3);

        $heatmapData[$heat['type']][] = [
            'lat' => floatval($heat['latitude']),
            'lng' => floatval($heat['longitude']),
            'intensity' => $intensity
        ];
    }
}

// Response with both formats
echo json_encode([
    'success' => true,
    'data' => $formatted, // Keep for backward compatibility
    'all_incidents' => $allIncidents, // New flat array already sorted by date
    'heatmap' => $heatmapData,
    'timestamp' => date('Y-m-d H:i:s'),
    'count' => [
        'fire' => count($formatted['fire']),
        'crime' => count($formatted['crime']),
        'flood' => count($formatted['flood']),
        'total' => count($allIncidents)
    ]
]);

mysqli_close($conn);