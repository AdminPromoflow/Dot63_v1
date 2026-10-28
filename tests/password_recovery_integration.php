<?php
/** Local-only: clones account schemas into a temporary database, never sends real email. */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../model/password_recovery.php';

$root = dirname(__DIR__);
$dbName = 'dot63_recovery_test_' . bin2hex(random_bytes(6));
$admin = new PDO('mysql:host=127.0.0.1;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$server = null;
$cookie = tempnam(sys_get_temp_dir(), 'dot63-recovery-cookie-');
$log = tempnam(sys_get_temp_dir(), 'dot63-recovery-log-');
$checks = 0;
function recoveryCheck(bool $condition, string $message): void {
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
}
try {
    $admin->exec("CREATE DATABASE `$dbName` CHARACTER SET utf8mb4");
    foreach (['customers', 'suppliers'] as $table) $admin->exec("CREATE TABLE `$dbName`.`$table` LIKE dot63.`$table`");
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=$dbName;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $migration = file_get_contents($root . '/controller/config/migrations/20261027_add_password_recovery.sql');
    $pdo->exec($migration);
    $pdo->exec($migration);
    $email = 'recovery@example.test';
    $originalPassword = 'Original!Pass42';
    $hash = password_hash($originalPassword, PASSWORD_DEFAULT);
    $pdo->prepare('INSERT INTO customers (customer_id, name, email, password_hash) VALUES (1, ?, ?, ?)')->execute(['Customer test', $email, $hash]);
    $pdo->prepare('INSERT INTO suppliers (supplier_id, contact_name, email, password) VALUES (1, ?, ?, ?)')->execute(['Supplier test', $email, $hash]);
    $recovery = new PasswordRecovery($pdo);
    $sent = [];
    $capture = static function (array $account, string $type, string $token) use (&$sent): bool {
        $sent[] = ['type' => $type, 'token' => $token, 'account' => $account];
        return true;
    };
    $clear = static function () use ($pdo): void {
        $pdo->exec('DELETE FROM password_reset_tokens');
        $pdo->exec('DELETE FROM password_reset_requests');
    };
    foreach (['customer', 'supplier'] as $type) {
        $recovery->request($type, ' RECOVERY@EXAMPLE.TEST ', '127.0.0.1', $capture);
        $token = end($sent)['token'];
        recoveryCheck($recovery->isValid($type, $token), 'Normalized account token is invalid.');
        recoveryCheck(!$recovery->isValid($type === 'customer' ? 'supplier' : 'customer', $token), 'Cross-role token accepted.');
        $row = $pdo->query("SELECT * FROM password_reset_tokens WHERE account_type = '$type'")->fetch(PDO::FETCH_ASSOC);
        recoveryCheck($row['token_hash'] === hash('sha256', $token) && $row['token_hash'] !== $token, 'Plain token stored.');
        recoveryCheck((int)$row['expires_at'] >= time() + 1798, 'Incorrect expiry.');
    }
    recoveryCheck((int)$pdo->query('SELECT COUNT(*) FROM password_reset_tokens')->fetchColumn() === 2, 'Same email and ID must support independent roles.');
    $oldToken = $sent[0]['token'];
    $recovery->request('customer', $email, '127.0.0.1', $capture);
    recoveryCheck(!$recovery->isValid('customer', $oldToken), 'Resend did not invalidate old token.');
    $pdo->exec("UPDATE password_reset_tokens SET expires_at = 1 WHERE account_type = 'customer'");
    recoveryCheck(!$recovery->isValid('customer', end($sent)['token']), 'Expired token accepted.');
    $pdo->prepare('UPDATE suppliers SET password = ? WHERE supplier_id = 1')->execute([password_hash('Changed!Elsewhere1', PASSWORD_DEFAULT)]);
    recoveryCheck(!$recovery->isValid('supplier', $sent[1]['token']), 'Password change did not invalidate token.');
    $pdo->prepare('UPDATE suppliers SET password = ? WHERE supplier_id = 1')->execute([$hash]);
    echo "PASS hashed tokens, role isolation, normalization, resend, expiry and password change invalidation\n";

    $clear(); $sent = [];
    for ($i = 0; $i < 4; $i++) $recovery->request('customer', $email, '127.0.0.1', $capture);
    recoveryCheck(count($sent) === 3, 'Per-account limit failed.');
    $pdo->exec('UPDATE password_reset_requests SET window_started = window_started - 901');
    $recovery->request('customer', $email, '127.0.0.1', $capture);
    recoveryCheck(count($sent) === 4, 'Rate window did not reset.');
    $clear(); $sent = [];
    for ($i = 0; $i < 10; $i++) $recovery->request('customer', "missing$i@example.test", '127.0.0.1', $capture);
    $recovery->request('customer', $email, '127.0.0.1', $capture);
    recoveryCheck(count($sent) === 0, 'IP limit must also count nonexistent accounts.');
    $clear();
    $recovery->request('customer', $email, '127.0.0.1', static fn(): bool => false);
    recoveryCheck((int)$pdo->query('SELECT COUNT(*) FROM password_reset_tokens')->fetchColumn() === 0, 'Failed email left an active token.');
    $recovery->request('customer', $email, '127.0.0.1', static function (): bool { throw new RuntimeException('Test delivery failure'); });
    recoveryCheck((int)$pdo->query('SELECT COUNT(*) FROM password_reset_tokens')->fetchColumn() === 0, 'Mailer exception left an active token.');
    echo "PASS persistent account/IP limits, window rollover, missing accounts and delivery failures\n";

    $socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
    $port = (int)substr(strrchr(stream_socket_get_name($socket, false), ':'), 1);
    fclose($socket);
    $base = 'http://127.0.0.1:' . $port;
    $env = array_merge(getenv(), ['DOT63_DB_HOST' => '127.0.0.1', 'DOT63_DB_PORT' => '3306', 'DOT63_DB_NAME' => $dbName,
        'DOT63_DB_USER' => 'root', 'DOT63_DB_PASSWORD' => '', 'DOT63_SMTP_PASSWORD' => '', 'DOT63_SMTP_HOST' => '127.0.0.1', 'DOT63_SMTP_PORT' => '1']);
    $server = proc_open([PHP_BINARY, '-d', 'session.save_path=' . sys_get_temp_dir(), '-S', '127.0.0.1:' . $port, '-t', $root],
        [0 => ['pipe', 'r'], 1 => ['file', $log, 'a'], 2 => ['file', $log, 'a']], $pipes, $root, $env);
    if (isset($pipes[0])) fclose($pipes[0]);
    for ($i = 0; $i < 50; $i++) {
        $probe = @fsockopen('127.0.0.1', $port, $errno, $errstr, .1);
        if ($probe) { fclose($probe); break; }
        usleep(100000);
    }
    $csrf = '';
    $request = static function (string $path, $data = null, bool $withCsrf = true) use ($base, $cookie, &$csrf): array {
        $curl = curl_init($base . $path);
        curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_COOKIEFILE => $cookie, CURLOPT_COOKIEJAR => $cookie, CURLOPT_TIMEOUT => 10]);
        if ($data !== null) curl_setopt_array($curl, [CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $withCsrf ? ['X-Dot63-CSRF-Token: ' . $csrf] : []),
            CURLOPT_POSTFIELDS => is_array($data) ? json_encode($data) : $data]);
        $body = curl_exec($curl);
        recoveryCheck($body !== false, 'HTTP failure: ' . curl_error($curl));
        $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);
        return [$status, json_decode((string)$body, true), $body];
    };
    $csrf = $request('/controller/security/csrf.php')[1]['token'];
    $endpoint = '/controller/users/password_recovery.php';
    $payload = ['action' => 'request_reset', 'account_type' => 'customer', 'email' => $email];
    recoveryCheck($request($endpoint)[0] === 405, 'GET must be rejected.');
    recoveryCheck($request($endpoint, '{')[0] === 400, 'Malformed JSON accepted.');
    recoveryCheck($request($endpoint, $payload, false)[0] === 419, 'Missing CSRF accepted.');
    foreach ([['account_type' => 'admin'], ['account_type' => []], ['email' => 'invalid'], ['email' => []]] as $override) {
        recoveryCheck($request($endpoint, array_merge($payload, $override))[0] === 422, 'Invalid request accepted.');
    }
    $clear();
    $known = $request($endpoint, $payload);
    $missing = $request($endpoint, array_merge($payload, ['email' => 'missing@example.test']));
    recoveryCheck($known[0] === 200 && $known[1] === $missing[1], 'Response disclosed account existence or SMTP failure.');
    recoveryCheck(!isset($known[1]['token']), 'API exposed a reset token.');

    foreach (['customer', 'supplier'] as $type) {
        $clear(); $sent = [];
        $recovery->request($type, $email, '127.0.0.1', $capture);
        $token = $sent[0]['token'];
        $validate = ['action' => 'validate_token', 'account_type' => $type, 'token' => $token];
        recoveryCheck($request($endpoint, $validate)[0] === 200, 'Valid link rejected.');
        recoveryCheck($request($endpoint, $validate)[0] === 200, 'Viewing a link consumed it.');
        recoveryCheck($request($endpoint, array_merge($validate, ['token' => []]))[0] === 410, 'Invalid token type accepted.');
        $reset = array_merge($validate, ['action' => 'reset_password', 'password' => 'NewSecure!Pass42', 'password_confirmation' => 'NewSecure!Pass42']);
        foreach (['weak', str_repeat('Aa1!', 19), "Valid!Pass42\0", 'UPPERCASE!123', 'lowercase!123', 'NoNumbers!Pass', 'NoSymbols123'] as $invalid) {
            recoveryCheck($request($endpoint, array_merge($reset, ['password' => $invalid, 'password_confirmation' => $invalid]))[0] === 422, 'Weak/invalid password accepted.');
        }
        recoveryCheck($request($endpoint, array_merge($reset, ['password_confirmation' => 'mismatch']))[0] === 422, 'Password mismatch accepted.');
        recoveryCheck($recovery->isValid($type, $token), 'Validation failure consumed token.');
        recoveryCheck($request($endpoint, $reset)[0] === 200, 'Password reset failed.');
        recoveryCheck($request($endpoint, $reset)[0] === 410, 'Single-use token reused.');
        $loginPath = $type === 'customer' ? '/controller/customers/login.php' : '/controller/users/login.php';
        $loginAction = $type === 'customer' ? 'requestLogin' : 'requestLoginSupplier';
        recoveryCheck($request($loginPath, ['action' => $loginAction, 'email' => $email, 'password' => $originalPassword])[0] === 401, 'Old password still works.');
        recoveryCheck($request($loginPath, ['action' => $loginAction, 'email' => $email, 'password' => $reset['password']])[0] === 200, 'New password cannot log in.');
        echo "PASS $type HTTP validation, reset, token reuse rejection and login with new password\n";
    }
    $page = $request('/view/forg_password/index.php?account=supplier')[2];
    recoveryCheck(strpos($page, 'data-account-type="supplier"') !== false, 'Supplier page context missing.');
    recoveryCheck(strpos($page, '../log_inSupplier/index.php') !== false, 'Supplier login link missing.');
    echo "PASS $checks checks; no existing accounts changed or real email sent\n";
} finally {
    if (is_resource($server)) { proc_terminate($server); proc_close($server); }
    $admin->exec("DROP DATABASE IF EXISTS `$dbName`");
    @unlink($cookie);
    @unlink($log);
}
