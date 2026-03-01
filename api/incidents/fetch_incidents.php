<?php
require_once '../../config/conn.php';

header('Content-Type: application/json');

try {
    // Fetch incidents
    $query = "
        SELECT 
            id, type, location, reporter,
            DATE_FORMAT(date_time, '%Y-%m-%d %h:%i %p') as dateTime,
            status
        FROM incidents
        WHERE is_archived = 0
        ORDER BY date_time DESC
    ";
    
    $result = mysqli_query($conn, $query);
    if (!$result) throw new Exception(mysqli_error($conn));
    
    $incidents = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $incidents[] = $row;
    }

    // ── Month-over-month stats ────────────────────────────────────────────
    $statsQuery = "
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'responding' THEN 1 ELSE 0 END) as responding,
            SUM(CASE WHEN MONTH(date_time) = MONTH(CURDATE()) AND YEAR(date_time) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as this_month,
            SUM(CASE WHEN MONTH(date_time) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(date_time) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) as last_month,
            SUM(CASE WHEN status = 'resolved' AND MONTH(date_time) = MONTH(CURDATE()) AND YEAR(date_time) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as resolved_this_month,
            SUM(CASE WHEN status = 'resolved' AND MONTH(date_time) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(date_time) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) as resolved_last_month
        FROM incidents
        WHERE is_archived = 0
    ";

    $statsResult = mysqli_query($conn, $statsQuery);
    $stats = mysqli_fetch_assoc($statsResult);

    // Calculate percent change: ((this - last) / last) * 100
    function percentChange($current, $previous) {
        if ($previous == 0) return $current > 0 ? 100 : 0;
        return round((($current - $previous) / $previous) * 100);
    }

    $totalChange = percentChange($stats['this_month'], $stats['last_month']);
    $resolutionRate = $stats['total'] > 0
        ? round(($stats['resolved'] / $stats['total']) * 100)
        : 0;

    echo json_encode([
        'success' => true,
        'data' => $incidents,
        'stats' => [
            'total'           => (int) $stats['total'],
            'resolved'        => (int) $stats['resolved'],
            'pending'         => (int) $stats['pending'],
            'responding'      => (int) $stats['responding'],
            'total_change'    => $totalChange,    // % vs last month
            'resolution_rate' => $resolutionRate, // % of all resolved
        ]
    ]);

} catch(Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

mysqli_close($conn);
?>