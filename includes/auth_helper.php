<?php
// includes/auth_helper.php

/**
 * Authentication and Authorization Helper
 * Handles user session management, role checks, and access control
 */
class AuthChecker
{

    // Session keys constants
    private const SESSION_USER_ID = 'user_id';
    private const SESSION_NAME = 'name';
    private const SESSION_USERNAME = 'username';
    private const SESSION_ROLE = 'user_role';
    private const SESSION_STATUS = 'user_status';

    // Cookie expiry (30 days)
    private const COOKIE_EXPIRY = 2592000;

    /**
     * Check if user is authenticated
     */
    public static function isLoggedIn(): bool
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Already have a valid session
        if (isset($_SESSION[self::SESSION_USER_ID]) && !empty($_SESSION[self::SESSION_USER_ID])) {
            return true;
        }

        // Try to restore from remember-me cookies
        return self::restoreFromCookies();
    }

    private static function restoreFromCookies(): bool
    {
        if (empty($_COOKIE[self::SESSION_USER_ID])) {
            return false;
        }

        $userId = $_COOKIE[self::SESSION_USER_ID];

        // Re-fetch fresh data from DB instead of trusting cookie values
        global $conn;
        if (!$conn)
            return false;

        $stmt = mysqli_prepare(
            $conn,
            "SELECT user_id, name, username, role, status FROM users WHERE user_id = ? LIMIT 1"
        );
        mysqli_stmt_bind_param($stmt, 's', $userId);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $user = mysqli_fetch_assoc($result);
        mysqli_stmt_close($stmt);

        if (!$user)
            return false;

        $_SESSION[self::SESSION_USER_ID] = $user['user_id'];
        $_SESSION[self::SESSION_NAME] = $user['name'];
        $_SESSION[self::SESSION_USERNAME] = $user['username'];
        $_SESSION[self::SESSION_ROLE] = $user['role'];
        $_SESSION[self::SESSION_STATUS] = $user['status']; // ← always fresh from DB

        return true;
    }

    /**
     * Check if user account is active (not suspended)
     */
    public static function isActive(): bool
    {
        if (!self::isLoggedIn()) {
            return false;
        }

        $status = $_SESSION[self::SESSION_STATUS] ?? 'suspended';
        return $status === 'active';
    }

    /**
     * Require authentication and active status
     * Automatically logs out suspended users
     */
    public static function requireAuth(string $redirectUrl = '/auth/login'): void
    {
        if (!self::isLoggedIn()) {
            self::redirectTo($redirectUrl);
        }

        // Check if user is suspended
        if (!self::isActive()) {
            self::logout();
            self::redirectTo($redirectUrl . '?error=suspended');
        }
    }

    /**
     * Require authentication for API (returns JSON instead of redirecting)
     */
    public static function requireApiAuth(): void
    {
        if (!self::isLoggedIn()) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Not authenticated'
            ]);
            exit;
        }

        if (!self::isActive()) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Account suspended'
            ]);
            exit;
        }
    }

    /**
     * Get current user's role
     */
    public static function getUserRole(): string
    {
        return $_SESSION[self::SESSION_ROLE] ?? Roles::GUEST;
    }

    /**
     * Get current user's ID (returns string like 'USR-2025-001')
     */
    public static function getUserId(): ?string
    {
        return $_SESSION[self::SESSION_USER_ID] ?? null;
    }

    /**
     * Get current user's full name
     */
    public static function getName(): ?string
    {
        return $_SESSION[self::SESSION_NAME] ?? null;
    }

    /**
     * Get current user's username
     */
    public static function getUsername(): ?string
    {
        return $_SESSION[self::SESSION_USERNAME] ?? null;
    }

    /**
     * Get current user's status
     */
    public static function getStatus(): string
    {
        return $_SESSION[self::SESSION_STATUS] ?? 'suspended';
    }

    /**
     * Check if user has a specific role
     */
    public static function hasRole(string $role): bool
    {
        return self::getUserRole() === $role;
    }

    /**
     * Check if user has any of the specified roles
     */
    public static function hasAnyRole(array $roles): bool
    {
        return in_array(self::getUserRole(), $roles, true);
    }

    /**
     * Require specific role - show 403 if user doesn't have the role
     */
    public static function requireRole(string $role, string $errorPage = '/errors/403.php'): void
    {
        self::requireAuth();

        if (!self::hasRole($role)) {
            self::sendForbiddenResponse($errorPage);
        }
    }

    /**
     * Require specific role for API (returns JSON)
     */
    public static function requireApiRole(string $role): void
    {
        self::requireApiAuth();

        if (!self::hasRole($role)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Insufficient permissions'
            ]);
            exit;
        }
    }

    /**
     * Require any of the specified roles
     */
    public static function requireAnyRole(array $roles, string $errorPage = '/errors/403.php'): void
    {
        self::requireAuth();

        if (!self::hasAnyRole($roles)) {
            self::sendForbiddenResponse($errorPage);
        }
    }

    /**
     * Require any of the specified roles for API (returns JSON)
     */
    public static function requireApiAnyRole(array $roles): void
    {
        self::requireApiAuth();

        if (!self::hasAnyRole($roles)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Insufficient permissions'
            ]);
            exit;
        }
    }

    /**
     * Require admin role (web app only)
     */
    public static function requireAdmin(): void
    {
        self::requireRole(Roles::ADMIN);
    }

    /**
     * Require admin role for API (returns JSON)
     */
    public static function requireApiAdmin(): void
    {
        self::requireApiRole(Roles::ADMIN);
    }

    /**
     * Require responder role (mobile app users)
     */
    public static function requireResponder(): void
    {
        self::requireAnyRole(Roles::getResponderRoles());
    }

    /**
     * Require responder role for API (returns JSON)
     */
    public static function requireApiResponder(): void
    {
        self::requireApiAnyRole(Roles::getResponderRoles());
    }

    /**
     * Check if user is guest (not logged in)
     */
    public static function isGuest(): bool
    {
        return !self::isLoggedIn() || self::getUserRole() === Roles::GUEST;
    }

    /**
     * Redirect if already authenticated
     */
    public static function redirectIfAuthenticated(string $redirectUrl = '/home'): void
    {
        if (self::isLoggedIn() && self::isActive()) {
            self::redirectTo($redirectUrl);
        }
    }

    /**
     * Logout user - clear session and cookies
     */
    public static function logout(): void
    {
        // Clear session variables
        $_SESSION = [];

        // Clear cookies if they exist
        $cookieParams = [
            self::SESSION_USER_ID,
            self::SESSION_NAME,
            self::SESSION_USERNAME,
            self::SESSION_ROLE,
            self::SESSION_STATUS
        ];

        foreach ($cookieParams as $param) {
            if (isset($_COOKIE[$param])) {
                setcookie($param, '', time() - 3600, '/', '', true, true);
            }
        }

        // Destroy session
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
    }

    /**
     * Set user session data after successful login
     * UPDATED: Now accepts string $userId (like 'USR-2025-001')
     */
    public static function login(
        string $userId,
        string $name,
        string $username,
        string $role,
        string $status = 'active',
        bool $rememberMe = false
    ): void {
        // Start session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Regenerate session ID to prevent session fixation
        session_regenerate_id(true);

        // Set session data
        $_SESSION[self::SESSION_USER_ID] = $userId;
        $_SESSION[self::SESSION_NAME] = $name;
        $_SESSION[self::SESSION_USERNAME] = $username;
        $_SESSION[self::SESSION_ROLE] = $role;
        $_SESSION[self::SESSION_STATUS] = $status;

        // Set secure cookies if remember me is checked
        if ($rememberMe) {
            $expiry = time() + self::COOKIE_EXPIRY;
            $cookieOptions = [
                'expires' => $expiry,
                'path' => '/',
                'secure' => true,      // HTTPS only
                'httponly' => true,    // No JavaScript access
                'samesite' => 'Strict' // CSRF protection
            ];

            setcookie(self::SESSION_USER_ID, $userId, $cookieOptions);
            setcookie(self::SESSION_NAME, $name, $cookieOptions);
            setcookie(self::SESSION_USERNAME, $username, $cookieOptions);
            setcookie(self::SESSION_ROLE, $role, $cookieOptions);
            setcookie(self::SESSION_STATUS, $status, $cookieOptions);
        }
    }

    /**
     * Check if user is an admin (web app access only)
     */
    public static function isAdmin(): bool
    {
        return self::hasRole(Roles::ADMIN);
    }

    /**
     * Check if user is a responder (mobile app users)
     */
    public static function isResponder(): bool
    {
        return self::hasAnyRole(Roles::getResponderRoles());
    }

    /**
     * Check if current platform is allowed for user's role
     */
    public static function isPlatformAllowed(string $platform = 'web'): bool
    {
        $role = self::getUserRole();

        if ($platform === 'web') {
            return $role === Roles::ADMIN;
        }

        if ($platform === 'mobile') {
            return in_array($role, Roles::getResponderRoles(), true);
        }

        return false;
    }

    /**
     * Require platform access (web or mobile)
     */
    public static function requirePlatform(string $platform = 'web'): void
    {
        self::requireAuth();

        if (!self::isPlatformAllowed($platform)) {
            $message = $platform === 'web'
                ? 'Web access is restricted to administrators only.'
                : 'Mobile access is restricted to responders only.';

            http_response_code(403);
            die($message);
        }
    }

    // Private helper methods

    private static function redirectTo(string $url): void
    {
        header("Location: $url");
        exit;
    }

    private static function sendForbiddenResponse(string $errorPage): void
    {
        http_response_code(403);

        if (file_exists(__DIR__ . $errorPage)) {
            require __DIR__ . $errorPage;
        } else {
            die('403 Forbidden: You do not have permission to access this resource.');
        }

        exit;
    }
}

