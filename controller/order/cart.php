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

        $email = strtolower(trim((string)($_SESSION['email'] ?? '')));
        if (empty($_SESSION['login']) || $email === '') {
            $this->respond([
                'success' => false,
                'error' => 'Please log in before adding a product to your cart.',
            ], 401);
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

        $result['message'] = ($data['intent'] ?? '') === 'buy_now'
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
