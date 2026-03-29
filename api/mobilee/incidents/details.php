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
// ═══════════════════════════════════════════════════════════════════════════
function handle_get(mysqli $conn, string $id, array $user): void
{
    $stmt = $conn->prepare("
        SELECT
            i.*,
            r.contact              AS reporter_contact,
            r.address              AS reporter_address,
            r.resident_id         AS reporter_resident_id,
            r.medical_conditions  AS reporter_medical_conditions,
            f.flag_reason          AS flag_reason,
            f.flag_type            AS flag_type,
            u.name                 AS responder_name,
            u.profile_picture      AS responder_avatar
        FROM incidents i
        LEFT JOIN residents r ON r.resident_id = i.reporter_id
        LEFT JOIN incident_flags f ON f.incident_id = i.id
        LEFT JOIN users u ON u.user_id = i.dispatched_to
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

    $role_types = [
        'bpso'        => ['crime'],
        'bdrrm'       => ['flood'],
        'bfp' => ['fire'],
        'admin'       => ['fire', 'flood', 'crime'],
    ];
    $allowed = $role_types[strtolower($user['role'] ?? '')] ?? [];
    if (!empty($allowed) && !in_array($row['type'], $allowed, true)) {
        ResponseHelper::forbidden('You do not have access to this incident type');
    }

    // ── Fetch corroborators ───────────────────────────────────────────────
    $corroStmt = $conn->prepare("
        SELECT
            c.resident_id,
            c.lat,
            c.lng,
            c.needs_rescue,
            c.reported_at,
            res.name               AS name,
            res.contact            AS contact,
            res.medical_conditions AS medical_conditions
        FROM incident_corroborations c
        LEFT JOIN residents res ON res.resident_id = c.resident_id
        WHERE c.incident_id = ?
        ORDER BY c.reported_at ASC
    ");
    $corroStmt->bind_param('s', $id);
    $corroStmt->execute();
    $corroResult = $corroStmt->get_result();

    $corroborators = [];
    $corroRescueCount = 0;
    while ($corro = $corroResult->fetch_assoc()) {
        if (intval($corro['needs_rescue'])) $corroRescueCount++;

        // medical_conditions is stored as a JSON array string e.g. ["Asthma","Heart Disease"]
        $rawMedical = $corro['medical_conditions'] ?? null;
        $medicalConditions = null;
        if ($rawMedical) {
            $decoded = json_decode($rawMedical, true);
            $medicalConditions = is_array($decoded) ? $decoded : null;
        }

        $corroborators[] = [
            'resident_id'        => $corro['resident_id'],
            'name'               => $corro['name'] ?? 'Unknown',
            'contact'            => $corro['contact'] ?? null,
            'lat'                => $corro['lat'] !== null ? (float) $corro['lat'] : null,
            'lng'                => $corro['lng'] !== null ? (float) $corro['lng'] : null,
            'needs_rescue'       => (bool) $corro['needs_rescue'],
            'reported_at'        => $corro['reported_at'],
            'medical_conditions' => $medicalConditions,
        ];
    }
    $corroStmt->close();

    // ── Rescue totals ─────────────────────────────────────────────────────
    $reporterRescue = intval($row['needs_rescue'] ?? 0);
    $totalRescue    = $reporterRescue + $corroRescueCount;

    ResponseHelper::success(
        format_detail($row, $corroborators, $totalRescue),
        'Incident fetched successfully'
    );
}

function format_detail(array $row, array $corroborators = [], int $rescueCount = 0): array
{
    // Parse reporter's medical_conditions JSON string → array or null
    $rawMedical = $row['reporter_medical_conditions'] ?? null;
    $reporterMedical = null;
    if ($rawMedical) {
        $decoded = json_decode($rawMedical, true);
        $reporterMedical = is_array($decoded) && count($decoded) > 0 ? $decoded : null;
    }

    return [
        'id'                          => $row['id'],
        'type'                        => $row['type'],
        'location'                    => $row['location'],
        'latitude'                    => $row['latitude'] !== null ? (float) $row['latitude'] : null,
        'longitude'                   => $row['longitude'] !== null ? (float) $row['longitude'] : null,
        'device_id'                   => $row['device_id'],
        'reporter'                    => $row['reporter'],
        'reporter_id'                 => $row['reporter_id'],
        'reporter_contact'            => $row['reporter_contact'] ?? null,
        'reporter_address'            => $row['reporter_address'] ?? null,
        'reporter_medical_conditions' => $reporterMedical,   // ← NEW: null or string[]
        'date_time'                   => $row['date_time'],
        'status'                      => $row['status'],
        'dispatched_to'               => $row['dispatched_to'],
        'dispatched_at'               => $row['dispatched_at'],
        'dispatched_by'               => $row['dispatched_by'],
        'is_archived'                 => (bool) $row['is_archived'],
        'archived_at'                 => $row['archived_at'],
        'created_at'                  => $row['created_at'],
        'updated_at'                  => $row['updated_at'],
        'is_false_alarm'              => (bool) $row['is_false_alarm'],
        'is_wrong_type'               => (bool) ($row['is_wrong_type'] ?? false),
        'flag_reason'                 => $row['flag_reason'] ?? null,
        'flag_type'                   => $row['flag_type'] ?? null,
        'responder_name'              => $row['responder_name'] ?? null,
        'responder_avatar'            => $row['responder_avatar'] ?? null,
        'confidence_score'            => intval($row['confidence_score'] ?? 1),
        'needs_rescue'                => (bool) ($row['needs_rescue'] ?? false),
        'rescue'                      => ['count' => $rescueCount],
        'corroborators'               => $corroborators,    // each now has medical_conditions
    ];
}