<?php
require_once '../../config/conn.php';

header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['ids']) || !is_array($data['ids']) || count($data['ids']) === 0) {
        throw new Exception('An array of incident IDs is required');
    }
    
    $ids = $data['ids'];
    
    // Build parameterized query
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $types = str_repeat('s', count($ids));
    
    $stmt = $conn->prepare("UPDATE incidents SET is_archived = 1, archived_at = NOW() WHERE id IN ($placeholders)");
    $stmt->bind_param($types, ...$ids);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => $stmt->affected_rows . ' incident(s) archived successfully'
        ]);
    } else {
        throw new Exception($stmt->error);
    }
    
    $stmt->close();
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>
