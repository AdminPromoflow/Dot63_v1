<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

// Local XAMPP integration test: clone only the schema into a disposable database.
$root = dirname(__DIR__);
$dbName = 'dot63_artwork_test_' . bin2hex(random_bytes(6));
$temp = sys_get_temp_dir() . '/' . $dbName;
$admin = new PDO('mysql:host=127.0.0.1;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$server = null;
$stored = [];
$checks = 0;
function artworkCheck(bool $condition, string $message): void {
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
}
try {
    mkdir($temp, 0700);
    $admin->exec("CREATE DATABASE `$dbName` CHARACTER SET utf8mb4");
    foreach (['products', 'suppliers', 'variations', 'prices', 'jobs', 'job_details', 'images', 'type_variations'] as $table) {
        $admin->exec("CREATE TABLE `$dbName`.`$table` LIKE dot63.`$table`");
    }
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=$dbName;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec('ALTER TABLE jobs AUTO_INCREMENT = 1900000000');
    $pdo->exec("INSERT INTO suppliers (supplier_id, company_name) VALUES (1, 'Artwork test')");
    $pdo->exec("INSERT INTO products (product_id, SKU, name, supplier_id, status, is_approved) VALUES (1, 'ARTWORK-TEST', 'Artwork test', 1, 2, 1)");
    $pdo->exec("INSERT INTO variations (variation_id, SKU, name, product_id, price_display_mode, pdf_artwork) VALUES (1, 'ARTWORK-VAR', 'Default', 1, 'prices', 'controller/uploads/supplier-template.pdf')");
    $pdo->exec('INSERT INTO prices (price_id, min_quantity, max_quantity, price, variation_id) VALUES (1, 1, 100, 2.50, 1)');
    session_save_path($temp);
    session_id('artwork' . bin2hex(random_bytes(8)));
    session_start();
    $sessionId = session_id();
    $csrf = bin2hex(random_bytes(32));
    $_SESSION = ['customer_login' => true, 'customer_id' => 1, 'customer_email' => 'artwork@example.test', 'dot63_csrf_token' => $csrf];
    session_write_close();
    $socket = stream_socket_server('tcp://127.0.0.1:0');
    $port = (int)substr(strrchr(stream_socket_get_name($socket, false), ':'), 1);
    fclose($socket);
    $env = array_merge(getenv(), ['DOT63_DB_HOST' => '127.0.0.1', 'DOT63_DB_PORT' => '3306', 'DOT63_DB_NAME' => $dbName, 'DOT63_DB_USER' => 'root', 'DOT63_DB_PASSWORD' => '']);
    $server = proc_open([PHP_BINARY, '-d', 'session.save_path=' . $temp, '-d', 'upload_max_filesize=9M', '-d', 'post_max_size=10M', '-S', '127.0.0.1:' . $port, '-t', $root],
        [0 => ['pipe', 'r'], 1 => ['file', $temp . '/server.log', 'a'], 2 => ['file', $temp . '/server.log', 'a']], $pipes, $root, $env);
    for ($i = 0; $i < 50; $i++) {
        $connection = @fsockopen('127.0.0.1', $port, $errno, $error, 0.1);
        if ($connection) { fclose($connection); break; }
        usleep(50000);
    }
    $request = static function (array $data, bool $multipart = true, bool $authenticated = true, bool $withCsrf = true) use ($port, $sessionId, $csrf): array {
        $curl = curl_init('http://127.0.0.1:' . $port . '/controller/order/cart.php');
        $headers = $withCsrf ? ['X-Dot63-CSRF-Token: ' . $csrf] : [];
        if (!$multipart) $headers[] = 'Content-Type: application/json';
        curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => $headers, CURLOPT_COOKIE => $authenticated ? 'PHPSESSID=' . $sessionId : '',
            CURLOPT_POSTFIELDS => $multipart ? $data : json_encode($data)]);
        $body = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        $json = json_decode((string)$body, true);
        artworkCheck(is_array($json), 'Invalid JSON response: ' . substr((string)$body, 0, 300));
        return [$status, $json];
    };
    $base = ['action' => 'add_to_cart', 'sku' => 'ARTWORK-TEST', 'quantity' => 2, 'price_id' => 1, 'variation_ids[0]' => 1];
    $pdf = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n";
    file_put_contents($temp . '/valid.pdf', $pdf);
    $upload = static fn(string $path, string $name = 'customer-artwork.pdf') => new CURLFile($path, 'application/pdf', $name);
    artworkCheck($request($base + ['artwork_pdf' => $upload($temp . '/valid.pdf')], true, false)[0] === 401, 'Anonymous upload accepted');
    artworkCheck($request($base + ['artwork_pdf' => $upload($temp . '/valid.pdf')], true, true, false)[0] === 419, 'Missing CSRF accepted');

    for ($i = 0; $i < 2; $i++) {
        [$status, $result] = $request($base + ['artwork_pdf' => $upload($temp . '/valid.pdf')]);
        artworkCheck($status === 201 && $result['success'], 'Valid upload failed: ' . json_encode($result));
        $jobId = (int)$result['job_id'];
        $link = $pdo->query('SELECT pdf_artwork_link FROM jobs WHERE job_id=' . $jobId)->fetchColumn();
        $stored[] = $root . '/' . $link;
        artworkCheck($link === $result['pdf_artwork_link'], 'Response differs from stored artwork path');
        artworkCheck((bool)preg_match('#^controller/uploads/job-artworks/' . $jobId . '/[a-f0-9]{48}\.pdf$#', $link), 'Unsafe stored filename');
        artworkCheck(file_get_contents($root . '/' . $link) === $pdf, 'Stored PDF differs from uploaded bytes');
    }
    artworkCheck($stored[0] !== $stored[1], 'Repeated filenames overwrite earlier uploads');
    artworkCheck($request(['action' => 'update_cart_item', 'cart_id' => $jobId, 'quantity' => 3], false)[0] === 200, 'Quantity update failed');
    artworkCheck($pdo->query('SELECT pdf_artwork_link FROM jobs WHERE job_id=' . $jobId)->fetchColumn() === $link, 'Quantity update lost the artwork');

    [$status, $result] = $request($base);
    artworkCheck($status === 201 && $result['pdf_artwork_link'] === null, 'Optional multipart upload failed');
    $json = $base;
    unset($json['variation_ids[0]']);
    $json['variation_ids'] = [1];
    $json['pdf_artwork_link'] = 'https://untrusted.example/fake.pdf';
    [$status, $result] = $request($json, false);
    artworkCheck($status === 201 && $result['pdf_artwork_link'] === null, 'JSON compatibility or trusted artwork source broken');
    artworkCheck($pdo->query('SELECT pdf_artwork_link FROM jobs WHERE job_id=' . (int)$result['job_id'])->fetchColumn() === null, 'Supplier template saved as customer artwork');

    file_put_contents($temp . '/fake.pdf', '<?php echo "not a PDF";');
    file_put_contents($temp . '/empty.pdf', '');
    file_put_contents($temp . '/large.pdf', $pdf . str_repeat(' ', 8 * 1024 * 1024));
    $count = (int)$pdo->query('SELECT COUNT(*) FROM jobs')->fetchColumn();
    foreach ([[$temp . '/fake.pdf', 'artwork.pdf'], [$temp . '/empty.pdf', 'empty.pdf'], [$temp . '/large.pdf', 'large.pdf'], [$temp . '/valid.pdf', 'artwork.txt'], [$temp . '/valid.pdf', 'artwork.php.pdf']] as [$path, $name]) {
        artworkCheck($request($base + ['artwork_pdf' => $upload($path, $name)])[0] === 422, 'Invalid file accepted: ' . $name);
    }
    artworkCheck($request($base + ['artwork_pdf[0]' => $upload($temp . '/valid.pdf')])[0] === 422, 'Nested upload accepted');
    file_put_contents($temp . '/server-limit.pdf', $pdf . str_repeat(' ', 9 * 1024 * 1024));
    artworkCheck($request($base + ['artwork_pdf' => $upload($temp . '/server-limit.pdf')])[0] === 422, 'PHP upload limit did not return a useful error');
    file_put_contents($temp . '/post-limit.pdf', $pdf . str_repeat(' ', 11 * 1024 * 1024));
    artworkCheck($request($base + ['artwork_pdf' => $upload($temp . '/post-limit.pdf')])[0] === 413, 'PHP post limit did not return a useful error');
    artworkCheck((int)$pdo->query('SELECT COUNT(*) FROM jobs')->fetchColumn() === $count, 'Rejected uploads left jobs behind');

    $before = glob($root . '/controller/uploads/job-artworks/*/*.pdf');
    $pdo->exec("CREATE TRIGGER artwork_test_failure BEFORE INSERT ON job_details FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Expected artwork rollback test'");
    artworkCheck($request($base + ['artwork_pdf' => $upload($temp . '/valid.pdf')])[0] === 500, 'Forced database error not reported');
    artworkCheck(glob($root . '/controller/uploads/job-artworks/*/*.pdf') === $before, 'Failed job left its PDF behind');
    artworkCheck((int)$pdo->query('SELECT COUNT(*) FROM jobs')->fetchColumn() === $count, 'Failed job transaction was not rolled back');
    echo "PASS: $checks artwork checks (HTTP uploads, saved paths/bytes, auth, CSRF, optional PDF, limits, spoofed files and rollback).\n";
} finally {
    if (is_resource($server)) { proc_terminate($server); proc_close($server); }
    foreach ($stored as $file) { if (is_file($file)) unlink($file); @rmdir(dirname($file)); }
    $admin->exec("DROP DATABASE IF EXISTS `$dbName`");
    foreach (glob($temp . '/*') ?: [] as $file) unlink($file);
    if (is_dir($temp)) rmdir($temp);
}
