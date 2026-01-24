<?php 
    $conn  = mysqli_connect("localhost", "root", "kingsdeath10", "safechain");
    if ($conn == false){
        die("connection error". mysqli_connect_error());
    }
?>