<?php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/user_functions.php';

AuthChecker::requireApiAdmin();
header('Content-Type: application/json');

// Now using $_POST since we send FormData
$userId   = $_POST['userId']   ?? '';
$fullName = $_POST['fullName'] ?? '';
$username = $_POST['username'] ?? '';
$role     = $_POST['role']     ?? '';

if (empty($userId) || empty($fullName) || empty($username) || empty($role)) {
    echo json_encode(['success' => false, 'error' => 'All fields are required']);
    exit;
}

try {
    if (usernameExists($conn, $username, $userId)) {
        echo json_encode(['success' => false, 'error' => 'Username already exists']);
        exit;
    }

    // Handle profile picture upload
    $profilePictureUrl = null;
    $updatePhoto = false;

    if (!empty($_FILES['profilePicture']['tmp_name'])) {
        $uploadDir = __DIR__ . '/../../uploads/profiles/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $ext     = strtolower(pathinfo($_FILES['profilePicture']['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];

        if (!in_array($ext, $allowed)) {
            echo json_encode(['success' => false, 'error' => 'Invalid file type']);
            exit;
        }

        $filename  = 'profile_' . $userId . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . $filename;

        if (!move_uploaded_file($_FILES['profilePicture']['tmp_name'], $destPath)) {
            throw new Exception('Failed to save uploaded file');
        }

        $profilePictureUrl = 'uploads/profiles/' . $filename;
        $updatePhoto = true;
    }

    if (!empty($_POST['removePhoto'])) {
        $profilePictureUrl = null;
        $updatePhoto = true;
    }

    // Update core fields
    $result = updateUser($conn, $userId, $fullName, $username, $role);

    // Update profile picture separately if changed
    if ($updatePhoto) {
        $stmt = mysqli_prepare($conn,
            "UPDATE users SET profile_picture = ? WHERE user_id = ?"
        );
        mysqli_stmt_bind_param($stmt, "ss", $profilePictureUrl, $userId);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }

    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update user']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}