<?php
require_once __DIR__.'/../model/delivery_settings.php';
function checkOption($value,$message){if(!$value)throw new RuntimeException($message);}
class DeliveryOptionsPDO extends PDO {
 public function query($query, ?int $fetchMode = null, ...$fetchModeArgs) {
  if (preg_match('/SHOW COLUMNS FROM `(variations|prices)`/', $query,$m)) return parent::query("SELECT name FROM pragma_table_info('".$m[1]."')");
  return parent::query($query);
 }
}
$pdo=new DeliveryOptionsPDO('sqlite::memory:',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$pdo->exec("CREATE TABLE suppliers(supplier_id INTEGER,email TEXT); CREATE TABLE products(product_id INTEGER,supplier_id INTEGER,name TEXT,SKU TEXT); CREATE TABLE variations(variation_id INTEGER, product_id INTEGER,name TEXT,SKU TEXT,price_display_mode TEXT,delivery_time_days INTEGER,delivery_price REAL,delivery_price_type TEXT,delivery_options TEXT); CREATE TABLE prices(price_id INTEGER,variation_id INTEGER,min_quantity INTEGER,max_quantity INTEGER,price REAL,delivery_time_days INTEGER,delivery_price REAL,delivery_price_type TEXT,delivery_options TEXT); INSERT INTO suppliers VALUES(1,'test@example.test'); INSERT INTO products VALUES(1,1,'Test','P'); INSERT INTO variations VALUES(1,1,'Flat','V','prices',10,5,'amount',NULL); INSERT INTO prices VALUES(1,1,1,100,2,10,3,'percentage',NULL)");
$options=[['days'=>10,'value'=>'5','type'=>'amount'],['days'=>8,'value'=>'25','type'=>'percentage']];
foreach(['variation'=>'V','price'=>'1'] as $kind=>$id){$result=DeliverySettings::save($pdo,'test@example.test',$kind,$id,['options'=>$options]);checkOption(count($result['options'])===2,'Save multiple options');}
$catalog=DeliveryOptions::catalog($pdo,1);
checkOption($catalog['variations'][0]['options'][0]['days']===8,'Round trip order');
checkOption(count($catalog['prices'][0]['options'])===2,'Price options round trip');
checkOption(DeliveryOptions::catalog($pdo,2)['variations']===[],'Product scoping');
$updated=DeliveryOptions::updateFirst(json_encode($options),8,'30','percentage');
checkOption(count(json_decode($updated,true))===2,'Legacy edit preserves other options');
foreach([[['days'=>8,'value'=>1,'type'=>'amount'],['days'=>8,'value'=>2,'type'=>'amount']],[['days'=>-1,'value'=>1,'type'=>'amount']],[['days'=>8,'value'=>-1,'type'=>'amount']],[['days'=>8,'value'=>1,'type'=>'invalid']]] as $bad){try{DeliverySettings::save($pdo,'test@example.test','variation','V',['options'=>$bad]);throw new RuntimeException('Invalid options accepted');}catch(InvalidArgumentException $expected){}}
checkOption(count(DeliveryOptions::catalog($pdo,1)['variations'][0]['options'])===2,'Invalid save preserves options');
DeliverySettings::save($pdo,'test@example.test','variation','V',['options'=>[]]);
checkOption(DeliveryOptions::catalog($pdo,1)['variations'][0]['options']===[],'Clear options');
checkOption(DeliveryOptions::fromRow(['delivery_time_days'=>10,'delivery_price'=>0,'delivery_price_type'=>'amount'])[0]['value']==='0','Legacy free delivery');
echo "Delivery options: multiple values, validation, clearing, legacy fallback and scoped catalog passed.\n";
