<?php 
date_default_timezone_set('Asia/Manila');

    $conn  = mysqli_connect("localhost", "u131483420_safechain", "r?5Rd&S=|", "u131483420_safechain");
    if ($conn == false){
        die("connection error". mysqli_connect_error());
    }
    
    // Add this line to set MySQL timezone
$conn->query("SET time_zone = '+08:00'");
?>