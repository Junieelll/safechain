<?php
require_once '../../config/conn.php';

header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['items']) || !is_array($data['items'])) {
        throw new Exception('Items array is required');
    }
    
    $restored = 0;
    
    foreach ($data['items'] as $item) {
        $id = mysqli_real_escape_string($conn, $item['id']);
        $type = $item['type'];
        
        if ($type === 'incident') {
            $query = "UPDATE incidents SET 
                      is_archived = 0,
                      archived_at = NULL
                      WHERE id = '$id'";
        } elseif ($type === 'user') {
            $query = "UPDATE residents SET 
                      is_archived = 0,
                      archived_at = NULL
                      WHERE resident_id = '$id'";
        } else {
            continue;
        }
        
        if (mysqli_query($conn, $query)) {
            $restored++;
        }
    }
    
    echo json_encode([
        'success' => true,
        'restored' => $restored,
        'message' => "$restored item(s) restored successfully"
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>