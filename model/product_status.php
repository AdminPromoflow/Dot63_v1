<?php

declare(strict_types=1);

final class ProductStatus
{
    public const LABELS = [0 => 'Draft', 1 => 'Published', 2 => 'Configurable product', 3 => 'Separate combinations'];
    private PDO $pdo;

    public function __construct(Database $database)
    {
        $this->pdo = $database->getConnection();
    }

    public static function normalize($status): int
    {
        $value = strtolower(trim((string)$status));
        if ($value === 'active') return 1;
        return in_array($value, ['0', '1', '2', '3'], true) ? (int)$value : 0;
    }

    public static function describe(array $product): array
    {
        $status = self::normalize($product['status'] ?? null);
        $pending = isset($product['pending_status']) ? (int)$product['pending_status'] : null;
        // Requests submitted by the previous publication workflow remain reviewable.
        if ($pending === null && $status === 2 && empty($product['is_approved'])) {
            $pending = 2;
            $status = 0;
        }
        return [
            'status' => $status,
            'status_label' => self::LABELS[$status],
            'pending_status' => $pending,
            'pending_status_label' => $pending === null ? null : (self::LABELS[$pending] ?? 'Unknown'),
            'status_request_version' => (int)($product['status_request_version'] ?? 0),
            'status_requested_at' => $product['status_requested_at'] ?? null,
        ];
    }

