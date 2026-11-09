<?php
/** Optional surcharge configuration; no customer pricing calculations. */
final class DeliveryPrice
{
    public static function normalize($value, $type): array
    {
        if ($value === null || $value === '') return [null, null];
        if (!is_scalar($value) || is_bool($value) || !preg_match('/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/D', (string)$value) || (float)$value > 9999999999.99) {
            throw new InvalidArgumentException('Delivery Price must be a non-negative number with at most 2 decimal places (maximum 9999999999.99).');
        }
        if (!in_array($type, ['percentage', 'amount'], true)) {
            throw new InvalidArgumentException('Select a valid Delivery Price type.');
        }
        return [(string)$value, $type];
    }

    public static function requireColumns(PDO $pdo, string $table): void
    {
        if (!in_array($table, ['variations', 'prices'], true)) throw new InvalidArgumentException('Invalid table.');
        $columns = $pdo->query("SHOW COLUMNS FROM `$table`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('delivery_price', $columns, true) || !in_array('delivery_price_type', $columns, true)) {
            throw new RuntimeException('Delivery Price is not available yet. Apply the Delivery Price SQL migration first.');
        }
    }
}
