<?php
// ============================================
// api/devices/lora_devices.php
// Handles GET (list), POST (add), PUT (update), PATCH (pin location)
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/conn.php'; 

$method = $_SERVER['REQUEST_METHOD'];

// ------------------------------------------------
// GET — list all lora devices
// ------------------------------------------------
if ($method === 'GET') {
    $type   = $_GET['type']   ?? null; // 'gateway' | 'repeater' | null (all)
    $status = $_GET['status'] ?? null; // 'active' | 'inactive' | null (all)
    $mapOnly = isset($_GET['map']); // only pinned devices for dashboard map

    $where = [];
    $params = [];
    $types  = '';

    if ($type) {
        $where[] = 'device_type = ?';
        $params[] = $type;
        $types   .= 's';
    }
    if ($status) {
        $where[] = 'status = ?';
        $params[] = $status;
        $types   .= 's';
    }
    if ($mapOnly) {
        $where[] = 'lat IS NOT NULL AND lng IS NOT NULL';
    }

    $sql = 'SELECT * FROM lora_devices';
    if (!empty($where)) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= ' ORDER BY device_type ASC, created_at DESC';

    $stmt = $conn->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $devices = [];
    while ($row = $result->fetch_assoc()) {
        // Cast numeric strings
        $row['lat'] = $row['lat'] !== null ? (float)$row['lat'] : null;
        $row['lng'] = $row['lng'] !== null ? (float)$row['lng'] : null;
        $row['coverage_radius'] = (int)$row['coverage_radius'];
        $devices[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $devices, 'count' => count($devices)]);
    exit();
}

// ------------------------------------------------
// POST — add new lora device
// ------------------------------------------------
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    // Required fields
    $required = ['device_type', 'name'];
    foreach ($required as $field) {
        if (empty($body[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
            exit();
        }
    }

    $device_type     = $body['device_type'];     // 'gateway' | 'repeater'
    $name            = trim($body['name']);
    $location_label  = trim($body['location_label'] ?? '');
    $lat             = isset($body['lat'])  && $body['lat']  !== '' ? (float)$body['lat']  : null;
    $lng             = isset($body['lng'])  && $body['lng']  !== '' ? (float)$body['lng']  : null;
    $signal          = $body['signal']          ?? 'Good';
    $status          = $body['status']          ?? 'active';
    $coverage_radius = (int)($body['coverage_radius'] ?? 300);
    $firmware        = trim($body['firmware']   ?? '');
    $frequency       = trim($body['frequency']  ?? '915 MHz');
    $install_date    = $body['install_date']    ?? null;
    $notes           = trim($body['notes']      ?? '');

    // Generate device_id (fallback if trigger not used)
    $prefix = $device_type === 'gateway' ? 'SC-GW' : 'SC-RP';
    $count_stmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM lora_devices WHERE device_type = ?");
    $count_stmt->bind_param('s', $device_type);
    $count_stmt->execute();
    $count_result = $count_stmt->get_result()->fetch_assoc();
    $device_id = $prefix . '-' . str_pad($count_result['cnt'] + 1, 3, '0', STR_PAD_LEFT);

    $stmt = $conn->prepare("
        INSERT INTO lora_devices
            (device_id, device_type, name, location_label, lat, lng, signal, status,
             coverage_radius, firmware, frequency, install_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        'ssssddssissss',
        $device_id, $device_type, $name, $location_label, $lat, $lng,
        $signal, $status, $coverage_radius, $firmware, $frequency, $install_date, $notes
    );

    if ($stmt->execute()) {
        $new_id = $conn->insert_id;
        echo json_encode([
            'success'   => true,
            'message'   => 'Device added successfully',
            'device_id' => $device_id,
            'id'        => $new_id,
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to add device: ' . $conn->error]);
    }
    exit();
}

// ------------------------------------------------
// PATCH — update pin location only
// ------------------------------------------------
if ($method === 'PATCH') {
    $body = json_decode(file_get_contents('php://input'), true);
    $device_id = $body['device_id'] ?? null;

    if (!$device_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'device_id is required']);
        exit();
    }

    $lat            = isset($body['lat'])  ? (float)$body['lat']  : null;
    $lng            = isset($body['lng'])  ? (float)$body['lng']  : null;
    $location_label = trim($body['location_label'] ?? '');

    $stmt = $conn->prepare("
        UPDATE lora_devices
        SET lat = ?, lng = ?, location_label = ?, updated_at = NOW()
        WHERE device_id = ?
    ");
    $stmt->bind_param('ddss', $lat, $lng, $location_label, $device_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Location updated']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update location']);
    }
    exit();
}

// ------------------------------------------------
// PUT — update device config
// ------------------------------------------------
if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);
    $device_id = $body['device_id'] ?? null;

    if (!$device_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'device_id is required']);
        exit();
    }

    $name            = trim($body['name']            ?? '');
    $signal          = $body['signal']               ?? 'Good';
    $status          = $body['status']               ?? 'active';
    $coverage_radius = (int)($body['coverage_radius'] ?? 300);
    $firmware        = trim($body['firmware']        ?? '');
    $frequency       = trim($body['frequency']       ?? '915 MHz');
    $notes           = trim($body['notes']           ?? '');
    $install_date    = $body['install_date']         ?? null;

    $stmt = $conn->prepare("
        UPDATE lora_devices
        SET name = ?, signal = ?, status = ?, coverage_radius = ?,
            firmware = ?, frequency = ?, notes = ?, install_date = ?,
            updated_at = NOW()
        WHERE device_id = ?
    ");
    $stmt->bind_param('sssississs',
        $name, $signal, $status, $coverage_radius,
        $firmware, $frequency, $notes, $install_date, $device_id
    );

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Device config updated']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update config']);
    }
    exit();
}

// ------------------------------------------------
// DELETE — soft delete (set inactive) or hard delete
// ------------------------------------------------
if ($method === 'DELETE') {
    $body = json_decode(file_get_contents('php://input'), true);
    $device_id = $body['device_id'] ?? null;
    $hard = isset($body['hard']) && $body['hard'] === true;

    if (!$device_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'device_id is required']);
        exit();
    }

    if ($hard) {
        $stmt = $conn->prepare("DELETE FROM lora_devices WHERE device_id = ?");
    } else {
        $stmt = $conn->prepare("UPDATE lora_devices SET status = 'inactive', updated_at = NOW() WHERE device_id = ?");
    }

    $stmt->bind_param('s', $device_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => $hard ? 'Device deleted' : 'Device deactivated']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Operation failed']);
    }
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);