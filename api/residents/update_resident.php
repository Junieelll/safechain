<?php
require_once '../../config/conn.php';

header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (empty($data['id'])) {
        throw new Exception('Resident ID is required');
    }

    $residentId = mysqli_real_escape_string($conn, $data['id']);
    $fields = [];

    if (!empty($data['name']))
        $fields[] = "name = '" . mysqli_real_escape_string($conn, $data['name']) . "'";
    if (!empty($data['address']))
        $fields[] = "address = '" . mysqli_real_escape_string($conn, $data['address']) . "'";
    if (!empty($data['contact']))
        $fields[] = "contact = '" . mysqli_real_escape_string($conn, $data['contact']) . "'";
    if (!empty($data['deviceId']))
        $fields[] = "device_id = '" . mysqli_real_escape_string($conn, $data['deviceId']) . "'";

    if (empty($fields)) {
        throw new Exception('No fields to update');
    }

    $query = "UPDATE residents SET " . implode(', ', $fields) . " WHERE resident_id = '$residentId'";

    if (!mysqli_query($conn, $query)) {
        throw new Exception(mysqli_error($conn));
    }

    echo json_encode([
        'success' => true,
        'message' => 'Resident updated successfully'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>