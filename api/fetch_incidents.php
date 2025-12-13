<?php
require_once '../config/conn.php';

header('Content-Type: application/json');

try {
    // Fetch only non-archived incidents
    $query = "
        SELECT 
            id,
            type,
            location,
            reporter,
            DATE_FORMAT(date_time, '%Y-%m-%d %h:%i %p') as dateTime,
            status
        FROM incidents
        WHERE is_archived = 0
        ORDER BY date_time DESC
    ";
    
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        throw new Exception(mysqli_error($conn));
    }
    
    $incidents = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $incidents[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $incidents
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>