<?php
declare(strict_types=1);

/*
 * MedLicense relay for a site that already receives AfriPay callbacks.
 *
 * MedLicense orders use client_token "ML_<payment UUID>". Put these two lines
 * at the very top of the existing AfriPay callback handler, before it touches
 * its own orders:
 *
 *     require_once __DIR__ . '/medlicense-forward.php';
 *     relayMedLicenseAfriPayCallback(); // exits for ML_ payments, returns otherwise
 *
 * Configuration (environment variables or define() constants):
 *   MEDLICENSE_WEBHOOK_URL     https://<medlicense-domain>/api/payments/webhook
 *   MEDLICENSE_WEBHOOK_SECRET  same value as MedLicense's PAYMENT_WEBHOOK_SECRET
 *   AFRIPAY_CALLBACK_KEY       optional; when set, the AfriPay callback URL must
 *                              carry ?key=<value>, so strangers cannot post
 *                              fake "success" callbacks through this relay
 */

if (isset($_SERVER['SCRIPT_FILENAME']) && realpath((string) $_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(404);
    exit;
}

function medlicenseConfig(string $name): string
{
    if (defined($name)) {
        return (string) constant($name);
    }
    $value = getenv($name);
    return $value === false ? '' : trim($value);
}

/**
 * Forwards the current AfriPay callback to MedLicense when its client_token
 * starts with ML_, answers AfriPay, and exits. Returns without output for any
 * other payment so the host site processes its own orders as before.
 */
function relayMedLicenseAfriPayCallback(): void
{
    $data = $_POST;
    if (!$data) {
        $json = json_decode((string) file_get_contents('php://input'), true);
        $data = is_array($json) ? $json : [];
    }
    $token = trim((string) ($data['client_token'] ?? ''));
    if (!str_starts_with($token, 'ML_')) {
        return;
    }

    header('Content-Type: application/json');
    $callbackKey = medlicenseConfig('AFRIPAY_CALLBACK_KEY');
    if ($callbackKey !== '' && !hash_equals($callbackKey, (string) ($_GET['key'] ?? ''))) {
        http_response_code(401);
        echo json_encode(['error' => 'invalid callback key']);
        exit;
    }

    try {
        $result = forwardMedLicensePayment([
            'client_token'   => $token,
            'status'         => (string) ($data['status'] ?? ''),
            'transaction_id' => (string) ($data['transaction_ref'] ?? $data['transaction_id'] ?? ''),
            'amount'         => $data['amount'] ?? null,
            'currency'       => (string) ($data['currency'] ?? ''),
            'payment_method' => (string) ($data['payment_method'] ?? ''),
        ]);
        http_response_code(200);
        echo json_encode(['received' => true, 'medlicense' => $result]);
    } catch (Throwable $e) {
        // A non-200 answer lets AfriPay retry the callback.
        error_log('[MedLicense relay] ' . $e->getMessage());
        http_response_code(502);
        echo json_encode(['error' => 'medlicense forward failed']);
    }
    exit;
}

/**
 * Sends one AfriPay settlement to MedLicense, signed with HMAC-SHA256.
 * MedLicense ignores non-paid statuses and only activates a plan when the
 * amount and currency match the original order.
 */
function forwardMedLicensePayment(array $settlement): array
{
    $token = (string) ($settlement['client_token'] ?? '');
    if (!preg_match('/^ML_[0-9a-f-]{36}$/i', $token)) {
        throw new InvalidArgumentException('Invalid MedLicense client_token');
    }

    $endpoint = medlicenseConfig('MEDLICENSE_WEBHOOK_URL');
    $secret = medlicenseConfig('MEDLICENSE_WEBHOOK_SECRET') ?: medlicenseConfig('PAYMENT_WEBHOOK_SECRET');
    if ($secret === '' || parse_url($endpoint, PHP_URL_SCHEME) !== 'https') {
        throw new RuntimeException('MedLicense webhook configuration is missing');
    }

    $body = json_encode([
        'client_token'   => $token,
        'status'         => (string) ($settlement['status'] ?? ''),
        'transaction_id' => (string) ($settlement['transaction_id'] ?? ''),
        'amount'         => $settlement['amount'] ?? null,
        'currency'       => strtoupper((string) ($settlement['currency'] ?? '')),
        'payment_method' => (string) ($settlement['payment_method'] ?? ''),
    ], JSON_THROW_ON_ERROR);
    $signature = hash_hmac('sha256', $body, $secret);
    $request = curl_init($endpoint);
    if ($request === false) {
        throw new RuntimeException('Could not initialize webhook request');
    }
    try {
        curl_setopt_array($request, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-afripay-signature: sha256=' . $signature,
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $response = curl_exec($request);
        $status = (int) curl_getinfo($request, CURLINFO_HTTP_CODE);
        if ($response === false || $status !== 200) {
            // Never include secrets or the raw provider response in an exception.
            throw new RuntimeException('MedLicense webhook failed with HTTP ' . $status);
        }
        return json_decode((string) $response, true, 512, JSON_THROW_ON_ERROR);
    } finally {
        curl_close($request);
    }
}
