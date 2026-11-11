<?php
require_once __DIR__ . '/delivery_price.php';
final class DeliveryOptions
{
    public static function normalize($options): array
    {
        if (!is_array($options) || count($options) > 50) throw new InvalidArgumentException('Provide up to 50 delivery options.');
        $result = []; $seen = [];
        foreach ($options as $option) {
            if (!is_array($option)) throw new InvalidArgumentException('Invalid delivery option.');
            $days = DeliveryPrice::normalizeDays($option['days'] ?? null);
            [$value, $type] = DeliveryPrice::normalize($option['value'] ?? null, $option['type'] ?? null);
            if ($days === null || $value === null) throw new InvalidArgumentException('Each delivery option requires days, a non-negative surcharge and a type. Use 0 for free delivery.');
            if (isset($seen[$days])) throw new InvalidArgumentException('Use each delivery time only once.');
            $seen[$days] = true;
            $result[] = ['days' => $days, 'value' => $value, 'type' => $type];
        }
        usort($result, static fn($a,$b) => $a['days'] <=> $b['days']);
        return $result;
    }
    public static function fromRow(array $row): array
    {
        if (isset($row['delivery_options'])) return self::normalize(json_decode($row['delivery_options'], true));
        if (!isset($row['delivery_time_days'])) return [];
        return self::normalize([['days'=>$row['delivery_time_days'], 'value'=>$row['delivery_price'] ?? '0', 'type'=>$row['delivery_price_type'] ?? 'amount']]);
    }
    public static function updateFirst($json, $days, $value, $type): ?string
    {
        if ($json === null) return null;
        $options = self::normalize(json_decode($json, true));
        $current = $options[0] ?? null;
        $replacement = $days === null ? null : ['days'=>$days, 'value'=>$value ?? '0', 'type'=>$type ?? 'amount'];
        if ($current !== null) array_shift($options);
        if ($replacement !== null) array_unshift($options, $replacement);
        return json_encode(self::normalize($options));
    }
    public static function catalog(PDO $pdo, int $productId): array
    {
        $stmt = $pdo->prepare('SELECT * FROM variations WHERE product_id = ?');
        $stmt->execute([$productId]); $variations = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) $variations[] = ['id'=>(int)$row['variation_id'], 'name'=>$row['name'], 'mode'=>$row['price_display_mode'] ?? 'prices', 'options'=>self::fromRow($row)];
        $stmt = $pdo->prepare('SELECT r.* FROM prices r JOIN variations v ON v.variation_id=r.variation_id WHERE v.product_id = ? ORDER BY r.min_quantity DESC, r.price_id DESC');
        $stmt->execute([$productId]); $prices=[];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) $prices[]=['id'=>(int)$row['price_id'], 'variationId'=>(int)$row['variation_id'], 'price'=>(float)$row['price'], 'min'=>(int)$row['min_quantity'], 'max'=>$row['max_quantity'] === null ? null : (int)$row['max_quantity'], 'options'=>self::fromRow($row)];
        return ['variations'=>$variations,'prices'=>$prices];
    }
}
