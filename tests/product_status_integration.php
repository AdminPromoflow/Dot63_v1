<?php
declare(strict_types=1);

require_once __DIR__ . '/../controller/config/database.php';
require_once __DIR__ . '/../model/products.php';
require_once __DIR__ . '/../model/jobs.php';

if (strpos((string)getenv('DOT63_DB_NAME'), 'dot63_status_test_') !== 0) {
    throw new RuntimeException('Use a disposable dot63_status_test_ database for this test.');
}
function statusCheck(bool $ok, string $message): void {
    if (!$ok) throw new RuntimeException($message);
}
function statusError(callable $action, int $code): void {
    try { $action(); } catch (Throwable $error) {
        statusCheck($error->getCode() === $code, 'Wrong error: ' . $error->getMessage());
        return;
    }
    throw new RuntimeException('Expected an error with code ' . $code);
}
$database = new Database();
$pdo = $database->getConnection();
$pdo->exec("INSERT INTO suppliers (email,company_name) VALUES ('status-test@example.test','Status Test')");
$supplierId = (int)$pdo->lastInsertId();
$pdo->exec("INSERT INTO categories (name,approved) VALUES ('Test category',1)");
$categoryId = (int)$pdo->lastInsertId();
$pdo->exec("INSERT INTO `groups` (name,approved,category_id) VALUES ('Test group',1,$categoryId)");
$groupId = (int)$pdo->lastInsertId();
$pdo->exec("INSERT INTO type_variations (type_name,category_id) VALUES ('Colour',$categoryId)");
$typeId = (int)$pdo->lastInsertId();
$pdo->exec("INSERT INTO products (SKU,name,description,supplier_id,group_id) VALUES ('STATUS-TEST','Test product','Product for status review',$supplierId,$groupId)");
$productId = (int)$pdo->lastInsertId();
$pdo->exec("INSERT INTO variations (product_id,name,type_id) VALUES ($productId,'Blue',$typeId)");
$variationId = (int)$pdo->lastInsertId();
$pdo->exec("INSERT INTO images (variation_id,link) VALUES ($variationId,'test.png')");
$pdo->exec("INSERT INTO prices (variation_id,min_quantity,max_quantity,price) VALUES ($variationId,1,100,2.50)");
$priceId = (int)$pdo->lastInsertId();
$workflow = new ProductStatus($database);
$products = new Products($database);
$notices = [];
$notify = static function (array $product) use (&$notices): bool { $notices[] = $product; return true; };
$read = static fn() => $workflow->getOwned('STATUS-TEST', 'status-test@example.test');
$save = static function (int $target, array $extra = []) use ($workflow, $read, $notify): array {
    return $workflow->saveDetails('STATUS-TEST', 'status-test@example.test', array_merge([
        'status' => $target, 'status_request_version' => $read()['status_request_version'],
    ], $extra), $notify);
};
statusCheck($read()['status'] === 0, 'New products must be Draft.');
$save(0, ['description'=>'A saved draft']);
statusCheck(count($notices) === 0, 'Saving a draft without changing its status sent an approval request.');
statusError(fn() => $workflow->saveDetails('STATUS-TEST', 'another@example.test', ['status'=>1,'status_request_version'=>0], $notify), 403);
statusError(fn() => $workflow->saveDetails('STATUS-TEST', 'status-test@example.test', ['status'=>'active','status_request_version'=>0], $notify), 422);
statusError(fn() => $save(1, ['description'=>'']), 422);
statusError(fn() => $workflow->saveDetails('STATUS-TEST', 'status-test@example.test', ['status'=>1,'status_request_version'=>0], static fn() => false), 502);
statusCheck($read()['pending_status'] === null && $read()['status'] === 0, 'Failed notification changed the status.');

foreach ([1, 2, 3, 0] as $target) {
    $old = $read()['status'];
    $save($target);
    $pending = $read();
    statusCheck($pending['status'] === $old && $pending['pending_status'] === $target, 'A status changed before approval.');
    $count = count($notices);
    $save($target);
    statusCheck(count($notices) === $count, 'Repeated save resent the same request.');
    $queue = $products->getPendingProducts();
    statusCheck(count($queue['result']) === 1 && $queue['result'][0]['pending_status'] === $target, 'Request absent from Promoflow queue.');
    statusError(fn() => $workflow->approve('STATUS-TEST', $pending['status_request_version'] - 1, $target), 409);
    $result = $workflow->approve('STATUS-TEST', $pending['status_request_version'], $target);
    statusCheck($result['status'] === $target && $read()['pending_status'] === null, 'The approved target was not applied.');
    statusCheck(count($products->getPendingProducts()['result']) === 0, 'Approved request stayed pending.');
    statusError(fn() => $workflow->approve('STATUS-TEST', $pending['status_request_version'], $target), 409);
}

$save(2);
$oldReview = $read();
$save(3);
statusError(fn() => $workflow->approve('STATUS-TEST', $oldReview['status_request_version'], 2), 409);
$currentReview = $read();
$save(3, ['description'=>'Updated while under review']);
statusError(fn() => $workflow->approve('STATUS-TEST', $currentReview['status_request_version'], 3), 409);
statusCheck($products->approveProductWithSKU() === false, 'Legacy approval bypass remains enabled.');
statusCheck(!$products->updateStatus($productId, 1)['success'], 'Direct status update bypass remains enabled.');
$cartResult = (new Jobs($database))->addProductToJobs([
    'sku'=>'STATUS-TEST', 'quantity'=>1, 'price_id'=>$priceId, 'variation_ids'=>[$variationId],
], 'customer@example.test');
statusCheck(!$cartResult['success'] && $cartResult['status'] === 404, 'An approved draft can still be purchased.');

