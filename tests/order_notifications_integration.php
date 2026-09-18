<?php

declare(strict_types=1);

require_once __DIR__ . '/../controller/config/database.php';
require_once __DIR__ . '/../model/checkout_payments.php';
require_once __DIR__ . '/../model/order_notifications.php';

function assertOrderNotice(bool $ok, string $message): void
{
    if (!$ok) {
        throw new RuntimeException($message);
    }
}

$database = new Database();
$pdo = $database->getConnection();
if (!$pdo instanceof PDO) {
    throw new RuntimeException('A test database is required.');
}
$suffix = bin2hex(random_bytes(6));
$intents = ['pi_notice_ian_' . $suffix, 'pi_notice_multi_' . $suffix];
$created = ['job_details' => [], 'jobs' => [], 'variations' => [], 'products' => [], 'suppliers' => [], 'orders' => []];
$insert = static function (string $table, string $idColumn, array $values) use ($pdo, &$created): int {
    $columns = implode(', ', array_map(static fn($column) => '`' . $column . '`', array_keys($values)));
    $placeholders = implode(', ', array_fill(0, count($values), '?'));
    $pdo->prepare("INSERT INTO `$table` ($columns) VALUES ($placeholders)")->execute(array_values($values));
    $id = (int)$pdo->lastInsertId();
    $created[$table][$id] = $idColumn;
    return $id;
};
$addJob = static function (int $orderId, string $email, string $name) use ($pdo, $insert): int {
    $supplierId = $insert('suppliers', 'supplier_id', ['email' => $email, 'company_name' => $name]);
    $productId = $insert('products', 'product_id', ['name' => $name . ' product', 'supplier_id' => $supplierId]);
    $jobId = $insert('jobs', 'job_id', ['order_id' => $orderId, 'status' => 'cart', 'quantity' => 10, 'price_per_unit' => 2.50, 'subtotal' => 25]);
    // Multiple variations of the same product must not duplicate jobs or recipients.
    for ($i = 0; $i < 2; $i++) {
        $variationId = $insert('variations', 'variation_id', ['product_id' => $productId, 'name' => 'Option ' . $i]);
        $pdo->prepare('INSERT INTO job_details (job_id, variation_id) VALUES (?, ?)')->execute([$jobId, $variationId]);
    }
    return $jobId;
};

