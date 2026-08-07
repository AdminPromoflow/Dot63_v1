<?php

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../../model/customers.php';

class CustomerLoginController
{
    public function handle(): void
    {
        $data = json_decode((string)file_get_contents('php://input'), true);

        if (!is_array($data)) {
            $this->respond([
                'success' => false,
                'error' => 'Invalid request payload.',
            ], 400);
            return;
        }

        switch ((string)($data['action'] ?? '')) {
            case 'requestLogin':
                $this->login($data);
                return;

            case 'verify_login_customer':
                $this->verifySession();
                return;

            case 'logout_customer':
                $this->logout();
                return;

            default:
                $this->respond([
                    'success' => false,
                    'error' => 'Unsupported authentication action.',
                ], 400);
        }
    }

    private function login(array $data): void
    {
        $email = strtolower(trim((string)($data['email'] ?? '')));
        $password = (string)($data['password'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            $this->respond([
                'success' => false,
                'code' => 'VALIDATION_ERROR',
                'error' => 'Enter a valid email address and password.',
            ], 422);
            return;
        }

        $customer = new Customers(new Database());
        $customer->setEmail($email);
        $customer->setPassword($password);
        $result = $customer->authenticate();

        if (empty($result['success'])) {
            if (($result['reason'] ?? '') === 'database_error') {
                $this->respond([
                    'success' => false,
                    'error' => 'Authentication is temporarily unavailable. Please try again.',
                ], 503);
                return;
            }

            $this->respond([
                'success' => false,
                'code' => 'INVALID_CREDENTIALS',
                'error' => 'The email or password is incorrect.',
            ], 401);
            return;
        }

        $publicCustomer = $result['customer'];
        $this->startCustomerSession($publicCustomer);
        $this->respond([
            'success' => true,
            'response' => true,
            'authenticated' => true,
            'customer' => $publicCustomer,
        ], 200);
    }

    private function verifySession(): void
    {
        $this->startSession();
        $authenticated = !empty($_SESSION['customer_login'])
            && (int)($_SESSION['customer_id'] ?? 0) > 0
            && trim((string)($_SESSION['customer_email'] ?? '')) !== '';

        $this->respond([
            'success' => true,
            'authenticated' => $authenticated,
            'customer' => $authenticated ? [
                'customer_id' => (int)$_SESSION['customer_id'],
                'name' => (string)($_SESSION['customer_name'] ?? ''),
                'email' => (string)$_SESSION['customer_email'],
            ] : null,
        ], 200);
    }

    private function logout(): void
    {
        $this->startSession();
        unset(
            $_SESSION['customer_login'],
            $_SESSION['customer_id'],
            $_SESSION['customer_name'],
            $_SESSION['customer_email'],
            $_SESSION['shopping_cart_count'],
            $_SESSION['shopping_cart_job_ids'],
            $_SESSION['shopping_cart']
        );
        session_regenerate_id(true);

        $this->respond([
            'success' => true,
            'authenticated' => false,
        ], 200);
    }

    private function startCustomerSession(array $customer): void
    {
        $this->startSession();
        session_regenerate_id(true);

        $_SESSION['customer_login'] = true;
        $_SESSION['customer_id'] = (int)$customer['customer_id'];
        $_SESSION['customer_name'] = (string)$customer['name'];
        $_SESSION['customer_email'] = (string)$customer['email'];
    }

    private function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        ini_set('session.use_strict_mode', '1');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    private function respond(array $payload, int $status): void
    {
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }
}

(new CustomerLoginController())->handle();
