<?php
require_once '../config/conn.php';

header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['items']) || !is_array($data['items'])) {
        throw new Exception('Items array is required');
    }
    
    $deleted = 0;
    
    foreach ($data['items'] as $item) {
        $id = mysqli_real_escape_string($conn, $item['id']);
        $type = $item['type'];
        
        if ($type === 'incident') {
            $query = "DELETE FROM incidents WHERE id = '$id' AND is_archived = 1";
        } elseif ($type === 'user') {
            $query = "DELETE FROM residents WHERE resident_id = '$id' AND is_archived = 1";
        } else {
            continue;
        }
        
        if (mysqli_query($conn, $query)) {
            $deleted++;
        }
    }
    
    echo json_encode([
        'success' => true,
        'deleted' => $deleted,
        'message' => "$deleted item(s) deleted permanently"
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>