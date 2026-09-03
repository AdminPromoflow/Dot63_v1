<?php

declare(strict_types=1);

class CheckoutPaymentException extends RuntimeException
{
    private int $httpStatus;
    private string $publicCode;

    public function __construct(string $message, int $httpStatus = 400, string $publicCode = 'CHECKOUT_ERROR')
    {
        parent::__construct($message);
        $this->httpStatus = $httpStatus;
        $this->publicCode = $publicCode;
    }

    public function httpStatus(): int
    {
        return $this->httpStatus;
    }

    public function publicCode(): string
    {
        return $this->publicCode;
    }
}

class CheckoutPayments
{
    private PDO $pdo;
    private $stripe;

    public function __construct(Database $database, $stripeClient = null)
    {
        $pdo = $database->getConnection();
        if (!$pdo instanceof PDO) {
            throw new CheckoutPaymentException('The database connection is unavailable.', 503, 'DATABASE_UNAVAILABLE');
        }

        $this->pdo = $pdo;
        $this->stripe = $stripeClient;
    }

    public function saveAddress(int $customerId, array $input): array
    {
        if ($customerId <= 0) {
            throw new CheckoutPaymentException('Please log in before adding an address.', 401, 'AUTH_REQUIRED');
        }

        $address = $this->validatedAddress($input);
        $statement = $this->pdo->prepare('
            INSERT INTO addresses
                (first_name, last_name, company_name, phone, email, street_address_1,
                 street_address_2, town_city, country, postcode, customer_id)
            VALUES
                (:first_name, :last_name, :company_name, :phone, :email, :street_address_1,
                 :street_address_2, :town_city, :country, :postcode, :customer_id)
        ');
        $statement->execute([
            ':first_name' => $address['first_name'],
            ':last_name' => $address['last_name'],
            ':company_name' => $address['company_name'],
            ':phone' => $address['phone'],
            ':email' => $address['email'],
            ':street_address_1' => $address['street_address_1'],
            ':street_address_2' => $address['street_address_2'],
            ':town_city' => $address['town_city'],
            ':country' => $address['country'],
            ':postcode' => $address['postcode'],
            ':customer_id' => $customerId,
        ]);

        $addressId = (int)$this->pdo->lastInsertId();
        if ($addressId <= 0) {
            throw new CheckoutPaymentException('The address could not be saved.', 500, 'ADDRESS_SAVE_FAILED');
        }

        return array_merge($address, [
            'address_id' => $addressId,
            'customer_id' => $customerId,
        ]);
    }

    public function preparePayment(
        int $customerId,
        string $customerEmail,
        int $addressId,
        string $promotionCode = '',
        int $preferredOrderId = 0
    ): array {
        if ($this->stripe === null) {
            throw new CheckoutPaymentException('Stripe is not configured on the server.', 503, 'STRIPE_NOT_CONFIGURED');
        }
        if ($customerId <= 0 || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
            throw new CheckoutPaymentException('Please log in before starting payment.', 401, 'AUTH_REQUIRED');
        }
        if ($addressId <= 0) {
            throw new CheckoutPaymentException('Select a delivery address before payment.', 422, 'ADDRESS_REQUIRED');
        }

        $promotionCode = strtoupper($this->limitedText($promotionCode, 50));
        $prepared = $this->prepareOrderRecord(
            $customerId,
            strtolower(trim($customerEmail)),
            $addressId,
            $promotionCode,
            $preferredOrderId
        );

        $intent = $this->createOrUpdateIntent($prepared, strtolower(trim($customerEmail)));
        $this->recordIntent($prepared['order_id'], $intent);

        return [
            'order_id' => $prepared['order_id'],
            'client_secret' => (string)$intent->client_secret,
            'payment_intent_id' => (string)$intent->id,
            'payment_status' => (string)$intent->status,
            'already_paid' => (string)$intent->status === 'succeeded',
            'currency' => strtoupper($prepared['currency']),
            'subtotal' => $this->pounds($prepared['subtotal_pence']),
            'discount' => $this->pounds($prepared['discount_pence']),
            'delivery' => $this->pounds($prepared['shipping_pence']),
            'total' => $this->pounds($prepared['total_pence']),
            'amount' => $prepared['total_pence'],
            'promotion_code' => $promotionCode,
        ];
    }

    public function paymentStatus(int $customerId, int $orderId): array
    {
        if ($customerId <= 0 || $orderId <= 0) {
            throw new CheckoutPaymentException('This order is invalid.', 422, 'INVALID_ORDER');
        }

        $statement = $this->pdo->prepare('
            SELECT
                order_id, status, currency, subtotal, shipping_total, discount_total,
                total_amount, stripe_payment_status, stripe_payment_intent_id, paid_at
            FROM orders
            WHERE order_id = :order_id AND customer_id = :customer_id
            LIMIT 1
        ');
        $statement->execute([
            ':order_id' => $orderId,
            ':customer_id' => $customerId,
        ]);
        $order = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$order) {
            throw new CheckoutPaymentException('This order could not be found.', 404, 'ORDER_NOT_FOUND');
        }

        return [
            'order_id' => (int)$order['order_id'],
            'status' => (string)$order['status'],
            'payment_status' => (string)($order['stripe_payment_status'] ?? ''),
            'payment_intent_id' => (string)($order['stripe_payment_intent_id'] ?? ''),
            'currency' => strtoupper((string)$order['currency']),
            'subtotal' => (float)$order['subtotal'],
            'discount' => (float)$order['discount_total'],
            'delivery' => (float)$order['shipping_total'],
            'total' => (float)$order['total_amount'],
            'paid_at' => $order['paid_at'],
            'complete' => (string)$order['status'] === 'paid',
        ];
    }

    public function processWebhookEvent(string $eventId, string $eventType, array $intent): array
    {
        $eventId = trim($eventId);
        $eventType = trim($eventType);
        $intentId = trim((string)($intent['id'] ?? ''));
        if ($eventId === '' || $eventType === '' || $intentId === '') {
            throw new CheckoutPaymentException('The Stripe event is incomplete.', 400, 'INVALID_WEBHOOK_EVENT');
        }

        try {
            $this->pdo->beginTransaction();
            $eventStatement = $this->pdo->prepare('
                INSERT INTO stripe_webhook_events (event_id, event_type, payment_intent_id, processed_at)
                VALUES (:event_id, :event_type, :payment_intent_id, NOW())
            ');
            try {
                $eventStatement->execute([
                    ':event_id' => $eventId,
                    ':event_type' => $eventType,
                    ':payment_intent_id' => $intentId,
                ]);
            } catch (PDOException $error) {
                if ((string)$error->getCode() === '23000') {
                    $this->pdo->rollBack();
                    return ['duplicate' => true, 'processed' => true];
                }
                throw $error;
            }

            $orderStatement = $this->pdo->prepare('
                SELECT order_id, status, currency, total_amount, stripe_payment_intent_id
                FROM orders
                WHERE stripe_payment_intent_id = :payment_intent_id
                LIMIT 1
                FOR UPDATE
            ');
            $orderStatement->execute([':payment_intent_id' => $intentId]);
            $order = $orderStatement->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                $this->pdo->commit();
                return ['ignored' => true, 'processed' => true];
            }

            $orderId = (int)$order['order_id'];
            $stripeStatus = trim((string)($intent['status'] ?? ''));
            $orderStatus = (string)$order['status'];

            if ($orderStatus === 'paid' && $eventType !== 'payment_intent.succeeded') {
                $this->pdo->commit();
                return [
                    'processed' => true,
                    'ignored' => true,
                    'order_id' => $orderId,
                    'status' => 'paid',
                ];
            }

            if ($eventType === 'payment_intent.succeeded') {
                $expectedAmount = (int)round(((float)$order['total_amount']) * 100);
                $receivedAmount = (int)($intent['amount_received'] ?? $intent['amount'] ?? 0);
                $expectedCurrency = strtolower((string)$order['currency']);
                $receivedCurrency = strtolower((string)($intent['currency'] ?? ''));

                if ($expectedAmount !== $receivedAmount || $expectedCurrency !== $receivedCurrency) {
                    $orderStatus = 'payment_review';
                } else {
                    $orderStatus = 'paid';
                    $this->pdo->prepare('
                        UPDATE jobs
                        SET status = \'ordered\'
                        WHERE order_id = :order_id AND status = \'cart\'
                    ')->execute([':order_id' => $orderId]);
                }
            } elseif ($eventType === 'payment_intent.processing') {
                $orderStatus = 'payment_processing';
            } elseif ($eventType === 'payment_intent.payment_failed') {
                $orderStatus = 'payment_failed';
            } elseif ($eventType === 'payment_intent.canceled') {
                $orderStatus = 'payment_canceled';
            }

            $update = $this->pdo->prepare('
                UPDATE orders
                SET status = :status,
                    stripe_payment_status = :stripe_payment_status,
                    paid_at = CASE WHEN :paid = 1 THEN COALESCE(paid_at, NOW()) ELSE paid_at END,
                    updated_at = NOW()
                WHERE order_id = :order_id
            ');
            $update->execute([
                ':status' => $orderStatus,
                ':stripe_payment_status' => $stripeStatus,
                ':paid' => $orderStatus === 'paid' ? 1 : 0,
                ':order_id' => $orderId,
            ]);

            $this->pdo->commit();
            return [
                'processed' => true,
                'order_id' => $orderId,
                'status' => $orderStatus,
            ];
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }

    private function prepareOrderRecord(
        int $customerId,
        string $customerEmail,
        int $addressId,
        string $promotionCode,
        int $preferredOrderId
    ): array {
        try {
            $this->pdo->beginTransaction();

            $addressStatement = $this->pdo->prepare('
                SELECT address_id, first_name, last_name, company_name, phone, email,
                       street_address_1, street_address_2, town_city, country, postcode, customer_id
                FROM addresses
                WHERE address_id = :address_id AND customer_id = :customer_id
                LIMIT 1
                FOR UPDATE
            ');
            $addressStatement->execute([
                ':address_id' => $addressId,
                ':customer_id' => $customerId,
            ]);
            $address = $addressStatement->fetch(PDO::FETCH_ASSOC);
            if (!$address) {
                throw new CheckoutPaymentException('The selected delivery address was not found.', 404, 'ADDRESS_NOT_FOUND');
            }

            $cartStatement = $this->pdo->prepare('
                SELECT job_id, quantity, CAST(subtotal AS DECIMAL(12,2)) AS subtotal
                FROM jobs
                WHERE status = \'cart\'
                  AND LOWER(TRIM(SUBSTRING_INDEX(notes, \'Customer session:\', -1))) = :cart_owner
                ORDER BY job_id ASC
                FOR UPDATE
            ');
            $cartStatement->execute([':cart_owner' => $this->ownerToken($customerEmail)]);
            $cartItems = $cartStatement->fetchAll(PDO::FETCH_ASSOC);
            if (empty($cartItems)) {
                throw new CheckoutPaymentException('Your shopping cart is empty.', 422, 'EMPTY_CART');
            }

            $jobIds = [];
            $subtotalPence = 0;
            $fingerprintRows = [];
            foreach ($cartItems as $item) {
                $jobId = (int)$item['job_id'];
                $quantity = max(1, (int)$item['quantity']);
                $linePence = max(0, (int)round(((float)$item['subtotal']) * 100));
                $jobIds[] = $jobId;
                $subtotalPence += $linePence;
                $fingerprintRows[] = [$jobId, $quantity, $linePence];
            }

            $discountPence = $this->promotionDiscountPence(
                $promotionCode,
                $jobIds,
                $subtotalPence
            );
            $shippingPence = 0;
            $totalPence = max(0, $subtotalPence - $discountPence + $shippingPence);
            if ($totalPence <= 0 || $totalPence > 99999999) {
                throw new CheckoutPaymentException('The order total cannot be processed by Stripe.', 422, 'INVALID_AMOUNT');
            }

            $fingerprint = hash('sha256', json_encode([
                'items' => $fingerprintRows,
                'promotion' => $promotionCode,
                'address_id' => $addressId,
                'total' => $totalPence,
            ], JSON_UNESCAPED_SLASHES));

            $order = $this->findReusableOrder($customerId, $customerEmail, $preferredOrderId);
            $shippingJson = json_encode($address, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($shippingJson === false) {
                throw new CheckoutPaymentException('The delivery address could not be prepared.', 500, 'ADDRESS_ENCODING_FAILED');
            }

            if (!$order) {
                $idempotencyKey = 'dot63-' . bin2hex(random_bytes(18));
                $insert = $this->pdo->prepare('
                    INSERT INTO orders
                        (status, created_at, currency, subtotal, shipping_total, customer_id,
                         address_id, shipping_address_json, promotion_code, discount_total,
                         total_amount, cart_fingerprint, stripe_payment_status,
                         stripe_idempotency_key, updated_at)
                    VALUES
                        (\'payment_pending\', :created_at, \'GBP\', :subtotal, :shipping_total,
                         :customer_id, :address_id, :shipping_address_json, :promotion_code,
                         :discount_total, :total_amount, :cart_fingerprint,
                         \'requires_payment_method\', :stripe_idempotency_key, NOW())
                ');
                $insert->execute([
                    ':created_at' => date('Y-m-d H:i:s'),
                    ':subtotal' => $this->moneyString($subtotalPence),
                    ':shipping_total' => $this->moneyString($shippingPence),
                    ':customer_id' => $customerId,
                    ':address_id' => $addressId,
                    ':shipping_address_json' => $shippingJson,
                    ':promotion_code' => $promotionCode !== '' ? $promotionCode : null,
                    ':discount_total' => $this->moneyString($discountPence),
                    ':total_amount' => $this->moneyString($totalPence),
                    ':cart_fingerprint' => $fingerprint,
                    ':stripe_idempotency_key' => $idempotencyKey,
                ]);
                $orderId = (int)$this->pdo->lastInsertId();
                $paymentIntentId = '';
            } else {
                $orderId = (int)$order['order_id'];
                $paymentIntentId = trim((string)($order['stripe_payment_intent_id'] ?? ''));
                $idempotencyKey = trim((string)($order['stripe_idempotency_key'] ?? ''));
                if ($idempotencyKey === '') {
                    $idempotencyKey = 'dot63-' . bin2hex(random_bytes(18));
                }

                $update = $this->pdo->prepare('
                    UPDATE orders
                    SET status = \'payment_pending\', currency = \'GBP\', subtotal = :subtotal,
                        shipping_total = :shipping_total, address_id = :address_id,
                        shipping_address_json = :shipping_address_json,
                        promotion_code = :promotion_code, discount_total = :discount_total,
                        total_amount = :total_amount, cart_fingerprint = :cart_fingerprint,
                        stripe_idempotency_key = :stripe_idempotency_key, updated_at = NOW()
                    WHERE order_id = :order_id AND customer_id = :customer_id
                ');
                $update->execute([
                    ':subtotal' => $this->moneyString($subtotalPence),
                    ':shipping_total' => $this->moneyString($shippingPence),
                    ':address_id' => $addressId,
                    ':shipping_address_json' => $shippingJson,
                    ':promotion_code' => $promotionCode !== '' ? $promotionCode : null,
                    ':discount_total' => $this->moneyString($discountPence),
                    ':total_amount' => $this->moneyString($totalPence),
                    ':cart_fingerprint' => $fingerprint,
                    ':stripe_idempotency_key' => $idempotencyKey,
                    ':order_id' => $orderId,
                    ':customer_id' => $customerId,
                ]);
            }

            if ($orderId <= 0) {
                throw new CheckoutPaymentException('The pending order could not be created.', 500, 'ORDER_CREATE_FAILED');
            }

            $this->pdo->prepare('
                UPDATE jobs SET order_id = NULL
                WHERE order_id = :order_id AND status = \'cart\'
            ')->execute([':order_id' => $orderId]);
            $placeholders = implode(',', array_fill(0, count($jobIds), '?'));
            $this->pdo->prepare("UPDATE jobs SET order_id = ? WHERE status = 'cart' AND job_id IN ($placeholders)")
                ->execute(array_merge([$orderId], $jobIds));

            $this->pdo->commit();
            return [
                'order_id' => $orderId,
                'customer_id' => $customerId,
                'address' => $address,
                'currency' => 'gbp',
                'subtotal_pence' => $subtotalPence,
                'discount_pence' => $discountPence,
                'shipping_pence' => $shippingPence,
                'total_pence' => $totalPence,
                'fingerprint' => $fingerprint,
                'payment_intent_id' => $paymentIntentId,
                'idempotency_key' => $idempotencyKey,
            ];
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }

    private function findReusableOrder(int $customerId, string $customerEmail, int $preferredOrderId): ?array
    {
        if ($preferredOrderId > 0) {
            $preferred = $this->pdo->prepare('
                SELECT order_id, stripe_payment_intent_id, stripe_idempotency_key
                FROM orders
                WHERE order_id = :order_id AND customer_id = :customer_id
                  AND status IN (\'payment_pending\', \'payment_failed\', \'payment_canceled\')
                LIMIT 1
                FOR UPDATE
            ');
            $preferred->execute([
                ':order_id' => $preferredOrderId,
                ':customer_id' => $customerId,
            ]);
            $order = $preferred->fetch(PDO::FETCH_ASSOC);
            if ($order) {
                return $order;
            }
        }

        $statement = $this->pdo->prepare('
            SELECT DISTINCT o.order_id, o.stripe_payment_intent_id, o.stripe_idempotency_key
            FROM orders o
            INNER JOIN jobs j ON j.order_id = o.order_id
            WHERE o.customer_id = :customer_id
              AND o.status IN (\'payment_pending\', \'payment_failed\', \'payment_canceled\')
              AND j.status = \'cart\'
              AND LOWER(TRIM(SUBSTRING_INDEX(j.notes, \'Customer session:\', -1))) = :cart_owner
            ORDER BY o.order_id DESC
            LIMIT 1
            FOR UPDATE
        ');
        $statement->execute([
            ':customer_id' => $customerId,
            ':cart_owner' => $this->ownerToken($customerEmail),
        ]);
        $order = $statement->fetch(PDO::FETCH_ASSOC);
        return $order ?: null;
    }

    private function createOrUpdateIntent(array &$prepared, string $customerEmail)
    {
        $paymentIntentId = $prepared['payment_intent_id'];
        $intent = null;

        if ($paymentIntentId !== '') {
            try {
                $intent = $this->stripe->paymentIntents->retrieve($paymentIntentId, []);
            } catch (\Stripe\Exception\InvalidRequestException $error) {
                if ((int)$error->getHttpStatus() !== 404) {
                    throw $error;
                }
            }
        }

        if ($intent && (string)$intent->status === 'succeeded') {
            return $intent;
        }

        if ($intent && in_array((string)$intent->status, ['processing', 'requires_action'], true)) {
            if ((int)$intent->amount !== $prepared['total_pence']) {
                throw new CheckoutPaymentException(
                    'This payment is already being confirmed. Wait for its result before changing the order.',
                    409,
                    'PAYMENT_IN_PROGRESS'
                );
            }
            return $intent;
        }

        $params = [
            'amount' => $prepared['total_pence'],
            'currency' => $prepared['currency'],
            'description' => sprintf('PromoFlow order #%d', $prepared['order_id']),
            'receipt_email' => $customerEmail,
            'metadata' => [
                'order_id' => (string)$prepared['order_id'],
                'customer_id' => (string)$prepared['customer_id'],
                'cart_fingerprint' => $prepared['fingerprint'],
            ],
            'shipping' => $this->stripeShippingAddress($prepared['address']),
        ];

        if ($intent && in_array((string)$intent->status, ['requires_payment_method', 'requires_confirmation'], true)) {
            return $this->stripe->paymentIntents->update((string)$intent->id, $params);
        }

        if ($intent && (string)$intent->status === 'canceled') {
            $prepared['idempotency_key'] = 'dot63-' . bin2hex(random_bytes(18));
            $clear = $this->pdo->prepare('
                UPDATE orders
                SET stripe_payment_intent_id = NULL,
                    stripe_idempotency_key = :idempotency_key,
                    stripe_payment_status = \'requires_payment_method\',
                    updated_at = NOW()
                WHERE order_id = :order_id
            ');
            $clear->execute([
                ':idempotency_key' => $prepared['idempotency_key'],
                ':order_id' => $prepared['order_id'],
            ]);
        }

        $params['payment_method_types'] = ['card'];
        return $this->stripe->paymentIntents->create($params, [
            'idempotency_key' => $prepared['idempotency_key'],
        ]);
    }

    private function recordIntent(int $orderId, $intent): void
    {
        $statement = $this->pdo->prepare('
            UPDATE orders
            SET stripe_payment_intent_id = :payment_intent_id,
                stripe_payment_status = :payment_status,
                updated_at = NOW()
            WHERE order_id = :order_id
        ');
        $statement->execute([
            ':payment_intent_id' => (string)$intent->id,
            ':payment_status' => (string)$intent->status,
            ':order_id' => $orderId,
        ]);
    }

    private function promotionDiscountPence(string $code, array $jobIds, int $subtotalPence): int
    {
        if ($code === '') {
            return 0;
        }

        $placeholders = implode(',', array_fill(0, count($jobIds), '?'));
        $statement = $this->pdo->prepare("
            SELECT promotion_id, discount_type, discount_value
            FROM promotions promotion
            WHERE UPPER(TRIM(promotion.name)) = ?
              AND (promotion.start_at IS NULL OR promotion.start_at <= NOW())
              AND (promotion.end_at IS NULL OR promotion.end_at >= NOW())
              AND (
                  NOT EXISTS (
                      SELECT 1 FROM variation_promotions configured
                      WHERE configured.promotion_id = promotion.promotion_id
                  )
                  OR EXISTS (
                      SELECT 1
                      FROM variation_promotions applicable
                      INNER JOIN job_details selected_detail
                          ON selected_detail.variation_id = applicable.variation_id
                      WHERE applicable.promotion_id = promotion.promotion_id
                        AND selected_detail.job_id IN ($placeholders)
                  )
              )
            ORDER BY promotion.promotion_id DESC
            LIMIT 1
        ");
        $statement->execute(array_merge([$code], $jobIds));
        $promotion = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$promotion) {
            throw new CheckoutPaymentException('This promotional code is no longer valid.', 422, 'INVALID_PROMOTION');
        }

        $type = strtolower(trim((string)$promotion['discount_type']));
        $value = max(0, (float)$promotion['discount_value']);
        if (in_array($type, ['percentage', 'percent', '%'], true)) {
            return min($subtotalPence, (int)round($subtotalPence * (min(100, $value) / 100)));
        }

        return min($subtotalPence, (int)round($value * 100));
    }

    private function validatedAddress(array $input): array
    {
        $fields = [
            'first_name' => true,
            'last_name' => true,
            'company_name' => false,
            'phone' => true,
            'email' => true,
            'street_address_1' => true,
            'street_address_2' => false,
            'town_city' => true,
            'country' => true,
            'postcode' => true,
        ];
        $address = [];
        foreach ($fields as $field => $required) {
            $value = trim((string)($input[$field] ?? ''));
            if ($required && $value === '') {
                throw new CheckoutPaymentException('Complete all required address fields.', 422, 'INVALID_ADDRESS');
            }
            if ($this->textLength($value) > 50) {
                throw new CheckoutPaymentException('Address fields must use no more than 50 characters.', 422, 'INVALID_ADDRESS');
            }
            $address[$field] = $value !== '' ? $value : null;
        }

        if (!filter_var((string)$address['email'], FILTER_VALIDATE_EMAIL)) {
            throw new CheckoutPaymentException('Enter a valid email address.', 422, 'INVALID_ADDRESS');
        }

        return $address;
    }

    private function stripeShippingAddress(array $address): array
    {
        $country = strtoupper(trim((string)($address['country'] ?? '')));
        $countryAliases = [
            'UNITED KINGDOM' => 'GB', 'UK' => 'GB', 'GREAT BRITAIN' => 'GB', 'ENGLAND' => 'GB',
            'UNITED STATES' => 'US', 'USA' => 'US', 'UNITED STATES OF AMERICA' => 'US',
            'COLOMBIA' => 'CO', 'SPAIN' => 'ES', 'FRANCE' => 'FR', 'GERMANY' => 'DE',
            'IRELAND' => 'IE', 'ITALY' => 'IT', 'PORTUGAL' => 'PT', 'CANADA' => 'CA',
            'AUSTRALIA' => 'AU', 'NETHERLANDS' => 'NL', 'BELGIUM' => 'BE',
        ];
        $countryCode = preg_match('/^[A-Z]{2}$/', $country) === 1
            ? $country
            : ($countryAliases[$country] ?? null);

        $stripeAddress = [
            'line1' => (string)$address['street_address_1'],
            'city' => (string)$address['town_city'],
            'postal_code' => (string)$address['postcode'],
        ];
        if (!empty($address['street_address_2'])) {
            $stripeAddress['line2'] = (string)$address['street_address_2'];
        }
        if ($countryCode !== null) {
            $stripeAddress['country'] = $countryCode;
        }

        return [
            'name' => trim((string)$address['first_name'] . ' ' . (string)$address['last_name']),
            'phone' => (string)$address['phone'],
            'address' => $stripeAddress,
        ];
    }

    private function ownerToken(string $customerEmail): string
    {
        return strtolower(trim($customerEmail)) . '.';
    }

    private function limitedText(string $value, int $limit): string
    {
        $value = trim($value);
        return function_exists('mb_substr') ? mb_substr($value, 0, $limit, 'UTF-8') : substr($value, 0, $limit);
    }

    private function textLength(string $value): int
    {
        return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
    }

    private function moneyString(int $pence): string
    {
        return number_format($pence / 100, 2, '.', '');
    }

    private function pounds(int $pence): float
    {
        return round($pence / 100, 2);
    }
}
