<?php

class Jobs
{
    private $connection;

    public function __construct($connection)
    {
        $this->connection = $connection;
    }

    public function addProductToJobs(array $input, string $customerEmail): array
    {
        $sku = trim((string)($input['sku'] ?? ''));
        $quantity = (int)($input['quantity'] ?? 0);
        $priceId = (int)($input['price_id'] ?? 0);
        $variationIds = $this->normaliseIds($input['variation_ids'] ?? []);

        if ($sku === '' || $quantity <= 0 || $quantity > 999999 || $priceId <= 0 || empty($variationIds)) {
            return $this->failure('Please select a valid product configuration.', 422);
        }

        try {
            $pdo = $this->getPdo();
            $product = $this->getAvailableProduct($pdo, $sku);
            if (!$product) {
                return $this->failure('This product is unavailable.', 404);
            }

            $variations = $this->getSelectedVariations(
                $pdo,
                (int)$product['product_id'],
                $variationIds,
                $quantity
            );

            if (count($variations) !== count($variationIds)) {
                return $this->failure('One or more selected options do not belong to this product.', 422);
            }

            $baseTier = $this->getBasePriceTier(
                $pdo,
                (int)$product['product_id'],
                $priceId,
                $quantity
            );

            if (!$baseTier || !in_array((int)$baseTier['variation_id'], $variationIds, true)) {
                return $this->failure('The selected price tier is no longer available.', 422);
            }

            $pricing = $this->calculateVariationPricing($variations, $baseTier);
            if (empty($pricing['success'])) {
                return $pricing;
            }

            $pricePerUnit = (float)$pricing['price_per_unit'];
            $subtotal = $pricePerUnit * $quantity;
            $artworkLink = $pricing['artwork_link'];
            $notes = sprintf(
                'Product: %s (%s). Customer session: %s.',
                trim((string)$product['name']),
                trim((string)$product['sku']),
                strtolower(trim($customerEmail))
            );

            $pdo->beginTransaction();

            $jobStatement = $pdo->prepare("
                INSERT INTO jobs
                    (status, created_at, notes, quantity, price_per_unit, subtotal, pdf_artwork_link)
                VALUES
                    ('cart', NOW(), :notes, :quantity, :price_per_unit, :subtotal, :pdf_artwork_link)
            ");
            $jobStatement->execute([
                ':notes' => $notes,
                ':quantity' => $quantity,
                ':price_per_unit' => $pricePerUnit,
                ':subtotal' => $subtotal,
                ':pdf_artwork_link' => $artworkLink,
            ]);

            $jobId = (int)$pdo->lastInsertId();
            if ($jobId <= 0) {
                throw new RuntimeException('The job record was not created.');
            }

            $detailStatement = $pdo->prepare("
                INSERT INTO job_details
                    (job_id, variation_id, name, image, price, quantity)
                VALUES
                    (:job_id, :variation_id, :name, :image, :price, :quantity)
            ");

            foreach ($variations as $variation) {
                $variationId = (int)$variation['variation_id'];
                $detailStatement->execute([
                    ':job_id' => $jobId,
                    ':variation_id' => $variationId,
                    ':name' => $this->limitText((string)$variation['name'], 50),
                    ':image' => $this->limitText((string)($variation['image'] ?? ''), 50),
                    ':price' => number_format((float)($pricing['prices'][$variationId] ?? 0), 2, '.', ''),
                    ':quantity' => (string)$quantity,
                ]);
            }

            $pdo->commit();

            return [
                'success' => true,
                'job_id' => $jobId,
                'cart_id' => $jobId,
                'quantity' => $quantity,
                'price_per_unit' => round($pricePerUnit, 2),
                'subtotal' => round($subtotal, 2),
            ];
        } catch (Throwable $error) {
            $this->rollBack($pdo ?? null);
            error_log('addProductToJobs error: ' . $error->getMessage());
            return $this->failure('The product could not be added to your cart.', 500);
        }
    }

    public function getCartItems(string $customerEmail): array
    {
        try {
            $pdo = $this->getPdo();
            $statement = $pdo->prepare("
                SELECT
                    j.job_id AS cart_id,
                    j.quantity,
                    j.price_per_unit AS unit_price,
                    j.subtotal,
                    (
                        SELECT p.SKU
                        FROM job_details selected_detail
                        INNER JOIN variations selected_variation
                            ON selected_variation.variation_id = selected_detail.variation_id
                        INNER JOIN products p ON p.product_id = selected_variation.product_id
                        WHERE selected_detail.job_id = j.job_id
                        LIMIT 1
                    ) AS sku,
                    (
                        SELECT p.name
                        FROM job_details selected_detail
                        INNER JOIN variations selected_variation
                            ON selected_variation.variation_id = selected_detail.variation_id
                        INNER JOIN products p ON p.product_id = selected_variation.product_id
                        WHERE selected_detail.job_id = j.job_id
                        LIMIT 1
                    ) AS name,
                    (
                        SELECT COALESCE(NULLIF(TRIM(s.company_name), ''), NULLIF(TRIM(s.contact_name), ''), 'Supplier')
                        FROM job_details selected_detail
                        INNER JOIN variations selected_variation
                            ON selected_variation.variation_id = selected_detail.variation_id
                        INNER JOIN products p ON p.product_id = selected_variation.product_id
                        INNER JOIN suppliers s ON s.supplier_id = p.supplier_id
                        WHERE selected_detail.job_id = j.job_id
                        LIMIT 1
                    ) AS company,
                    COALESCE(
                        (
                            SELECT NULLIF(TRIM(selected_variation.image), '')
                            FROM job_details selected_detail
                            INNER JOIN variations selected_variation
                                ON selected_variation.variation_id = selected_detail.variation_id
                            WHERE selected_detail.job_id = j.job_id
                              AND TRIM(COALESCE(selected_variation.image, '')) <> ''
                            ORDER BY selected_variation.variation_id DESC
                            LIMIT 1
                        ),
                        (
                            SELECT NULLIF(TRIM(i.link), '')
                            FROM job_details selected_detail
                            INNER JOIN images i ON i.variation_id = selected_detail.variation_id
                            WHERE selected_detail.job_id = j.job_id
                              AND TRIM(COALESCE(i.link, '')) <> ''
                            ORDER BY i.image_id ASC
                            LIMIT 1
                        ),
                        ''
                    ) AS image,
                    COALESCE(
                        (
                            SELECT
                                CASE
                                    WHEN SUM(pr.max_quantity IS NULL OR pr.max_quantity <= 0) > 0 THEN 999999
                                    ELSE MAX(pr.max_quantity)
                                END
                            FROM job_details priced_detail
                            INNER JOIN variations priced_variation
                                ON priced_variation.variation_id = priced_detail.variation_id
                            INNER JOIN prices pr ON pr.variation_id = priced_variation.variation_id
                            WHERE priced_detail.job_id = j.job_id
                              AND COALESCE(NULLIF(TRIM(priced_variation.price_display_mode), ''), 'prices') = 'prices'
                              AND CAST(priced_detail.price AS DECIMAL(12,2)) > 0
                        ),
                        999999
                    ) AS max_quantity
                FROM jobs j
                WHERE j.status = 'cart'
                  AND LOWER(TRIM(SUBSTRING_INDEX(j.notes, 'Customer session:', -1))) = :cart_owner
                ORDER BY j.created_at DESC, j.job_id DESC
            ");
            $statement->execute([':cart_owner' => $this->ownerToken($customerEmail)]);
            $items = $statement->fetchAll(PDO::FETCH_ASSOC);

            if (empty($items)) {
                return ['success' => true, 'items' => []];
            }

            $itemIndexes = [];
            foreach ($items as $index => &$item) {
                $item['cart_id'] = (int)$item['cart_id'];
                $item['quantity'] = max(1, (int)$item['quantity']);
                $item['max_quantity'] = max(1, (int)$item['max_quantity']);
                $item['unit_price'] = max(0, (float)$item['unit_price']);
                $item['subtotal'] = max(0, (float)$item['subtotal']);
                $item['variations'] = [];
                $itemIndexes[$item['cart_id']] = $index;
            }
            unset($item);

            $jobIds = array_keys($itemIndexes);
            $placeholders = implode(',', array_fill(0, count($jobIds), '?'));
            $detailStatement = $pdo->prepare("
                SELECT
                    jd.job_id,
                    jd.name,
                    COALESCE(NULLIF(TRIM(tv.type_name), ''), 'Option') AS variation_type
                FROM job_details jd
                INNER JOIN variations v ON v.variation_id = jd.variation_id
                LEFT JOIN type_variations tv ON tv.type_id = v.type_id
                WHERE jd.job_id IN ($placeholders)
                  AND LOWER(TRIM(COALESCE(jd.name, ''))) <> 'default'
                ORDER BY jd.job_id DESC, v.variation_id ASC
            ");
            $detailStatement->execute($jobIds);

            foreach ($detailStatement->fetchAll(PDO::FETCH_ASSOC) as $detail) {
                $jobId = (int)$detail['job_id'];
                if (!isset($itemIndexes[$jobId])) {
                    continue;
                }

                $items[$itemIndexes[$jobId]]['variations'][] = [
                    'name' => (string)$detail['variation_type'],
                    'value' => (string)$detail['name'],
                ];
            }

            return ['success' => true, 'items' => $items];
        } catch (Throwable $error) {
            error_log('getCartItems error: ' . $error->getMessage());
            return $this->failure('Your shopping cart could not be loaded.', 500);
        }
    }

    public function updateCartItem(int $jobId, int $quantity, string $customerEmail): array
    {
        if ($jobId <= 0 || $quantity <= 0 || $quantity > 999999) {
            return $this->failure('Please enter a valid quantity.', 422);
        }

        try {
            $pdo = $this->getPdo();
            $job = $this->getOwnedCartJob($pdo, $jobId, $customerEmail);
            if (!$job) {
                return $this->failure('This cart product was not found.', 404);
            }

            $pricing = $this->getJobPricing($pdo, $jobId, $quantity);
            if (empty($pricing['success'])) {
                return $pricing;
            }

            $pricePerUnit = (float)$pricing['price_per_unit'];
            $subtotal = $pricePerUnit * $quantity;

            $pdo->beginTransaction();

            $statement = $pdo->prepare("
                UPDATE jobs
                SET quantity = :quantity,
                    price_per_unit = :price_per_unit,
                    subtotal = :subtotal
                WHERE job_id = :job_id
                  AND status = 'cart'
            ");
            $statement->execute([
                ':quantity' => $quantity,
                ':price_per_unit' => $pricePerUnit,
                ':subtotal' => $subtotal,
                ':job_id' => $jobId,
            ]);

            $detailStatement = $pdo->prepare("
                UPDATE job_details
                SET quantity = :quantity,
                    price = :price
                WHERE job_id = :job_id
                  AND variation_id = :variation_id
            ");
            foreach ($pricing['prices'] as $variationId => $price) {
                $detailStatement->execute([
                    ':quantity' => (string)$quantity,
                    ':price' => number_format((float)$price, 2, '.', ''),
                    ':job_id' => $jobId,
                    ':variation_id' => (int)$variationId,
                ]);
            }

            $pdo->commit();

            return [
                'success' => true,
                'cart_id' => $jobId,
                'quantity' => $quantity,
                'max_quantity' => (int)$pricing['max_quantity'],
                'price_per_unit' => round($pricePerUnit, 2),
                'subtotal' => round($subtotal, 2),
            ];
        } catch (Throwable $error) {
            $this->rollBack($pdo ?? null);
            error_log('updateCartItem error: ' . $error->getMessage());
            return $this->failure('The cart quantity could not be updated.', 500);
        }
    }

    public function removeCartItem(int $jobId, string $customerEmail): array
    {
        if ($jobId <= 0) {
            return $this->failure('This cart product is invalid.', 422);
        }

        try {
            $pdo = $this->getPdo();
            if (!$this->getOwnedCartJob($pdo, $jobId, $customerEmail)) {
                return $this->failure('This cart product was not found.', 404);
            }

            $pdo->beginTransaction();
            $pdo->prepare('DELETE FROM job_details WHERE job_id = :job_id')
                ->execute([':job_id' => $jobId]);
            $pdo->prepare("DELETE FROM jobs WHERE job_id = :job_id AND status = 'cart'")
                ->execute([':job_id' => $jobId]);
            $pdo->commit();

            return ['success' => true, 'cart_id' => $jobId];
        } catch (Throwable $error) {
            $this->rollBack($pdo ?? null);
            error_log('removeCartItem error: ' . $error->getMessage());
            return $this->failure('The product could not be removed from your cart.', 500);
        }
    }

    public function clearCart(string $customerEmail): array
    {
        try {
            $pdo = $this->getPdo();
            $jobIds = $this->getOwnedCartIds($pdo, $customerEmail);
            if (empty($jobIds)) {
                return ['success' => true, 'removed' => 0];
            }

            $placeholders = implode(',', array_fill(0, count($jobIds), '?'));
            $pdo->beginTransaction();
            $pdo->prepare("DELETE FROM job_details WHERE job_id IN ($placeholders)")->execute($jobIds);
            $pdo->prepare("DELETE FROM jobs WHERE status = 'cart' AND job_id IN ($placeholders)")->execute($jobIds);
            $pdo->commit();

            return ['success' => true, 'removed' => count($jobIds)];
        } catch (Throwable $error) {
            $this->rollBack($pdo ?? null);
            error_log('clearCart error: ' . $error->getMessage());
            return $this->failure('Your shopping cart could not be cleared.', 500);
        }
    }

    public function validatePromotion(string $code, string $customerEmail): array
    {
        $code = strtoupper(trim($code));
        if ($code === '') {
            return $this->failure('Enter a promotional code.', 422);
        }

        try {
            $pdo = $this->getPdo();
            $jobIds = $this->getOwnedCartIds($pdo, $customerEmail);
            if (empty($jobIds)) {
                return $this->failure('Your shopping cart is empty.', 422);
            }

            $promotion = $this->getApplicablePromotion($pdo, $code, $jobIds);
            if (!$promotion) {
                return $this->failure('This promotional code is not valid for your cart.', 422);
            }

            return array_merge(['success' => true, 'code' => $code], $promotion);
        } catch (Throwable $error) {
            error_log('validatePromotion error: ' . $error->getMessage());
            return $this->failure('The promotional code could not be validated.', 500);
        }
    }

    public function checkoutCart(string $customerEmail, string $promotionCode = ''): array
    {
        try {
            $pdo = $this->getPdo();
            $jobIds = $this->getOwnedCartIds($pdo, $customerEmail);
            if (empty($jobIds)) {
                return $this->failure('Your shopping cart is empty.', 422);
            }

            $placeholders = implode(',', array_fill(0, count($jobIds), '?'));
            $subtotalStatement = $pdo->prepare("
                SELECT COALESCE(SUM(subtotal), 0)
                FROM jobs
                WHERE status = 'cart' AND job_id IN ($placeholders)
            ");
            $subtotalStatement->execute($jobIds);
            $subtotal = max(0, (float)$subtotalStatement->fetchColumn());
            $shipping = $subtotal > 0 && $subtotal < 200000 ? 15000.0 : 0.0;
            $discount = 0.0;

            $promotionCode = strtoupper(trim($promotionCode));
            if ($promotionCode !== '') {
                $promotion = $this->getApplicablePromotion($pdo, $promotionCode, $jobIds);
                if (!$promotion) {
                    return $this->failure('The promotional code is no longer valid.', 422);
                }

                $discount = $promotion['discount_type'] === 'percentage'
                    ? $subtotal * ((float)$promotion['discount_value'] / 100)
                    : (float)$promotion['discount_value'];
                $discount = min($subtotal, max(0, $discount));
            }

            $total = max(0, $subtotal - $discount + $shipping);
            $customerStatement = $pdo->prepare("
                SELECT customer_id
                FROM customers
                WHERE LOWER(TRIM(email)) = :email
                LIMIT 1
            ");
            $customerStatement->execute([':email' => strtolower(trim($customerEmail))]);
            $customerId = $customerStatement->fetchColumn();
            $customerId = $customerId !== false ? (int)$customerId : null;

            $pdo->beginTransaction();
            $orderStatement = $pdo->prepare("
                INSERT INTO orders
                    (status, created_at, currency, subtotal, shipping_total, customer_id)
                VALUES
                    ('pending', :created_at, 'COP', :subtotal, :shipping_total, :customer_id)
            ");
            $orderStatement->execute([
                ':created_at' => date('Y-m-d H:i:s'),
                ':subtotal' => number_format($subtotal - $discount, 2, '.', ''),
                ':shipping_total' => number_format($shipping, 2, '.', ''),
                ':customer_id' => $customerId,
            ]);

            $orderId = (int)$pdo->lastInsertId();
            if ($orderId <= 0) {
                throw new RuntimeException('The order record was not created.');
            }

            $updateParams = array_merge([$orderId], $jobIds);
            $pdo->prepare("
                UPDATE jobs
                SET status = 'ordered', order_id = ?
                WHERE status = 'cart' AND job_id IN ($placeholders)
            ")->execute($updateParams);
            $pdo->commit();

            return [
                'success' => true,
                'order_id' => $orderId,
                'subtotal' => round($subtotal, 2),
                'discount' => round($discount, 2),
                'delivery' => round($shipping, 2),
                'total' => round($total, 2),
                'message' => sprintf('Order #%d was created successfully.', $orderId),
            ];
        } catch (Throwable $error) {
            $this->rollBack($pdo ?? null);
            error_log('checkoutCart error: ' . $error->getMessage());
            return $this->failure('Your order could not be created.', 500);
        }
    }

    private function getJobPricing(PDO $pdo, int $jobId, int $quantity): array
    {
        $statement = $pdo->prepare("
            SELECT
                v.variation_id,
                v.name,
                v.image,
                v.pdf_artwork,
                COALESCE(NULLIF(TRIM(v.price_display_mode), ''), 'prices') AS price_display_mode,
                CAST(jd.price AS DECIMAL(12,2)) AS stored_price,
                (
                    SELECT pr.price
                    FROM prices pr
                    WHERE pr.variation_id = v.variation_id
                      AND :quantity_min >= pr.min_quantity
                      AND (pr.max_quantity IS NULL OR pr.max_quantity <= 0 OR :quantity_max <= pr.max_quantity)
                    ORDER BY pr.min_quantity DESC, pr.price_id DESC
                    LIMIT 1
                ) AS applicable_price,
                (
                    SELECT COUNT(*)
                    FROM prices configured_price
                    WHERE configured_price.variation_id = v.variation_id
                      AND configured_price.price > 0
                ) AS configured_extra_prices,
                (
                    SELECT
                        CASE
                            WHEN SUM(limit_price.max_quantity IS NULL OR limit_price.max_quantity <= 0) > 0 THEN 999999
                            ELSE MAX(limit_price.max_quantity)
                        END
                    FROM prices limit_price
                    WHERE limit_price.variation_id = v.variation_id
                ) AS variation_max_quantity
            FROM job_details jd
            INNER JOIN variations v ON v.variation_id = jd.variation_id
            WHERE jd.job_id = :job_id
            ORDER BY v.variation_id ASC
        ");
        $statement->execute([
            ':quantity_min' => $quantity,
            ':quantity_max' => $quantity,
            ':job_id' => $jobId,
        ]);
        $variations = $statement->fetchAll(PDO::FETCH_ASSOC);

        $baseVariation = null;
        foreach ($variations as $variation) {
            if ($variation['price_display_mode'] === 'prices' && (float)$variation['stored_price'] > 0) {
                $baseVariation = $variation;
                break;
            }
        }
        if ($baseVariation === null) {
            foreach (array_reverse($variations) as $variation) {
                if ($variation['price_display_mode'] === 'prices' && $variation['applicable_price'] !== null) {
                    $baseVariation = $variation;
                    break;
                }
            }
        }

        if ($baseVariation === null || $baseVariation['applicable_price'] === null) {
            return $this->failure('This quantity is not available for the selected product.', 422);
        }

        $baseTier = [
            'variation_id' => (int)$baseVariation['variation_id'],
            'price' => (float)$baseVariation['applicable_price'],
        ];
        $pricing = $this->calculateVariationPricing($variations, $baseTier);
        if (!empty($pricing['success'])) {
            $pricing['max_quantity'] = max(1, (int)($baseVariation['variation_max_quantity'] ?? 999999));
        }

        return $pricing;
    }

    private function calculateVariationPricing(array $variations, array $baseTier): array
    {
        $baseVariationId = (int)$baseTier['variation_id'];
        $basePrice = max(0, (float)$baseTier['price']);
        $pricePerUnit = $basePrice;
        $prices = [];
        $artworkLink = null;

        foreach ($variations as $variation) {
            $variationId = (int)$variation['variation_id'];
            $mode = (string)($variation['price_display_mode'] ?? 'prices');
            $applicablePrice = $variation['applicable_price'];
            $hasConfiguredExtra = (int)($variation['configured_extra_prices'] ?? 0) > 0;

            if ($mode === 'variation' && $hasConfiguredExtra && $applicablePrice === null) {
                return $this->failure(
                    sprintf('The option "%s" is unavailable for this quantity.', (string)$variation['name']),
                    422
                );
            }

            $linePrice = 0.0;
            if ($variationId === $baseVariationId) {
                $linePrice = $basePrice;
            } elseif ($mode === 'variation' && $applicablePrice !== null) {
                $linePrice = max(0, (float)$applicablePrice);
                $pricePerUnit += $linePrice;
            }
            $prices[$variationId] = $linePrice;

            if ($artworkLink === null && trim((string)($variation['pdf_artwork'] ?? '')) !== '') {
                $artworkLink = trim((string)$variation['pdf_artwork']);
            }
        }

        return [
            'success' => true,
            'price_per_unit' => $pricePerUnit,
            'prices' => $prices,
            'artwork_link' => $artworkLink,
        ];
    }

    private function getApplicablePromotion(PDO $pdo, string $code, array $jobIds): ?array
    {
        $placeholders = implode(',', array_fill(0, count($jobIds), '?'));
        $statement = $pdo->prepare("
            SELECT promotion_id, discount_type, discount_value
            FROM promotions promotion
            WHERE UPPER(TRIM(promotion.name)) = ?
              AND (promotion.start_at IS NULL OR promotion.start_at <= NOW())
              AND (promotion.end_at IS NULL OR promotion.end_at >= NOW())
              AND (
                  NOT EXISTS (
                      SELECT 1
                      FROM variation_promotions configured
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
        $row = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        $rawType = strtolower(trim((string)$row['discount_type']));
        $type = in_array($rawType, ['percentage', 'percent', '%'], true) ? 'percentage' : 'fixed';
        $value = max(0, (float)$row['discount_value']);
        if ($type === 'percentage') {
            $value = min(100, $value);
        }

        return [
            'discount_type' => $type,
            'discount_value' => $value,
        ];
    }

    private function getAvailableProduct(PDO $pdo, string $sku): ?array
    {
        $statement = $pdo->prepare("
            SELECT product_id, SKU AS sku, name
            FROM products
            WHERE LOWER(TRIM(SKU)) = LOWER(:sku)
              AND is_approved = 1
            LIMIT 1
        ");
        $statement->execute([':sku' => $sku]);
        $row = $statement->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    private function getBasePriceTier(PDO $pdo, int $productId, int $priceId, int $quantity): ?array
    {
        $statement = $pdo->prepare("
            SELECT pr.price_id, pr.price, v.variation_id
            FROM prices pr
            INNER JOIN variations v ON v.variation_id = pr.variation_id
            WHERE pr.price_id = :price_id
              AND v.product_id = :product_id
              AND COALESCE(NULLIF(TRIM(v.price_display_mode), ''), 'prices') = 'prices'
              AND :quantity_min >= pr.min_quantity
              AND (pr.max_quantity IS NULL OR pr.max_quantity <= 0 OR :quantity_max <= pr.max_quantity)
            LIMIT 1
        ");
        $statement->execute([
            ':price_id' => $priceId,
            ':product_id' => $productId,
            ':quantity_min' => $quantity,
            ':quantity_max' => $quantity,
        ]);
        $row = $statement->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    private function getSelectedVariations(PDO $pdo, int $productId, array $variationIds, int $quantity): array
    {
        $placeholders = implode(',', array_fill(0, count($variationIds), '?'));
        $statement = $pdo->prepare("
            SELECT
                v.variation_id,
                v.name,
                v.image,
                v.pdf_artwork,
                COALESCE(NULLIF(TRIM(v.price_display_mode), ''), 'prices') AS price_display_mode,
                (
                    SELECT pr.price
                    FROM prices pr
                    WHERE pr.variation_id = v.variation_id
                      AND ? >= pr.min_quantity
                      AND (pr.max_quantity IS NULL OR pr.max_quantity <= 0 OR ? <= pr.max_quantity)
                    ORDER BY pr.min_quantity DESC, pr.price_id DESC
                    LIMIT 1
                ) AS applicable_price,
                (
                    SELECT COUNT(*)
                    FROM prices configured_price
                    WHERE configured_price.variation_id = v.variation_id
                      AND configured_price.price > 0
                ) AS configured_extra_prices
            FROM variations v
            WHERE v.product_id = ?
              AND v.variation_id IN ($placeholders)
            ORDER BY v.variation_id ASC
        ");
        $statement->execute(array_merge([$quantity, $quantity, $productId], $variationIds));

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getOwnedCartJob(PDO $pdo, int $jobId, string $customerEmail): ?array
    {
        $statement = $pdo->prepare("
            SELECT job_id, quantity, price_per_unit, subtotal
            FROM jobs
            WHERE job_id = :job_id
              AND status = 'cart'
              AND LOWER(TRIM(SUBSTRING_INDEX(notes, 'Customer session:', -1))) = :cart_owner
            LIMIT 1
        ");
        $statement->execute([
            ':job_id' => $jobId,
            ':cart_owner' => $this->ownerToken($customerEmail),
        ]);
        $row = $statement->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    private function getOwnedCartIds(PDO $pdo, string $customerEmail): array
    {
        $statement = $pdo->prepare("
            SELECT job_id
            FROM jobs
            WHERE status = 'cart'
              AND LOWER(TRIM(SUBSTRING_INDEX(notes, 'Customer session:', -1))) = :cart_owner
            ORDER BY job_id ASC
        ");
        $statement->execute([':cart_owner' => $this->ownerToken($customerEmail)]);

        return array_map('intval', $statement->fetchAll(PDO::FETCH_COLUMN));
    }

    private function normaliseIds($values): array
    {
        if (!is_array($values)) {
            return [];
        }

        return array_values(array_unique(array_filter(
            array_map('intval', $values),
            static fn($id) => $id > 0
        )));
    }

    private function ownerToken(string $customerEmail): string
    {
        return strtolower(trim($customerEmail)) . '.';
    }

    private function getPdo(): PDO
    {
        $pdo = $this->connection->getConnection();
        if (!$pdo instanceof PDO) {
            throw new RuntimeException('The database connection is unavailable.');
        }

        return $pdo;
    }

    private function rollBack($pdo): void
    {
        if ($pdo instanceof PDO && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }

    private function limitText(string $value, int $length): string
    {
        $value = trim($value);
        return function_exists('mb_substr')
            ? mb_substr($value, 0, $length)
            : substr($value, 0, $length);
    }

    private function failure(string $message, int $status): array
    {
        return [
            'success' => false,
            'error' => $message,
            'status' => $status,
        ];
    }
}
