<?php
/**
 * SafeChain - Get Incidents API
 * Returns live incidents and heatmap data for dashboard
 * Place in: api/get_incidents.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/conn.php';

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
AND i.status = 'pending'";

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

// Format incidents for JavaScript
$formatted = [
    'fire' => [],
    'crime' => [],
    'flood' => []
];

while ($incident = mysqli_fetch_assoc($result)) {
    $incidentType = $incident['type'];
    
    $formatted[$incidentType][] = [
        'id' => $incident['id'],
        'type' => ucfirst($incidentType) . ' Emergency',
        'icon' => $incidentType === 'fire' ? 'uil-fire' : 
                  ($incidentType === 'crime' ? 'uil-shield-plus' : 'uil-water'),
        'color' => $incidentType === 'fire' ? 'red' : 
                   ($incidentType === 'crime' ? 'yellow' : 'blue'),
        'time' => date('g:i A', strtotime($incident['date_time'])),
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
}

// Get historical incidents for dynamic heatmap (last 30 days)
$heatmapQuery = "SELECT 
    type, 
    latitude, 
    longitude, 
    DATEDIFF(NOW(), date_time) as days_ago
FROM incidents 
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND is_archived = 0
  AND date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY date_time DESC
LIMIT 500";

$heatResult = mysqli_query($conn, $heatmapQuery);
$heatmapData = [
    'fire' => [],
    'crime' => [],
    'flood' => []
];

if ($heatResult) {
    while ($heat = mysqli_fetch_assoc($heatResult)) {
        // Calculate intensity based on age
        // Recent (0-7 days) = 1.0, Medium (8-21 days) = 0.7, Old (22-30 days) = 0.5
        $daysAgo = intval($heat['days_ago']);
        
        if ($daysAgo <= 7) {
            $intensity = 1.0;
        } elseif ($daysAgo <= 21) {
            $intensity = 0.7;
        } else {
            $intensity = 0.5;
        }
        
        $heatmapData[$heat['type']][] = [
            'lat' => floatval($heat['latitude']),
            'lng' => floatval($heat['longitude']),
            'intensity' => $intensity
        ];
    }
}

// Response
echo json_encode([
    'success' => true,
    'data' => $formatted,
    'heatmap' => $heatmapData,
    'timestamp' => date('Y-m-d H:i:s'),
    'count' => [
        'fire' => count($formatted['fire']),
        'crime' => count($formatted['crime']),
        'flood' => count($formatted['flood']),
        'total' => count($formatted['fire']) + count($formatted['crime']) + count($formatted['flood'])
    ]
]);

mysqli_close($conn);