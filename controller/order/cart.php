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

        $customerAuthenticated = !empty($_SESSION['customer_login'])
            && (int)($_SESSION['customer_id'] ?? 0) > 0
            && trim((string)($_SESSION['customer_email'] ?? '')) !== '';
        $supplierAuthenticated = !empty($_SESSION['login'])
            && trim((string)($_SESSION['email'] ?? '')) !== '';
        $email = strtolower(trim((string)($customerAuthenticated
            ? $_SESSION['customer_email']
            : ($_SESSION['email'] ?? ''))));

        if ((!$customerAuthenticated && !$supplierAuthenticated) || $email === '') {
            $this->respond([
                'success' => false,
                'code' => 'AUTH_REQUIRED',
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
                    $result = $this->withCartCount($result, $jobs, $email);
                }
                $this->respondFromResult($result, 201);
                return;

            case 'get_cart_status':
                $cart = $jobs->getCartItems($email);
                if (empty($cart['success'])) {
                    $this->respondFromResult($cart);
                    return;
                }
                $cartItems = is_array($cart['items'] ?? null) ? $cart['items'] : [];
                $cartCount = count($cartItems);
                $_SESSION['shopping_cart_count'] = $cartCount;
                $_SESSION['shopping_cart_job_ids'] = array_values(array_filter(array_map(
                    static fn($item): int => (int)($item['cart_id'] ?? 0),
                    $cartItems
                )));
                $this->respond([
                    'success' => true,
                    'cart_count' => $cartCount,
                ], 200);
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
                    $result = $this->withCartCount($result, $jobs, $email);
                }
                $this->respondFromResult($result);
                return;

            case 'clear_cart':
                $result = $jobs->clearCart($email);
                if (!empty($result['success'])) {
                    $result['message'] = 'Your shopping cart has been cleared.';
                    $_SESSION['shopping_cart_count'] = 0;
                    $_SESSION['shopping_cart_job_ids'] = [];
                    $result['cart_count'] = 0;
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
                $this->respond([
                    'success' => false,
                    'code' => 'STRIPE_CHECKOUT_REQUIRED',
                    'error' => 'Orders must be completed through the secure Stripe checkout.',
                ], 410);
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

    private function withCartCount(array $result, Jobs $jobs, string $email): array
    {
        $cart = $jobs->getCartItems($email);
        $cartCount = !empty($cart['success']) && is_array($cart['items'] ?? null)
            ? count($cart['items'])
            : max(0, (int)($_SESSION['shopping_cart_count'] ?? 0));

        $_SESSION['shopping_cart_count'] = $cartCount;
        if (!empty($cart['success']) && is_array($cart['items'] ?? null)) {
            $_SESSION['shopping_cart_job_ids'] = array_values(array_filter(array_map(
                static fn($item): int => (int)($item['cart_id'] ?? 0),
                $cart['items']
            )));
        }
        $result['cart_count'] = $cartCount;
        return $result;
    }

    private function respond(array $payload, int $status): void
    {
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}

(new CartController())->handle();