    public function getOwned(string $sku, string $email, bool $lock = false): array
    {
        $statement = $this->pdo->prepare('
            SELECT p.*, s.email AS supplier_email,
                COALESCE(NULLIF(s.company_name, \'\'), s.contact_name) AS supplier_name,
                g.name AS group_name, c.name AS category_name
            FROM products p
            INNER JOIN suppliers s ON s.supplier_id = p.supplier_id
            LEFT JOIN `groups` g ON g.group_id = p.group_id
            LEFT JOIN categories c ON c.category_id = g.category_id
            WHERE p.SKU = :sku AND LOWER(TRIM(s.email)) = :email
            LIMIT 1' . ($lock ? ' FOR UPDATE' : '')
        );
        $statement->execute([':sku' => trim($sku), ':email' => strtolower(trim($email))]);
        $product = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$product) throw new RuntimeException('Product not found in your supplier account.', 403);
        return array_merge($product, self::describe($product));
    }

    public function saveDetails(string $sku, string $email, array $data, callable $notify): array
    {
        $requested = $data['status'] ?? null;
        if (!in_array($requested, [0, 1, 2, 3, '0', '1', '2', '3'], true)) {
            throw new InvalidArgumentException('Choose a valid product status.', 422);
        }
        $requested = (int)$requested;
        $this->pdo->beginTransaction();
        try {
            $product = $this->getOwned($sku, $email, true);
            if (!isset($data['status_request_version']) || (string)$data['status_request_version'] !== (string)$product['status_request_version']) {
                throw new RuntimeException('This product has changed. Reload its details before saving.', 409);
            }
            $fields = [];
            foreach (['name', 'description', 'descriptive_tagline'] as $key) {
                $fields[$key] = trim((string)($data[$key] ?? $product[$key] ?? ''));
            }
            if (mb_strlen($fields['name']) > 150 || mb_strlen($fields['descriptive_tagline']) > 160) {
                throw new InvalidArgumentException('The product name or tagline is too long.', 422);
            }
            $detailsChanged = false;
            foreach ($fields as $key => $value) {
                $detailsChanged = $detailsChanged || $value !== (string)($product[$key] ?? '');
            }
            $pending = $product['pending_status'];
            $requestChanged = $requested !== ($pending ?? $product['status']);
            // Refresh a pending review when the supplier changes the details being reviewed.
            $needsReview = $requestChanged || ($pending !== null && $detailsChanged);
            $version = $product['status_request_version'];
            if ($needsReview) {
                if ($requested !== 0) $this->assertReady(array_merge($product, $fields));
                $pending = $requested;
                $version++;
            }
            $statement = $this->pdo->prepare('
                UPDATE products SET name=:name, description=:description,
                    descriptive_tagline=:tagline, status=:status,
                    pending_status=:pending, status_request_version=:version,
                    status_requested_at=CASE WHEN :changed=1 THEN NOW() ELSE status_requested_at END
                WHERE product_id=:id
            ');
            $statement->execute([
                ':name' => $fields['name'], ':description' => $fields['description'],
                ':tagline' => $fields['descriptive_tagline'], ':status' => $product['status'],
                ':pending' => $pending, ':version' => $version, ':changed' => (int)$needsReview,
                ':id' => $product['product_id'],
            ]);
            if ($needsReview) {
                $notice = array_merge($product, $fields, [
                    'pending_status' => $requested,
                    'pending_status_label' => self::LABELS[$requested],
                    'status_request_version' => $version,
                ]);
                if (!$notify($notice)) throw new RuntimeException('The approval request could not be sent. Your changes have not been saved. Please try again.', 502);
            }
            $result = $this->getOwned($sku, $email);
            $this->pdo->commit();
            return ['success' => true, 'data' => $result, 'pending_approval' => $pending !== null,
                'message' => $needsReview ? 'Change submitted to Promoflow for approval. The current status remains in effect.' : 'Product details saved.'];
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $error;
        }
    }

    public function approve(string $sku, int $expectedVersion, int $expectedStatus): array
    {
        $this->pdo->beginTransaction();
        try {
            $statement = $this->pdo->prepare('SELECT p.*, g.name AS group_name, c.name AS category_name FROM products p LEFT JOIN `groups` g ON g.group_id=p.group_id LEFT JOIN categories c ON c.category_id=g.category_id WHERE p.SKU=? LIMIT 1 FOR UPDATE');
            $statement->execute([trim($sku)]);
            $product = $statement->fetch(PDO::FETCH_ASSOC);
            if (!$product) throw new RuntimeException('Product not found.', 404);
            $product = array_merge($product, self::describe($product));
            if ($product['pending_status'] === null || $product['status_request_version'] !== $expectedVersion || $product['pending_status'] !== $expectedStatus) {
                throw new RuntimeException('This request has changed or has already been reviewed. Reload the product before approving.', 409);
            }
            if ($expectedStatus !== 0) $this->assertReady($product);
            $statement = $this->pdo->prepare('UPDATE products SET status=?, is_approved=1, pending_status=NULL, status_requested_at=NULL, status_request_version=status_request_version+1, date_status=CURRENT_TIME() WHERE product_id=?');
            $statement->execute([$expectedStatus, $product['product_id']]);
            $this->pdo->commit();
            return ['success' => true, 'status' => $expectedStatus, 'status_label' => self::LABELS[$expectedStatus],
                'message' => 'Status change approved: ' . self::LABELS[$expectedStatus] . '.'];
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $error;
        }
    }

    private function assertReady(array $product): void
    {
        $missing = [];
        if (trim((string)$product['name']) === '') $missing[] = 'product name';
        if (trim((string)$product['description']) === '') $missing[] = 'product description';
        if (empty($product['group_id']) || empty($product['category_name']) || $product['category_name'] === 'Unassigned Category' || $product['group_name'] === 'Unassigned Group') $missing[] = 'category and group';
        $statement = $this->pdo->prepare("SELECT
            SUM(v.type_id IS NOT NULL AND TRIM(COALESCE(v.name,''))<>'' AND LOWER(TRIM(v.name))<>'default') AS options_count,
            (SELECT COUNT(*) FROM images i INNER JOIN variations vi ON vi.variation_id=i.variation_id WHERE vi.product_id=:images_id AND TRIM(COALESCE(i.link,''))<>'') AS images_count,
            (SELECT COUNT(*) FROM prices pr INNER JOIN variations vp ON vp.variation_id=pr.variation_id WHERE vp.product_id=:prices_id AND COALESCE(NULLIF(TRIM(vp.price_display_mode),''),'prices')='prices') AS prices_count
            FROM variations v WHERE v.product_id=:product_id");
        $statement->execute([':images_id'=>$product['product_id'], ':prices_id'=>$product['product_id'], ':product_id'=>$product['product_id']]);
        $counts = $statement->fetch(PDO::FETCH_ASSOC);
        foreach (['options_count'=>'variations', 'images_count'=>'images', 'prices_count'=>'pricing'] as $key=>$label) {
            if ((int)($counts[$key] ?? 0) <= 0) $missing[] = $label;
        }
        if ($missing) throw new InvalidArgumentException('Complete the product before requesting this status: ' . implode(', ', $missing) . '.', 422);
    }
}
