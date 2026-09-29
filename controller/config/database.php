<?php
require_once __DIR__ . "/../security/bootstrap.php";

class Database
{
    private $connection = null;

    public function __construct()
    {
        $environmentHost = getenv('DOT63_DB_HOST');
        $environmentName = getenv('DOT63_DB_NAME');
        $environmentUser = getenv('DOT63_DB_USER');
        $environmentPassword = getenv('DOT63_DB_PASSWORD');

        if ($environmentHost !== false && $environmentName !== false && $environmentUser !== false) {
            $candidates = [[
                'host' => $environmentHost,
                'name' => $environmentName,
                'user' => $environmentUser,
                'password' => $environmentPassword !== false ? $environmentPassword : '',
            ]];
        } elseif (strpos(__DIR__, '/Applications/XAMPP/') === 0
            && $environmentHost === false && $environmentName === false && $environmentUser === false) {
            // Local XAMPP development only. Hosted deployments must supply environment variables.
            $candidates = [['host' => 'localhost', 'name' => 'dot63', 'user' => 'root', 'password' => '']];
        } else {
            error_log('Dot63 database credentials are not configured. Set DOT63_DB_HOST, DOT63_DB_NAME, DOT63_DB_USER and DOT63_DB_PASSWORD.');
            return;
        }

        $lastError = null;
        foreach ($candidates as $candidate) {
            try {
                $dsn = sprintf(
                    'mysql:host=%s;dbname=%s;charset=utf8mb4',
                    $candidate['host'],
                    $candidate['name']
                );
                $this->connection = new PDO($dsn, $candidate['user'], $candidate['password'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => true,
                ]);
                return;
            } catch (PDOException $error) {
                $lastError = $error;
            }
        }

        error_log('Database connection failed: ' . ($lastError ? $lastError->getMessage() : 'No connection candidates.'));
    }

    public function getConnection()
    {
        return $this->connection;
    }

    public function closeConnection(): void
    {
        $this->connection = null;
    }
}
