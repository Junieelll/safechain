<?php
// ============================================
// api/devices/get_nodes.php
// Returns keychain devices joined with their
// assigned resident from the residents table.
// ============================================

header('Content-Type: application/json');

require_once '../../config/conn.php'; // adjust path to your DB connection

$method = $_SERVER['REQUEST_METHOD'];

// ------------------------------------------------
// GET — list all keychain devices with resident info
// ------------------------------------------------
if ($method === 'GET') {

    $search   = trim($_GET['search']   ?? '');
    $archived = isset($_GET['archived']) ? 1 : 0; // include archived residents?

    $sql = "
        SELECT
            d.device_id,
            d.name           AS device_name,
            d.bt_remote_id,
            d.battery,
            d.created_at     AS assigned_at,

            r.resident_id,
            r.name           AS resident_name,
            r.address,
            r.contact,
            r.registered_date,
            r.is_archived,
            r.profile_picture_url,
            r.avatar,
            r.medical_conditions

        FROM devices d
        LEFT JOIN residents r ON d.resident_id = r.resident_id
    ";

    $where  = [];
    $params = [];
    $types  = '';

    // Filter archived residents out by default
    if (!$archived) {
        $where[] = '(r.is_archived = 0 OR r.is_archived IS NULL)';
    }

    // Search across device id, device name, resident name, address
    if ($search !== '') {
        $like    = '%' . $search . '%';
        $where[] = '(d.device_id LIKE ? OR d.name LIKE ? OR r.name LIKE ? OR r.address LIKE ? OR r.contact LIKE ?)';
        $params  = array_merge($params, [$like, $like, $like, $like, $like]);
        $types  .= 'sssss';
    }

    if (!empty($where)) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $sql .= ' ORDER BY d.created_at DESC';

    $stmt = $conn->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $devices = [];
    while ($row = $result->fetch_assoc()) {
        // Parse medical conditions JSON
        if ($row['medical_conditions']) {
            $row['medical_conditions'] = json_decode($row['medical_conditions'], true) ?? [];
        } else {
            $row['medical_conditions'] = [];
        }

        // Cast battery to int
        $row['battery'] = (int) $row['battery'];

        // Determine device status:
        // - "unassigned" if no resident linked
        // - "inactive"   if resident is archived
        // - "active"     otherwise
        if (empty($row['resident_id'])) {
            $row['status'] = 'unassigned';
        } elseif ($row['is_archived']) {
            $row['status'] = 'inactive';
        } else {
            $row['status'] = 'active';
        }

        $devices[] = $row;
    }

    echo json_encode([
        'success' => true,
        'data'    => $devices,
        'count'   => count($devices),
    ]);
    exit();
}

// ------------------------------------------------
// DELETE — unlink device from resident (soft remove)
// Sets resident_id to empty/null on the device
// Does NOT delete the device record
// ------------------------------------------------
if ($method === 'DELETE') {
    $body      = json_decode(file_get_contents('php://input'), true);
    $device_id = (int) ($body['device_id'] ?? 0);

    if (!$device_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'device_id is required']);
        exit();
    }

    // Unlink resident — device stays in table, just no owner
    $stmt = $conn->prepare("UPDATE devices SET resident_id = '' WHERE device_id = ?");
    $stmt->bind_param('i', $device_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Device unlinked from resident']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to unlink device']);
    }
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);