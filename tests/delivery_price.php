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
$pdo->exec('CREATE TABLE variations (variation_id INTEGER PRIMARY KEY, SKU TEXT, name TEXT, product_id INTEGER, parent_id INTEGER, type_id INTEGER, name_pdf_artwork TEXT, delivery_price DECIMAL(12,2), delivery_price_type TEXT, delivery_time_days INTEGER, delivery_options TEXT)');
$pdo->exec('CREATE TABLE prices (price_id INTEGER PRIMARY KEY, min_quantity INTEGER, max_quantity INTEGER, price REAL, variation_id INTEGER, delivery_price DECIMAL(12,2), delivery_price_type TEXT, delivery_time_days INTEGER, delivery_options TEXT)');
$pdo->exec("INSERT INTO variations (variation_id,SKU,name,product_id) VALUES (1,'TEST','Default',1)");
$connection = new class($pdo) { private $pdo; function __construct($pdo) {$this->pdo=$pdo;} function getConnection() {return $this->pdo;} };
$price = new Prices($connection); $price->setSKUVariation('TEST'); $price->setMinQuantity(1); $price->setMaxQuantity(100); $price->setPrice('3.25');
foreach ([['12.50','percentage'],['2.75','amount'],['0','amount'],[null,null]] as [$value,$type]) {
    $price->setDeliveryTimeDays($value === null ? null : 8); $price->setDeliveryPrice($value,$type); check($price->savePrice(),'Insert price');
    $rows=$price->getPricesBySKUVariation(); $last=end($rows);
    check($last['delivery_price_type']===$type && ($value===null ? $last['delivery_price']===null : (float)$last['delivery_price']===(float)$value),'Price round trip');
    check(($value === null ? $last['delivery_time_days'] === null : (int)$last['delivery_time_days'] === 8), 'Price delivery days round trip');
    check((float)$last['price']===3.25,'Base price unchanged');
}
$variation = new Variation($connection); $variation->setSKUVariation('TEST'); $variation->setSKUParentVariation('TEST'); $variation->setName('Default'); $variation->setIsAttachAnImage(0); $variation->setIsAttachAPDF(0);
foreach ([['15','percentage'],['4.25','amount'],['0','percentage'],[null,null]] as [$value,$type]) {
    $variation->setDeliveryTimeDays($value === null ? null : 10); $variation->setDeliveryPrice($value,$type); check($variation->updateVariationDetails(),'Update variation');
    $row=$pdo->query('SELECT delivery_time_days,delivery_price,delivery_price_type FROM variations')->fetch(PDO::FETCH_ASSOC);
    check(($value === null ? $row['delivery_time_days'] === null : (int)$row['delivery_time_days'] === 10), 'Variation delivery days round trip');
    check($row['delivery_price_type']===$type && ($value===null ? $row['delivery_price']===null : (float)$row['delivery_price']===(float)$value),'Variation round trip');
}
echo "Delivery Price: validation, persistence, clearing and base-price preservation passed (SQLite memory).\n";

foreach ([null, '', '0', 10, '65535'] as $value) check(DeliveryPrice::normalizeDays($value) === ($value === null || $value === '' ? null : (int)$value), 'Valid days');
foreach ([-1, '1.5', '65536', 'abc', [], true, '1e2'] as $value) {
    try { DeliveryPrice::normalizeDays($value); throw new RuntimeException('Invalid days accepted'); } catch (InvalidArgumentException $expected) {}
}
echo "Delivery Time: validation, persistence and clearing passed.\n";

$multiple = json_encode([['days'=>8,'value'=>'25','type'=>'percentage'],['days'=>10,'value'=>'5','type'=>'amount']]);
$price->setDeliveryOptions($multiple); $price->setDeliveryTimeDays(8); $price->setDeliveryPrice('30','percentage');
check($price->savePrice(),'Save legacy first option');
$last=$pdo->query('SELECT * FROM prices ORDER BY price_id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
check(count(json_decode($last['delivery_options'],true))===2,'Other price options preserved');
$pdo->prepare('UPDATE variations SET delivery_options=?')->execute([$multiple]);
$variation->setDeliveryTimeDays(null); $variation->setDeliveryPrice(null,null);
check($variation->updateVariationDetails(),'Clear first option');
$stored=$pdo->query('SELECT * FROM variations')->fetch(PDO::FETCH_ASSOC);
check((int)$stored['delivery_time_days']===10 && count(json_decode($stored['delivery_options'],true))===1,'Remaining option becomes the legacy default');
echo "Legacy editors preserve additional delivery options and synchronize the default.\n";
