<?php

require_once __DIR__ . '/../model/products.php';

final class PublicCatalogDatabase
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getConnection(): PDO
    {
        return $this->pdo;
    }
}

function assertPublicCatalog(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE categories (category_id INTEGER PRIMARY KEY, name TEXT)');
$pdo->exec('CREATE TABLE `groups` (group_id INTEGER PRIMARY KEY, name TEXT, category_id INTEGER)');
$pdo->exec('CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    SKU TEXT,
    name TEXT,
    description TEXT,
    descriptive_tagline TEXT,
    is_approved INTEGER,
    group_id INTEGER
)');
$pdo->exec('CREATE TABLE type_variations (type_id INTEGER PRIMARY KEY, type_name TEXT)');
$pdo->exec('CREATE TABLE variations (
    variation_id INTEGER PRIMARY KEY,
    name TEXT,
    SKU TEXT,
    parent_id INTEGER,
    product_id INTEGER,
    type_id INTEGER
)');
$pdo->exec('CREATE TABLE images (image_id INTEGER PRIMARY KEY, variation_id INTEGER, link TEXT)');
$pdo->exec('CREATE TABLE items (item_id INTEGER PRIMARY KEY, variation_id INTEGER, name TEXT)');

$pdo->exec("INSERT INTO categories VALUES (1, 'Giveaways')");
$pdo->exec("INSERT INTO `groups` VALUES (1, 'Giveaways - Lanyards', 1)");
$pdo->exec("INSERT INTO type_variations VALUES
    (1, 'Theme'),
    (2, 'Material'),
    (3, 'Width'),
    (4, 'Print Technique'),
    (5, 'Printed Sides'),
    (6, 'Colour')");

$insertProduct = $pdo->prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?)');
$insertProduct->execute([1, 'SOURCE-SL', 'Super Lanyard', 'Source', '', 1, 1]);
$insertProduct->execute([2, 'SLY-TUBULAR', 'Super Lanyard — Tubular — Polyester — 15mm — Screen Print — One Side — Full Colour', '', '', 1, 1]);
$insertProduct->execute([3, 'SLY-FLAT', 'Super Lanyard — Flat — Polyester — 20mm — Dye Sublimation — Two Sides — One Colour', '', '', 1, 1]);
$insertProduct->execute([4, 'NORMAL-1', 'Umbrella', '', '', 1, 1]);

$insertVariation = $pdo->prepare('INSERT INTO variations VALUES (?, ?, ?, ?, ?, ?)');
$variationId = 1;
$leafSkus = [];
foreach ([
    2 => ['Tubular', 'Polyester', '15mm', 'Screen Print', 'One Side', 'Full Colour'],
    3 => ['Flat', 'Polyester', '20mm', 'Dye Sublimation', 'Two Sides', 'One Colour'],
] as $productId => $values) {
    $parentId = null;
    $insertVariation->execute([$variationId, 'Default', 'DEFAULT-' . $productId, null, $productId, null]);
    $parentId = $variationId++;

    foreach ($values as $offset => $value) {
        $sku = 'VAR-' . $productId . '-' . ($offset + 1);
        $insertVariation->execute([$variationId, $value, $sku, $parentId, $productId, $offset + 1]);
        $parentId = $variationId++;
        if ($offset === 5) {
            $leafSkus[$productId] = $sku;
        }
    }
}

$insertVariation->execute([$variationId, 'Full Colour', 'SOURCE-COLOUR', null, 1, 6]);
$variationId++;
$insertVariation->execute([$variationId, 'Default', 'NORMAL-DEFAULT', null, 4, null]);

$products = new Products(new PublicCatalogDatabase($pdo));
$catalog = $products->getProducts();
assertPublicCatalog($catalog['success'] === true, 'Public catalogue query should succeed.');
assertPublicCatalog(count($catalog['result']) === 3, 'The source product must be replaced by two generated combinations.');

$bySku = [];
foreach ($catalog['result'] as $product) {
    $bySku[$product['SKU']] = $product;
}

assertPublicCatalog(!isset($bySku['SOURCE-SL']), 'The editable Super Lanyard source must not be public.');
assertPublicCatalog(isset($bySku['SLY-TUBULAR'], $bySku['SLY-FLAT']), 'Every generated combination must be returned.');
assertPublicCatalog(
    $bySku['SLY-TUBULAR']['super_lanyard_variation_sku'] === $leafSkus[2],
    'The public card must expose the final Colour variation SKU.'
);
assertPublicCatalog(isset($bySku['NORMAL-1']), 'Unrelated products must remain in the catalogue.');

$tubularSearch = $products->searchProducts('Tubular');
assertPublicCatalog(count($tubularSearch['result']) === 1, 'Title search must find the matching generated combination.');
assertPublicCatalog($tubularSearch['result'][0]['SKU'] === 'SLY-TUBULAR', 'Title search returned the wrong combination.');

$superSearch = $products->searchProducts('Super Lanyard');
assertPublicCatalog(count($superSearch['result']) === 2, 'Super Lanyard search must return combinations, not the source.');
foreach ($superSearch['result'] as $product) {
    assertPublicCatalog((int)$product['is_super_lanyard_generated'] === 1, 'Super Lanyard search mixed a non-generated product.');
}

echo "Public Super Lanyard catalogue tests passed.\n";

