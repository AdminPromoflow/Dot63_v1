<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

require_once __DIR__ . '/../controller/config/database.php';

$directory = sys_get_temp_dir() . '/dot63-db-config-' . bin2hex(random_bytes(6));
mkdir($directory, 0700);
$keys = ['DOT63_DB_HOST', 'DOT63_DB_NAME', 'DOT63_DB_USER', 'DOT63_DB_PASSWORD', 'DOT63_DB_PORT'];
$previous = [];
foreach ($keys as $key) {
    $previous[$key] = [getenv($key), $_ENV[$key] ?? null, $_SERVER[$key] ?? null];
    putenv($key);
    unset($_ENV[$key], $_SERVER[$key]);
}

$checks = 0;
function checkDatabaseConfig(bool $condition, string $message): void
{
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
}

function expectConfigFailure(callable $load, string $message): void
{
    try {
        $load();
    } catch (RuntimeException $error) {
        checkDatabaseConfig(true, $message);
        return;
    }
    throw new RuntimeException($message);
}

try {
    expectConfigFailure(fn() => DatabaseConfig::load($directory), 'Hosted config must not default to XAMPP.');
    $local = DatabaseConfig::load($directory, true);
    checkDatabaseConfig($local['name'] === 'dot63' && $local['user'] === 'root', 'XAMPP defaults changed.');
    checkDatabaseConfig($local['password'] === '' && $local['port'] === 3306, 'Empty local password must work.');

    $fileConfig = [
        'host' => 'localhost', 'name' => 'fixture_catalog', 'user' => 'fixture_user',
        'password' => "  quote' dollar\$ slash\\ hash# equal=  ", 'port' => 3307,
    ];
    $writeConfig = static function(array $config) use ($directory): void {
        file_put_contents($directory . '/database.local.php', '<?php return ' . var_export($config, true) . ';');
    };
    $writeConfig($fileConfig);
    checkDatabaseConfig(DatabaseConfig::load($directory) === $fileConfig, 'File values or password were altered.');

    putenv('DOT63_DB_HOST=environment.example.test');
    checkDatabaseConfig(DatabaseConfig::load($directory)['host'] === 'environment.example.test', 'Environment must override file.');
    putenv('DOT63_DB_HOST');
    $_ENV['DOT63_DB_HOST'] = 'php-env.example.test';
    checkDatabaseConfig(DatabaseConfig::load($directory)['host'] === 'php-env.example.test', 'PHP environment was ignored.');
    unset($_ENV['DOT63_DB_HOST']);
    $_SERVER['DOT63_DB_HOST'] = 'fastcgi.example.test';
    checkDatabaseConfig(DatabaseConfig::load($directory)['host'] === 'fastcgi.example.test', 'FastCGI configuration was ignored.');
    unset($_SERVER['DOT63_DB_HOST']);

    putenv('DOT63_DB_NAME=');
    expectConfigFailure(fn() => DatabaseConfig::load($directory, true), 'Empty explicit name must not fall back.');
    putenv('DOT63_DB_NAME');
    putenv('DOT63_DB_PORT=70000');
    expectConfigFailure(fn() => DatabaseConfig::load($directory), 'Invalid port accepted.');
    putenv('DOT63_DB_PORT');
    putenv('DOT63_DB_HOST=localhost;dbname=wrong');
    expectConfigFailure(fn() => DatabaseConfig::load($directory), 'Additional DSN parameters accepted.');
    putenv('DOT63_DB_HOST');

    $withoutPassword = $fileConfig;
    unset($withoutPassword['password']);
    $writeConfig($withoutPassword);
    expectConfigFailure(fn() => DatabaseConfig::load($directory), 'Missing password must not become an empty password.');
    file_put_contents($directory . '/database.local.php', '<?php return true;');
    expectConfigFailure(fn() => DatabaseConfig::load($directory, true), 'Invalid file must not fall back to XAMPP.');
    unlink($directory . '/database.local.php');

    putenv('DOT63_DB_PASSWORD=fixture-only');
    expectConfigFailure(fn() => DatabaseConfig::load($directory, true), 'Partial environment must not use XAMPP.');
    putenv('DOT63_DB_HOST=127.0.0.1');
    putenv('DOT63_DB_NAME=fixture_catalog');
    putenv('DOT63_DB_USER=fixture_user');
    checkDatabaseConfig(DatabaseConfig::load($directory)['password'] === 'fixture-only', 'Complete environment config failed.');

    // Missing configuration must never hand a null connection to a model.
    putenv('DOT63_DB_NAME=');
    $oldLog = ini_get('error_log');
    ini_set('error_log', $directory . '/errors.log');
    expectConfigFailure(fn() => (new Database())->getConnection(), 'Unavailable connection returned instead of throwing.');
    ini_set('error_log', (string)$oldLog);

    echo "PASS {$checks} database configuration checks (no database writes).\n";
} finally {
    foreach ($previous as $key => [$environment, $envValue, $serverValue]) {
        putenv($environment === false ? $key : $key . '=' . $environment);
        if ($envValue === null) unset($_ENV[$key]); else $_ENV[$key] = $envValue;
        if ($serverValue === null) unset($_SERVER[$key]); else $_SERVER[$key] = $serverValue;
    }
    foreach (glob($directory . '/*') as $file) unlink($file);
    rmdir($directory);
}
