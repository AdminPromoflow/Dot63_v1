<?php

require_once __DIR__ . '/../model/super_lanyard_generator.php';

class SuperLanyardTestDatabase
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

function assertSameValue($expected, $actual, string $message): void
{
    if ($expected !== $actual) {
        throw new RuntimeException(sprintf(
            "%s\nExpected: %s\nActual: %s",
            $message,
            var_export($expected, true),
            var_export($actual, true)
        ));
    }
}

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->sqliteCreateFunction('GET_LOCK', static fn(string $name, int $timeout): int => 1, 2);
$pdo->sqliteCreateFunction('RELEASE_LOCK', static fn(string $name): int => 1, 1);

$pdo->exec('CREATE TABLE suppliers (
    supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL
)');
$pdo->exec('CREATE TABLE products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    SKU TEXT,
    name TEXT,
    description TEXT,
    descriptive_tagline TEXT,
    status TEXT,
    date_status TEXT,
    is_approved INTEGER NOT NULL DEFAULT 0,
    supplier_id INTEGER,
    group_id INTEGER
)');
$pdo->exec('CREATE TABLE type_variations (
    type_id INTEGER PRIMARY KEY,
    type_name TEXT
)');
$pdo->exec('CREATE TABLE variations (
    variation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    SKU TEXT,
    image TEXT,
    parent_id INTEGER,
    product_id INTEGER,
    type_id INTEGER
)');
$pdo->exec('CREATE TABLE images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    variation_id INTEGER,
    link TEXT
)');
$pdo->exec('CREATE TABLE prices (
    price_id INTEGER PRIMARY KEY AUTOINCREMENT,
    variation_id INTEGER,
    price REAL
)');

$pdo->exec("INSERT INTO suppliers (email) VALUES ('supplier@example.com')");
$pdo->exec("INSERT INTO products (
    SKU, name, description, descriptive_tagline, status, date_status,
    is_approved, supplier_id, group_id
) VALUES (
    'SOURCE-SL', 'Super Lanyard', 'Source description', 'Source tagline',
    'active', '12:00:00', 1, 1, 9
)");

$types = [
    1 => 'Theme',
    2 => 'Material',
    3 => 'Width',
    4 => 'Print Technique',
    5 => 'Printed Sides',
    6 => 'Colour',
];
$options = [
    1 => ['Tubular', 'Flat'],
    2 => ['Polyester'],
    3 => ['15mm', '20mm'],
    4 => ['Screen print'],
    5 => ['One side', 'Two sides'],
    6 => ['One colour', 'Two colours'],
];

$insertType = $pdo->prepare('INSERT INTO type_variations (type_id, type_name) VALUES (?, ?)');
$insertOption = $pdo->prepare('INSERT INTO variations (name, SKU, product_id, type_id) VALUES (?, ?, 1, ?)');
$firstOptionIds = [];
foreach ($types as $typeId => $typeName) {
    $insertType->execute([$typeId, $typeName]);
    foreach ($options[$typeId] as $index => $optionName) {
        $insertOption->execute([$optionName, "SOURCE-{$typeId}-{$index}", $typeId]);
        if ($index === 0) {
            $firstOptionIds[$typeId] = (int)$pdo->lastInsertId();
        }
    }
}

// The source contains one complete path. The Products catalogue assertion
// below verifies that this editable source path is not mixed with SLY-* rows.
$updateParent = $pdo->prepare('UPDATE variations SET parent_id = ? WHERE variation_id = ?');
for ($typeId = 2; $typeId <= 6; $typeId++) {
    $updateParent->execute([$firstOptionIds[$typeId - 1], $firstOptionIds[$typeId]]);
}

$generator = new SuperLanyardGenerator(new SuperLanyardTestDatabase($pdo));
$preview = $generator->preview('supplier@example.com');

assertSameValue(true, $preview['success'], 'Preview must succeed.');
assertSameValue(16, $preview['total_combinations'], 'Preview must calculate the full Cartesian product.');
assertSameValue(0, $preview['existing_combinations'], 'No generated combination should exist initially.');
assertSameValue(
    'Super Lanyard — Tubular — Polyester — 15mm — Screen print — One side — One colour',
    $preview['preview'][0]['title'],
    'The generated title must follow the required dimension order.'
);

