<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../../model/jobs.php';

class CartController
{
    public function handle(): void
    {
        $data = json_decode((string)file_get_contents('php://input'), true);

        if (!is_array($data) || ($data['action'] ?? '') !== 'add_to_cart') {
            $this->respond([
                'success' => false,
                'error' => 'Unsupported cart action.',
            ], 400);
            return;
        }

        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        $customerId = (int)($_SESSION['customer_id'] ?? 0);
        $email = strtolower(trim((string)($_SESSION['customer_email'] ?? '')));
        if (empty($_SESSION['customer_login']) || $customerId <= 0 || $email === '') {
            $this->respond([
                'success' => false,
                'code' => 'AUTH_REQUIRED',
                'error' => 'Usuario no registrado. Inicia sesión o crea una cuenta para continuar.',
            ], 401);
            return;
        }

        $intent = (string)($data['intent'] ?? 'add_to_cart');
        if (!in_array($intent, ['add_to_cart', 'buy_now'], true)) {
            $this->respond([
                'success' => false,
                'error' => 'Unsupported purchase intent.',
            ], 422);
            return;
        }

        $database = new Database();
        $jobs = new Jobs($database);
        $result = $jobs->addProductToJobs($data, $email);

        if (empty($result['success'])) {
            $status = (int)($result['status'] ?? 400);
            unset($result['status']);
            $this->respond($result, $status);
            return;
        }

        $result['message'] = $intent === 'buy_now'
            ? 'Your product is ready in the cart.'
            : 'The product was added to your cart.';
        $this->respond($result, 201);
    }

    private function respond(array $payload, int $status): void
    {
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }
}

$controller = new CartController();
$controller->handle();
