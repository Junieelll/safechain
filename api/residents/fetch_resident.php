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
            r.registered_date AS registeredDate,
            d.device_id AS deviceId
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
        $residents[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'address' => $row['address'],
            'contact' => $row['contact'],
            'deviceId' => $row['deviceId'],
            'profilePicture' => $row['profile_picture_url'], // ← map it here
            'registeredDate' => $row['registeredDate'],
            'falseReportCount' => (int) ($row['false_report_count'] ?? 0),
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