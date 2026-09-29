<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../config/database.php';

/** Every supplied reference is resolved through its product and supplier. */
final class CatalogAccess
{
    private const ROUTES = [
        'product' => [
            'create_new_product' => [true, []],
            'get_all_products_supplier' => [false, []],
            'get_products_by_group' => [false, ['sku' => 'product']],
            'get_editor_selection' => [false, ['sku' => 'product']],
            'get_product_details' => [false, ['sku' => 'product']],
            'get_preview_product_details' => [false, ['sku' => 'product']],
            'get_default_variation_by_sku' => [false, ['sku' => 'product']],
            'update_category' => [true, ['sku' => 'product']],
            'update_group' => [true, ['sku' => 'product']],
            'save_product_details' => [true, ['sku' => 'product']],
            'publish_product' => [true, ['sku' => 'product']],
            'delete_product' => [true, ['sku' => 'product']],
        ],
        'category' => [
            'get_categories' => [false, ['sku' => 'product']],
            'get_category_selected' => [false, ['sku' => 'product']],
            'create_new_category' => [true, ['sku' => 'product']],
            'create_new_group' => [true, ['sku' => 'product']],
        ],
        'group' => [
            'get_groups' => [false, ['sku' => 'product']],
            'get_group_selected' => [false, ['sku' => 'product']],
            'create_new_group' => [true, ['sku' => 'product']],
        ],
        'variations' => [
            'create_new_variation' => [true, ['sku' => 'product']],
            'get_sku_default_variation' => [false, ['sku' => 'product']],
            'get_variation_details' => [false, ['sku' => 'product', 'sku_variation' => 'variation']],
            'save_variation_details' => [true, ['sku_product' => 'product', 'sku_variation' => 'variation']],
            'update_group_name' => [true, ['sku_variation' => 'variation']],
            'delete_variation' => [true, ['sku_variation' => 'variation']],
        ],
        'image' => [
            'get_images_details' => [false, ['sku' => 'product', 'sku_variation' => 'variation']],
            'create_update_images' => [true, ['sku_product' => 'product', 'sku_variation' => 'variation']],
            'delete_image' => [true, ['sku_variation' => 'variation']],
        ],
        'price' => [
            'get_prices_details' => [false, ['sku_variation' => 'variation']],
            'create_prices' => [true, ['sku_variation' => 'variation']],
            'delete_price' => [true, ['id_price' => 'price']],
        ],
        'item' => [
            'get_items_details' => [false, ['sku_variation' => 'variation']],
            'create_items' => [true, ['sku_variation' => 'variation']],
            'delete_item' => [true, ['id_item' => 'item']],
        ],
        'parameters' => ['check_parameters' => [false, ['sku' => 'product', 'sku_variation' => 'variation']]],
    ];

    public static function enforce(string $module, array $data): void
    {
        Dot63Security::post();
        $action = is_string($data['action'] ?? null) ? $data['action'] : '';
        if ($module === 'product' && in_array($action, ['get_products', 'search_products', 'get_status_three_variations'], true)) {
            return;
        }
        $email = Dot63Security::supplierEmail();
        $rule = self::ROUTES[$module][$action] ?? null;
        if ($rule === null) Dot63Security::fail(400, 'Unsupported action.');
        if ($rule[0]) Dot63Security::csrf($data);
        try {
            $pdo = (new Database())->getConnection();
            if (!$pdo instanceof PDO) throw new RuntimeException('Database unavailable');
            $required = $rule[1];
            // Optional references must not point to another supplier or another product.
            $references = $required + array_intersect_key([
                'sku' => 'product', 'sku_product' => 'product',
                'sku_variation' => 'variation', 'sku_parent_variation' => 'variation',
            ], $data);
            $productId = null;
            foreach ($references as $key => $type) {
                $value = $data[$key] ?? null;
                if (!array_key_exists($key, $required) && ($value === null || $value === '')) continue;
                if ((!is_string($value) && !is_int($value)) || trim((string)$value) === '') {
                    Dot63Security::fail(422, 'A valid product reference is required.');
                }
                $resolved = self::ownedProductId($pdo, $type, (string)$value, $email);
                if ($resolved === null || ($productId !== null && $productId !== $resolved)) {
                    Dot63Security::fail(403, 'You cannot access this product or variation.');
                }
                $productId = $resolved;
            }
        } catch (Throwable $error) {
            error_log('Catalog authorization failed: ' . $error->getMessage());
            Dot63Security::fail(503, 'The catalog is temporarily unavailable.');
        }
    }

    public static function ownedProductId(PDO $pdo, string $type, string $reference, string $email): ?int
    {
        $joins = '';
        switch ($type) {
            case 'product': $predicate = 'p.SKU = :reference'; break;
            case 'variation':
                $joins = ' JOIN variations v ON v.product_id = p.product_id';
                $predicate = 'v.SKU = :reference'; break;
            case 'price':
                $joins = ' JOIN variations v ON v.product_id = p.product_id JOIN prices r ON r.variation_id = v.variation_id';
                $predicate = 'r.price_id = :reference'; break;
            case 'item':
                $joins = ' JOIN variations v ON v.product_id = p.product_id JOIN items i ON i.variation_id = v.variation_id';
                $predicate = 'i.item_id = :reference'; break;
            default: throw new InvalidArgumentException('Unknown reference type.');
        }
        if (in_array($type, ['price', 'item'], true) && (!ctype_digit($reference) || (int)$reference <= 0)) return null;
        $statement = $pdo->prepare('SELECT p.product_id FROM products p JOIN suppliers s ON s.supplier_id = p.supplier_id'
            . $joins . ' WHERE ' . $predicate . ' AND LOWER(s.email) = :owner LIMIT 1');
        $statement->execute([':reference' => $reference, ':owner' => strtolower(trim($email))]);
        $id = $statement->fetchColumn();
        return $id === false ? null : (int)$id;
    }
}
