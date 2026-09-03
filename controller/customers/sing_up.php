<?php

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../emails/send_emails.php';
require_once __DIR__ . '/../../model/customers.php';

class CustomerSignUpController
{
    public function handle(): void
    {
        $data = json_decode((string)file_get_contents('php://input'), true);

        if (!is_array($data) || ($data['action'] ?? '') !== 'requestSignUp') {
            $this->respond([
                'success' => false,
                'response' => false,
                'error' => 'Unsupported registration action.',
            ], 400);
            return;
        }

        $name = trim((string)($data['name'] ?? ''));
        $email = strtolower(trim((string)($data['email'] ?? '')));
        $password = (string)($data['password'] ?? '');

        $validationError = $this->validate($name, $email, $password);
        if ($validationError !== null) {
            $this->respond([
                'success' => false,
                'response' => false,
                'code' => 'VALIDATION_ERROR',
                'error' => $validationError,
            ], 422);
            return;
        }

        $customer = new Customers(new Database());
        $customer->setName($name);
        $customer->setEmail($email);
        $customer->setPassword($password);
        $result = $customer->createCustomer();

        if (empty($result['success'])) {
            if (($result['reason'] ?? '') === 'email_exists') {
                $this->respond([
                    'success' => false,
                    'response' => false,
                    'code' => 'EMAIL_EXISTS',
                    'error' => 'An account already exists for this email. Try logging in instead.',
                ], 409);
                return;
            }

            $this->respond([
                'success' => false,
                'response' => false,
                'error' => 'Registration is temporarily unavailable. Please try again.',
            ], 503);
            return;
        }

        $publicCustomer = $result['customer'];
        $emailSender = new EmailsSender();
        $emailSender->setRecipientEmail((string)$publicCustomer['email']);
        $emailSender->setRecipientName((string)$publicCustomer['name']);
        $notificationSent = $emailSender->sendEmailCustomerRegistration();

        $this->startCustomerSession($publicCustomer);
        $this->respond([
            'success' => true,
            'response' => true,
            'authenticated' => true,
            'message' => $notificationSent
                ? 'Your account was created successfully. A welcome email has been sent.'
                : 'Your account was created successfully, but the welcome email could not be sent.',
            'notification_sent' => $notificationSent,
            'customer' => $publicCustomer,
        ], 201);
    }

    private function validate(string $name, string $email, string $password): ?string
    {
        if ($name === '' || strlen($name) > 50) {
            return 'Enter your name using no more than 50 characters.';
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 50) {
            return 'Enter a valid email address using no more than 50 characters.';
        }

        if (strlen($password) < 8
            || !preg_match('/[A-Z]/', $password)
            || !preg_match('/[a-z]/', $password)
            || !preg_match('/[0-9]/', $password)
            || !preg_match('/[^A-Za-z0-9]/', $password)) {
            return 'Use at least 8 characters with uppercase, lowercase, a number and a symbol.';
        }

        return null;
    }

    private function startCustomerSession(array $customer): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
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

        session_regenerate_id(true);
        $_SESSION['customer_login'] = true;
        $_SESSION['customer_id'] = (int)$customer['customer_id'];
        $_SESSION['customer_name'] = (string)$customer['name'];
        $_SESSION['customer_email'] = (string)$customer['email'];
    }

    private function respond(array $payload, int $status): void
    {
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }
}

(new CustomerSignUpController())->handle();