/**
 * Role definitions and utilities
 */
class Roles
{
    // Role constants
    const GUEST = 'guest';
    const ADMIN = 'admin';
    const BPSO = 'bpso';        // Barangay Public Safety Officer
    const BHERT = 'bhert';      // Barangay Health Emergency Response Team
    const FIREFIGHTER = 'firefighter';

    /**
     * Get all responder roles (mobile app users)
     */
    public static function getResponderRoles(): array
    {
        return [
            self::BPSO,
            self::BHERT,
            self::FIREFIGHTER
        ];
    }

    /**
     * Get all authenticated roles (excludes guest)
     */
    public static function getAuthenticatedRoles(): array
    {
        return array_merge([self::ADMIN], self::getResponderRoles());
    }

    /**
     * Get all roles including guest
     */
    public static function getAllRoles(): array
    {
        return array_merge([self::GUEST], self::getAuthenticatedRoles());
    }

    /**
     * Check if role exists
     */
    public static function exists(string $role): bool
    {
        return in_array($role, self::getAllRoles(), true);
    }

    /**
     * Check if role is a responder role
     */
    public static function isResponderRole(string $role): bool
    {
        return in_array($role, self::getResponderRoles(), true);
    }

    /**
     * Get role display name
     */
    public static function getDisplayName(string $role): string
    {
        $displayNames = [
            self::GUEST => 'Guest',
            self::ADMIN => 'Administrator',
            self::BPSO => 'BPSO',
            self::BHERT => 'BHERT',
            self::FIREFIGHTER => 'Firefighter'
        ];

        return $displayNames[$role] ?? 'Unknown';
    }

    /**
     * Get allowed platform for role
     */
    public static function getAllowedPlatform(string $role): string
    {
        if ($role === self::ADMIN) {
            return 'web';
        }

        if (self::isResponderRole($role)) {
            return 'mobile';
        }

        return 'none';
    }
}