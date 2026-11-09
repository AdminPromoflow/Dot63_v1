<?php
/** Read-only delivery overview, restricted to the signed-in supplier. */
final class DeliverySettings
{
    public static function variations(PDO $pdo, string $supplierEmail, ?string $productSku = null): array
    {
        // v.* also supports rendering before the optional delivery migrations are applied.
        $sql = 'SELECT v.*, p.name AS product_name, p.SKU AS product_sku
                FROM variations v
                JOIN products p ON p.product_id = v.product_id
                JOIN suppliers s ON s.supplier_id = p.supplier_id
                WHERE LOWER(s.email) = :owner';
        $params = [':owner' => strtolower(trim($supplierEmail))];
        if ($productSku !== null && $productSku !== '') {
            $sql .= ' AND p.SKU = :sku';
            $params[':sku'] = $productSku;
        }
        $sql .= ' ORDER BY p.name, p.product_id, v.name, v.variation_id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function formatPrice(array $row): string
    {
        if (!isset($row['delivery_price'], $row['delivery_price_type'])) return 'Not set';
        $value = number_format((float)$row['delivery_price'], 2, '.', ',');
        if ($row['delivery_price_type'] === 'percentage') return $value . '%';
        if ($row['delivery_price_type'] === 'amount') return '£' . $value . ' GBP';
        return 'Not set';
    }
}
