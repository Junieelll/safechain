<?php
// includes/user_functions.php

/**
 * Generate user_id in format USR-2025-001
 */
function generateUserId($conn) {
    $year = date('Y');
    
    // Get the count of users created this year
    $pattern = "USR-$year-%";
    $stmt = mysqli_prepare($conn, "SELECT COUNT(*) as count FROM users WHERE user_id LIKE ?");
    mysqli_stmt_bind_param($stmt, "s", $pattern);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    
    $count = $row['count'] + 1;
    
    // Format: USR-2025-001
    return sprintf("USR-%s-%03d", $year, $count);
}

/**
 * Create a new user
 */
function createUser($conn, $name, $username, $password, $role = 'operator') {
    // Generate user_id
    $userId = generateUserId($conn);
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    // Prepare statement
    $stmt = mysqli_prepare($conn, 
        "INSERT INTO users (user_id, name, username, password, role) 
         VALUES (?, ?, ?, ?, ?)"
    );
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . mysqli_error($conn));
    }
    
    mysqli_stmt_bind_param($stmt, "sssss", $userId, $name, $username, $hashedPassword, $role);
    
    if (mysqli_stmt_execute($stmt)) {
        mysqli_stmt_close($stmt);
        return getUserById($conn, $userId);
    } else {
        $error = mysqli_stmt_error($stmt);
        mysqli_stmt_close($stmt);
        
        if (strpos($error, 'Duplicate entry') !== false) {
            throw new Exception("Username already exists");
        }
        throw new Exception("Error creating user: " . $error);
    }
}

/**
 * Get user by user_id
 */
function getUserById($conn, $userId) {
    $stmt = mysqli_prepare($conn, 
        "SELECT user_id, name, username, role, created_at, updated_at, last_login 
         FROM users WHERE user_id = ?"
    );
    
    mysqli_stmt_bind_param($stmt, "s", $userId);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);
    
    return $user;
}

/**
 * Get user by username
 */
function getUserByUsername($conn, $username) {
    $stmt = mysqli_prepare($conn, 
        "SELECT user_id, name, username, password, role, created_at, updated_at, last_login 
         FROM users WHERE username = ?"
    );
    
    mysqli_stmt_bind_param($stmt, "s", $username);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);
    
    return $user;
}

/**
 * Verify user credentials
 */
function verifyCredentials($conn, $username, $password) {
    $user = getUserByUsername($conn, $username);
    
    if (!$user) {
        return false;
    }
    
    if (password_verify($password, $user['password'])) {
        // Update last login
        updateLastLogin($conn, $user['user_id']);
        
        // Remove password from returned data
        unset($user['password']);
        return $user;
    }
    
    return false;
}

/**
 * Update last login timestamp
 */
function updateLastLogin($conn, $userId) {
    $stmt = mysqli_prepare($conn, "UPDATE users SET last_login = NOW() WHERE user_id = ?");
    mysqli_stmt_bind_param($stmt, "s", $userId);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);
}

/**
 * Check if username exists
 */
function usernameExists($conn, $username) {
    $stmt = mysqli_prepare($conn, "SELECT COUNT(*) as count FROM users WHERE username = ?");
    mysqli_stmt_bind_param($stmt, "s", $username);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);
    
    return $row['count'] > 0;
}

/**
 * Get all users
 */
function getAllUsers($conn, $role = null) {
    if ($role) {
        $stmt = mysqli_prepare($conn, 
            "SELECT user_id, name, username, role, created_at, updated_at, last_login 
             FROM users WHERE role = ? ORDER BY created_at DESC"
        );
        mysqli_stmt_bind_param($stmt, "s", $role);
        mysqli_stmt_execute($stmt);
    } else {
        $stmt = mysqli_prepare($conn, 
            "SELECT user_id, name, username, role, created_at, updated_at, last_login 
             FROM users ORDER BY created_at DESC"
        );
        mysqli_stmt_execute($stmt);
    }
    
    $result = mysqli_stmt_get_result($stmt);
    $users = mysqli_fetch_all($result, MYSQLI_ASSOC);
    mysqli_stmt_close($stmt);
    
    return $users;
}

/**
 * Update user
 */
function updateUser($conn, $userId, $name = null, $username = null, $role = null) {
    $fields = [];
    $types = "";
    $params = [];
    
    if ($name !== null) {
        $fields[] = "name = ?";
        $types .= "s";
        $params[] = $name;
    }
    
    if ($username !== null) {
        $fields[] = "username = ?";
        $types .= "s";
        $params[] = $username;
    }
    
    if ($role !== null) {
        $fields[] = "role = ?";
        $types .= "s";
        $params[] = $role;
    }
    
    if (empty($fields)) {
        return false;
    }
    
    $types .= "s";
    $params[] = $userId;
    
    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE user_id = ?";
    $stmt = mysqli_prepare($conn, $sql);
    
    mysqli_stmt_bind_param($stmt, $types, ...$params);
    $result = mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);
    
    return $result;
}

/**
 * Update password
 */
function updatePassword($conn, $userId, $newPassword) {
    $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmt = mysqli_prepare($conn, "UPDATE users SET password = ? WHERE user_id = ?");
    mysqli_stmt_bind_param($stmt, "ss", $hashedPassword, $userId);
    $result = mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);
    
    return $result;
}

/**
 * Delete user
 */
function deleteUser($conn, $userId) {
    $stmt = mysqli_prepare($conn, "DELETE FROM users WHERE user_id = ?");
    mysqli_stmt_bind_param($stmt, "s", $userId);
    $result = mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);
    
    return $result;
}
?>