<?php
/**
 * Run against the local test server, with SMTP disabled there:
 * DOT63_SMTP_HOST=127.0.0.1 DOT63_SMTP_PORT=1 php -d session.save_path=/private/tmp -S 127.0.0.1:8791
 * php tests/customer_auth_integration.php
 * Creates only uniquely named fixtures and removes them in finally.
 */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

require_once __DIR__ . '/../controller/config/database.php';
require_once __DIR__ . '/../model/customers.php';

function checkAuth(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}

$base = getenv('DOT63_AUTH_TEST_URL') ?: 'http://127.0.0.1:8791';
checkAuth(in_array(parse_url($base, PHP_URL_HOST), ['127.0.0.1', 'localhost'], true), 'Use a local test server.');
$pdo = (new Database())->getConnection();
checkAuth($pdo instanceof PDO, 'Local database unavailable.');
$cookie = tempnam(sys_get_temp_dir(), 'dot63-auth-');
$email = 'auth-' . bin2hex(random_bytes(6)) . '@example.test';
$password = 'Customer!Test42';
$address = [
    'first_name' => 'María', 'last_name' => 'Test', 'company_name' => 'Example Company',
    'phone' => '+57 300 000 0000', 'email' => 'delivery@example.test',
    'street_address_1' => 'Test Street 42', 'street_address_2' => 'Suite 7',
    'town_city' => 'Bogotá', 'country' => 'Colombia', 'postcode' => '110111',
];
$payload = ['action' => 'requestSignUp', 'name' => 'María Test', 'email' => $email,
    'password' => $password, 'password_confirmation' => $password, 'address' => $address];
$request = static function (string $path, $data = null) use ($base, $cookie): array {
    $curl = curl_init($base . $path);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_COOKIEFILE => $cookie,
        CURLOPT_COOKIEJAR => $cookie, CURLOPT_TIMEOUT => 25]);
    if ($data !== null) {
        curl_setopt_array($curl, [CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => is_array($data) ? json_encode($data) : $data]);
    }
    $body = curl_exec($curl);
    checkAuth($body !== false, 'HTTP request failed: ' . curl_error($curl));
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    return [$status, json_decode($body, true), $body];
};
$register = '/controller/customers/sing_up.php';
$login = '/controller/customers/login.php';
try {
    checkAuth($request($register)[0] === 405, 'Registration must require POST.');
    checkAuth($request($register, '{')[0] === 400, 'Malformed JSON must fail.');
    foreach ([
        array_merge($payload, ['password' => 'weak']),
        array_merge($payload, ['password_confirmation' => 'different']),
        array_merge($payload, ['address' => []]),
        array_merge($payload, ['address' => array_merge($address, ['postcode' => ''])]),
        array_merge($payload, ['address' => array_merge($address, ['email' => 'invalid'])]),
        array_merge($payload, ['address' => array_merge($address, ['town_city' => str_repeat('a', 51)])]),
        array_merge($payload, ['name' => ['invalid type']]),
    ] as $invalid) {
        checkAuth($request($register, $invalid)[0] === 422, 'Invalid registration must return 422.');
    }
    $count = $pdo->prepare('SELECT COUNT(*) FROM customers WHERE email = ?');
    $count->execute([$email]);
    checkAuth((int)$count->fetchColumn() === 0, 'Validation created a partial account.');
    echo "PASS server validation rejects incomplete account/address without writing\n";

    $payload['address']['customer_id'] = 99999999;
    $payload['address']['address_id'] = 99999999;
    [$status, $result] = $request($register, $payload);
    checkAuth($status === 201 && $result['authenticated'] === true, 'Registration failed: ' . json_encode($result));
    checkAuth($result['notification_sent'] === false, 'Test server must have SMTP disabled.');
    $customerId = (int)$result['customer']['customer_id'];
    $statement = $pdo->prepare('SELECT * FROM addresses WHERE customer_id = ?');
    $statement->execute([$customerId]);
    $rows = $statement->fetchAll();
    checkAuth(count($rows) === 1, 'Registration must save exactly one linked address.');
    foreach ($address as $key => $value) checkAuth($rows[0][$key] === $value, 'Address field not saved: ' . $key);
    checkAuth((int)$rows[0]['address_id'] === $result['address_id'], 'Address ID mismatch.');
    $statement = $pdo->prepare('SELECT password_hash FROM customers WHERE customer_id = ?');
    $statement->execute([$customerId]);
    checkAuth(password_verify($password, $statement->fetchColumn()), 'Password was not correctly hashed.');
    checkAuth(!isset($result['customer']['password_hash']), 'Password hash exposed.');
    checkAuth($request($login, ['action' => 'verify_login_customer'])[1]['authenticated'] === true, 'Registration session missing.');
    checkAuth(strpos($request('/view/checkout/index.php')[2], 'Test Street 42') !== false, 'Saved address is unavailable at checkout.');
    echo "PASS registration saves all address fields, hashes password, logs in and exposes address at checkout\n";

    $duplicate = $payload;
    $duplicate['email'] = strtoupper($email);
    checkAuth($request($register, $duplicate)[0] === 409, 'Duplicate email must return 409.');
    $statement = $pdo->prepare('SELECT COUNT(*) FROM addresses WHERE customer_id = ?');
    $statement->execute([$customerId]);
    checkAuth((int)$statement->fetchColumn() === 1, 'Duplicate registration created another address.');
    checkAuth($request($login, ['action' => 'logout_customer'])[1]['authenticated'] === false, 'Logout failed.');
    checkAuth($request($login, ['action' => 'verify_login_customer'])[1]['authenticated'] === false, 'Session survived logout.');
    checkAuth($request($login, ['action' => 'requestLogin', 'email' => $email, 'password' => 'wrong'])[0] === 401, 'Wrong password accepted.');
    checkAuth($request($login, ['action' => 'requestLogin', 'email' => [$email], 'password' => $password])[0] === 422, 'Invalid type accepted.');
    checkAuth($request($login, ['action' => 'requestLogin', 'email' => ' ' . strtoupper($email) . ' ', 'password' => $password])[0] === 200, 'Login after registration failed.');
    checkAuth($request($login, ['action' => 'verify_login_customer'])[1]['customer']['customer_id'] === $customerId, 'Wrong customer in session.');
    $request($login, ['action' => 'logout_customer']);
    echo "PASS duplicate detection, incorrect credentials, normalized login and logout\n";
} finally {
    $pdo->prepare('DELETE FROM addresses WHERE customer_id IN (SELECT customer_id FROM customers WHERE email = ?)')->execute([$email]);
    $pdo->prepare('DELETE FROM customers WHERE email = ?')->execute([$email]);
    @unlink($cookie);
}

// Isolated failure injection: prove an address INSERT failure rolls back the account.
$memory = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$memory->exec('CREATE TABLE customers (customer_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password_hash TEXT, notes TEXT, "group" TEXT)');
$connection = new class($memory) {
    private PDO $pdo;
    public function __construct(PDO $pdo) { $this->pdo = $pdo; }
    public function getConnection(): PDO { return $this->pdo; }
};
$customer = new Customers($connection);
$customer->setName('Rollback Test');
$customer->setEmail('rollback@example.test');
$customer->setPassword($password);
checkAuth($customer->createCustomer($address)['success'] === false, 'Missing addresses table must fail.');
checkAuth((int)$memory->query('SELECT COUNT(*) FROM customers')->fetchColumn() === 0, 'Address failure left an account behind.');
echo "PASS address failure rolls back customer creation\n";
