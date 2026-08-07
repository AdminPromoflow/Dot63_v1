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
        $variationIds = array_values(array_unique(array_filter(
            array_map('intval', is_array($input['variation_ids'] ?? null) ? $input['variation_ids'] : []),
            static fn($id) => $id > 0
        )));

        if ($sku === '' || $quantity <= 0 || $priceId <= 0 || empty($variationIds)) {
            return $this->failure('Please select a valid product configuration.', 422);
        }

        try {
            $pdo = $this->connection->getConnection();
            if (!$pdo instanceof PDO) {
                return $this->failure('The database connection is unavailable.', 500);
            }

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

            $extrasPerUnit = 0.0;
            $artworkLink = null;

            foreach ($variations as &$variation) {
                $mode = (string)($variation['price_display_mode'] ?? 'prices');
                $applicablePrice = $variation['applicable_price'];
                $hasConfiguredExtra = (int)$variation['configured_extra_prices'] > 0;

                if ($mode === 'variation' && $hasConfiguredExtra && $applicablePrice === null) {
                    return $this->failure(
                        sprintf('The option "%s" is unavailable for this quantity.', (string)$variation['name']),
                        422
                    );
                }

                $variation['line_price'] = $mode === 'variation' && $applicablePrice !== null
                    ? max(0, (float)$applicablePrice)
                    : 0.0;
                $extrasPerUnit += $variation['line_price'];

                if ($artworkLink === null && trim((string)($variation['pdf_artwork'] ?? '')) !== '') {
                    $artworkLink = trim((string)$variation['pdf_artwork']);
                }
            }
            unset($variation);

            $basePrice = (float)$baseTier['price'];
            $pricePerUnit = $basePrice + $extrasPerUnit;
            $subtotal = $pricePerUnit * $quantity;
            $notes = sprintf(
                'Product: %s (%s). Customer session: %s.',
                trim((string)$product['name']),
                trim((string)$product['sku']),
                $customerEmail
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
                $detailPrice = (int)$variation['variation_id'] === (int)$baseTier['variation_id']
                    ? $basePrice
                    : (float)$variation['line_price'];

                $detailStatement->execute([
                    ':job_id' => $jobId,
                    ':variation_id' => (int)$variation['variation_id'],
                    ':name' => $this->limitText((string)$variation['name'], 50),
                    ':image' => $this->limitText((string)($variation['image'] ?? ''), 50),
                    ':price' => number_format($detailPrice, 2, '.', ''),
                    ':quantity' => (string)$quantity,
                ]);
            }

            $pdo->commit();

            return [
                'success' => true,
                'job_id' => $jobId,
                'quantity' => $quantity,
                'price_per_unit' => round($pricePerUnit, 2),
                'subtotal' => round($subtotal, 2),
            ];
        } catch (Throwable $error) {
            if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
                $pdo->rollBack();
            }

            error_log('addProductToJobs error: ' . $error->getMessage());
            return $this->failure('The product could not be added to your cart.', 500);
        }
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
