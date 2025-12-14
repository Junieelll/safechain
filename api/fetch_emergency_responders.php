<?php
require_once '../config/conn.php';

header('Content-Type: application/json');

try {
    $query = "
        SELECT 
            id,
            name,
            type,
            contact,
            station_address,
            available
        FROM emergency_responders
        WHERE available = 1
        ORDER BY type, name
    ";
    
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        throw new Exception(mysqli_error($conn));
    }
    
    $responders = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $responders[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $responders
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>