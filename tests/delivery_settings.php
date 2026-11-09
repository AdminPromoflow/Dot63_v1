<?php
require_once __DIR__ . '/../model/delivery_settings.php';
function verify($condition, $message) { if (!$condition) throw new RuntimeException($message); }
$pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE TABLE suppliers (supplier_id INTEGER, email TEXT); CREATE TABLE products (product_id INTEGER, supplier_id INTEGER, name TEXT, SKU TEXT); CREATE TABLE variations (variation_id INTEGER, product_id INTEGER, name TEXT, SKU TEXT, delivery_time_days INTEGER, delivery_price REAL, delivery_price_type TEXT)');
$pdo->exec("INSERT INTO suppliers VALUES (1,'owner@example.com'), (2,'other@example.com'); INSERT INTO products VALUES (1,1,'Product One','P1'),(2,2,'Private Product','P2'),(3,1,'Product Three','P3'); INSERT INTO variations VALUES (1,1,'<script>name</script>','V1',8,25,'percentage'),(2,1,'Second','V2',NULL,NULL,NULL),(3,2,'Private','V3',10,15,'amount'),(4,3,'Third','V4',0,0,'amount')");
$rows=DeliverySettings::variations($pdo,'OWNER@example.com');
verify(count($rows)===3,'Supplier can see only their variations');
verify(count(DeliverySettings::variations($pdo,'owner@example.com','P1'))===2,'Product filter');
verify(DeliverySettings::variations($pdo,'owner@example.com','P2')===[],'Cross-supplier product is inaccessible');
verify(DeliverySettings::formatPrice(['delivery_price'=>0,'delivery_price_type'=>'amount'])==='£0.00 GBP','Zero amount is configured');
verify(DeliverySettings::formatPrice(['delivery_price'=>25,'delivery_price_type'=>'percentage'])==='25.00%','Percentage formatting');
verify(DeliverySettings::formatPrice([])==='Not set','Missing migration compatibility');
$loadError=false;
$escape=static function($value) {return htmlspecialchars((string)$value,ENT_QUOTES,'UTF-8');};
ob_start(); require __DIR__.'/../view/delivery_times/list.php'; $html=ob_get_clean();
verify(strpos($html,'<script>name</script>')===false && strpos($html,'&lt;script&gt;name&lt;/script&gt;')!==false,'Names escaped');
verify(strpos($html,'Not set')!==false && strpos($html,'£0.00 GBP')!==false,'Empty versus zero values');
echo "Delivery overview: supplier ownership, product filtering, formatting and safe rendering passed.\n";
