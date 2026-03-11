<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../config/conn.php';

$period = isset($_GET['period']) ? $_GET['period'] : 'last30days';
$fromDate = isset($_GET['from']) ? $_GET['from'] : null;
$toDate = isset($_GET['to']) ? $_GET['to'] : null;
$types = isset($_GET['types']) ? $_GET['types'] : 'all';
$status = isset($_GET['status']) ? $_GET['status'] : 'all';

// ── Date condition ─────────────────────────────────────────
switch ($period) {
    case 'last7days':
        $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $prevDateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND i.date_time < DATE_SUB(NOW(), INTERVAL 7 DAY)";
        break;
    case 'last30days':
        $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        $prevDateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND i.date_time < DATE_SUB(NOW(), INTERVAL 30 DAY)";
        break;
    case 'last90days':
        $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 90 DAY)";
        $prevDateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 180 DAY) AND i.date_time < DATE_SUB(NOW(), INTERVAL 90 DAY)";
        break;
    case 'lastyear':
        $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
        $prevDateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 2 YEAR) AND i.date_time < DATE_SUB(NOW(), INTERVAL 1 YEAR)";
        break;
    case 'custom':
        if ($fromDate && $toDate) {
            $from = mysqli_real_escape_string($conn, $fromDate);
            $to = mysqli_real_escape_string($conn, $toDate);
            $dateCondition = "AND i.date_time BETWEEN '$from' AND '$to 23:59:59'";
            $prevDateCondition = "AND i.date_time >= DATE_SUB('$from', INTERVAL 30 DAY) AND i.date_time < '$from'";
        } else {
            $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            $prevDateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND i.date_time < DATE_SUB(NOW(), INTERVAL 30 DAY)";
        }
        break;
    default:
        $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        $prevDateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND i.date_time < DATE_SUB(NOW(), INTERVAL 30 DAY)";
}

// ── Type condition ─────────────────────────────────────────
$typeCondition = "";
if ($types !== 'all') {
    $typeList = implode("','", array_map(fn($t) => mysqli_real_escape_string($conn, $t), explode(',', $types)));
    $typeCondition = "AND i.type IN ('$typeList')";
}

// ── Status condition ───────────────────────────────────────
$statusCondition = "";
if ($status !== 'all') {
    $statusList = implode("','", array_map(fn($s) => mysqli_real_escape_string($conn, $s), explode(',', $status)));
    $statusCondition = "AND i.status IN ('$statusList')";
}

$where = "WHERE i.is_archived = 0 $dateCondition $typeCondition $statusCondition";
$wherePrev = "WHERE i.is_archived = 0 $prevDateCondition $typeCondition $statusCondition";

// ── Helper: format seconds into readable string ────────────
function formatSeconds($totalSeconds)
{
    $totalSeconds = intval($totalSeconds);
    if ($totalSeconds <= 0)
        return 'N/A';
    if ($totalSeconds < 60)
        return "{$totalSeconds}s";
    $mins = floor($totalSeconds / 60);
    $secs = $totalSeconds % 60;
    return $secs > 0 ? "{$mins}m {$secs}s" : "{$mins}m";
}

// ── Summary stats ──────────────────────────────────────────
$summarySQL = "SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN i.status = 'resolved'   THEN 1 ELSE 0 END) as resolved,
    SUM(CASE WHEN i.status = 'responding' THEN 1 ELSE 0 END) as responding,
    SUM(CASE WHEN i.status = 'pending'    THEN 1 ELSE 0 END) as pending,
    AVG(
        CASE
            WHEN ir.incident_id IS NOT NULL
            THEN (COALESCE(ir.response_time_minutes, 0) * 60) + COALESCE(ir.response_time_seconds, 0)
            ELSE NULL
        END
    ) as avg_response_time_seconds
FROM incidents i
LEFT JOIN incident_reports ir ON i.id = ir.incident_id
$where";

$summaryResult = mysqli_query($conn, $summarySQL);
$summary = mysqli_fetch_assoc($summaryResult);

$total = intval($summary['total']);
$resolved = intval($summary['resolved']);
$resolutionRate = $total > 0 ? round(($resolved / $total) * 100, 1) : 0;
$avgResponse = formatSeconds($summary['avg_response_time_seconds']);

// ── Previous period summary (for % change badges) ──────────
$prevSummarySQL = "SELECT 
    COUNT(*) as prev_total,
    SUM(CASE WHEN i.status = 'resolved' THEN 1 ELSE 0 END) as prev_resolved,
    AVG(
        CASE
            WHEN ir.incident_id IS NOT NULL
            THEN (COALESCE(ir.response_time_minutes, 0) * 60) + COALESCE(ir.response_time_seconds, 0)
            ELSE NULL
        END
    ) as prev_avg_response_seconds
FROM incidents i
LEFT JOIN incident_reports ir ON i.id = ir.incident_id
$wherePrev";

$prevSummaryResult = mysqli_query($conn, $prevSummarySQL);
$prevSummary = mysqli_fetch_assoc($prevSummaryResult);

$prevTotal = intval($prevSummary['prev_total']);
$prevResolved = intval($prevSummary['prev_resolved']);
$prevResolutionRate = $prevTotal > 0 ? round(($prevResolved / $prevTotal) * 100, 1) : 0;
$prevAvgRespSeconds = floatval($prevSummary['prev_avg_response_seconds']);
$currAvgRespSeconds = floatval($summary['avg_response_time_seconds']);

// % changes — 0 if no previous data
$totalChange = $prevTotal > 0
    ? round((($total - $prevTotal) / $prevTotal) * 100, 1)
    : 0;

