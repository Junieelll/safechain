<?php
require_once '../../config/conn.php';

header('Content-Type: application/json');

try {
    $query = "
        SELECT 
            r.resident_id AS id,
            r.name,
            r.address,
            r.contact,
            r.profile_picture_url,
            r.false_report_count,
            r.status,
            r.registered_date AS registeredDate,
            r.medical_conditions,
            d.device_id AS deviceId,
            d.name AS deviceModel,
            d.battery AS batteryLevel,
            d.bt_remote_id AS btRemoteId,
            d.status AS deviceStatus,
            (SELECT COUNT(*) FROM incident_flags f WHERE f.user_id = r.resident_id AND f.flag_type = 'false_alarm' AND f.reversed_at IS NULL) AS falseAlarmCount,
            (SELECT COUNT(*) FROM incident_flags f WHERE f.user_id = r.resident_id AND f.flag_type = 'wrong_type' AND f.reversed_at IS NULL) AS wrongEmergencyCount,
            (SELECT COUNT(*) FROM incidents i WHERE i.reporter_id = r.resident_id) AS totalIncidents
        FROM residents r
        LEFT JOIN devices d ON d.resident_id = r.resident_id
        WHERE r.is_archived = 0
        ORDER BY r.registered_date DESC
    ";

    $result = mysqli_query($conn, $query);

    if (!$result) {
        throw new Exception(mysqli_error($conn));
    }

    $residents = [];
    while ($row = mysqli_fetch_assoc($result)) {
        // Parse medical_conditions JSON
        $rawMedical = $row['medical_conditions'] ?? null;
        $medicalConditions = null;
        if ($rawMedical) {
            $decoded = json_decode($rawMedical, true);
            $medicalConditions = is_array($decoded) && count($decoded) > 0 ? $decoded : null;
        }

        $residents[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'address' => $row['address'],
            'contact' => $row['contact'],
            'deviceId' => $row['deviceId'],
            'deviceModel' => $row['deviceModel'] ?? null,
            'batteryLevel' => $row['batteryLevel'] ?? null,
            'btRemoteId' => $row['btRemoteId'] ?? null,
            'deviceStatus' => $row['deviceStatus'] ?? null,
            'profilePicture' => $row['profile_picture_url'],
            'registeredDate' => $row['registeredDate'],
            'falseReportCount' => (int) ($row['false_report_count'] ?? 0),
            'falseAlarmCount' => (int) ($row['falseAlarmCount'] ?? 0),
            'wrongEmergencyCount' => (int) ($row['wrongEmergencyCount'] ?? 0),
            'totalIncidents' => (int) ($row['totalIncidents'] ?? 0),
            'medicalConditions' => $medicalConditions,
            'status'           => $row['status'] ?? 'active',
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $residents
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>