<?php
// api/devices/index.php
// GET  ?action=list           → fetch all node devices + lora devices + stats
// POST ?action=add-lora       → add a new LoRa gateway/repeater
// POST ?action=deactivate-lora → deactivate a lora device

require_once '../../includes/auth_helper.php';
require_once '../../config/conn.php';

header('Content-Type: application/json');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
AuthChecker::requireApiAuth();
AuthChecker::requireApiAdmin();

$userId = AuthChecker::getUserId();
$role = AuthChecker::getUserRole();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

// ── Helpers ───────────────────────────────────────────────────────────────────
function jsonSuccess($data = null, string $msg = 'Success', int $code = 200): void
{
    http_response_code($code);
    echo json_encode(['success' => true, 'message' => $msg, 'data' => $data]);
    exit;
}
function jsonError(string $msg = 'Error', int $code = 400, $errors = null): void
{
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $msg, 'errors' => $errors]);
    exit;
}

// ── GET list ──────────────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'list') {

    // Node devices
    $nodeStmt = $conn->prepare("
        SELECT
            d.device_id,
            d.name        AS device_name,
            d.bt_remote_id,
            d.battery,
            d.status,
            d.created_at,
            r.resident_id,
            r.name        AS owner_name,
            r.address,
            r.contact,
            r.registered_date,
            r.profile_picture_url,
            r.medical_conditions
        FROM devices d
        LEFT JOIN residents r ON d.resident_id = r.resident_id
        WHERE (r.is_archived = 0 OR r.is_archived IS NULL)
        ORDER BY d.created_at DESC
    ");
    $nodeStmt->execute();
    $nodes = $nodeStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $nodeStmt->close();

    foreach ($nodes as &$n) {
        $n['medical_conditions'] = !empty($n['medical_conditions'])
            ? (json_decode($n['medical_conditions'], true) ?? [])
            : [];
    }
    unset($n);

    // LoRa devices
    $loraStmt = $conn->prepare("
        SELECT id, device_id, device_type, `name`,
               location_label, lat, lng,
               `signal`, `status`, coverage_radius,
               firmware, frequency, install_date,
               notes, last_seen, created_at, updated_at
        FROM lora_devices
        ORDER BY created_at DESC
    ");
    $loraStmt->execute();
    $lora = $loraStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $loraStmt->close();

    // Authorized hardware (not registered)
    $authStmt = $conn->prepare("
        SELECT bt_remote_id, batch_number
        FROM authorized_hardware
        WHERE is_registered = 0
    ");
    $authStmt->execute();
    $authorized = $authStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $authStmt->close();

    $totalNodes = count($nodes);
    $totalLora = count($lora);
    $totalAuthorized = count($authorized);

    $activeGateways = count(array_filter(
        $lora,
        fn($d) =>
        $d['status'] === 'active' && $d['device_type'] === 'gateway'
    ));

    jsonSuccess([
        'nodes' => $nodes,
        'lora' => $lora,
        'authorized' => $authorized,
        'stats' => [
            'total' => $totalNodes + $totalLora + $totalAuthorized,
            'total_nodes' => $totalNodes,
            'total_lora' => $totalLora,
            'total_authorized' => $totalAuthorized,
            'active_gateways' => $activeGateways,
        ],
    ]);
}

// ── POST add-lora ─────────────────────────────────────────────────────────────
elseif ($method === 'POST' && $action === 'add-lora') {

    if ($role !== Roles::ADMIN) {
        jsonError('Only admins can add LoRa devices', 403);
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $name = trim($input['name'] ?? '');
    $device_type = trim($input['device_type'] ?? 'gateway');
    $location_label = trim($input['location_label'] ?? '');
    $lat = isset($input['lat']) ? (float) $input['lat'] : null;
    $lng = isset($input['lng']) ? (float) $input['lng'] : null;
    $signal = $input['signal'] ?? 'Good';
    $coverage_radius = (int) ($input['coverage_radius'] ?? 300);
    $firmware = trim($input['firmware'] ?? '');
    $frequency = trim($input['frequency'] ?? '915 MHz');
    $install_date = !empty($input['install_date']) ? $input['install_date'] : date('Y-m-d');
    $notes = trim($input['notes'] ?? '');

    $errors = [];
    if (empty($name))
        $errors[] = 'Name is required';
    if (!in_array($device_type, ['gateway', 'repeater']))
        $errors[] = 'Invalid device type';
    if ($lat === null || $lng === null)
        $errors[] = 'Location pin is required — tap the map';
    if (!in_array($signal, ['Excellent', 'Good', 'Fair', 'Weak']))
        $errors[] = 'Invalid signal value';

    if (!empty($errors))
        jsonError('Validation failed', 422, $errors);

    // device_id auto-generated by DB trigger — pass empty string
    $ins = $conn->prepare("
        INSERT INTO lora_devices
            (device_id, device_type, `name`, location_label, lat, lng,
             `signal`, `status`, coverage_radius, firmware, frequency, install_date, notes)
        VALUES ('', ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
    ");
    $ins->bind_param(
        "sssddsissss",
        $device_type,
        $name,
        $location_label,
        $lat,
        $lng,
        $signal,
        $coverage_radius,
        $firmware,
        $frequency,
        $install_date,
        $notes
    );

    if ($ins->execute()) {
        $newId = $conn->insert_id;
        $fetch = $conn->prepare("SELECT * FROM lora_devices WHERE id = ?");
        $fetch->bind_param("i", $newId);
        $fetch->execute();
        $newDevice = $fetch->get_result()->fetch_assoc();
        $fetch->close();
        jsonSuccess($newDevice, 'LoRa device added successfully', 201);
    } else {
        jsonError('Failed to add LoRa device: ' . $conn->error, 500);
    }
}

// ── POST deactivate-lora ──────────────────────────────────────────────────────
elseif ($method === 'POST' && $action === 'deactivate-lora') {

    if ($role !== Roles::ADMIN) {
        jsonError('Only admins can deactivate devices', 403);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $id = (int) ($input['id'] ?? 0);

    if (!$id)
        jsonError('id is required', 422);

    $upd = $conn->prepare("UPDATE lora_devices SET `status` = 'inactive' WHERE id = ?");
    $upd->bind_param("i", $id);
    $upd->execute() ? jsonSuccess(null, 'LoRa device deactivated') : jsonError('Failed to deactivate', 500);
} elseif ($method === 'POST' && $action === 'reactivate-lora') {
    if ($role !== Roles::ADMIN)
        jsonError('Only admins can reactivate devices', 403);

    $input = json_decode(file_get_contents('php://input'), true);
    $id = (int) ($input['id'] ?? 0);
    if (!$id)
        jsonError('id is required', 422);

    $upd = $conn->prepare("UPDATE lora_devices SET status = 'active' WHERE id = ?");
    $upd->bind_param("i", $id);
    $upd->execute() ? jsonSuccess(null, 'LoRa device reactivated') : jsonError('Failed to reactivate', 500);
}

// ── POST authorize-node ──────────────────────────────────────────────────────
elseif ($method === 'POST' && $action === 'authorize-node') {

    if ($role !== Roles::ADMIN) {
        jsonError('Only admins can authorize new hardware', 403);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $bt_remote_id = trim($input['bt_remote_id'] ?? '');
    
    // Optional: You can tag batches if you manufacture them in groups
    $batch_number = trim($input['batch_number'] ?? 'BATCH-' . date('Ym'));

    if (empty($bt_remote_id)) {
        jsonError('MAC Address is required', 422);
    }

    // Check if it's already authorized
    $check = $conn->prepare("SELECT bt_remote_id FROM authorized_hardware WHERE bt_remote_id = ?");
    $check->bind_param("s", $bt_remote_id);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        $check->close();
        jsonError('This hardware MAC is already authorized in the system.', 409);
    }
    $check->close();

    // Insert into the whitelist
    $ins = $conn->prepare("INSERT INTO authorized_hardware (bt_remote_id, batch_number, is_registered) VALUES (?, ?, 0)");
    $ins->bind_param("ss", $bt_remote_id, $batch_number);
    
    if ($ins->execute()) {
        jsonSuccess(null, "Hardware $bt_remote_id authorized successfully! Ready for user registration.", 201);
    } else {
        jsonError('Failed to authorize hardware: ' . $conn->error, 500);
    }
}

// ── PUT edit-lora ─────────────────────────────────────────────────────────────
elseif ($method === 'POST' && $action === 'edit-lora') {

    if ($role !== Roles::ADMIN) {
        jsonError('Only admins can edit LoRa devices', 403);
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $id = (int) ($input['id'] ?? 0);
    $name = trim($input['name'] ?? '');
    $device_type = trim($input['device_type'] ?? 'gateway');
    $location_label = trim($input['location_label'] ?? '');
    $lat = isset($input['lat']) ? (float) $input['lat'] : null;
    $lng = isset($input['lng']) ? (float) $input['lng'] : null;
    $coverage_radius = (int) ($input['coverage_radius'] ?? 300);
    $frequency = trim($input['frequency'] ?? '915 MHz');
    $firmware = trim($input['firmware'] ?? '');
    $notes = trim($input['notes'] ?? '');

    $errors = [];
    if (!$id)
        $errors[] = 'id is required';
    if (empty($name))
        $errors[] = 'Name is required';
    if (!in_array($device_type, ['gateway', 'repeater']))
        $errors[] = 'Invalid device type';
    if ($lat === null || $lng === null)
        $errors[] = 'Location is required';

    if (!empty($errors))
        jsonError('Validation failed', 422, $errors);

    $upd = $conn->prepare("
        UPDATE lora_devices
        SET device_type     = ?,
            `name`          = ?,
            location_label  = ?,
            lat             = ?,
            lng             = ?,
            coverage_radius = ?,
            frequency       = ?,
            firmware        = ?,
            notes           = ?,
            updated_at      = NOW()
        WHERE id = ?
    ");
    $upd->bind_param(
        "sssddisssi",   
        $device_type,
        $name,
        $location_label,
        $lat,
        $lng,
        $coverage_radius,
        $frequency,
        $firmware,
        $notes,
        $id
    );
    if ($upd->execute()) {
        $fetch = $conn->prepare("SELECT * FROM lora_devices WHERE id = ?");
        $fetch->bind_param("i", $id);
        $fetch->execute();
        $updated = $fetch->get_result()->fetch_assoc();
        $fetch->close();
        jsonSuccess($updated, 'LoRa device updated successfully');
    } else {
        jsonError('Failed to update: ' . $conn->error, 500);
    }
}

// ── POST deactivate-node ──────────────────────────────────────────────────────
elseif ($method === 'POST' && $action === 'deactivate-node') {

    if ($role !== Roles::ADMIN)
        jsonError('Only admins can deactivate node devices', 403);

    $input = json_decode(file_get_contents('php://input'), true);
    $device_id = trim($input['device_id'] ?? '');

    if (empty($device_id))
        jsonError('device_id is required', 422);

    // Confirm device exists and is a node (not a lora device)
    $check = $conn->prepare("SELECT device_id, status FROM devices WHERE device_id = ? LIMIT 1");
    $check->bind_param("s", $device_id);
    $check->execute();
    $node = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$node)
        jsonError('Node device not found', 404);

    if ($node['status'] === 'deactivated')
        jsonError('Device is already deactivated', 422);

    $upd = $conn->prepare("UPDATE devices SET `status` = 'deactivated' WHERE device_id = ?");
    $upd->bind_param("s", $device_id);
    $upd->execute() ? jsonSuccess(null, 'Node device deactivated') : jsonError('Failed to deactivate', 500);
}

// ── POST reactivate-node ──────────────────────────────────────────────────────
elseif ($method === 'POST' && $action === 'reactivate-node') {

    if ($role !== Roles::ADMIN)
        jsonError('Only admins can reactivate node devices', 403);

    $input = json_decode(file_get_contents('php://input'), true);
    $device_id = trim($input['device_id'] ?? '');

    if (empty($device_id))
        jsonError('device_id is required', 422);

    $check = $conn->prepare("SELECT device_id, status FROM devices WHERE device_id = ? LIMIT 1");
    $check->bind_param("s", $device_id);
    $check->execute();
    $node = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$node)
        jsonError('Node device not found', 404);

    if ($node['status'] === 'active')
        jsonError('Device is already active', 422);

    $upd = $conn->prepare("UPDATE devices SET `status` = 'active' WHERE device_id = ?");
    $upd->bind_param("s", $device_id);
    $upd->execute() ? jsonSuccess(null, 'Node device reactivated') : jsonError('Failed to reactivate', 500);

} else {
    jsonError('Invalid action or method', 405);
}