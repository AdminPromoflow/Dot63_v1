<?php

declare(strict_types=1);

final class OrderNotifications
{
    private const IAN_EMAIL = 'ian@kan-do-it.com';
    private PDO $pdo;

    public function __construct(Database $database)
    {
        $pdo = $database->getConnection();
        if (!$pdo instanceof PDO) {
            throw new RuntimeException('The order notification database is unavailable.');
        }
        $this->pdo = $pdo;
    }

    public function dispatchForPaidOrder(string $paymentIntentId, callable $sender): array
    {
        $paymentIntentId = trim($paymentIntentId);
        if ($paymentIntentId === '') {
            throw new InvalidArgumentException('A payment intent is required for order notifications.');
        }

        $statement = $this->pdo->prepare('
            SELECT order_id, currency, paid_at
            FROM orders
            WHERE stripe_payment_intent_id = :intent AND status = \'paid\'
            LIMIT 1
        ');
        $statement->execute([':intent' => $paymentIntentId]);
        $order = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$order) {
            return ['sent_count' => 0, 'not_ready' => true];
        }

        $recipients = $this->getRecipients((int)$order['order_id']);
        $result = ['order_id' => (int)$order['order_id'], 'sent_count' => 0, 'already_sent_count' => 0];
        $failed = false;
        foreach ($recipients as $email => $recipient) {
            try {
                $sent = $this->dispatchRecipient($paymentIntentId, $order, $email, $recipient, $sender);
                $result[$sent ? 'sent_count' : 'already_sent_count']++;
            } catch (Throwable $error) {
                // Continue with other recipients; a retry will only send the failed messages.
                $failed = true;
                error_log('Order notification failed for order #' . $order['order_id'] . ': ' . $error->getMessage());
            }
        }
        if ($failed) {
            throw new RuntimeException('One or more order notifications could not be sent.');
        }
        return $result;
    }

    private function getRecipients(int $orderId): array
    {
        $statement = $this->pdo->prepare('
            SELECT DISTINCT
                j.job_id, j.quantity, j.price_per_unit, j.subtotal,
                p.SKU AS product_sku, p.name AS product_name,
                s.supplier_id, s.email AS supplier_email,
                COALESCE(NULLIF(TRIM(s.company_name), \'\'), s.contact_name) AS supplier_name
            FROM jobs j
            LEFT JOIN job_details jd ON jd.job_id = j.job_id
            LEFT JOIN variations v ON v.variation_id = jd.variation_id
            LEFT JOIN products p ON p.product_id = v.product_id
            LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
            WHERE j.order_id = :order_id
            ORDER BY j.job_id, s.supplier_id
        ');
        $statement->execute([':order_id' => $orderId]);
        $recipients = [self::IAN_EMAIL => ['name' => 'Ian Southworth', 'jobs' => []]];
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $jobId = (int)$row['job_id'];
            $job = [
                'job_id' => $jobId,
                'product_name' => (string)($row['product_name'] ?? ''),
                'product_sku' => (string)($row['product_sku'] ?? ''),
                'quantity' => (int)$row['quantity'],
                'price_per_unit' => (float)$row['price_per_unit'],
                'subtotal' => (float)$row['subtotal'],
            ];
            $recipients[self::IAN_EMAIL]['jobs'][$jobId] = $job;
            $email = strtolower(trim((string)($row['supplier_email'] ?? '')));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                error_log('No valid supplier email for job #' . $jobId . ' in order #' . $orderId);
                continue;
            }
            if (!isset($recipients[$email])) {
                $recipients[$email] = ['name' => (string)($row['supplier_name'] ?? 'Supplier'), 'jobs' => []];
            }
            $recipients[$email]['jobs'][$jobId] = $job;
        }
        return $recipients;
    }

    private function dispatchRecipient(
        string $paymentIntentId,
        array $order,
        string $email,
        array $recipient,
        callable $sender
    ): bool {
        try {
            $this->pdo->beginTransaction();
            // Serialize sends for this order, including concurrent webhook deliveries.
            $lock = $this->pdo->prepare('SELECT status FROM orders WHERE order_id = ? FOR UPDATE');
            $lock->execute([(int)$order['order_id']]);
            if ($lock->fetchColumn() !== 'paid') {
                throw new RuntimeException('The order is no longer confirmed as paid.');
            }
            $marker = $this->pdo->prepare('
                INSERT INTO stripe_webhook_events (event_id, event_type, payment_intent_id, processed_at)
                VALUES (:event_id, \'dot63.supplier_order_notification.sent\', :intent, NOW())
            ');
            try {
                $marker->execute([
                    ':event_id' => 'dot63_order_email_' . hash('sha256', $order['order_id'] . ':' . $email),
                    ':intent' => $paymentIntentId,
                ]);
            } catch (PDOException $error) {
                if ((int)($error->errorInfo[1] ?? 0) === 1062) {
                    $this->pdo->rollBack();
                    return false;
                }
                throw $error;
            }
            if (!(bool)$sender($order, [
                'email' => $email,
                'name' => $recipient['name'],
                'jobs' => array_values($recipient['jobs']),
            ])) {
                throw new RuntimeException('The order email was not accepted by the mail server.');
            }
            $this->pdo->commit();
            return true;
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }
}
