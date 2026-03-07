<?php

require_once __DIR__ . '/../../config/conn.php';

function getAccessToken() {
    $serviceAccount = [
        "type"                        => "service_account",
        "project_id"                  => "safechain-4daf7",
        "private_key_id"              => "98048e0b0e235afd2349206ebcaa09653ce4a8af",
        "private_key"                 => "-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCuAgcB3tvlRXUL\niuxx0zf+rQiGQXD8AHDiwkWXj966O0LiNNy+XBOZsvE9FmED2c2Q78wwx9VHoAbN\n8ZBA5He97qQoYmXHDJyzXdenhketKcbmFuLllbStzeXmqx+SpabxyQ16MdOxxgMp\nEt8qpbkVANfOXh2z6j4oqdYAP2gIhfp0eA7wfXQXWa/ilOk6l741TXPHhTboJm/1\nh45emdwGbhNX4xqD6ZErRRchIqH8Wojra/ipAtBUODztdZpIFQ8/DOdi+3Kf8HYC\nyIOtaRadOl37V4iuJK9yw9r6619W1cENx+9CEMOJS+nztC9DWi7Xd23xDXdKRA2Q\nCLLAnUfzAgMBAAECgf8dZ3e9bajj+8lgEFxU3726b2RD73kjHHUVs4tMco2cKDRJ\nBWhccK2sCMlUy97WcLUoPpCZwiDIWv/VmhYI4TZ5ivOtZHhoBp/5XYD6Gu8qv2SF\n7cjF7pWzL3k+hpfKIM2VNwMK5ahLw3cM74751AdZBUE1FARNFgWypjOnUfDrf4WI\nrMV67lDL4pqJVjgHlAInYgifUclUYkWoFoUZZDw07kGUOKrKO/88EEkFoKrpVp6m\nrZlv3p8bHas/tPYy0NK/eKLqnjZWj54LNCsLuHAwLCddiq3fM4YG17AlJzMZFvwI\nTii2vf1S3UgKEjrd3z4WI9NYf4cijeULPeaBnj0CgYEA2A29sHnZZp70xdvLa2IM\n59X9R4a6tg1QjtOowAvnJ5ki8QIlx9XSQF3UjPkCfQtzKXS75tvz4Oe05C6QmFye\n10mjPxDt5owaBFB54moutZwLogpZ+UuwU1YUgkwqIZyhlXkgnW9HJKN0/nk3Nhta\n6zTVHG4cRzN0Dd6zY3O5T78CgYEAzi4s54vuSRPJ3qegr98wEk6O2yYzqw2qq4Pd\n/4QaLfyV6qa1W18FhWq6gwW6EPHQs3Btfh+8GKM1Q2nw5hMgKjU9Ayu9QFqI8uk3\nevpFXLFZNja6Ts0WxM7j7Sv3a1if249jUP/96cgM2/O5/TFV2Ev79aKjleoP2k2z\nI5RilM0CgYBZApA7vHeMh8BgI4VS4Dpg6RBH/4G8rw+ZSColtMGu1rBGipP2GGle\ni0meKpiT27u+QJGJMuTuq4ci2uxHWSE3oObYfKkGaoHtdRpB5W0I9Rj10T3wLvad\n3sDkTWyuHFGVuylsswOkXJM+o8HTUMHMVR/XbqXHz7LoY++T8YFPEQKBgCHrmtul\nO9it9sI41cjZcTEx13LagBmeL/vzv+wvsZbrPUbTknar1V6zxmeT456yCeHbl0fu\ntKVhBHxIy6cuclY/WABTi9kwi+Na1xPWZN7xFnpC2rfoKdzLJNh6KURx2irnFjHX\nS9DQZr0xBeJP4Y2qQpOQ5FTfoygJLHWoDefpAoGBAL4vKBDd/IJzx8DjOv/qCT8W\nACwiFEK5huLURh9gsZMPjKxuXlmkx/LJEdA11NCJFDM0WzPgGSq5on6/AxQGdsj3\nyFRKkbM30axTeNMXH7tMbHo+a3m2+HGd6kiKiFnht5C4VeXaG5lUpNEXCSY1Mo3i\nSgOOr1Jlgcji99z1M+5J\n-----END PRIVATE KEY-----\n",
        "client_email"                => "firebase-adminsdk-fbsvc@safechain-4daf7.iam.gserviceaccount.com",
        "token_uri"                   => "https://oauth2.googleapis.com/token",
    ];

    // Build JWT
    $header  = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $now     = time();
    $payload = base64_encode(json_encode([
        'iss'   => $serviceAccount['client_email'],
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        'aud'   => $serviceAccount['token_uri'],
        'iat'   => $now,
        'exp'   => $now + 3600,
    ]));

    $unsignedJwt = "$header.$payload";
    openssl_sign($unsignedJwt, $signature, $serviceAccount['private_key'], 'SHA256');
    $jwt = "$unsignedJwt." . base64_encode($signature);

    // Exchange JWT for access token
    $ch = curl_init($serviceAccount['token_uri']);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]),
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    return $response['access_token'] ?? null;
}

function sendPushToAll(string $title, string $body, array $data = []): void {
    global $conn;

    $accessToken = getAccessToken();
    if (!$accessToken) return;

    $projectId = 'safechain-4daf7';
    $url       = "https://fcm.googleapis.com/v1/projects/$projectId/messages:send";

    // Get all FCM tokens
    $result = $conn->query("SELECT fcm_token FROM fcm_tokens");
    if (!$result) return;

    while ($row = $result->fetch_assoc()) {
        $token = $row['fcm_token'];

        $payload = json_encode([
            'message' => [
                'token'        => $token,
                'notification' => [
                    'title' => $title,
                    'body'  => $body,
                ],
                'data'         => array_map('strval', $data),
                'android'      => [
                    'priority'     => 'high',
                    'notification' => [
                        'channel_id'    => 'safechain_channel',
                        'click_action'  => 'FLUTTER_NOTIFICATION_CLICK',
                    ],
                ],
            ],
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                "Authorization: Bearer $accessToken",
            ],
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}
?>