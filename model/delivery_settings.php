<?php
require_once __DIR__ . "/delivery_price.php";
/** Delivery configuration restricted to the signed-in supplier. */
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
        return self::hierarchy($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public static function hierarchy(array $rows): array
    {
        $products = [];
        foreach ($rows as $row) $products[$row['product_id']][] = $row;
        $ordered = [];
        foreach ($products as $productRows) {
            // Match the variation menu's lexical ID path order.
            usort($productRows, static function ($a, $b) { return strcmp((string)$a['variation_id'], (string)$b['variation_id']); });
            $byId = []; $children = []; $visited = [];
            foreach ($productRows as $row) $byId[(int)$row['variation_id']] = $row;
            foreach ($productRows as $row) {
                $id = (int)$row['variation_id']; $parent = (int)($row['parent_id'] ?? 0);
                if ($parent && $parent !== $id && isset($byId[$parent])) $children[$parent][] = $id;
            }
            $visit = function ($id, $level, $path) use (&$visit, &$visited, &$ordered, $byId, $children) {
                if (isset($visited[$id])) return;
                $visited[$id] = true;
                $row = $byId[$id]; $row['level'] = $level; $row['parent_path'] = $path;
                $ordered[] = $row;
                $path = $path === '' ? $row['name'] : $path . ' / ' . $row['name'];
                foreach ($children[$id] ?? [] as $child) $visit($child, $level + 1, $path);
            };
            foreach ($productRows as $row) {
                $id = (int)$row['variation_id']; $parent = (int)($row['parent_id'] ?? 0);
                if (!$parent || $parent === $id || !isset($byId[$parent])) $visit($id, 0, '');
            }
            // Keep malformed cyclic data visible without recursing indefinitely.
            foreach ($productRows as $row) if (!isset($visited[(int)$row['variation_id']])) $visit((int)$row['variation_id'], 0, '');
        }
        return $ordered;
    }

    public static function priceRows(PDO $pdo, string $supplierEmail, array $variations): array
    {
        $stmt = $pdo->prepare('SELECT r.* FROM prices r JOIN variations v ON v.variation_id = r.variation_id
            JOIN products p ON p.product_id = v.product_id JOIN suppliers s ON s.supplier_id = p.supplier_id
            WHERE LOWER(s.email) = :owner AND r.price IS NOT NULL
            ORDER BY r.min_quantity, r.max_quantity, r.price_id');
        $stmt->execute([':owner' => strtolower(trim($supplierEmail))]);
        $byVariation = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) $byVariation[$row['variation_id']][] = $row;
        $result = [];
        foreach ($variations as $variation) {
            foreach ($byVariation[$variation['variation_id']] ?? [] as $price) {
                $result[] = array_merge($variation, $price);
            }
        }
        return $result;
    }

    public static function save(PDO $pdo, string $owner, string $kind, string $reference, array $data): array
    {
        $days = DeliveryPrice::normalizeDays($data['delivery_time_days'] ?? null);
        [$value, $type] = DeliveryPrice::normalize($data['delivery_price'] ?? null, $data['delivery_price_type'] ?? null);
        if ($kind === 'variation') {
            $table = 'variations'; $key = 'variation_id';
            $sql = 'SELECT v.variation_id FROM variations v JOIN products p ON p.product_id = v.product_id
                    JOIN suppliers s ON s.supplier_id = p.supplier_id WHERE v.SKU = :ref AND LOWER(s.email) = :owner';
        } elseif ($kind === 'price') {
            $table = 'prices'; $key = 'price_id';
            $sql = 'SELECT r.price_id FROM prices r JOIN variations v ON v.variation_id = r.variation_id
                    JOIN products p ON p.product_id = v.product_id JOIN suppliers s ON s.supplier_id = p.supplier_id
                    WHERE r.price_id = :ref AND r.price IS NOT NULL AND LOWER(s.email) = :owner';
        } else {
            throw new InvalidArgumentException('Invalid delivery configuration type.');
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':ref' => $reference, ':owner' => strtolower(trim($owner))]);
        $id = $stmt->fetchColumn();
        if ($id === false) throw new InvalidArgumentException('This delivery configuration is unavailable.');
        // Update only delivery fields, preserving base prices and variation metadata.
        $stmt = $pdo->prepare("UPDATE $table SET delivery_time_days = :days, delivery_price = :value, delivery_price_type = :type WHERE $key = :id");
        $stmt->execute([':days' => $days, ':value' => $value, ':type' => $type, ':id' => $id]);
        return ['delivery_time_days' => $days, 'delivery_price' => $value, 'delivery_price_type' => $type];
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
