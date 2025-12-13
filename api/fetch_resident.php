<?php
require_once '../config/conn.php';

header('Content-Type: application/json');

try {
    $query = "
        SELECT 
            resident_id AS id,
            name,
            address,
            contact,
            device_id AS deviceId,
            registered_date AS registeredDate
        FROM residents
        WHERE is_archived = 0
        ORDER BY registered_date DESC
    ";

    $result = mysqli_query($conn, $query);

    if (!$result) {
        throw new Exception(mysqli_error($conn));
    }

    $residents = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $residents[] = $row;
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