$generation = $generator->generate(
    'supplier@example.com',
    $preview['definition_signature'],
    (int)$preview['source']['product_id']
);

assertSameValue(true, $generation['success'], 'Generation must finish without errors.');
assertSameValue(16, $generation['created'], 'Every pending Cartesian combination must be created.');
assertSameValue(0, $generation['skipped'], 'The first generation must not skip combinations.');
assertSameValue(0, $generation['errors_count'], 'The first generation must report no errors.');
assertSameValue(17, (int)$pdo->query('SELECT COUNT(*) FROM products')->fetchColumn(), 'Source plus 16 products must exist.');
assertSameValue(
    112,
    (int)$pdo->query("SELECT COUNT(*) FROM variations WHERE product_id IN (SELECT product_id FROM products WHERE SKU LIKE 'SLY-%')")->fetchColumn(),
    'Each generated product must store Default plus the six typed variation values.'
);

$secondPreview = $generator->preview('supplier@example.com');
assertSameValue(16, $secondPreview['existing_combinations'], 'A second preview must identify every duplicate.');
assertSameValue(0, $secondPreview['pending_combinations'], 'No combination should remain pending.');

$secondGeneration = $generator->generate(
    'supplier@example.com',
    $secondPreview['definition_signature'],
    (int)$secondPreview['source']['product_id']
);
assertSameValue(0, $secondGeneration['created'], 'Idempotent generation must create no duplicates.');
assertSameValue(16, $secondGeneration['skipped'], 'Idempotent generation must report all duplicates as skipped.');

$andFilter = $pdo->query("
    SELECT COUNT(*)
    FROM products p
    WHERE p.SKU LIKE 'SLY-%'
      AND EXISTS (
        SELECT 1 FROM variations v
        WHERE v.product_id = p.product_id AND v.type_id = 1 AND v.name = 'Tubular'
      )
      AND EXISTS (
        SELECT 1 FROM variations v
        WHERE v.product_id = p.product_id AND v.type_id = 2 AND v.name = 'Polyester'
      )
      AND EXISTS (
        SELECT 1 FROM variations v
        WHERE v.product_id = p.product_id AND v.type_id = 3 AND v.name = '15mm'
      )
")->fetchColumn();
assertSameValue(4, (int)$andFilter, 'Theme + Material + Width must combine with AND logic.');

$titleSearch = $pdo->prepare("SELECT COUNT(*) FROM products WHERE name LIKE :search AND SKU LIKE 'SLY-%'");
$titleSearch->execute([':search' => '%Tubular — Polyester — 15mm%']);
assertSameValue(4, (int)$titleSearch->fetchColumn(), 'Text search must find generated products by title.');

require_once __DIR__ . '/../model/products.php';
$productsModel = new Products(new SuperLanyardTestDatabase($pdo));
$productsModel->setSku('SOURCE-SL');
$catalogResponse = $productsModel->getProductsByGroupId();

assertSameValue('super_lanyard', $catalogResponse['catalog_type'], 'Products must activate the exclusive Super Lanyard catalogue.');
assertSameValue(16, count($catalogResponse['catalog']['products']), 'Products must expose every generated Cartesian combination once.');
foreach ($catalogResponse['catalog']['products'] as $catalogProduct) {
    assertSameValue(
        true,
        strpos((string)$catalogProduct['product_sku'], 'SLY-') === 0,
        'Products filters must never mix the editable source product into generated combinations.'
    );
}

$catalogAndFilter = array_filter(
    $catalogResponse['catalog']['products'],
    static fn(array $product): bool =>
        ($product['configuration']['theme'] ?? null) === 'Tubular'
        && ($product['configuration']['material'] ?? null) === 'Polyester'
        && ($product['configuration']['width'] ?? null) === '15mm'
);
assertSameValue(4, count($catalogAndFilter), 'Products catalogue filters must combine dimensions with AND.');

$catalogTitleSearch = array_filter(
    $catalogResponse['catalog']['products'],
    static fn(array $product): bool =>
        strpos((string)$product['title'], 'Tubular — Polyester — 15mm') !== false
);
assertSameValue(4, count($catalogTitleSearch), 'Products catalogue search must use the generated title.');

echo "Super Lanyard generator tests passed.\n";
