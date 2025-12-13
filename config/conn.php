<?php 
    $conn  = mysqli_connect("localhost", "root", "", "safechain");
    if ($conn == false){
        die("connection error". mysqli_connect_error());
    }
?>