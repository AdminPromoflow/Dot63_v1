<?php
require_once __DIR__ . '/../model/prices.php';
require_once __DIR__ . '/../model/variations.php';
function check($condition, $message) { if (!$condition) throw new RuntimeException($message); }
foreach ([[null,null],['','percentage']] as [$value,$type]) check(DeliveryPrice::normalize($value,$type)===[null,null], 'Empty configuration');
foreach (['0','12.50','9999999999.99'] as $value) foreach (['amount','percentage'] as $type) check(DeliveryPrice::normalize($value,$type)===[$value,$type], 'Valid configuration');
foreach ([['-1','amount'],['abc','percentage'],['1.234','amount'],['10000000000','amount'],['10','invalid'],[[], 'amount'],[true,'amount'],['INF','amount']] as [$value,$type]) {
    try { DeliveryPrice::normalize($value,$type); throw new RuntimeException('Accepted invalid value'); } catch (InvalidArgumentException $expected) {}
}
// SQLite is isolated in memory. No MySQL migrations or data are changed.
// SQLite lacks MySQL's UPDATE ... LIMIT syntax; retain all bindings and predicates.
class DeliveryTestPDO extends PDO {
    public function prepare($query, $options = []) {
        if (preg_match('/^\s*UPDATE /i', $query)) $query = preg_replace('/\s+LIMIT 1\s*$/i', '', $query);
        return parent::prepare($query, $options);
    }
}
$pdo = new DeliveryTestPDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE TABLE variations (variation_id INTEGER PRIMARY KEY, SKU TEXT, name TEXT, product_id INTEGER, parent_id INTEGER, type_id INTEGER, name_pdf_artwork TEXT, delivery_price DECIMAL(12,2), delivery_price_type TEXT)');
$pdo->exec('CREATE TABLE prices (price_id INTEGER PRIMARY KEY, min_quantity INTEGER, max_quantity INTEGER, price REAL, variation_id INTEGER, delivery_price DECIMAL(12,2), delivery_price_type TEXT)');
$pdo->exec("INSERT INTO variations (variation_id,SKU,name,product_id) VALUES (1,'TEST','Default',1)");
$connection = new class($pdo) { private $pdo; function __construct($pdo) {$this->pdo=$pdo;} function getConnection() {return $this->pdo;} };
$price = new Prices($connection); $price->setSKUVariation('TEST'); $price->setMinQuantity(1); $price->setMaxQuantity(100); $price->setPrice('3.25');
foreach ([['12.50','percentage'],['2.75','amount'],['0','amount'],[null,null]] as [$value,$type]) {
    $price->setDeliveryPrice($value,$type); check($price->savePrice(),'Insert price');
    $rows=$price->getPricesBySKUVariation(); $last=end($rows);
    check($last['delivery_price_type']===$type && ($value===null ? $last['delivery_price']===null : (float)$last['delivery_price']===(float)$value),'Price round trip');
    check((float)$last['price']===3.25,'Base price unchanged');
}
$variation = new Variation($connection); $variation->setSKUVariation('TEST'); $variation->setSKUParentVariation('TEST'); $variation->setName('Default'); $variation->setIsAttachAnImage(0); $variation->setIsAttachAPDF(0);
foreach ([['15','percentage'],['4.25','amount'],['0','percentage'],[null,null]] as [$value,$type]) {
    $variation->setDeliveryPrice($value,$type); check($variation->updateVariationDetails(),'Update variation');
    $row=$pdo->query('SELECT delivery_price,delivery_price_type FROM variations')->fetch(PDO::FETCH_ASSOC);
    check($row['delivery_price_type']===$type && ($value===null ? $row['delivery_price']===null : (float)$row['delivery_price']===(float)$value),'Variation round trip');
}
echo "Delivery Price: validation, persistence, clearing and base-price preservation passed (SQLite memory).\n";
