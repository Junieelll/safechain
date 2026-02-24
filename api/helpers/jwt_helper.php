<?php
// api/helpers/jwt_helper.php

class JWTHelper
{
    private static $secret_key = "your-secret-key-change-this-in-production";

    /**
     * Generate JWT token for user
     */
    public static function generateToken($userId, $username, $role)
    {
        $issued_at = time();
        $expiration_time = $issued_at + (60 * 60 * 24 * 30); // 30 days

        $payload = [
            'iat' => $issued_at,
            'exp' => $expiration_time,
            'user_id' => $userId,
            'username' => $username,
            'role' => $role,
        ];

        return self::encode($payload);
    }

    /**
     * Verify and decode JWT token
     */
    public static function verifyToken($token)
    {
        try {
            $payload = self::decode($token);

            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return false;
            }

            return $payload;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Get token from Authorization header
     * 
     * Uses multiple fallbacks because getallheaders() is unreliable
     * on some Apache/XAMPP setups.
     */
    public static function getTokenFromHeader()
    {
        $auth = null;

        // On this XAMPP setup, getallheaders() works — check it first
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            $auth = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }

        // Fallbacks if getallheaders() ever stops working
        if (!$auth && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth = $_SERVER['HTTP_AUTHORIZATION'];
        }

        if (!$auth && !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if ($auth && preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    /**
     * Simple JWT encode
     */
    private static function encode($payload)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);

        $signature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, self::$secret_key, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . '.' . $base64UrlPayload . '.' . $base64UrlSignature;
    }

    /**
     * Simple JWT decode
     */
    private static function decode($jwt)
    {
        $tokenParts = explode('.', $jwt);

        if (count($tokenParts) !== 3) {
            throw new Exception('Invalid token format');
        }

        $header = base64_decode($tokenParts[0]);
        $payload = base64_decode($tokenParts[1]);
        $signatureProvided = $tokenParts[2];

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);

        $signature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, self::$secret_key, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        if (!hash_equals($base64UrlSignature, $signatureProvided)) {
            throw new Exception('Invalid signature');
        }

        return json_decode($payload, true);
    }

    private static function base64UrlEncode($text)
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($text));
    }
}
?>