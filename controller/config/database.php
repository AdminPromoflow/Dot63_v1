<?php
require_once __DIR__ . "/../security/bootstrap.php";
require_once __DIR__ . '/database_config.php';

class Database
{
    private $connection = null;

    public function __construct()
    {
        try {
            $config = DatabaseConfig::load(__DIR__, strpos(__DIR__, '/Applications/XAMPP/') === 0);
        } catch (Throwable $error) {
            error_log('Dot63 database configuration failed: ' . $error->getMessage());
            return;
        }

        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                $config['host'],
                $config['port'],
                $config['name']
            );
            $this->connection = new PDO($dsn, $config['user'], $config['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => true,
            ]);
        } catch (PDOException $error) {
            error_log('Database connection failed: ' . $error->getMessage());
        }
    }

    public function getConnection(): PDO
    {
        if (!$this->connection instanceof PDO) {
            if (PHP_SAPI !== 'cli') {
                Dot63Security::fail(503, 'The service is temporarily unavailable. Please try again later.');
            }
            throw new RuntimeException('The database connection is unavailable.');
        }
        return $this->connection;
    }

    public function closeConnection(): void
    {
        $this->connection = null;
    }
}
