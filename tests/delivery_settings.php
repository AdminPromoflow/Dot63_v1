<?php
require_once __DIR__ . '/../model/delivery_settings.php';
function verify($condition, $message) { if (!$condition) throw new RuntimeException($message); }
$pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE TABLE suppliers (supplier_id INTEGER, email TEXT); CREATE TABLE products (product_id INTEGER, supplier_id INTEGER, name TEXT, SKU TEXT); CREATE TABLE variations (variation_id INTEGER, product_id INTEGER, name TEXT, SKU TEXT, delivery_time_days INTEGER, delivery_price REAL, delivery_price_type TEXT, parent_id INTEGER); CREATE TABLE prices (price_id INTEGER, variation_id INTEGER, min_quantity INTEGER, max_quantity INTEGER, price REAL, delivery_time_days INTEGER, delivery_price REAL, delivery_price_type TEXT)');
$pdo->exec("INSERT INTO suppliers VALUES (1,'owner@example.com'), (2,'other@example.com'); INSERT INTO products VALUES (1,1,'Product One','P1'),(2,2,'Private Product','P2'),(3,1,'Product Three','P3'); INSERT INTO variations VALUES (1,1,'Flat','V1',8,25,'percentage',1),(2,1,'Z child','V2',NULL,NULL,NULL,1),(3,2,'Private','V3',10,15,'amount',NULL),(4,3,'Third','V4',0,0,'amount',NULL),(5,1,'A grandchild','V5',NULL,NULL,NULL,2),(6,1,'<script>name</script>','V6',NULL,NULL,NULL,1); INSERT INTO prices VALUES (1,2,1,99,3.25,NULL,NULL,NULL),(2,2,100,NULL,2.75,8,25,'percentage'),(3,3,1,NULL,5,NULL,NULL,NULL),(4,6,1,NULL,0,NULL,NULL,NULL),(5,5,1,NULL,NULL,NULL,NULL,NULL)");
$rows=DeliverySettings::variations($pdo,'OWNER@example.com','P1');
verify(array_map('intval',array_column($rows,'variation_id'))===[1,2,5,6],'Parent-child depth-first ordering');
verify(array_column($rows,'level')===[0,1,2,1],'Indentation levels');
verify(DeliverySettings::variations($pdo,'owner@example.com','P2')===[],'Cross-supplier product is inaccessible');
$prices=DeliverySettings::priceRows($pdo,'owner@example.com',$rows);
verify(array_map('intval',array_column($prices,'price_id'))===[1,2,4],'Only configured prices, including zero, in hierarchy and quantity order');
$base=$pdo->query('SELECT price FROM prices WHERE price_id=1')->fetchColumn();
$data=['delivery_time_days'=>'12','delivery_price'=>'5.50','delivery_price_type'=>'amount'];
DeliverySettings::save($pdo,'owner@example.com','variation','V2',$data);
DeliverySettings::save($pdo,'owner@example.com','price','1',$data);
verify((float)$pdo->query('SELECT delivery_price FROM prices WHERE price_id=1')->fetchColumn()===5.5,'Price surcharge saved');
verify((int)$pdo->query('SELECT delivery_time_days FROM variations WHERE variation_id=2')->fetchColumn()===12,'Variation days saved');
verify($pdo->query('SELECT price FROM prices WHERE price_id=1')->fetchColumn()===$base,'Base price unchanged');
verify((float)$pdo->query('SELECT delivery_price FROM prices WHERE price_id=2')->fetchColumn()===25.0,'Other quantity tier unchanged');
foreach ([['variation','V3'],['price','3']] as [$kind,$ref]) {
    try { DeliverySettings::save($pdo,'owner@example.com',$kind,$ref,$data); throw new RuntimeException('Cross-supplier write accepted'); } catch (InvalidArgumentException $expected) {}
}
foreach ([['delivery_time_days'=>'-1'],['delivery_price'=>'-2'],['delivery_price_type'=>'bad']] as $invalid) {
    try { DeliverySettings::save($pdo,'owner@example.com','price','1',array_merge($data,$invalid)); throw new RuntimeException('Invalid write accepted'); } catch (InvalidArgumentException $expected) {}
}
verify((float)$pdo->query('SELECT delivery_price FROM prices WHERE price_id=1')->fetchColumn()===5.5,'Invalid edits preserve stored configuration');
DeliverySettings::save($pdo,'owner@example.com','price','1',['delivery_time_days'=>'','delivery_price'=>'','delivery_price_type'=>'percentage']);
verify($pdo->query('SELECT delivery_price FROM prices WHERE price_id=1')->fetchColumn()===null,'Empty clears surcharge');
$loadError=false; $kind='variation'; $listRows=$rows;
$escape=static function($value) {return htmlspecialchars((string)$value,ENT_QUOTES,'UTF-8');};
ob_start(); require __DIR__.'/../view/delivery_times/list.php'; $html=ob_get_clean();
verify(strpos($html,'<script>name</script>')===false && strpos($html,'&lt;script&gt;name&lt;/script&gt;')!==false,'Names escaped');
verify(strpos($html,'padding-left: 40px')!==false && strpos($html,'delivery-edit-form')!==false,'Hierarchy is editable');
$kind='price';$listRows=$prices;
ob_start();require __DIR__.'/../view/delivery_times/list.php';$html=ob_get_clean();
verify(substr_count($html,'class="delivery-edit-form"')===3 && strpos($html,'Qty: 100–No limit')!==false,'Quantity tier forms');
$cycles=DeliverySettings::hierarchy([['product_id'=>1,'variation_id'=>1,'parent_id'=>2,'name'=>'A'],['product_id'=>1,'variation_id'=>2,'parent_id'=>1,'name'=>'B']]);
verify(count($cycles)===2,'Cycles are finite and visible');
echo "Delivery settings: hierarchy, tier filtering, editing, ownership, validation, clearing and rendering passed.\n";
