<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../config/conn.php';

$year = isset($_GET['year']) ? intval($_GET['year']) : intval(date('Y'));

$sql = "SELECT 
    type,
    MONTH(date_time) as month,
    COUNT(*) as count
FROM incidents
WHERE YEAR(date_time) = $year
AND is_archived = 0
GROUP BY type, MONTH(date_time)
ORDER BY type, month";

$result = mysqli_query($conn, $sql);

$data = [
    'fire'  => array_fill(1, 12, 0),
    'crime' => array_fill(1, 12, 0),
    'flood' => array_fill(1, 12, 0),
];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $type  = $row['type'];
        $month = intval($row['month']);
        if (isset($data[$type])) {
            $data[$type][$month] = intval($row['count']);
        }
    }
}

// Get available years from DB
$yearsResult = mysqli_query($conn, "SELECT DISTINCT YEAR(date_time) as year FROM incidents WHERE is_archived = 0 ORDER BY year DESC");
$years = [];
while ($row = mysqli_fetch_assoc($yearsResult)) {
    $years[] = intval($row['year']);
}

echo json_encode([
    'success' => true,
    'year'    => $year,
    'years'   => $years,
    'data'    => [
        'fire'  => array_values($data['fire']),
        'crime' => array_values($data['crime']),
        'flood' => array_values($data['flood']),
    ]
]);

mysqli_close($conn);