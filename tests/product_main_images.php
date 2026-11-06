<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../model/products.php';
$pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec("CREATE TABLE products (product_id INTEGER, SKU TEXT, name TEXT, status TEXT, is_approved INTEGER, group_id INTEGER, description TEXT, descriptive_tagline TEXT);
CREATE TABLE categories (category_id INTEGER, name TEXT);
CREATE TABLE `groups` (group_id INTEGER, category_id INTEGER, name TEXT);
CREATE TABLE variations (variation_id INTEGER, product_id INTEGER, SKU TEXT, name TEXT, image TEXT, parent_id INTEGER, type_id INTEGER, price_display_mode TEXT);
CREATE TABLE images (image_id INTEGER, variation_id INTEGER, link TEXT, updated INTEGER, show_on_product_main INTEGER);
CREATE TABLE items (item_id INTEGER, variation_id INTEGER, name TEXT, description TEXT);
CREATE TABLE type_variations (type_id INTEGER, type_name TEXT);
CREATE TABLE prices (price_id INTEGER, variation_id INTEGER, min_quantity INTEGER, max_quantity INTEGER, price REAL);
INSERT INTO categories VALUES (1, 'Lanyards');
INSERT INTO `groups` VALUES (1, 1, 'Standard');
INSERT INTO products VALUES (1,'P1','Test one','1',1,1,'',''), (2,'P2','Test two','3',1,1,'',''), (3,'P3','Test empty','1',1,1,'','');
INSERT INTO type_variations VALUES (1,'Color');
INSERT INTO variations VALUES (1,1,'V1','Red','unchecked-legacy.jpg',NULL,1,'prices'), (2,2,'V2','Blue','unchecked-legacy.jpg',NULL,1,'prices'), (3,3,'V3','Green',NULL,NULL,1,'prices');
INSERT INTO images VALUES (1,1,'selected.jpg',1,1), (2,1,'hidden.jpg',1,0), (3,2,'combination-selected.jpg',1,1), (4,2,'combination-hidden.jpg',1,0), (5,3,'only-hidden.jpg',1,0);");
$model = new Products(new class($pdo) {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function getConnection() { return $this->pdo; }
});
function check($condition, $message) { if (!$condition) throw new RuntimeException($message); }
foreach ([$model->getProducts(), $model->searchProducts('Test'), $model->searchProducts('')] as $result) {
    check($result['success'], 'Catalog query succeeds');
    $products = array_column($result['result'], null, 'product_id');
    check(count($products) === 3, 'Products without selected images stay listed');
    check($products[1]['images'] === ['selected.jpg'], 'Only checked images in normal catalog and search');
    check($products[2]['images'] === ['combination-selected.jpg'], 'Only checked combination product images');
    check($products[3]['images'] === [], 'No unchecked fallback');
}
$result = $model->getStatusThreeEligibleVariations([2]);
check($result['success'], 'Combination query succeeds');
check(array_column($result['result'][0]['images'], 'link') === ['combination-selected.jpg'], 'Combination galleries exclude unchecked images');
$pdo->exec('UPDATE images SET show_on_product_main = 0');
foreach ($model->getProducts()['result'] as $product) check($product['images'] === [], 'All unchecked means empty galleries');
echo "PASS: catalog, search, combinations, unchecked images and products without selected images\n";
