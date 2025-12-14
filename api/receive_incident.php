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

// Get resident info from device_id
$device_id = mysqli_real_escape_string($conn, $data['device_id']);
$query = "SELECT resident_id, name, address, contact 
          FROM residents 
          WHERE device_id = '$device_id' AND is_archived = 0 
          LIMIT 1";
$result = mysqli_query($conn, $query);

if (!$result || mysqli_num_rows($result) == 0) {
    echo json_encode([
        'success' => false, 
        'message' => "Device '$device_id' not registered"
    ]);
    exit;
}

$resident = mysqli_fetch_assoc($result);

// Handle different packet types
if ($data['type'] === 'INCIDENT') {
    handleNewIncident($conn, $data, $resident);
} else if ($data['type'] === 'GPS_UPDATE') {
    handleGPSUpdate($conn, $data, $resident);
}

/**
 * Create new incident
 */
function handleNewIncident($conn, $data, $resident) {
    // Generate incident ID
    $query = "SELECT id FROM incidents ORDER BY created_at DESC LIMIT 1";
    $result = mysqli_query($conn, $query);
    
    if ($result && mysqli_num_rows($result) > 0) {
        $lastIncident = mysqli_fetch_assoc($result);
        preg_match('/(\d+)$/', $lastIncident['id'], $matches);
        $newNumber = intval($matches[1]) + 1;
    } else {
        $newNumber = 1001;
    }
    
    $incidentId = 'EMG-' . date('Y') . '-' . $newNumber;
    
    // Map button to incident type
    $typeMap = [
        'fire' => 'fire',
        'crime' => 'crime',
        'flood' => 'flood'
    ];
    $type = mysqli_real_escape_string($conn, $typeMap[$data['button']] ?? 'fire');
    
    // Prepare data
    $lat = floatval($data['lat']);
    $lng = floatval($data['lng']);
    $location = mysqli_real_escape_string($conn, 
        sprintf("%.6f°N, %.6f°E - %s", $lat, $lng, $resident['address'])
    );
    $reporter_id = mysqli_real_escape_string($conn, $resident['resident_id']);
    $reporter_name = mysqli_real_escape_string($conn, $resident['name']);
    $device_id = mysqli_real_escape_string($conn, $data['device_id']);
    
    // Insert incident
    $query = "INSERT INTO incidents 
              (id, type, location, reporter, reporter_id, device_id, date_time, status, is_archived, latitude, longitude) 
              VALUES 
              ('$incidentId', '$type', '$location', '$reporter_name', '$reporter_id', '$device_id', NOW(), 'pending', 0, $lat, $lng)";
    
    if (mysqli_query($conn, $query)) {
        // Log to PHP error log
        error_log(sprintf(
            "[SafeChain] New %s: %s by %s (%s) at (%.6f, %.6f)",
            strtoupper($type),
            $incidentId,
            $resident['name'],
            $reporter_id,
            $lat,
            $lng
        ));
        
        echo json_encode([
            'success' => true,
            'incident_id' => $incidentId,
            'type' => $type,
            'reporter' => $resident['name'],
            'reporter_id' => $reporter_id,
            'device_id' => $device_id,
            'location' => [
                'lat' => $lat, 
                'lng' => $lng,
                'address' => $resident['address']
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save incident: ' . mysqli_error($conn)
        ]);
    }
}

/**
 * Update GPS location for existing incident
 */
function handleGPSUpdate($conn, $data, $resident) {
    // Find active incident using reporter_id
    $reporter_id = mysqli_real_escape_string($conn, $resident['resident_id']);
    $device_id = mysqli_real_escape_string($conn, $data['device_id']);
    
    $query = "SELECT id FROM incidents
              WHERE reporter_id = '$reporter_id' 
              AND device_id = '$device_id'
              AND status IN ('pending', 'responding')
              AND is_archived = 0
              ORDER BY created_at DESC 
              LIMIT 1";
    
    $result = mysqli_query($conn, $query);
    
    if ($result && mysqli_num_rows($result) > 0) {
        $incident = mysqli_fetch_assoc($result);
        $incident_id = mysqli_real_escape_string($conn, $incident['id']);
        
        $lat = floatval($data['lat']);
        $lng = floatval($data['lng']);
        $location = mysqli_real_escape_string($conn, 
            sprintf("%.6f°N, %.6f°E - %s", $lat, $lng, $resident['address'])
        );
        
        // Update incident with new location
        $updateQuery = "UPDATE incidents SET 
                        latitude = $lat, 
                        longitude = $lng,
                        location = '$location',
                        updated_at = NOW()
                        WHERE id = '$incident_id'";
        
        if (mysqli_query($conn, $updateQuery)) {
            echo json_encode([
                'success' => true,
                'type' => 'GPS_UPDATE',
                'incident_id' => $incident_id,
                'reporter_id' => $reporter_id,
                'location' => ['lat' => $lat, 'lng' => $lng],
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update location: ' . mysqli_error($conn)
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No active incident found for this device'
        ]);
    }
}

mysqli_close($conn);
?>