try {
    $notifications = new OrderNotifications($database);
    $payments = new CheckoutPayments($database);
    $sent = [];
    $record = static function (array $order, array $recipient) use (&$sent): bool {
        $sent[] = ['order' => $order, 'recipient' => $recipient];
        return true;
    };
    $ianOrder = $insert('orders', 'order_id', [
        'status' => 'payment_pending', 'currency' => 'GBP', 'total_amount' => 25,
        'stripe_payment_intent_id' => $intents[0],
    ]);
    $ianJob = $addJob($ianOrder, ' IAN@KAN-DO-IT.COM ', 'Ian supplier');
    foreach (['payment_pending', 'payment_processing', 'payment_failed', 'payment_canceled', 'payment_review'] as $status) {
        $pdo->prepare('UPDATE orders SET status = ? WHERE order_id = ?')->execute([$status, $ianOrder]);
        assertOrderNotice(!empty($notifications->dispatchForPaidOrder($intents[0], $record)['not_ready']), 'Unconfirmed order sent a notification.');
    }
    assertOrderNotice(count($sent) === 0, 'Emails were sent before payment confirmation.');
    assertOrderNotice(!empty($notifications->dispatchForPaidOrder('pi_unknown_' . $suffix, $record)['not_ready']), 'Unknown payment sent a notification.');

    $eventId = 'evt_notice_paid_' . $suffix;
    $event = ['id' => $intents[0], 'status' => 'succeeded', 'amount_received' => 2500, 'currency' => 'gbp'];
    $payments->processWebhookEvent($eventId, 'payment_intent.succeeded', $event);
    $result = $notifications->dispatchForPaidOrder($intents[0], $record);
    assertOrderNotice($result['sent_count'] === 1, 'Ian supplier received more than one email.');
    assertOrderNotice(count($sent) === 1 && $sent[0]['recipient']['email'] === 'ian@kan-do-it.com', 'Ian address was not normalized.');
    assertOrderNotice(count($sent[0]['recipient']['jobs']) === 1, 'Job was duplicated by its variations.');
    assertOrderNotice((int)$sent[0]['recipient']['jobs'][0]['job_id'] === $ianJob, 'Incorrect job in notification.');
    $payments->processWebhookEvent($eventId, 'payment_intent.succeeded', $event);
    $result = $notifications->dispatchForPaidOrder($intents[0], $record);
    assertOrderNotice($result['already_sent_count'] === 1 && count($sent) === 1, 'Duplicate webhook resent an email.');

    $multiOrder = $insert('orders', 'order_id', [
        'status' => 'payment_pending', 'currency' => 'GBP', 'total_amount' => 100,
        'stripe_payment_intent_id' => $intents[1],
    ]);
    $aJob = $addJob($multiOrder, ' SupplierA@example.test ', 'Supplier A');
    $aSecondJob = $addJob($multiOrder, 'SUPPLIERA@EXAMPLE.TEST', 'Supplier A second account');
    $bJob = $addJob($multiOrder, 'supplierb@example.test', 'Supplier B');
    $anotherIanJob = $addJob($multiOrder, 'Ian@kan-do-it.com', 'Ian second account');
    $payments->processWebhookEvent('evt_notice_multi_' . $suffix, 'payment_intent.succeeded', [
        'id' => $intents[1], 'status' => 'succeeded', 'amount_received' => 10000, 'currency' => 'gbp',
    ]);
    $multiSent = [];
    $attempts = [];
    $sender = static function (array $order, array $recipient) use (&$multiSent, &$attempts): bool {
        $email = $recipient['email'];
        $attempts[$email] = ($attempts[$email] ?? 0) + 1;
        if ($email === 'supplierb@example.test' && $attempts[$email] === 1) {
            return false;
        }
        $multiSent[$email] = $recipient;
        return true;
    };
    $failed = false;
    try {
        $notifications->dispatchForPaidOrder($intents[1], $sender);
    } catch (RuntimeException $error) {
        $failed = true;
    }
    assertOrderNotice($failed && count($multiSent) === 2, 'A failed recipient blocked the other recipients.');
    $retry = $notifications->dispatchForPaidOrder($intents[1], $sender);
    assertOrderNotice($retry['sent_count'] === 1 && $retry['already_sent_count'] === 2, 'Retry did not isolate the failed recipient.');
    assertOrderNotice(count($multiSent) === 3 && $attempts['ian@kan-do-it.com'] === 1 && $attempts['suppliera@example.test'] === 1, 'Shared email or Ian was notified twice.');
    assertOrderNotice(count($multiSent['ian@kan-do-it.com']['jobs']) === 4, 'Ian did not receive all order jobs.');
    assertOrderNotice(array_column($multiSent['suppliera@example.test']['jobs'], 'job_id') === [$aJob, $aSecondJob], 'Supplier A received another supplier\'s jobs.');
    assertOrderNotice(array_column($multiSent['supplierb@example.test']['jobs'], 'job_id') === [$bJob], 'Supplier B received another supplier\'s jobs.');
    $notifications->dispatchForPaidOrder($intents[1], $sender);
    assertOrderNotice(array_sum($attempts) === 4, 'Completed order notifications were resent.');
    fwrite(STDOUT, "Order notification integration passed: confirmed payments, Ian deduplication, multiple suppliers, isolated retries and duplicate webhooks.\n");
} finally {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $pdo->prepare('DELETE FROM stripe_webhook_events WHERE payment_intent_id IN (?, ?)')->execute($intents);
    foreach (array_keys($created['jobs']) as $jobId) {
        $pdo->prepare('DELETE FROM job_details WHERE job_id = ?')->execute([$jobId]);
    }
    foreach ($created as $table => $rows) {
        foreach ($rows as $id => $idColumn) {
            $pdo->prepare("DELETE FROM `$table` WHERE `$idColumn` = ?")->execute([$id]);
        }
    }
}
