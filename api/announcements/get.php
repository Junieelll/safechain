<?php
// api/announcements/get.php
header('Content-Type: application/json');

require_once '../../config/conn.php';

try {
    // Pagination
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;

    // Get total count
    $count_result = $conn->query("SELECT COUNT(*) as total FROM announcements");
    $total = $count_result->fetch_assoc()['total'];

    // Fetch announcements
    $stmt = $conn->prepare("
        SELECT 
            a.*,
            u.name as author_name,
            u.username as author_username
        FROM announcements a
        JOIN users u ON a.user_id = u.user_id
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->bind_param("ii", $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();

    $announcements = [];
    while ($row = $result->fetch_assoc()) {
        // Fetch media for each announcement
        $stmt_media = $conn->prepare("
            SELECT media_type, file_path 
            FROM announcement_media 
            WHERE announcement_id = ? 
            ORDER BY display_order ASC
        ");
        $stmt_media->bind_param("i", $row['id']);
        $stmt_media->execute();
        $media_result = $stmt_media->get_result();
        
        $media = [];
        while ($media_row = $media_result->fetch_assoc()) {
            $media[] = [
                'type' => $media_row['media_type'],
                'src' => $media_row['file_path']
            ];
        }
        
        $row['media'] = $media;
        $announcements[] = $row;
    }

    echo json_encode([
        'success' => true,
        'announcements' => $announcements,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => ceil($total / $limit)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>