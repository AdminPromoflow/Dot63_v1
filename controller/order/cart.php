<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../../model/jobs.php';

class CartController
{
    public function handle(): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            $this->respond([
                'success' => false,
                'error' => 'Only POST requests are supported.',
            ], 405);
            return;
        }

        $data = json_decode((string)file_get_contents('php://input'), true);
        if (!is_array($data)) {
            $this->respond([
                'success' => false,
                'error' => 'The cart request is invalid.',
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
                'error' => 'Please log in before using your shopping cart.',
            ], 401);
            return;
        }

        $jobs = new Jobs(new Database());
        $action = (string)($data['action'] ?? '');

        switch ($action) {
            case 'add_to_cart':
                $result = $jobs->addProductToJobs($data, $email);
                if (!empty($result['success'])) {
                    $result['message'] = ($data['intent'] ?? '') === 'buy_now'
                        ? 'Your product is ready in the cart.'
                        : 'The product was added to your cart.';
                }
                $this->respondFromResult($result, 201);
                return;

            case 'update_cart_item':
                $result = $jobs->updateCartItem(
                    (int)($data['cart_id'] ?? 0),
                    (int)($data['quantity'] ?? 0),
                    $email
                );
                if (!empty($result['success'])) {
                    $result['message'] = 'Cart quantity updated.';
                }
                $this->respondFromResult($result);
                return;

            case 'remove_cart_item':
                $result = $jobs->removeCartItem((int)($data['cart_id'] ?? 0), $email);
                if (!empty($result['success'])) {
                    $result['message'] = 'The product was removed from your cart.';
                }
                $this->respondFromResult($result);
                return;

            case 'clear_cart':
                $result = $jobs->clearCart($email);
                if (!empty($result['success'])) {
                    $result['message'] = 'Your shopping cart has been cleared.';
                }
                $this->respondFromResult($result);
                return;

            case 'validate_promo':
                $result = $jobs->validatePromotion((string)($data['code'] ?? ''), $email);
                if (!empty($result['success'])) {
                    $result['message'] = 'Promotional code applied successfully.';
                }
                $this->respondFromResult($result);
                return;

            case 'checkout':
                $result = $jobs->checkoutCart($email, (string)($data['promo_code'] ?? ''));
                $this->respondFromResult($result, 201);
                return;

            default:
                $this->respond([
                    'success' => false,
                    'error' => 'Unsupported cart action.',
                ], 400);
        }
    }

    private function respondFromResult(array $result, int $successStatus = 200): void
    {
        $status = !empty($result['success'])
            ? $successStatus
            : (int)($result['status'] ?? 400);
        unset($result['status']);
        $this->respond($result, $status);
    }

    private function respond(array $payload, int $status): void
    {
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}

(new CartController())->handle();
