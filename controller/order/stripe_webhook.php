<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/stripe.php';
require_once __DIR__ . '/../../model/checkout_payments.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['received' => false, 'error' => 'Only POST requests are supported.']);
    exit;
}

$webhookSecret = StripeConfig::webhookSecret();
if ($webhookSecret === '' || preg_match('/^whsec_/', $webhookSecret) !== 1) {
    error_log('Stripe webhook secret is not configured.');
    http_response_code(503);
    echo json_encode(['received' => false, 'error' => 'Webhook unavailable.']);
    exit;
}

$autoload = __DIR__ . '/../assets/vendor/autoload.php';
if (!is_file($autoload)) {
    error_log('Stripe PHP SDK is not installed.');
    http_response_code(503);
    echo json_encode(['received' => false, 'error' => 'Webhook unavailable.']);
    exit;
}
require_once $autoload;

$payload = (string)file_get_contents('php://input');
$signature = (string)($_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '');

try {
    $event = \Stripe\Webhook::constructEvent($payload, $signature, $webhookSecret);
} catch (UnexpectedValueException $error) {
    http_response_code(400);
    echo json_encode(['received' => false, 'error' => 'Invalid payload.']);
    exit;
} catch (\Stripe\Exception\SignatureVerificationException $error) {
    http_response_code(400);
    echo json_encode(['received' => false, 'error' => 'Invalid signature.']);
    exit;
}

$supportedEvents = [
    'payment_intent.succeeded',
    'payment_intent.processing',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
];

try {
    if (!in_array((string)$event->type, $supportedEvents, true)) {
        http_response_code(200);
        echo json_encode(['received' => true, 'ignored' => true]);
        exit;
    }

    $intentObject = $event->data->object;
    $intent = method_exists($intentObject, 'toArray')
        ? $intentObject->toArray()
        : json_decode(json_encode($intentObject), true);
    if (!is_array($intent)) {
        throw new RuntimeException('Stripe PaymentIntent data is invalid.');
    }

    $payments = new CheckoutPayments(new Database());
    $result = $payments->processWebhookEvent((string)$event->id, (string)$event->type, $intent);
    http_response_code(200);
    echo json_encode(array_merge(['received' => true], $result), JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    error_log('Stripe webhook processing error: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['received' => false, 'error' => 'Webhook processing failed.']);
}
