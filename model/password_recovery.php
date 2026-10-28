<?php
declare(strict_types=1);

final class PasswordRecovery
{
    public const LIFETIME = 1800;
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    private function accountColumns(string $type): array
    {
        if ($type === 'supplier') return ['suppliers', 'supplier_id', 'contact_name', 'password'];
        if ($type === 'customer') return ['customers', 'customer_id', 'name', 'password_hash'];
        throw new InvalidArgumentException('Invalid account type.');
    }

    /** The caller always returns the same public response, including for missing accounts. */
    public function request(string $type, string $email, string $ip, callable $send): void
    {
        [$table, $id, $name, $password] = $this->accountColumns($type);
        $email = strtolower(trim($email));
        $now = time();
        $this->pdo->prepare('DELETE FROM password_reset_requests WHERE window_started < ?')->execute([$now - 86400]);
        $this->pdo->prepare('DELETE FROM password_reset_tokens WHERE expires_at <= ?')->execute([$now]);
        // Persistent limits work across sessions. Never trust an incoming forwarded IP header.
        if (!$this->allowRequest('ip:' . $ip, 10, $now)
            || !$this->allowRequest('account:' . $type . ':' . $email, 3, $now)) return;

        $query = $this->pdo->prepare("SELECT $id AS id, $name AS name, email, $password AS password FROM $table WHERE LOWER(TRIM(email)) = ? LIMIT 1");
        $query->execute([$email]);
        $account = $query->fetch(PDO::FETCH_ASSOC);
        if (!$account) return;

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $statement = $this->pdo->prepare('INSERT INTO password_reset_tokens
            (account_type, account_id, token_hash, password_fingerprint, expires_at) VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE token_hash = VALUES(token_hash),
                password_fingerprint = VALUES(password_fingerprint), expires_at = VALUES(expires_at)');
        $statement->execute([$type, $account['id'], $tokenHash, hash('sha256', (string)$account['password']), $now + self::LIFETIME]);

        try {
            $sent = $send($account, $type, $token);
        } catch (Throwable $error) {
            $sent = false;
        }
        if (!$sent) {
            $this->pdo->prepare('DELETE FROM password_reset_tokens WHERE token_hash = ?')->execute([$tokenHash]);
            error_log('Dot63 password recovery email could not be delivered. Check SMTP configuration.');
        }
    }

    private function allowRequest(string $bucket, int $limit, int $now): bool
    {
        $hash = hash('sha256', $bucket);
        $statement = $this->pdo->prepare('INSERT INTO password_reset_requests (bucket_hash, attempts, window_started)
            VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE
            attempts = IF(window_started <= ?, 1, attempts + 1),
            window_started = IF(window_started <= ?, VALUES(window_started), window_started)');
        $statement->execute([$hash, $now, $now - 900, $now - 900]);
        $query = $this->pdo->prepare('SELECT attempts FROM password_reset_requests WHERE bucket_hash = ?');
        $query->execute([$hash]);
        return (int)$query->fetchColumn() <= $limit;
    }

    private function findToken(string $type, string $token, bool $lock = false): ?array
    {
        [$table, $id, , $password] = $this->accountColumns($type);
        if (!preg_match('/\A[a-f0-9]{64}\z/', $token)) return null;
        $statement = $this->pdo->prepare('SELECT account_id, password_fingerprint FROM password_reset_tokens
            WHERE token_hash = ? AND account_type = ? AND expires_at > ?' . ($lock ? ' FOR UPDATE' : ''));
        $statement->execute([hash('sha256', $token), $type, time()]);
        $reset = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$reset) return null;
        $account = $this->pdo->prepare("SELECT $password FROM $table WHERE $id = ?" . ($lock ? ' FOR UPDATE' : ''));
        $account->execute([$reset['account_id']]);
        $storedHash = $account->fetchColumn();
        if ($storedHash === false || !hash_equals($reset['password_fingerprint'], hash('sha256', (string)$storedHash))) return null;
        return $reset;
    }

    public function isValid(string $type, string $token): bool
    {
        return $this->findToken($type, $token) !== null;
    }

    public function reset(string $type, string $token, string $password): bool
    {
        if (self::passwordError($password) !== null) throw new InvalidArgumentException('Invalid password.');
        [$table, $id, , $column] = $this->accountColumns($type);
        $this->pdo->beginTransaction();
        try {
            $reset = $this->findToken($type, $token, true);
            if (!$reset) {
                $this->pdo->rollBack();
                return false;
            }
            $statement = $this->pdo->prepare("UPDATE $table SET $column = ? WHERE $id = ?");
            $statement->execute([password_hash($password, PASSWORD_DEFAULT), $reset['account_id']]);
            $this->pdo->prepare('DELETE FROM password_reset_tokens WHERE account_type = ? AND account_id = ?')
                ->execute([$type, $reset['account_id']]);
            $this->pdo->commit();
            return true;
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $error;
        }
    }

    public static function passwordError(string $password): ?string
    {
        if (strlen($password) > 72 || strpos($password, "\0") !== false) {
            return 'Choose a password no longer than 72 bytes, without null characters.';
        }
        if (mb_strlen($password, 'UTF-8') < 8 || !preg_match('/[A-Z]/', $password)
            || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password)
            || !preg_match('/[^A-Za-z0-9]/', $password)) {
            return 'Use at least 8 characters with uppercase, lowercase, a number and a symbol.';
        }
        return null;
    }
}
