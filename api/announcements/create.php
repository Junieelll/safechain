<?php
// api/announcements/create.php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once '../../config/conn.php';

try {
    // Get form data
    $content = trim($_POST['content'] ?? '');
    $link = trim($_POST['link'] ?? '');
    $user_id = $_SESSION['user_id'];
    
    // Check if media files are present
    $hasMedia = isset($_FILES['media']) && !empty($_FILES['media']['name'][0]);

    // Validate: Must have at least one type of content
    if (empty($content) && empty($link) && !$hasMedia) {
        throw new Exception('Announcement must contain text, media, or a link');
    }

    // Start transaction
    $conn->begin_transaction();

    // Insert announcement - content can be empty if there's media or link
    $stmt = $conn->prepare("INSERT INTO announcements (user_id, content, link, views) VALUES (?, ?, ?, 0)");
    $stmt->bind_param("sss", $user_id, $content, $link);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to create announcement');
    }

    $announcement_id = $conn->insert_id;

    // Handle media uploads
    if ($hasMedia) {
        $upload_dir = '../../uploads/announcements/' . date('Y/m/');
        
        // Create directory if it doesn't exist
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        $allowed_images = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $allowed_videos = ['video/mp4', 'video/webm'];
        $max_image_size = 10 * 1024 * 1024; // 10MB
        $max_video_size = 50 * 1024 * 1024; // 50MB

        foreach ($_FILES['media']['tmp_name'] as $index => $tmp_name) {
            if (empty($tmp_name)) continue;

            $file_name = $_FILES['media']['name'][$index];
            $file_size = $_FILES['media']['size'][$index];
            $file_type = $_FILES['media']['type'][$index];

            // Determine media type
            $media_type = 'image';
            $max_size = $max_image_size;
            
            if (in_array($file_type, $allowed_videos)) {
                $media_type = 'video';
                $max_size = $max_video_size;
            } elseif (!in_array($file_type, $allowed_images)) {
                throw new Exception('Invalid file type: ' . $file_name);
            }

            // Check file size
            if ($file_size > $max_size) {
                throw new Exception('File too large: ' . $file_name);
            }

            // Generate unique filename
            $extension = pathinfo($file_name, PATHINFO_EXTENSION);
            $new_filename = uniqid() . '_' . time() . '.' . $extension;
            $file_path_server = $upload_dir . $new_filename; // Path for saving file on server
            $file_path_web = 'uploads/announcements/' . date('Y/m/') . $new_filename; // Path for web access

            // Move uploaded file
            if (!move_uploaded_file($tmp_name, $file_path_server)) {
                throw new Exception('Failed to upload file: ' . $file_name);
            }

            // Insert into announcement_media table - save web-accessible path
            $stmt_media = $conn->prepare("INSERT INTO announcement_media (announcement_id, media_type, file_path, file_name, file_size, display_order) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt_media->bind_param("isssii", $announcement_id, $media_type, $file_path_web, $file_name, $file_size, $index);
            
            if (!$stmt_media->execute()) {
                throw new Exception('Failed to save media record');
            }
        }
    }

    // Commit transaction
    $conn->commit();
    
    // Send push notification to all users
    require_once '../fcm/send_push.php';
    
    $title = "New Announcement";
    $body = !empty($content) ? $content : "A new announcement was posted.";
    
    sendPushToAll($title, $body, ['type' => 'announcement']);

    // Fetch the created announcement with media
    $stmt = $conn->prepare("
        SELECT 
            a.*,
            u.name as author_name,
            u.username as author_username
        FROM announcements a
        JOIN users u ON a.user_id = u.user_id
        WHERE a.id = ?
    ");
    $stmt->bind_param("i", $announcement_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $announcement = $result->fetch_assoc();

    // Fetch media
    $stmt_media = $conn->prepare("SELECT * FROM announcement_media WHERE announcement_id = ? ORDER BY display_order ASC");
    $stmt_media->bind_param("i", $announcement_id);
    $stmt_media->execute();
    $media_result = $stmt_media->get_result();
    
    $media = [];
    while ($row = $media_result->fetch_assoc()) {
        $media[] = [
            'type' => $row['media_type'],
            'src' => $row['file_path']
        ];
    }
    $announcement['media'] = $media;

    echo json_encode([
        'success' => true,
        'message' => 'Announcement created successfully',
        'announcement' => $announcement
    ]);

} catch (Exception $e) {
    // Rollback on error
    if (isset($conn)) {
        $conn->rollback();
    }
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
