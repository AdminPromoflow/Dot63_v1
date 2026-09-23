<?php
declare(strict_types=1);

// Isolated HTTP regression test; never uses the application's configured database.
if (PHP_SAPI !== 'cli') exit;
$root = dirname(__DIR__);
$admin = new PDO('mysql:host=localhost;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$dbName = 'dot63_preview_test_' . bin2hex(random_bytes(5));
$temp = sys_get_temp_dir() . '/' . $dbName;
$server = null;
$reviewServer = null;
$promoflow = getenv('PROMOFLOW_ROOT') ?: dirname($root) . '/Promoflow_v1';
mkdir($temp, 0700);
$admin->exec("CREATE DATABASE `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
function previewCheck(bool $ok, string $message): void {
    if (!$ok) throw new RuntimeException($message);
}
try {
    $pdo = new PDO("mysql:host=localhost;dbname=$dbName;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec(file_get_contents($root . '/controller/config/mySQL.sql'));
    $pdo->exec("INSERT INTO suppliers (email, company_name) VALUES ('preview@example.test','Preview supplier'),('other@example.test','Other supplier')");
    $pdo->exec("INSERT INTO categories (name,approved) VALUES ('Lanyards',1)");
    $pdo->exec("INSERT INTO `groups` (name,category_id,approved) VALUES ('Lanyards - SuperLanyard',1,1)");
    $pdo->exec("INSERT INTO type_variations (type_name,category_id) VALUES ('Colour',1),('Width',1)");
    $pdo->exec("INSERT INTO products (SKU,name,description,supplier_id,group_id,status,is_approved) VALUES
        ('PREVIEW-TEST','Super Lanyard','A configurable lanyard with colour and width options.',1,1,2,1),
        ('PREVIEW-DRAFT','Draft lanyard','Draft available only to its supplier.',1,1,0,0),
        ('OTHER-PRODUCT','Private product','Another supplier product.',2,1,0,0)");
    $pdo->exec("INSERT INTO variations (SKU,product_id,parent_id,type_id,name,price_display_mode) VALUES
        ('ROOT',1,NULL,NULL,'Default','prices'),
        ('BLUE',1,1,1,'Blue','variation'),('RED',1,1,1,'Red','variation'),
        ('NARROW',1,1,2,'15mm','variation'),('WIDE',1,1,2,'25mm','variation'),
        ('DRAFT-ROOT',2,NULL,NULL,'Default','prices'),('OTHER-ROOT',3,NULL,NULL,'Default','prices')");
    $pdo->exec("INSERT INTO images (variation_id,link) VALUES (1,'../view/preview_porduct/img/icon_product.png'),(2,'../view/preview_porduct/img/icon_product.png')");
    $pdo->exec("INSERT INTO prices (variation_id,min_quantity,max_quantity,price) VALUES (1,10,99,5.46),(1,100,NULL,4),(3,10,NULL,1.50),(5,20,NULL,2)");

    session_save_path($temp);
    $session = 'preview' . bin2hex(random_bytes(6));
    session_id($session); session_start();
    $_SESSION = ['login'=>true,'email'=>'preview@example.test'];
    session_write_close();
    $reviewSession = 'review' . bin2hex(random_bytes(6));
    session_id($reviewSession); session_start();
    $_SESSION = ['is_logged'=>true,'user_email'=>'reviewer@example.test'];
    session_write_close();
    $socket = stream_socket_server('tcp://127.0.0.1:0');
    $port = (int)substr(strrchr(stream_socket_get_name($socket, false), ':'), 1);
    fclose($socket);
    // Browser QA can enter the same isolated supplier session through this test-only router.
    $router = $temp . '/router.php';
    file_put_contents($router, '<?php if (parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH) === "/__preview_test") { session_start(); $_SESSION=["login"=>true,"email"=>"preview@example.test"]; header("Location: /view/preview_porduct/index.php?sku=PREVIEW-TEST"); return; } return false;');
    $env = array_merge(getenv(), ['DOT63_DB_HOST'=>'localhost','DOT63_DB_NAME'=>$dbName,'DOT63_DB_USER'=>'root','DOT63_DB_PASSWORD'=>'']);
    $server = proc_open([PHP_BINARY,'-d','session.save_path='.$temp,'-S','127.0.0.1:'.$port,'-t',$root,$router],
        [0=>['pipe','r'],1=>['file',$temp.'/server.log','a'],2=>['file',$temp.'/server.log','a']], $pipes, $root, $env);
    for ($i=0;$i<50;$i++) {
        $connection = @fsockopen('127.0.0.1',$port,$errno,$error,0.1);
        if ($connection) { fclose($connection); break; }
        usleep(20000);
    }
    $socket = stream_socket_server('tcp://127.0.0.1:0');
    $reviewPort = (int)substr(strrchr(stream_socket_get_name($socket, false), ':'), 1);
    fclose($socket);
    $reviewRouter = $temp . '/review_router.php';
    file_put_contents($reviewRouter, '<?php
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
if ($path === "/__review_test") {
    session_start(); $_SESSION=["is_logged"=>true,"user_email"=>"reviewer@example.test"];
    header("Location: /view/preview_porduct/index.php?sku=PREVIEW-TEST"); return;
}
if (strpos($path, "/dot63/") === 0) {
    $file = realpath(getenv("DOT63_APP_ROOT") . substr($path, 6));
    if ($file && strpos($file, realpath(getenv("DOT63_APP_ROOT")) . "/") === 0 && is_file($file)) {
        $type = ["js"=>"text/javascript", "css"=>"text/css", "png"=>"image/png", "pdf"=>"application/pdf"][pathinfo($file, PATHINFO_EXTENSION)] ?? null;
        if ($type) { header("Content-Type: " . $type); readfile($file); return; }
    }
    http_response_code(404); return;
}
return false;');
    $reviewEnv = array_merge($env, [
        'DOT63_WEBHOOK_URL'=>'http://127.0.0.1:'.$port.'/controller/promoflow/promoflow_webhook.php',
        'DOT63_APP_ROOT'=>$root, 'DOT63_ASSET_BASE'=>'/dot63'
    ]);
    $reviewServer = proc_open([PHP_BINARY,'-d','session.save_path='.$temp,'-S','127.0.0.1:'.$reviewPort,'-t',$promoflow,$reviewRouter],
        [0=>['pipe','r'],1=>['file',$temp.'/review.log','a'],2=>['file',$temp.'/review.log','a']], $reviewPipes, $promoflow, $reviewEnv);
    for ($i=0;$i<50;$i++) {
        $connection = @fsockopen('127.0.0.1',$reviewPort,$errno,$error,0.1);
        if ($connection) { fclose($connection); break; }
        usleep(20000);
    }
    $request = static function (string $action, array $data = [], bool $authenticated = true, bool $review = false, bool $direct = false) use ($port,$session,$reviewSession,$reviewPort): array {
        $curl = curl_init('http://127.0.0.1:'.($review && !$direct ? $reviewPort : $port).($review && !$direct ? '/controller/dot63/requests_63_api.php' : '/controller/order/product.php'));
        curl_setopt_array($curl,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_POST=>true,
            CURLOPT_HTTPHEADER=>['Content-Type: application/json'],CURLOPT_POSTFIELDS=>json_encode(array_merge(['action'=>$action],$data)),
            CURLOPT_COOKIE=>$authenticated ? 'PHPSESSID='.($review ? $reviewSession : $session) : '',CURLOPT_TIMEOUT=>10]);
        $body = curl_exec($curl); $code = curl_getinfo($curl,CURLINFO_HTTP_CODE); curl_close($curl);
        $json = json_decode((string)$body,true);
        previewCheck(is_array($json), "Invalid JSON ($code) for $action: ".substr((string)$body,0,200));
        return [$code,$json];
    };
    [$code,$preview] = $request('get_supplier_preview',['sku'=>'PREVIEW-TEST']);
    previewCheck($code===200 && $preview['success'] && $preview['root_variation_id']===1, 'Supplier preview did not load.');
    [$code] = $request('get_supplier_preview',['sku'=>'PREVIEW-TEST'],false);
    previewCheck($code===401,'Anonymous private preview was allowed.');
    [$code] = $request('get_supplier_preview',['sku'=>'OTHER-PRODUCT']);
    previewCheck($code===403,'Another supplier product was visible.');
    [$code] = $request('get_supplier_variation_children',['variation_id'=>7]);
    previewCheck($code===403,'Another supplier variation was visible.');
    [$code,$draft] = $request('get_supplier_preview',['sku'=>'PREVIEW-DRAFT']);
    previewCheck($code===200 && $draft['product']['status']===0,'Supplier draft was not previewable.');
    [$code] = $request('get_customer_preview',['sku'=>'PREVIEW-DRAFT'],false);
    previewCheck($code===404,'Supplier draft became public.');
    [$code,$children] = $request('get_supplier_variation_children',['variation_id'=>1]);
    previewCheck($code===200 && count($children['children'])===4 && count($children['types'])===2,'Sibling variation groups were lost.');
    $pdo->exec('UPDATE products SET pending_status=0,status_request_version=3 WHERE product_id=1');
    [$code,$pending] = $request('get_supplier_preview',['sku'=>'PREVIEW-TEST']);
    previewCheck($code===200 && $pending['product']['pending_status']===0 && !$pending['permissions']['can_submit'],'Pending Draft metadata was lost.');

    // Review endpoints reuse the private preview with a Promoflow session at both ends.
    [$code,$review] = $request('get_review_preview',['sku'=>'PREVIEW-TEST'],true,true);
    previewCheck($code===200 && $review['product']===$pending['product'] && $review['permissions']['can_approve'], 'Review product or pending Draft differs from supplier.');
    previewCheck(!$review['permissions']['can_submit'] && !$review['permissions']['can_edit'], 'Review exposes supplier write permissions.');
    [$code,$reviewChildren] = $request('get_review_variation_children',['variation_id'=>1],true,true);
    previewCheck($code===200 && $reviewChildren===$children, 'Review variations differ from supplier.');
    foreach (['get_review_preview'=>['sku'=>'PREVIEW-TEST'], 'get_review_variation_children'=>['variation_id'=>1], 'get_review_variation_prices'=>['sku'=>'PREVIEW-TEST','ids'=>[3,5],'quantity'=>10]] as $action=>$input) {
        [$code] = $request($action,$input,false,true);
        previewCheck($code===401, 'Anonymous review allowed through proxy.');
        [$code] = $request($action,$input,true,false);
        previewCheck($code===401, 'Supplier could call reviewer endpoint directly.');
        [$code] = $request($action,$input,false,true,true);
        previewCheck($code===401, 'Anonymous review allowed directly.');
    }
    [$code,$privateReview] = $request('get_review_preview',['sku'=>'OTHER-PRODUCT'],true,true);
    previewCheck($code===200 && $privateReview['product']['status']===0, 'Admin could not review another supplier draft.');
    previewCheck(!$privateReview['permissions']['can_approve'], 'Unrequested change was approvable.');
    $input = ['sku'=>'PREVIEW-TEST','ids'=>[2,3,4,5],'quantity'=>10];
    [$code,$reviewPrices] = $request('get_review_variation_prices',$input,true,true);
    [$customerCode,$publicPrices] = $request('get_customer_variation_prices',$input,false);
    previewCheck($code===200 && $reviewPrices===$publicPrices, 'Review extras availability differs from customer.');
    [$code] = $request('approve_product',['sku'=>'PREVIEW-TEST','requested_status'=>0,'status_request_version'=>2],true,true);
    previewCheck($code===409, 'Stale review approval was accepted.');
    [$code,$approved] = $request('approve_product',['sku'=>'PREVIEW-TEST','requested_status'=>0,'status_request_version'=>3],true,true);
    previewCheck($code===200 && $approved['success'], 'Pending Draft could not be approved.');
    [$code,$afterApproval] = $request('get_review_preview',['sku'=>'PREVIEW-TEST'],true,true);
    previewCheck($afterApproval['product']['status']===0 && $afterApproval['product']['pending_status']===null && !$afterApproval['permissions']['can_approve'], 'Approval did not update review state.');
    $pdo->exec('UPDATE products SET status=2,is_approved=1,pending_status=0,status_request_version=5 WHERE product_id=1');
    if (in_array('--serve',$argv,true)) {
        echo 'Review fixture: http://127.0.0.1:'.$reviewPort."/__review_test\nPress Enter after browser checks.\n";
        fgets(STDIN);
        // Browser QA may approve Draft; reset the fixture for the remaining schema checks.
        $pdo->exec('UPDATE products SET status=2,is_approved=1 WHERE product_id=1');
    }

    // Reproduce the deployed database before the approval columns were added.
    $pdo->exec('ALTER TABLE products DROP pending_status, DROP status_request_version, DROP status_requested_at');
    [$code,$legacy] = $request('get_supplier_preview',['sku'=>'PREVIEW-TEST']);
    previewCheck($code===200 && $legacy['success'] && $legacy['product']['status']===2,'Older approval schema broke the supplier preview.');
    previewCheck($legacy['permissions']['approval_available']===false && !$legacy['permissions']['can_submit'],'Unavailable approvals must not be offered.');
    $priceInput = ['sku'=>'PREVIEW-TEST','ids'=>[2,3,4,5],'quantity'=>10];
    [$code,$supplierPrices] = $request('get_supplier_variation_prices',$priceInput);
    [$customerCode,$customerPrices] = $request('get_customer_variation_prices',$priceInput,false);
    previewCheck($code===200 && $customerCode===200 && $supplierPrices===$customerPrices,'Supplier and customer extras or availability differ.');
    previewCheck(in_array(5,$supplierPrices['priced_variation_ids'],true),'An extra without an applicable tier was treated as free.');
    [$code,$legacyReview] = $request('get_review_preview',['sku'=>'PREVIEW-TEST'],true,true);
    previewCheck($code===200 && !$legacyReview['permissions']['approval_available'] && !$legacyReview['permissions']['can_approve'], 'Legacy schema broke the reviewer preview or offered an unavailable approval.');
    echo "PASS Promoflow review HTTP: admin access, private drafts, shared options/prices, pending Draft approval, stale requests and older schema.\n";
    echo "PASS supplier preview HTTP: current/older schema, pending Draft, ownership, private drafts, sibling options and customer price parity.\n";
    if (in_array('--serve',$argv,true)) {
        echo 'Browser fixture: http://127.0.0.1:'.$port."/__preview_test\nPress Enter to stop and remove the disposable database.\n";
        fgets(STDIN);
    }
} finally {
    if (is_resource($reviewServer)) { proc_terminate($reviewServer); proc_close($reviewServer); }
    if (is_resource($server)) { proc_terminate($server); proc_close($server); }
    $admin->exec("DROP DATABASE `$dbName`");
    foreach (glob($temp.'/*') as $file) unlink($file);
    rmdir($temp);
}
