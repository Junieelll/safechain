<?php
require_once '../../config/conn.php';
header('Content-Type: application/json');

try {
    $residentId = mysqli_real_escape_string($conn, $_POST['id'] ?? '');

    if (empty($residentId)) {
        throw new Exception('Resident ID is required');
    }

    $fields = [];

    if (!empty($_POST['name']))
        $fields[] = "name = '" . mysqli_real_escape_string($conn, $_POST['name']) . "'";
    if (isset($_POST['address']))
        $fields[] = "address = '" . mysqli_real_escape_string($conn, $_POST['address']) . "'";
    if (isset($_POST['contact']))
        $fields[] = "contact = '" . mysqli_real_escape_string($conn, $_POST['contact']) . "'";

    // Handle profile picture upload
    if (!empty($_FILES['profilePicture']['tmp_name'])) {
        $uploadDir = __DIR__ . '/../mobile/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $ext      = strtolower(pathinfo($_FILES['profilePicture']['name'], PATHINFO_EXTENSION));
        $allowed  = ['jpg', 'jpeg', 'png', 'webp'];

        if (!in_array($ext, $allowed)) {
            throw new Exception('Invalid file type. Only JPG, PNG, WEBP allowed.');
        }

        $filename = 'resident_' . $residentId . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . $filename;

        if (!move_uploaded_file($_FILES['profilePicture']['tmp_name'], $destPath)) {
            throw new Exception('Failed to save uploaded file');
        }

        $url      = 'https://safechain.site/api/mobile/uploads/' . $filename;
        $fields[] = "profile_picture_url = '" . mysqli_real_escape_string($conn, $url) . "'";
    }

    // Handle remove photo
    if (!empty($_POST['removePhoto'])) {
        $fields[] = "profile_picture_url = NULL";
    }

    if (empty($fields)) {
        throw new Exception('No fields to update');
    }

    $fields[] = "updated_at = NOW()";

    $query = "UPDATE residents SET " . implode(', ', $fields) . " WHERE resident_id = '$residentId'";

    if (!mysqli_query($conn, $query)) {
        throw new Exception(mysqli_error($conn));
    }

    echo json_encode(['success' => true, 'message' => 'Resident updated successfully']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

mysqli_close($conn);
?>