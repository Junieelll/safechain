<?php
// api/mobilee/incidents/details.php

require_once __DIR__ . '/../../../config/conn.php';
require_once __DIR__ . '/../../helpers/response_helper.php';
require_once __DIR__ . '/../../helpers/jwt_helper.php';
require_once __DIR__ . '/../middleware/mobile_auth.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

setCorsHeaders();

$user = mobile_authenticate();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

if (!$id) {
    ResponseHelper::error('Incident ID is required', 400);
}

match ($method) {
    'GET' => handle_get($conn, $id, $user),
    default => ResponseHelper::error('Method not allowed', 405),
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /incidents/details.php?id=xxx
// Joins incidents + residents to get reporter contact
// ═══════════════════════════════════════════════════════════════════════════
function handle_get(mysqli $conn, string $id, array $user): void
{
    $stmt = $conn->prepare("
        SELECT
            i.*,
            r.contact      AS reporter_contact,
            r.address      AS reporter_address,
            r.resident_id  AS reporter_resident_id
        FROM incidents i
        LEFT JOIN residents r ON r.device_id = i.device_id
        WHERE i.id = ?
          AND i.is_archived = 0
        LIMIT 1
    ");

    $stmt->bind_param('s', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        ResponseHelper::notFound('Incident not found');
    }

    // Role-based access check
    $role_types = [
        'bpso'        => ['crime'],
        'bhert'       => ['flood'],
        'firefighter' => ['fire'],
        'admin'       => ['fire', 'flood', 'crime'],
    ];
    $allowed = $role_types[strtolower($user['role'] ?? '')] ?? [];
    if (!empty($allowed) && !in_array($row['type'], $allowed, true)) {
        ResponseHelper::forbidden('You do not have access to this incident type');
    }

    ResponseHelper::success(format_detail($row), 'Incident fetched successfully');
}

function format_detail(array $row): array
{
    return [
        'id'               => $row['id'],
        'type'             => $row['type'],
        'location'         => $row['location'],
        'latitude'         => $row['latitude']  !== null ? (float) $row['latitude']  : null,
        'longitude'        => $row['longitude'] !== null ? (float) $row['longitude'] : null,
        'device_id'        => $row['device_id'],
        'reporter'         => $row['reporter'],
        'reporter_id'      => $row['reporter_id'],
        'reporter_contact' => $row['reporter_contact'] ?? null,  // from residents table
        'reporter_address' => $row['reporter_address'] ?? null,  // from residents table
        'date_time'        => $row['date_time'],
        'status'           => $row['status'],
        'dispatched_to'    => $row['dispatched_to'],
        'dispatched_at'    => $row['dispatched_at'],
        'dispatched_by'    => $row['dispatched_by'],
        'is_archived'      => (bool) $row['is_archived'],
        'archived_at'      => $row['archived_at'],
        'created_at'       => $row['created_at'],
        'updated_at'       => $row['updated_at'],
    ];
}   