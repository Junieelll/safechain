<?php
require_once '../../config/conn.php';

header('Content-Type: application/json');

try {
    $allArchivedItems = [];
    
    // Fetch archived incidents
    $incidentQuery = "
        SELECT 
            id,
            type,
            location as title,
            archived_at,
            'incident' as item_type
        FROM incidents
        WHERE is_archived = 1
        ORDER BY archived_at DESC
    ";
    
    $incidentResult = mysqli_query($conn, $incidentQuery);
    if ($incidentResult) {
        while ($row = mysqli_fetch_assoc($incidentResult)) {
            $allArchivedItems[] = [
                'id' => $row['id'],
                'type' => $row['item_type'],
                'incidentType' => $row['type'],
                'title' => $row['id'] . ' - ' . $row['title'],
                'archived_at' => $row['archived_at'],
                'time' => getTimeAgo($row['archived_at'])
            ];
        }
    }
    
    // Fetch archived residents
    $residentQuery = "
        SELECT 
            resident_id as id,
            name as title,
            archived_at,
            'user' as item_type
        FROM residents
        WHERE is_archived = 1
        ORDER BY archived_at DESC
    ";
    
    $residentResult = mysqli_query($conn, $residentQuery);
    if ($residentResult) {
        while ($row = mysqli_fetch_assoc($residentResult)) {
            $allArchivedItems[] = [
                'id' => $row['id'],
                'type' => $row['item_type'],
                'title' => $row['title'],
                'archived_at' => $row['archived_at'],
                'time' => getTimeAgo($row['archived_at'])
            ];
        }
    }
    
    // Sort all items by archived_at
    usort($allArchivedItems, function($a, $b) {
        return strtotime($b['archived_at']) - strtotime($a['archived_at']);
    });
    
    echo json_encode([
        'success' => true,
        'data' => $allArchivedItems
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

// Helper function to calculate time ago
function getTimeAgo($timestamp) {
    $time = strtotime($timestamp);
    $diff = time() - $time;
    
    if ($diff < 60) {
        return 'Just now';
    } elseif ($diff < 3600) {
        $mins = floor($diff / 60);
        return $mins . ' min' . ($mins > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return $hours . ' hr' . ($hours > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 604800) {
        $days = floor($diff / 86400);
        return $days . ' day' . ($days > 1 ? 's' : '') . ' ago';
    } else {
        return date('M j, Y', $time);
    }
}

mysqli_close($conn);
?>