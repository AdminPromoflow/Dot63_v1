<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }


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
$created = ['job_details' => [], 'jobs' => [], 'variations' => [], 'products' => [], 'suppliers' => [], 'orders' => [], 'customers' => []];
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
    $jobId = $insert('jobs', 'job_id', [
        'order_id' => $orderId, 'id_order' => 123, 'status' => 'cart',
        'created_at' => '2026-09-29 10:00:00', 'notes' => $name . " notes\nSecond line",
        'quantity' => 10, 'price_per_unit' => 2.50, 'subtotal' => 25,
    ]);
    $pdo->prepare('UPDATE jobs SET pdf_artwork_link = ? WHERE job_id = ?')
        ->execute(['controller/uploads/job-artworks/' . $jobId . '/artwork.pdf', $jobId]);
    // Multiple variations of the same product must not duplicate jobs or recipients.
    for ($i = 0; $i < 2; $i++) {
        $variationId = $insert('variations', 'variation_id', ['product_id' => $productId, 'name' => 'Option ' . $i]);
        $pdo->prepare('INSERT INTO job_details (job_id, variation_id, name, image, price, quantity) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$jobId, $variationId, $i === 0 ? 'Saved option name' : null, 'controller/uploads/option.jpg', $i === 0 ? '2.50' : '0.00', '10']);
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
    $ianCustomer = $insert('customers', 'customer_id', ['name' => 'Ian Customer', 'email' => ' IAN@KAN-DO-IT.COM ']);
    $ianOrder = $insert('orders', 'order_id', [
        'status' => 'payment_pending', 'currency' => 'GBP', 'total_amount' => 25,
        'stripe_payment_intent_id' => $intents[0], 'customer_id' => $ianCustomer,
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
    assertOrderNotice($sent[0]['recipient']['is_customer'] === true && $sent[0]['recipient']['name'] === 'Ian Customer', 'Shared customer/supplier/Ian recipient lost the customer copy.');
    assertOrderNotice(count($sent[0]['recipient']['jobs']) === 1, 'Job was duplicated by its variations.');
    assertOrderNotice((int)$sent[0]['recipient']['jobs'][0]['job_id'] === $ianJob, 'Incorrect job in notification.');
    $job = $sent[0]['recipient']['jobs'][0];
    foreach (['order_id' => $ianOrder, 'id_order' => 123, 'status' => 'ordered', 'created_at' => '2026-09-29 10:00:00',
        'notes' => "Ian supplier notes\nSecond line", 'price_per_unit' => 2.50,
        'pdf_artwork_link' => 'controller/uploads/job-artworks/' . $ianJob . '/artwork.pdf'] as $field => $value) {
        assertOrderNotice((string)$job[$field] === (string)$value, 'Job information missing or changed: ' . $field);
    }
    assertOrderNotice(count($job['details']) === 2, 'Selected options were lost or duplicated.');
    assertOrderNotice($job['details'][0]['name'] === 'Saved option name', 'Stored option name was replaced by the current catalog name.');
    assertOrderNotice($job['details'][1]['name'] === 'Option 1', 'Legacy option name fallback is missing.');
    assertOrderNotice($job['details'][0]['price'] === '2.50' && $job['details'][0]['quantity'] === '10'
        && $job['details'][0]['image'] === 'controller/uploads/option.jpg', 'Stored option details were lost.');
    $payments->processWebhookEvent($eventId, 'payment_intent.succeeded', $event);
    $result = $notifications->dispatchForPaidOrder($intents[0], $record);
    assertOrderNotice($result['already_sent_count'] === 1 && count($sent) === 1, 'Duplicate webhook resent an email.');

    $customerId = $insert('customers', 'customer_id', ['name' => 'Customer Test', 'email' => ' CUSTOMER@example.test ']);
    $multiOrder = $insert('orders', 'order_id', [
        'status' => 'payment_pending', 'currency' => 'GBP', 'total_amount' => 100,
        'stripe_payment_intent_id' => $intents[1], 'customer_id' => $customerId,
    ]);
    $aJob = $addJob($multiOrder, ' SupplierA@example.test ', 'Supplier A');
    $aSecondJob = $addJob($multiOrder, 'SUPPLIERA@EXAMPLE.TEST', 'Supplier A second account');
    $bJob = $addJob($multiOrder, 'supplierb@example.test', 'Supplier B');
    $pdo->prepare('UPDATE jobs SET pdf_artwork_link = NULL WHERE job_id = ?')->execute([$bJob]);
    $anotherIanJob = $addJob($multiOrder, 'Ian@kan-do-it.com', 'Ian second account');
    $payments->processWebhookEvent('evt_notice_multi_' . $suffix, 'payment_intent.succeeded', [
        'id' => $intents[1], 'status' => 'succeeded', 'amount_received' => 10000, 'currency' => 'gbp',
    ]);
    $multiSent = [];
    $attempts = [];
    $sender = static function (array $order, array $recipient) use (&$multiSent, &$attempts): bool {
        $email = $recipient['email'];
        $attempts[$email] = ($attempts[$email] ?? 0) + 1;
        if (in_array($email, ['supplierb@example.test', 'customer@example.test'], true) && $attempts[$email] === 1) {
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
    assertOrderNotice($retry['sent_count'] === 2 && $retry['already_sent_count'] === 2, 'Retry did not isolate the failed recipients.');
    assertOrderNotice(count($multiSent) === 4 && $attempts['ian@kan-do-it.com'] === 1 && $attempts['suppliera@example.test'] === 1, 'Shared email or Ian was notified twice.');
    $customerCopy = $multiSent['customer@example.test'];
    assertOrderNotice($customerCopy['is_customer'] === true && $customerCopy['name'] === 'Customer Test', 'Customer recipient was not identified correctly.');
    assertOrderNotice(array_column($customerCopy['jobs'], 'job_id') === [$aJob, $aSecondJob, $bJob, $anotherIanJob], 'Customer did not receive exactly their own order jobs.');
    assertOrderNotice($customerCopy['jobs'] === $multiSent['ian@kan-do-it.com']['jobs'], 'Customer copy lost job details or artwork links.');
    $marker = $pdo->prepare('SELECT event_type FROM stripe_webhook_events WHERE event_id = ?');
    $marker->execute(['dot63_order_email_' . hash('sha256', $multiOrder . ':customer@example.test')]);
    assertOrderNotice($marker->fetchColumn() === 'dot63.customer_order_notification.sent', 'Customer delivery marker is missing.');
    assertOrderNotice(count($multiSent['ian@kan-do-it.com']['jobs']) === 4, 'Ian did not receive all order jobs.');
    assertOrderNotice(array_column($multiSent['suppliera@example.test']['jobs'], 'job_id') === [$aJob, $aSecondJob], 'Supplier A received another supplier\'s jobs.');
    assertOrderNotice(array_column($multiSent['supplierb@example.test']['jobs'], 'job_id') === [$bJob], 'Supplier B received another supplier\'s jobs.');
    assertOrderNotice($multiSent['supplierb@example.test']['jobs'][0]['pdf_artwork_link'] === '', 'Job without artwork did not preserve the missing PDF.');
    foreach ($multiSent['suppliera@example.test']['jobs'] as $job) {
        assertOrderNotice($job['pdf_artwork_link'] === 'controller/uploads/job-artworks/' . $job['job_id'] . '/artwork.pdf', 'Supplier received another job\'s artwork.');
        assertOrderNotice(count($job['details']) === 2 && (int)$job['details'][0]['job_id'] === $job['job_id'], 'Supplier received another job\'s selected options.');
    }
    $notifications->dispatchForPaidOrder($intents[1], $sender);
    assertOrderNotice(array_sum($attempts) === 6, 'Completed order notifications were resent.');
    $pdo->prepare('UPDATE customers SET email = ? WHERE customer_id = ?')->execute(['invalid-address', $customerId]);
    $invalidCustomer = $notifications->dispatchForPaidOrder($intents[1], $sender);
    assertOrderNotice($invalidCustomer['sent_count'] === 0 && $invalidCustomer['already_sent_count'] === 3, 'Invalid customer email disrupted supplier notifications.');
    $pdo->prepare('UPDATE orders SET customer_id = NULL WHERE order_id = ?')->execute([$multiOrder]);
    $legacyOrder = $notifications->dispatchForPaidOrder($intents[1], $sender);
    assertOrderNotice($legacyOrder['sent_count'] === 0 && $legacyOrder['already_sent_count'] === 3, 'Legacy order without a customer disrupted notifications.');
    fwrite(STDOUT, "Order notification integration passed: confirmed payments, customer artwork copy, recipient isolation/deduplication, missing customers, isolated retries and duplicate webhooks.\n");
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
