<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../config/conn.php';

$period    = isset($_GET['period']) ? $_GET['period'] : 'last30days';
$fromDate  = isset($_GET['from']) ? $_GET['from'] : null;
$toDate    = isset($_GET['to']) ? $_GET['to'] : null;
$types     = isset($_GET['types']) ? $_GET['types'] : 'all';
$status    = isset($_GET['status']) ? $_GET['status'] : 'all';

// Build date condition
switch ($period) {
    case 'last7days':  $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)"; break;
    case 'last30days': $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)"; break;
    case 'last90days': $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 90 DAY)"; break;
    case 'lastyear':   $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 1 YEAR)"; break;
    case 'custom':
        if ($fromDate && $toDate) {
            $from = mysqli_real_escape_string($conn, $fromDate);
            $to   = mysqli_real_escape_string($conn, $toDate);
            $dateCondition = "AND i.date_time BETWEEN '$from' AND '$to 23:59:59'";
        } else {
            $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        }
        break;
    default: $dateCondition = "AND i.date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
}

// Build type condition
$typeCondition = "";
if ($types !== 'all') {
    $typeList = implode("','", array_map(fn($t) => mysqli_real_escape_string($conn, $t), explode(',', $types)));
    $typeCondition = "AND i.type IN ('$typeList')";
}

// Build status condition
$statusCondition = "";
if ($status !== 'all') {
    $statusList = implode("','", array_map(fn($s) => mysqli_real_escape_string($conn, $s), explode(',', $status)));
    $statusCondition = "AND i.status IN ('$statusList')";
}

$where = "WHERE i.is_archived = 0 $dateCondition $typeCondition $statusCondition";

// ── Summary stats ──────────────────────────────────────────
$summarySQL = "SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN i.status = 'resolved' THEN 1 ELSE 0 END) as resolved,
    SUM(CASE WHEN i.status = 'responding' THEN 1 ELSE 0 END) as responding,
    SUM(CASE WHEN i.status = 'pending' THEN 1 ELSE 0 END) as pending,
    AVG(ir.response_time_minutes + ir.response_time_seconds/60) as avg_response_time,
    AVG(ir.resolution_time_minutes + ir.resolution_time_seconds/60) as avg_resolution_time
FROM incidents i
LEFT JOIN incident_reports ir ON i.id = ir.incident_id
$where";

$summaryResult = mysqli_query($conn, $summarySQL);
$summary = mysqli_fetch_assoc($summaryResult);

$total          = intval($summary['total']);
$resolved       = intval($summary['resolved']);
$resolutionRate = $total > 0 ? round(($resolved / $total) * 100, 1) : 0;
$avgResponse    = round(floatval($summary['avg_response_time']), 1);

// ── Incident type distribution ─────────────────────────────
$typeSQL = "SELECT type, COUNT(*) as count FROM incidents i $where GROUP BY type";
$typeResult = mysqli_query($conn, $typeSQL);
$typeDistribution = [];
while ($row = mysqli_fetch_assoc($typeResult)) {
    $typeDistribution[$row['type']] = intval($row['count']);
}

// ── Response time distribution ─────────────────────────────
$responseSQL = "SELECT
    SUM(CASE WHEN ir.response_time_minutes < 2 THEN 1 ELSE 0 END) as '0_2',
    SUM(CASE WHEN ir.response_time_minutes >= 2 AND ir.response_time_minutes < 4 THEN 1 ELSE 0 END) as '2_4',
    SUM(CASE WHEN ir.response_time_minutes >= 4 AND ir.response_time_minutes < 6 THEN 1 ELSE 0 END) as '4_6',
    SUM(CASE WHEN ir.response_time_minutes >= 6 THEN 1 ELSE 0 END) as '6_plus'
FROM incidents i
LEFT JOIN incident_reports ir ON i.id = ir.incident_id
$where";

$responseResult = mysqli_query($conn, $responseSQL);
$responseRow = mysqli_fetch_assoc($responseResult);
$responseDistribution = [
    '0-2 mins' => intval($responseRow['0_2']),
    '2-4 mins' => intval($responseRow['2_4']),
    '4-6 mins' => intval($responseRow['4_6']),
    '6+ mins'  => intval($responseRow['6_plus']),
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
    ir.response_time_minutes, ir.severity_level
FROM incidents i
LEFT JOIN incident_reports ir ON i.id = ir.incident_id
$where
ORDER BY i.date_time DESC
LIMIT 10";

$tableResult = mysqli_query($conn, $tableSQL);
$tableData = [];
while ($row = mysqli_fetch_assoc($tableResult)) {
    $responseMin = $row['response_time_minutes'] ?? 0;
    $tableData[] = [
        'id'           => $row['id'],
        'type'         => ucfirst($row['type']),
        'resident'     => $row['reporter'],
        'location'     => $row['location'],
        'timeReported' => date('M d, Y g:i A', strtotime($row['date_time'])),
        'responseTime' => $responseMin ? $responseMin . 'm' : 'N/A',
        'status'       => ucfirst($row['status']),
        'severity'     => $row['severity_level'] ?? 'N/A',
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
$trendData   = [];
$weekIndex   = 1;
while ($row = mysqli_fetch_assoc($trendResult)) {
    $trendLabels[] = "Week $weekIndex";
    $trendData[]   = intval($row['count']);
    $weekIndex++;
}

echo json_encode([
    'success' => true,
    'summary' => [
        'total'          => $total,
        'resolved'       => $resolved,
        'responding'     => intval($summary['responding']),
        'pending'        => intval($summary['pending']),
        'resolutionRate' => $resolutionRate . '%',
        'avgResponseTime'=> $avgResponse . 'm',
    ],
    'typeDistribution'     => $typeDistribution,
    'responseDistribution' => $responseDistribution,
    'peakHours'            => $peakHours,
    'trendLabels'          => $trendLabels,
    'trendData'            => $trendData,
    'tableData'            => $tableData,
]);

mysqli_close($conn);