<?php
// auth_helper.php 

class AuthChecker {
    
    /**
     * Check if user is authenticated
     * @return bool
     */
    public static function isLoggedIn() {
        return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
    }
    
    /**
     * Require authentication - redirect to login if not authenticated
     * @param string $redirectUrl URL to redirect to if not authenticated
     */
    public static function requireAuth($redirectUrl = '/auth/login') {
        if (!self::isLoggedIn()) {
            header("Location: $redirectUrl");
            exit;
        }
    }
    
    /**
     * Get current user's role
     * @return string
     */
    public static function getUserRole() {
        return $_SESSION['user_role'] ?? 'guest';
    }
    
    /**
     * Get current user's ID
     * @return mixed|null
     */
    public static function getUserId() {
        return $_SESSION['user_id'] ?? null;
    }
    
    /**
     * Get current user's full name
     * @return string|null
     */
    public static function getName() {
        return $_SESSION['name'] ?? null;
    }
    
    /**
     * Get current user's username
     * @return string|null
     */
    public static function getUsername() {
        return $_SESSION['username'] ?? null;
    }
    
    /**
     * Check if user has a specific role
     * @param string $role Role to check
     * @return bool
     */
    public static function hasRole($role) {
        return self::getUserRole() === $role;
    }
    
    /**
     * Check if user has any of the specified roles
     * @param array $roles Array of roles to check
     * @return bool
     */
    public static function hasAnyRole(array $roles) {
        return in_array(self::getUserRole(), $roles);
    }
    
    /**
     * Require specific role - show 403 if user doesn't have the role
     * @param string $role Required role
     * @param string $errorPage Path to 403 error page
     */
    public static function requireRole($role, $errorPage = '/errors/403.php') {
        if (!self::hasRole($role)) {
            http_response_code(403);
            require __DIR__ . $errorPage;
            exit;
        }
    }
    
    /**
     * Require any of the specified roles
     * @param array $roles Array of allowed roles
     * @param string $errorPage Path to 403 error page
     */
    public static function requireAnyRole(array $roles, $errorPage = '/errors/403.php') {
        if (!self::hasAnyRole($roles)) {
            http_response_code(403);
            require __DIR__ . $errorPage;
            exit;
        }
    }
    
    /**
     * Check if user is guest (not logged in)
     * @return bool
     */
    public static function isGuest() {
        return !self::isLoggedIn() || self::getUserRole() === 'guest';
    }
    
    /**
     * Redirect if already authenticated (useful for login/register pages)
     * @param string $redirectUrl URL to redirect to if authenticated
     */
    public static function redirectIfAuthenticated($redirectUrl = '/home') {
        if (self::isLoggedIn()) {
            header("Location: $redirectUrl");
            exit;
        }
    }
    
    /**
     * Check if user can access a specific route based on role
     * @param string $route Route to check
     * @param array $allowedRoutes Array of allowed routes by role
     * @return bool
     */
    public static function canAccessRoute($route, array $allowedRoutes) {
        $userRole = self::getUserRole();
        return isset($allowedRoutes[$userRole]) && in_array($route, $allowedRoutes[$userRole]);
    }
    
    /**
     * Logout user - clear session and cookies
     */
    public static function logout() {
        // Clear session variables
        $_SESSION = array();
        
        // Clear cookies
        if (isset($_COOKIE['user_id'])) {
            setcookie('user_id', '', time() - 3600, '/');
            setcookie('name', '', time() - 3600, '/');
            setcookie('username', '', time() - 3600, '/');
            setcookie('user_role', '', time() - 3600, '/');
        }
        
        // Destroy session
        session_destroy();
    }
    
    /**
     * Set user session data
     * @param int $userId User ID
     * @param string $name User's full name
     * @param string $username User's username
     * @param string $userRole User role
     * @param bool $rememberMe Whether to set cookies
     */
    public static function login($userId, $name, $username, $userRole, $rememberMe = false) {
        $_SESSION['user_id'] = $userId;
        $_SESSION['name'] = $name;
        $_SESSION['username'] = $username;
        $_SESSION['user_role'] = $userRole;
        
        if ($rememberMe) {
            $cookieExpiry = time() + (30 * 24 * 60 * 60); // 30 days
            setcookie('user_id', $userId, $cookieExpiry, '/');
            setcookie('name', $name, $cookieExpiry, '/');
            setcookie('username', $username, $cookieExpiry, '/');
            setcookie('user_role', $userRole, $cookieExpiry, '/');
        }
    }
    
    /**
     * Check if user is an admin
     * @return bool
     */
    public static function isAdmin() {
        return self::hasRole(Roles::ADMIN);
    }
    
    /**
     * Check if user is a responder
     * @return bool
     */
    public static function isResponder() {
        return self::hasRole(Roles::RESPONDER);
    }
    
    /**
     * Check if user is an operator
     * @return bool
     */
    public static function isOperator() {
        return self::hasRole(Roles::OPERATOR);
    }
}

// Role constants for SafeChain application
class Roles {
    const GUEST = 'guest';
    const ADMIN = 'admin';
    const RESPONDER = 'responder';
    const OPERATOR = 'operator';
    
    /**
     * Get all available roles
     * @return array
     */
    public static function all() {
        return [
            self::ADMIN,
            self::RESPONDER,
            self::OPERATOR
        ];
    }
    
    /**
     * Get all roles including guest
     * @return array
     */
    public static function allWithGuest() {
        return [
            self::GUEST,
            self::ADMIN,
            self::RESPONDER,
            self::OPERATOR
        ];
    }
    
    /**
     * Check if role exists
     * @param string $role
     * @return bool
     */
    public static function exists($role) {
        return in_array($role, self::allWithGuest());
    }
    
    /**
     * Get authenticated roles only (excludes guest)
     * @return array
     */
    public static function authenticated() {
        return [
            self::ADMIN,
            self::RESPONDER,
            self::OPERATOR
        ];
    }
}