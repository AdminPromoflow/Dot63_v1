<?php

declare(strict_types=1);

require_once __DIR__ . '/../controller/config/database.php';
require_once __DIR__ . '/../model/checkout_payments.php';

final class FakePaymentIntentService
{
    public array $createdParams = [];
    private object $intent;

    public function __construct(string $intentId)
    {
        $this->intent = (object)[
            'id' => $intentId,
            'client_secret' => $intentId . '_secret_test',
            'status' => 'requires_payment_method',
            'amount' => 0,
        ];
    }

    public function create(array $params, array $options): object
    {
        $this->createdParams = ['params' => $params, 'options' => $options];
        $this->intent->amount = (int)$params['amount'];
        return $this->intent;
    }

    public function retrieve(string $id, array $params): object
    {
        return $this->intent;
    }

    public function update(string $id, array $params): object
    {
        $this->intent->amount = (int)$params['amount'];
        return $this->intent;
    }
}

final class FakeStripeClient
{
    public FakePaymentIntentService $paymentIntents;

    public function __construct(string $intentId)
    {
        $this->paymentIntents = new FakePaymentIntentService($intentId);
    }
}

function assertCheckout(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$database = new Database();
$pdo = $database->getConnection();
if (!$pdo instanceof PDO) {
    fwrite(STDERR, "Database is unavailable.\n");
    exit(1);
}

$suffix = bin2hex(random_bytes(5));
$email = "stripe-integration-{$suffix}@example.test";
$intentId = "pi_dot63_{$suffix}";
$eventId = "evt_dot63_{$suffix}";
$lateEventId = "evt_dot63_late_{$suffix}";
$customerId = 0;
$addressId = 0;
$jobId = 0;
$orderId = 0;

try {
    $customer = $pdo->prepare('INSERT INTO customers (name, email) VALUES (:name, :email)');
    $customer->execute([':name' => 'Stripe Integration Test', ':email' => $email]);
    $customerId = (int)$pdo->lastInsertId();

    $fakeStripe = new FakeStripeClient($intentId);
    $payments = new CheckoutPayments($database, $fakeStripe);
    $address = $payments->saveAddress($customerId, [
        'first_name' => 'Stripe',
        'last_name' => 'Tester',
        'company_name' => 'Dot63',
        'phone' => '+44 20 7946 0000',
        'email' => $email,
        'street_address_1' => '18 Market Street',
        'street_address_2' => '',
        'town_city' => 'London',
        'country' => 'GB',
        'postcode' => 'SW1A 1AA',
    ]);
    $addressId = (int)$address['address_id'];

    $job = $pdo->prepare('
        INSERT INTO jobs (status, created_at, notes, quantity, price_per_unit, subtotal)
        VALUES (\'cart\', NOW(), :notes, 2, 10.00, 20.00)
    ');
    $job->execute([':notes' => "Integration test. Customer session: {$email}."]);
    $jobId = (int)$pdo->lastInsertId();

    $prepared = $payments->preparePayment($customerId, $email, $addressId);
    $orderId = (int)$prepared['order_id'];

    assertCheckout($orderId > 0, 'A pending order was not created.');
    assertCheckout((int)$prepared['amount'] === 2000, 'The Stripe amount was not calculated in pence.');
    assertCheckout($prepared['payment_intent_id'] === $intentId, 'The PaymentIntent ID was not stored.');
    assertCheckout(
        ($fakeStripe->paymentIntents->createdParams['options']['idempotency_key'] ?? '') !== '',
        'Stripe idempotency was not configured.'
    );
    assertCheckout(
        ($fakeStripe->paymentIntents->createdParams['params']['receipt_email'] ?? '') === $email,
        'The customer email was not attached to the Stripe receipt notification.'
    );

    $webhook = $payments->processWebhookEvent($eventId, 'payment_intent.succeeded', [
        'id' => $intentId,
        'status' => 'succeeded',
        'amount' => 2000,
        'amount_received' => 2000,
        'currency' => 'gbp',
    ]);
    assertCheckout(($webhook['status'] ?? '') === 'paid', 'The successful webhook did not mark the order paid.');

    $duplicate = $payments->processWebhookEvent($eventId, 'payment_intent.succeeded', [
        'id' => $intentId,
        'status' => 'succeeded',
        'amount_received' => 2000,
        'currency' => 'gbp',
    ]);
    assertCheckout(!empty($duplicate['duplicate']), 'Duplicate webhook delivery was not idempotent.');

    $lateFailure = $payments->processWebhookEvent($lateEventId, 'payment_intent.payment_failed', [
        'id' => $intentId,
        'status' => 'requires_payment_method',
        'amount' => 2000,
        'currency' => 'gbp',
    ]);
    assertCheckout(($lateFailure['status'] ?? '') === 'paid', 'A late webhook downgraded a paid order.');

    $status = $payments->paymentStatus($customerId, $orderId);
    assertCheckout(!empty($status['complete']), 'The paid order did not report completion.');

    $jobStatus = $pdo->query("SELECT status FROM jobs WHERE job_id = {$jobId}")->fetchColumn();
    assertCheckout($jobStatus === 'ordered', 'The paid job did not leave the cart.');

    fwrite(STDOUT, "Stripe checkout integration test passed.\n");
} finally {
    foreach ([$eventId, $lateEventId] as $cleanupEventId) {
        $pdo->prepare('DELETE FROM stripe_webhook_events WHERE event_id = :event_id')
            ->execute([':event_id' => $cleanupEventId]);
    }
    if ($jobId > 0) {
        $pdo->prepare('DELETE FROM jobs WHERE job_id = :job_id')->execute([':job_id' => $jobId]);
    }
    if ($orderId > 0) {
        $pdo->prepare('DELETE FROM orders WHERE order_id = :order_id')->execute([':order_id' => $orderId]);
    }
    if ($addressId > 0) {
        $pdo->prepare('DELETE FROM addresses WHERE address_id = :address_id')->execute([':address_id' => $addressId]);
    }
    if ($customerId > 0) {
        $pdo->prepare('DELETE FROM customers WHERE customer_id = :customer_id')->execute([':customer_id' => $customerId]);
    }
}
