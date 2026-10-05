<?php
declare(strict_types=1);

// Include this helper only AFTER SonaMovie verifies settlement with AfriPay.
// Do not call it with browser form fields or an unverified callback body.
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath((string) $_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(404);
    exit;
}

/**
 * $settlement must contain the provider-confirmed client_token, transaction_id,
 * amount, and currency. Handle exceptions by retrying through your existing
 * durable payment-event queue; the caller should not silently discard failures.
 */
function forwardMedLicensePayment(array $settlement): array
{
    $token = (string) ($settlement['client_token'] ?? '');
    if (!str_starts_with($token, 'ML_')) {
        return ['forwarded' => false, 'reason' => 'not_medlicense'];
    }

    $transactionId = (string) ($settlement['transaction_id'] ?? '');
    $amount = $settlement['amount'] ?? null;
    $currency = strtoupper((string) ($settlement['currency'] ?? ''));
    if (!preg_match('/^ML_[0-9a-f-]{36}$/i', $token) || $transactionId === '' ||
        strlen($transactionId) > 200 || !is_numeric($amount) || (float) $amount <= 0 ||
        !preg_match('/^[A-Z]{3}$/', $currency)) {
        throw new InvalidArgumentException('Missing verified settlement details');
    }

    $endpoint = getenv('MEDLICENSE_WEBHOOK_URL') ?: '';
    $secret = getenv('PAYMENT_WEBHOOK_SECRET') ?: '';
    if ($secret === '' || parse_url($endpoint, PHP_URL_SCHEME) !== 'https') {
        throw new RuntimeException('MedLicense webhook configuration is missing');
    }

    $body = json_encode([
        'client_token' => $token,
        'status' => 'success',
        'transaction_id' => $transactionId,
        'amount' => $amount,
        'currency' => $currency,
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
        return json_decode($response, true, 512, JSON_THROW_ON_ERROR);
    } finally {
        curl_close($request);
    }
}