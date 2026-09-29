<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

/** Local-only integration suite. Clones schema (never data), then drops its own random database. */
$root = dirname(__DIR__);
$dbName = 'dot63_security_test_' . bin2hex(random_bytes(6));
$admin = new PDO('mysql:host=127.0.0.1;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$server = null;
$files = [];
$uploaded = [];
$checks = 0;
function securityCheck(bool $condition, string $message): void {
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
}
try {
    $admin->exec("CREATE DATABASE `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    foreach ($admin->query('SHOW TABLES FROM dot63')->fetchAll(PDO::FETCH_COLUMN) as $table) {
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) throw new RuntimeException('Unexpected table name');
        $admin->exec("CREATE TABLE `$dbName`.`$table` LIKE dot63.`$table`");
    }
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=$dbName;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $hash = password_hash('Security!Test42', PASSWORD_DEFAULT);
    $insert = $pdo->prepare('INSERT INTO suppliers (supplier_id,email,contact_name,password) VALUES (?,?,?,?)');
    $insert->execute([1001, 'owner-a@example.test', 'Owner A', $hash]);
    $insert->execute([1002, 'owner-b@example.test', 'Owner B', $hash]);
    $pdo->exec("INSERT INTO products (product_id,SKU,name,supplier_id) VALUES (1001,'AUDIT-A','A',1001),(1002,'AUDIT-B','B',1002),(1003,'AUDIT-C','C',1001)");
    $pdo->exec("INSERT INTO variations (variation_id,SKU,name,product_id,price_display_mode) VALUES (1001,'VAR-A','A',1001,'prices'),(1002,'VAR-B','B',1002,'prices'),(1003,'VAR-C','C',1003,'prices')");
    $pdo->exec('INSERT INTO prices (price_id,min_quantity,max_quantity,price,variation_id) VALUES (1001,1,20,4,1001),(1002,1,20,9,1002)');
    $pdo->exec("INSERT INTO items (item_id,name,description,variation_id) VALUES (1001,'A','A',1001),(1002,'B','B',1002)");
    $socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
    $address = stream_socket_get_name($socket, false);
    fclose($socket);
    $base = 'http://' . $address;
    $log = tempnam(sys_get_temp_dir(), 'dot63-security-log-'); $files[] = $log;
    $sessionDirectory = sys_get_temp_dir() . '/' . $dbName;
    mkdir($sessionDirectory, 0700);
    $environment = array_merge(getenv(), ['DOT63_DB_HOST' => '127.0.0.1', 'DOT63_DB_NAME' => $dbName,
        'DOT63_DB_USER' => 'root', 'DOT63_DB_PASSWORD' => '', 'DOT63_SMTP_PASSWORD' => '']);
    $server = proc_open([PHP_BINARY, '-d', 'session.save_path=' . $sessionDirectory, '-S', $address, '-t', $root],
        [0 => ['pipe', 'r'], 1 => ['file', $log, 'a'], 2 => ['file', $log, 'a']], $pipes, $root, $environment);
    securityCheck(is_resource($server), 'Could not start test server');
    for ($i=0; $i<50; $i++) {
        $ready = @stream_socket_client('tcp://' . $address, $errno, $errstr, 0.1);
        if ($ready) { fclose($ready); break; }
        usleep(100000);
    }
    $cookie = tempnam(sys_get_temp_dir(), 'dot63-security-cookie-'); $files[] = $cookie;
    $request = static function(string $path, ?array $data = null, bool $authenticated = true, string $token = '', bool $multipart = false) use ($base, $cookie): array {
        $curl = curl_init($base . $path);
        $headers = $multipart ? [] : ['Content-Type: application/json'];
        if ($token !== '') $headers[] = 'X-Dot63-CSRF-Token: ' . $token;
        curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>10, CURLOPT_HTTPHEADER=>$headers]);
        if ($authenticated) curl_setopt_array($curl, [CURLOPT_COOKIEFILE=>$cookie, CURLOPT_COOKIEJAR=>$cookie]);
        if ($data !== null) curl_setopt_array($curl, [CURLOPT_POST=>true, CURLOPT_POSTFIELDS=>$multipart ? $data : json_encode($data)]);
        $body = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if ($body === false) throw new RuntimeException($error);
        return [$status, json_decode($body,true), $body];
    };
    $routes = [
        ['product','delete_product',['sku'=>'AUDIT-B']],
        ['product','update_category',['sku'=>'AUDIT-B','id'=>1]],
        ['product','update_group',['sku'=>'AUDIT-B','group_id'=>1]],
        ['product','save_product_details',['sku'=>'AUDIT-B']],
        ['product','publish_product',['sku'=>'AUDIT-B']],
        ['product','create_new_product',[]],
        ['price','create_prices',['sku_variation'=>'VAR-B']],
        ['price','delete_price',['id_price'=>1002]],
        ['item','create_items',['sku_variation'=>'VAR-B','labels'=>['x'],'texts'=>['x']]],
        ['item','delete_item',['id_item'=>1002]],
        ['image','create_update_images',['sku_product'=>'AUDIT-B','sku_variation'=>'VAR-B']],
        ['image','delete_image',['sku_variation'=>'VAR-B','link_image'=>'missing.png']],
        ['variations','save_variation_details',['sku_product'=>'AUDIT-B','sku_variation'=>'VAR-B']],
        ['variations','delete_variation',['sku_variation'=>'VAR-B']],
        ['variations','create_new_variation',['sku'=>'AUDIT-B']],
        ['variations','update_group_name',['sku_variation'=>'VAR-B']],
        ['category','create_new_category',['sku'=>'AUDIT-B','name'=>'audit']],
        ['group','create_new_group',['sku'=>'AUDIT-B','name'=>'audit']],
    ];
    foreach ($routes as [$controller,$action,$data]) {
        securityCheck($request("/controller/products/$controller.php", ['action'=>$action]+$data, false)[0]===401, "Anonymous action accepted: $action");
    }
    securityCheck($request('/controller/users/supplier_info.php',['action'=>'request_update_profile_info','email'=>'owner-b@example.test'],false)[0]===401,'Anonymous profile accepted');
    foreach (['get_suppliers','get_API_overview_data','get_preview_product_details','get_variation_prices','approve_product'] as $action) {
        securityCheck($request('/controller/promoflow/promoflow_webhook.php',['action'=>$action],false)[0]===401,'Anonymous internal action accepted: '.$action);
    }
    echo "PASS anonymous catalog, profile and internal API access blocked\n";
    securityCheck($request('/controller/users/login.php',['action'=>'requestLoginSupplier','email'=>'owner-a@example.test','password'=>'Security!Test42'])[0]===200,'Supplier login failed');
    [$status,$csrf] = $request('/controller/security/csrf.php');
    securityCheck($status===200 && strlen($csrf['token']??'')===64,'CSRF token unavailable');
    $token=$csrf['token'];
    foreach ($routes as [$controller,$action,$data]) {
        securityCheck($request("/controller/products/$controller.php",['action'=>$action]+$data)[0]===419,"Missing CSRF accepted: $action");
        if ($action==='create_new_product') continue;
        securityCheck($request("/controller/products/$controller.php",['action'=>$action]+$data,true,$token)[0]===403,"Foreign object accepted: $action");
    }
    securityCheck($request('/controller/products/variations.php',['action'=>'save_variation_details','sku_product'=>'AUDIT-A','sku_variation'=>'VAR-A','sku_parent_variation'=>'VAR-B'],true,$token)[0]===403,'Foreign parent accepted');
    securityCheck($request('/controller/products/variations.php',['action'=>'save_variation_details','sku_product'=>'AUDIT-A','sku_variation'=>'VAR-A','sku_parent_variation'=>'VAR-C'],true,$token)[0]===403,'Parent from different owned product accepted');
    securityCheck($request('/controller/products/image.php',['action'=>'get_images_details','sku'=>'AUDIT-A','sku_variation'=>'VAR-B'],true,$token)[0]===403,'Mixed product/variation accepted');
    securityCheck((int)$pdo->query('SELECT COUNT(*) FROM products')->fetchColumn()===3,'Rejected requests modified products');
    securityCheck((float)$pdo->query('SELECT price FROM prices WHERE price_id=1002')->fetchColumn()===9.0,'Foreign price changed');
    echo "PASS CSRF and ownership (including mixed references and parent variations)\n";
    [$status,$body]=$request('/controller/products/price.php',['action'=>'create_prices','sku_variation'=>'VAR-A','min_qty'=>[1],'max_qty'=>[20],'prices'=>[5.25]],true,$token);
    securityCheck($status===200 && ($body['success']??false),'Owner cannot save prices: '.json_encode($body));
    securityCheck((float)$pdo->query('SELECT price FROM prices WHERE variation_id=1001')->fetchColumn()===5.25,'Price not saved');
    [$status,$body]=$request('/controller/products/item.php',['action'=>'create_items','sku_variation'=>'VAR-A','labels'=>['Label'],'texts'=>['Text']],true,$token);
    securityCheck($status===200 && ($body['success']??false),'Owner cannot save items: '.json_encode($body));
    $profile=['action'=>'request_update_profile_info','email'=>'owner-b@example.test','contact_name'=>'Changed A','company_name'=>'Audit','phone'=>'1','country'=>'CO','city'=>'Bogota','address_line1'=>'Test','address_line2'=>'','postal_code'=>'123'];
    securityCheck($request('/controller/users/supplier_info.php',$profile,true,$token)[0]===200,'Owner profile update failed');
    securityCheck($pdo->query('SELECT contact_name FROM suppliers WHERE supplier_id=1001')->fetchColumn()==='Changed A','Own profile not updated');
    securityCheck($pdo->query('SELECT contact_name FROM suppliers WHERE supplier_id=1002')->fetchColumn()==='Owner B','Foreign profile changed');
    echo "PASS authorized price/item changes and session-bound profile update\n";
    $png=tempnam(sys_get_temp_dir(),'dot63-image-');$files[]=$png;
    file_put_contents($png,base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5LkAAAAASUVORK5CYII='));
    $fake=tempnam(sys_get_temp_dir(),'dot63-invalid-');$files[]=$fake;file_put_contents($fake,'This is not an image.');
    foreach ([[$png,'image.php'],[$png,'image.php.png'],[$fake,'image.png']] as [$file,$name]) {
        $payload=['action'=>'create_update_images','sku_product'=>'AUDIT-A','sku_variation'=>'VAR-A','images[0]'=>new CURLFile($file,'image/png',$name)];
        securityCheck($request('/controller/products/image.php',$payload,true,$token,true)[0]===422,'Invalid upload accepted: '.$name);
    }
    securityCheck((int)$pdo->query('SELECT COUNT(*) FROM images')->fetchColumn()===0,'Rejected uploads wrote records');
    $payload=['action'=>'create_update_images','sku_product'=>'AUDIT-A','sku_variation'=>'VAR-A','images[0]'=>new CURLFile($png,'image/png','valid.png')];
    [$status,$body]=$request('/controller/products/image.php',$payload,true,$token,true);
    foreach ($body['paths']??[] as $entry) $uploaded[]=$root.'/'.$entry['path'];
    securityCheck($status===200 && ($body['success']??false),'Valid upload rejected: '.json_encode($body));
    securityCheck((bool)preg_match('~/[a-f0-9]{48}\.png$~',$body['paths'][0]['path']??''),'Upload filename was not generated');
    securityCheck((int)$pdo->query('SELECT COUNT(*) FROM images')->fetchColumn()===1,'Valid image not saved');
    echo "PASS upload type/content rejection and valid image preservation\n";
    securityCheck($request('/controller/products/product.php',['action'=>'delete_product','sku'=>'AUDIT-C'],true,$token)[1]['success']??false,'Owner cannot delete product');
    securityCheck((int)$pdo->query('SELECT COUNT(*) FROM products WHERE product_id=1003')->fetchColumn()===0,'Owned product not deleted');
    securityCheck((int)$pdo->query('SELECT COUNT(*) FROM products WHERE product_id=1002')->fetchColumn()===1,'Foreign product deleted');
    securityCheck($request('/tests/security_integration.php',null,false)[0]===404,'Test script exposed over HTTP');
    securityCheck($request('/controller/products/product.php',['action'=>'get_products'],false)[0]===200,'Public catalog broken');
    echo "PASS owned deletion, public catalog and test-script HTTP guard\n";
    echo "Security integration: $checks checks passed.\n";
} finally {
    if (is_resource($server)) { proc_terminate($server); proc_close($server); }
    // Remove only files this test created, never existing product data.
    foreach ($uploaded as $path) {
        if (strpos($path,$root.'/controller/uploads/')===0 && is_file($path)) {
            unlink($path); $dir=dirname($path); @rmdir($dir); @rmdir(dirname($dir));
        }
    }
    foreach ($files as $file) if (is_file($file)) unlink($file);
    if (isset($sessionDirectory) && is_dir($sessionDirectory)) {
        foreach (glob($sessionDirectory.'/sess_*') as $sessionFile) unlink($sessionFile);
        rmdir($sessionDirectory);
    }
    if (preg_match('/^dot63_security_test_[a-f0-9]{12}$/',$dbName)) $admin->exec("DROP DATABASE IF EXISTS `$dbName`");
}
