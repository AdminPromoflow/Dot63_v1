<?php

class Customers
{
    private $connection;
    private string $name = '';
    private string $email = '';
    private string $password = '';
    private ?string $notes = null;
    private ?string $group = null;

    public function __construct($connection)
    {
        $this->connection = $connection;
    }

    public function setName($name): void
    {
        $this->name = trim((string)$name);
    }

    public function setEmail($email): void
    {
        $this->email = strtolower(trim((string)$email));
    }

    public function setPassword($password): void
    {
        $this->password = (string)$password;
    }

    public function setNotes($notes): void
    {
        $value = trim((string)$notes);
        $this->notes = $value === '' ? null : $value;
    }

    public function setGroup($group): void
    {
        $value = trim((string)$group);
        $this->group = $value === '' ? null : $value;
    }

    public function authenticate(): array
    {
        try {
            $pdo = $this->getPdo();
            $statement = $pdo->prepare("
                SELECT customer_id, name, email, password_hash
                FROM customers
                WHERE LOWER(TRIM(email)) = :email
                LIMIT 1
            ");
            $statement->execute([':email' => $this->email]);
            $customer = $statement->fetch(PDO::FETCH_ASSOC);

            if (!$customer || !password_verify($this->password, (string)($customer['password_hash'] ?? ''))) {
                return [
                    'success' => false,
                    'reason' => 'invalid_credentials',
                ];
            }

            if (password_needs_rehash((string)$customer['password_hash'], PASSWORD_DEFAULT)) {
                $rehash = $pdo->prepare("
                    UPDATE customers
                    SET password_hash = :password_hash
                    WHERE customer_id = :customer_id
                ");
                $rehash->execute([
                    ':password_hash' => password_hash($this->password, PASSWORD_DEFAULT),
                    ':customer_id' => (int)$customer['customer_id'],
                ]);
            }

            return [
                'success' => true,
                'customer' => $this->publicCustomer($customer),
            ];
        } catch (Throwable $error) {
            error_log('Customer authentication error: ' . $error->getMessage());
            return [
                'success' => false,
                'reason' => 'database_error',
            ];
        }
    }

    public function createCustomer(array $address): array
    {
        $pdo = null;
        try {
            $pdo = $this->getPdo();

            if ($this->findByEmail($pdo)) {
                return [
                    'success' => false,
                    'reason' => 'email_exists',
                ];
            }

            $pdo->beginTransaction();
            $statement = $pdo->prepare("
                INSERT INTO customers
                    (name, email, password_hash, notes, `group`)
                VALUES
                    (:name, :email, :password_hash, :notes, :customer_group)
            ");
            $statement->execute([
                ':name' => $this->name,
                ':email' => $this->email,
                ':password_hash' => password_hash($this->password, PASSWORD_DEFAULT),
                ':notes' => $this->notes,
                ':customer_group' => $this->group,
            ]);

            $customerId = (int)$pdo->lastInsertId();
            if ($customerId <= 0) {
                throw new RuntimeException('The customer ID was not generated.');
            }

            $addressStatement = $pdo->prepare('
                INSERT INTO addresses
                    (first_name, last_name, company_name, phone, email, street_address_1,
                     street_address_2, town_city, country, postcode, customer_id)
                VALUES
                    (:first_name, :last_name, :company_name, :phone, :email, :street_address_1,
                     :street_address_2, :town_city, :country, :postcode, :customer_id)
            ');
            $parameters = [':customer_id' => $customerId];
            foreach (['first_name', 'last_name', 'company_name', 'phone', 'email',
                      'street_address_1', 'street_address_2', 'town_city', 'country', 'postcode'] as $field) {
                $parameters[':' . $field] = $address[$field] === '' ? null : $address[$field];
            }
            $addressStatement->execute($parameters);
            $addressId = (int)$pdo->lastInsertId();
            if ($addressId <= 0) {
                throw new RuntimeException('The address ID was not generated.');
            }
            $pdo->commit();

            return [
                'success' => true,
                'address_id' => $addressId,
                'customer' => [
                    'customer_id' => $customerId,
                    'name' => $this->name,
                    'email' => $this->email,
                ],
            ];
        } catch (PDOException $error) {
            if ($pdo instanceof PDO && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('Customer registration error: ' . $error->getMessage());

            if ((int)($error->errorInfo[1] ?? 0) === 1062) {
                return [
                    'success' => false,
                    'reason' => 'email_exists',
                ];
            }

            return [
                'success' => false,
                'reason' => 'database_error',
            ];
        } catch (Throwable $error) {
            if ($pdo instanceof PDO && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('Customer registration error: ' . $error->getMessage());
            return [
                'success' => false,
                'reason' => 'database_error',
            ];
        }
    }

    private function findByEmail(PDO $pdo): ?array
    {
        $statement = $pdo->prepare("
            SELECT customer_id, name, email
            FROM customers
            WHERE LOWER(TRIM(email)) = :email
            LIMIT 1
        ");
        $statement->execute([':email' => $this->email]);
        $customer = $statement->fetch(PDO::FETCH_ASSOC);

        return $customer ?: null;
    }

    private function getPdo(): PDO
    {
        $pdo = $this->connection->getConnection();
        if (!$pdo instanceof PDO) {
            throw new RuntimeException('The database connection is unavailable.');
        }

        return $pdo;
    }

    private function publicCustomer(array $customer): array
    {
        return [
            'customer_id' => (int)($customer['customer_id'] ?? 0),
            'name' => trim((string)($customer['name'] ?? '')),
            'email' => strtolower(trim((string)($customer['email'] ?? ''))),
        ];
    }
}
