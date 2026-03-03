<?php
require_once __DIR__ . '/../../vendor/autoload.php';

function getFCMAccessToken(): string
{
    $client = new Google\Client();
    // Pass the FILE PATH not the decoded array
    $client->setAuthConfig(__DIR__ . '/service-account.json');
    $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
    $client->fetchAccessTokenWithAssertion();
    $token = $client->getAccessToken();

    if (empty($token['access_token'])) {
        error_log('[FCM] Failed to get access token: ' . json_encode($token));
        throw new \Exception('Failed to get FCM access token');
    }

    return $token['access_token'];
}

function getRolesForIncidentType(string $type): array
{
    return match ($type) {
        'fire' => ['firefighter', 'bhert', 'admin'],
        'flood' => ['bhert', 'firefighter', 'admin'],
        'crime' => ['bpso', 'admin'],
        default => ['admin'],
    };
}

function sendFCMToAllResponders(mysqli $conn, array $incident): void
{
    // ── 1. Get roles that should receive this incident type ────────────────
    $roles = getRolesForIncidentType($incident['type']);
    $placeholders = implode(',', array_fill(0, count($roles), '?'));
    $types = str_repeat('s', count($roles));

    $now = date('H:i:s');
    $today = date('Y-m-d');
    
    $stmt = $conn->prepare("
        SELECT token FROM device_tokens 
        WHERE role IN ($placeholders)
        AND on_duty = 1
        AND (duty_start IS NULL OR duty_start <= ?)
        AND (duty_end IS NULL OR duty_end >= ?)
        AND (duty_until IS NULL OR duty_until >= ?)
    ");

    $stmt->bind_param($types . 'sss', ...[...$roles, $now, $now, $today]);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    if (empty($rows)) {
        error_log('[FCM] No device tokens found for roles: ' . implode(', ', $roles));
        return;
    }

    try {
        $accessToken = getFCMAccessToken();
    } catch (\Exception $e) {
        error_log('[FCM] Auth error: ' . $e->getMessage());
        return;
    }

    $projectId = 'safechain-14782';

    // ── Everything below is unchanged ──────────────────────────────────────
    foreach ($rows as $row) {
        $payload = [
            'message' => [
                'token' => $row['token'],
                'notification' => [
                    'title' => 'New Incident Reported',
                    'body' => "A {$incident['type']} emergency at {$incident['location']}.",
                ],
                'data' => [
                    'incidentId' => (string) $incident['id'],
                    'type' => (string) $incident['type'],
                    'location' => (string) $incident['location'],
                ],
                'android' => [
                    'priority' => 'high',
                    'ttl'      => '30s',
                    'notification' => [
                        'channel_id' => 'default',
                        'sound' => 'alert_v2',
                    ],
                ],
            ],
        ];

        $ch = curl_init(
            "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send"
        );
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // ── Remove stale tokens ────────────────────────────────────────────────
        if ($httpCode === 404) {
            $responseBody = json_decode($response, true);
            $errorStatus = $responseBody['error']['status'] ?? '';

            if ($errorStatus === 'UNREGISTERED') {
                $del = $conn->prepare("DELETE FROM device_tokens WHERE token = ?");
                $del->bind_param("s", $row['token']);
                $del->execute();
                $del->close();
                error_log("[FCM] Removed stale token: {$row['token']}");
            }
        }

        error_log("[FCM] Token: {$row['token']} | HTTP: {$httpCode} | Response: {$response}");
    }
}