$resolutionChange = $prevResolutionRate > 0
    ? round((($resolutionRate - $prevResolutionRate) / $prevResolutionRate) * 100, 1)
    : 0;

// Response time: lower is better, so flip the sign for badge direction
$responseChange = $prevAvgRespSeconds > 0
    ? round((($currAvgRespSeconds - $prevAvgRespSeconds) / $prevAvgRespSeconds) * 100, 1) * -1
    : 0;

// ── Incident type distribution ─────────────────────────────
$typeSQL = "SELECT type, COUNT(*) as count FROM incidents i $where GROUP BY type";
$typeResult = mysqli_query($conn, $typeSQL);
$typeDistribution = [];
while ($row = mysqli_fetch_assoc($typeResult)) {
    $typeDistribution[$row['type']] = intval($row['count']);
}

// ── Response time distribution (uses total seconds) ────────
$responseSQL = "SELECT
    SUM(CASE WHEN ((COALESCE(ir.response_time_minutes,0)*60)+COALESCE(ir.response_time_seconds,0)) < 120   THEN 1 ELSE 0 END) as '0_2',
    SUM(CASE WHEN ((COALESCE(ir.response_time_minutes,0)*60)+COALESCE(ir.response_time_seconds,0)) >= 120
             AND  ((COALESCE(ir.response_time_minutes,0)*60)+COALESCE(ir.response_time_seconds,0)) < 240   THEN 1 ELSE 0 END) as '2_4',
    SUM(CASE WHEN ((COALESCE(ir.response_time_minutes,0)*60)+COALESCE(ir.response_time_seconds,0)) >= 240
             AND  ((COALESCE(ir.response_time_minutes,0)*60)+COALESCE(ir.response_time_seconds,0)) < 360   THEN 1 ELSE 0 END) as '4_6',
    SUM(CASE WHEN ((COALESCE(ir.response_time_minutes,0)*60)+COALESCE(ir.response_time_seconds,0)) >= 360  THEN 1 ELSE 0 END) as '6_plus'
FROM incidents i
LEFT JOIN incident_reports ir ON i.id = ir.incident_id
$where";

$responseResult = mysqli_query($conn, $responseSQL);
$responseRow = mysqli_fetch_assoc($responseResult);
$responseDistribution = [
    '0-2 mins' => intval($responseRow['0_2']),
    '2-4 mins' => intval($responseRow['2_4']),
    '4-6 mins' => intval($responseRow['4_6']),
    '6+ mins' => intval($responseRow['6_plus']),
];

// ── Peak hours ─────────────────────────────────────────────
$peakSQL = "SELECT HOUR(i.date_time) as hour, COUNT(*) as count 
               FROM incidents i $where 
               GROUP BY HOUR(i.date_time) 
               ORDER BY hour";
$peakResult = mysqli_query($conn, $peakSQL);
$peakHours = array_fill(0, 24, 0);
while ($row = mysqli_fetch_assoc($peakResult)) {
    $peakHours[intval($row['hour'])] = intval($row['count']);
}

// ── Incident table ─────────────────────────────────────────
$tableSQL = "SELECT 
    i.id, i.type, i.reporter, i.location, i.date_time, i.status,
    ir.response_time_minutes, ir.response_time_seconds, ir.severity_level
FROM incidents i
LEFT JOIN incident_reports ir ON i.id = ir.incident_id
$where AND i.status = 'resolved'
ORDER BY i.date_time DESC
LIMIT 10";

$tableResult = mysqli_query($conn, $tableSQL);
$tableData = [];
while ($row = mysqli_fetch_assoc($tableResult)) {
    $responseMin = intval($row['response_time_minutes'] ?? 0);
    $responseSec = intval($row['response_time_seconds'] ?? 0);
    $totalSeconds = ($responseMin * 60) + $responseSec;

    $tableData[] = [
        'id' => $row['id'],
        'type' => ucfirst($row['type']),
        'resident' => $row['reporter'],
        'location' => $row['location'],
        'timeReported' => date('M d, Y g:i A', strtotime($row['date_time'])),
        'responseTime' => formatSeconds($totalSeconds),
        'status' => ucfirst($row['status']),
        'severity' => $row['severity_level'] ?? 'N/A',
    ];
}

// ── Trend data (weekly) ────────────────────────────────────
$trendSQL = "SELECT 
    WEEK(i.date_time) as week_num,
    YEAR(i.date_time) as year,
    COUNT(*) as count
FROM incidents i
$where
GROUP BY YEAR(i.date_time), WEEK(i.date_time)
ORDER BY year, week_num
LIMIT 12";

$trendResult = mysqli_query($conn, $trendSQL);
$trendLabels = [];
$trendData = [];
$weekIndex = 1;
while ($row = mysqli_fetch_assoc($trendResult)) {
    $trendLabels[] = "Week $weekIndex";
    $trendData[] = intval($row['count']);
    $weekIndex++;
}

// ── Output ─────────────────────────────────────────────────
echo json_encode([
    'success' => true,
    'summary' => [
        'total' => $total,
        'resolved' => $resolved,
        'responding' => intval($summary['responding']),
        'pending' => intval($summary['pending']),
        'resolutionRate' => $resolutionRate . '%',
        'avgResponseTime' => $avgResponse,
    ],
    'changes' => [
        'total' => $totalChange,
        'avgResponseTime' => $responseChange,
        'resolutionRate' => $resolutionChange,
    ],
    'typeDistribution' => $typeDistribution,
    'responseDistribution' => $responseDistribution,
    'peakHours' => $peakHours,
    'trendLabels' => $trendLabels,
    'trendData' => $trendData,
    'tableData' => $tableData,
]);

mysqli_close($conn);