// Existing publication requests use status=2 and is_approved=0 without a separate pending field.
$pdo->exec("INSERT INTO products (SKU,name,description,supplier_id,group_id,status,is_approved) VALUES ('LEGACY-STATUS','Legacy request','Existing pending publication',$supplierId,$groupId,2,0)");
$legacy = $workflow->getOwned('LEGACY-STATUS', 'status-test@example.test');
statusCheck($legacy['status'] === 0 && $legacy['pending_status'] === 2, 'Legacy publication request was lost.');
$pdo->exec("DELETE FROM products WHERE SKU='LEGACY-STATUS'");

// Exercise both real HTTP controllers with an isolated database and shared test sessions.
// No SMTP call is made: requests above use the recording callback, and HTTP requests only approve.
$php = PHP_BINARY;
$root = dirname(__DIR__);
$promoRoot = dirname($root) . '/Promoflow_v1';
$temp = sys_get_temp_dir() . '/dot63-status-' . bin2hex(random_bytes(5));
mkdir($temp, 0700);
session_save_path($temp);
$adminSession = 'admin' . bin2hex(random_bytes(8));
session_id($adminSession); session_start();
$_SESSION = ['is_logged'=>true, 'user_email'=>'admin@example.test'];
session_write_close();
$supplierSession = 'supplier' . bin2hex(random_bytes(8));
session_id($supplierSession); session_start();
$_SESSION = ['login'=>true, 'email'=>'status-test@example.test'];
session_write_close();
$ports = [];
foreach ([0,1] as $i) {
    $socket = stream_socket_server('tcp://127.0.0.1:0');
    $ports[] = (int)substr(strrchr(stream_socket_get_name($socket, false), ':'), 1);
    fclose($socket);
}
$servers = [];
$env = array_merge(getenv(), ['DOT63_WEBHOOK_URL'=>'http://127.0.0.1:' . $ports[0] . '/controller/promoflow/promoflow_webhook.php']);
$request = static function (int $port, string $path, array $data, string $session = ''): array {
    $curl = curl_init('http://127.0.0.1:' . $port . $path);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_POST=>true,
        CURLOPT_HTTPHEADER=>['Content-Type: application/json'], CURLOPT_POSTFIELDS=>json_encode($data),
        CURLOPT_COOKIE=>'PHPSESSID=' . $session, CURLOPT_TIMEOUT=>10]);
    $body = curl_exec($curl); $code = curl_getinfo($curl, CURLINFO_HTTP_CODE); curl_close($curl);
    $json = json_decode((string)$body, true);
    statusCheck(is_array($json), 'Invalid HTTP JSON: ' . substr((string)$body, 0, 400));
    return [$code, $json];
};
try {
    foreach ([$root, $promoRoot] as $i=>$documentRoot) {
        $servers[] = proc_open([$php, '-d', 'session.save_path=' . $temp, '-S', '127.0.0.1:' . $ports[$i], '-t', $documentRoot],
            [0=>['pipe','r'], 1=>['file',$temp.'/server'.$i.'.log','a'], 2=>['file',$temp.'/server'.$i.'.log','a']], $pipes, $documentRoot, $env);
    }
    foreach ($ports as $port) {
        for ($i=0; $i<50; $i++) {
            $connection = @fsockopen('127.0.0.1', $port, $errno, $error, 0.1);
            if ($connection) { fclose($connection); break; }
            usleep(20000);
        }
    }
    $pending = $read();
    $payload = ['action'=>'approve_product','sku'=>'STATUS-TEST', 'requested_status'=>3, 'status_request_version'=>$pending['status_request_version']];
    [$code] = $request($ports[0], '/controller/promoflow/promoflow_webhook.php', $payload);
    statusCheck($code === 401, 'Unauthenticated direct approval was accepted.');
    [$code] = $request($ports[1], '/controller/dot63/requests_63_api.php', $payload, $supplierSession);
    statusCheck($code === 401, 'A supplier session can approve changes.');
    [$code,$queue] = $request($ports[1], '/controller/dot63/requests_63_api.php', ['action'=>'get_API_overview_data']);
    statusCheck($code === 200 && count($queue['result']) === 1, 'Promoflow could not read the pending queue.');
    [$code,$preview] = $request($ports[1], '/controller/dot63/requests_63_api.php', ['action'=>'get_preview_product_details','sku'=>'STATUS-TEST']);
    statusCheck($code === 200 && $preview[3]['product_details']['pending_status'] === 3, 'Promoflow preview lost the requested status.');
    [$code,$result] = $request($ports[1], '/controller/dot63/requests_63_api.php', $payload, $adminSession);
    statusCheck($code === 200 && $result['success'] && $read()['status'] === 3, 'Promoflow approval did not apply the reviewed mode.');
    [$code] = $request($ports[1], '/controller/dot63/requests_63_api.php', $payload, $adminSession);
    statusCheck($code === 409, 'An outdated approval request was accepted.');
    [$code] = $request($ports[0], '/controller/products/product.php', ['action'=>'save_product_details','sku'=>'STATUS-TEST','status'=>0,'status_request_version'=>$read()['status_request_version']]);
    statusCheck($code === 401, 'Anonymous supplier changes were accepted.');
    [$code,$details] = $request($ports[0], '/controller/products/product.php', ['action'=>'get_product_details','sku'=>'STATUS-TEST'], $supplierSession);
    statusCheck($code === 200 && $details['data']['status'] === 3, 'Product details did not load the approved status.');
    echo "Product status integration passed: all modes, pending visibility, notifications, ownership, stale reviews, draft purchasing and Promoflow HTTP approval.\n";
} finally {
    foreach ($servers as $server) { if (is_resource($server)) { proc_terminate($server); proc_close($server); } }
    foreach (glob($temp.'/*') as $file) unlink($file);
    rmdir($temp);
}
