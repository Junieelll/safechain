<?php
// api/announcements/delete.php
session_start();
header('Content-Type: application/json');
require_once '../../config/conn.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized. Please log in.'
    ]);
    exit;
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        throw new Exception('Announcement ID is required');
    }
    
    $announcement_id = (int)$input['id'];
    $user_id = $_SESSION['user_id'];
    
    // Check if announcement exists and belongs to the user
    $stmt = $conn->prepare("SELECT user_id FROM announcements WHERE id = ?");
    $stmt->bind_param("i", $announcement_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Announcement not found');
    }
    
    $announcement = $result->fetch_assoc();
    
    // Verify ownership
    if ($announcement['user_id'] !== $user_id) {
        http_response_code(403);
        throw new Exception('You do not have permission to delete this announcement');
    }
    
    // Get media files to delete from filesystem
    $stmt_media = $conn->prepare("SELECT file_path FROM announcement_media WHERE announcement_id = ?");
    $stmt_media->bind_param("i", $announcement_id);
    $stmt_media->execute();
    $media_result = $stmt_media->get_result();
    
    $media_files = [];
    while ($media_row = $media_result->fetch_assoc()) {
        $media_files[] = $media_row['file_path'];
    }
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Delete media records from database
        $stmt_delete_media = $conn->prepare("DELETE FROM announcement_media WHERE announcement_id = ?");
        $stmt_delete_media->bind_param("i", $announcement_id);
        $stmt_delete_media->execute();
        
        // Delete announcement
        $stmt_delete = $conn->prepare("DELETE FROM announcements WHERE id = ?");
        $stmt_delete->bind_param("i", $announcement_id);
        $stmt_delete->execute();
        
        // Commit transaction
        $conn->commit();
        
        // Delete media files from filesystem
        foreach ($media_files as $file_path) {
            $full_path = '../../' . $file_path;
            if (file_exists($full_path)) {
                unlink($full_path);
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Announcement deleted successfully'
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>