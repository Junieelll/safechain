<?php
// api/announcements/get.php
header('Content-Type: application/json');
require_once '../../config/conn.php';

try {
    $page  = isset($_GET['page'])  ? (int)$_GET['page']  : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;

    // Total count
    $count_result = $conn->query("SELECT COUNT(*) as total FROM announcements");
    $total = $count_result->fetch_assoc()['total'];

    // Fetch announcements WITH view count joined
    $stmt = $conn->prepare("
        SELECT
            a.*,
            u.name        AS author_name,
            u.username    AS author_username,
            COUNT(av.id)  AS view_count
        FROM announcements a
        JOIN users u ON a.user_id = u.user_id
        LEFT JOIN announcement_views av ON av.announcement_id = a.id
        GROUP BY a.id
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
                'src'  => $media_row['file_path'],
            ];
        }

        $row['media']      = $media;
        $row['view_count'] = (int)$row['view_count'];
        $announcements[]   = $row;
    }

    echo json_encode([
        'success'       => true,
        'announcements' => $announcements,
        'pagination'    => [
            'page'        => $page,
            'limit'       => $limit,
            'total'       => (int)$total,
            'total_pages' => (int)ceil($total / $limit),
        ],
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
