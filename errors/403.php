<?php
echo "Requested Route: $route <br>";
echo "User Role: $userRole <br>";
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>403 Forbidden</title>
    <style>
        body { text-align: center; font-family: Arial, sans-serif; padding: 50px; }
        h1 { font-size: 50px; color: #ff0000; }
        p { font-size: 18px; }
    </style>
</head>
<body>
    <h1>403 - Access Denied</h1>
    <p>Sorry, you don’t have permission to access this page.</p>
    <a href="/safechain/auth/login">Go to Homepage</a>
</body>
</html>
