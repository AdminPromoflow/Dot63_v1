<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/stripe.php';
require_once __DIR__ . '/../../model/checkout_payments.php';

final class StripeCheckoutController
{
    public function handle(): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            $this->respond(['success' => false, 'error' => 'Only POST requests are supported.'], 405);
            return;
        }

        $this->startSession();
        $data = json_decode((string)file_get_contents('php://input'), true);
        if (!is_array($data)) {
            $this->respond(['success' => false, 'error' => 'The checkout request is invalid.'], 400);
            return;
        }

        $customerId = (int)($_SESSION['customer_id'] ?? 0);
        $customerEmail = strtolower(trim((string)($_SESSION['customer_email'] ?? '')));
        $authenticated = !empty($_SESSION['customer_login'])
            && $customerId > 0
            && filter_var($customerEmail, FILTER_VALIDATE_EMAIL);
        if (!$authenticated) {
            $this->respond([
                'success' => false,
                'code' => 'AUTH_REQUIRED',
                'error' => 'Please log in as a customer before checkout.',
            ], 401);
            return;
        }

        $csrfToken = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($data['csrf_token'] ?? ''));
        $sessionToken = (string)($_SESSION['checkout_csrf_token'] ?? '');
        if ($sessionToken === '' || $csrfToken === '' || !hash_equals($sessionToken, $csrfToken)) {
            $this->respond([
                'success' => false,
                'code' => 'INVALID_CSRF_TOKEN',
                'error' => 'Your checkout session expired. Refresh the page and try again.',
            ], 419);
            return;
        }

        try {
            $action = trim((string)($data['action'] ?? ''));
            if ($action === 'save_address') {
                $payments = new CheckoutPayments(new Database());
                $address = $payments->saveAddress($customerId, is_array($data['address'] ?? null) ? $data['address'] : []);
                $this->respond([
                    'success' => true,
                    'message' => 'The delivery address was saved.',
                    'address' => $address,
                ], 201);
                return;
            }

            if ($action === 'create_payment_intent') {
                if (!StripeConfig::isConfigured()) {
                    throw new CheckoutPaymentException(
                        'Stripe keys are not configured on the server.',
                        503,
                        'STRIPE_NOT_CONFIGURED'
                    );
                }

                $payments = new CheckoutPayments(new Database(), StripeConfig::stripeClient());
                $result = $payments->preparePayment(
                    $customerId,
                    $customerEmail,
                    (int)($data['address_id'] ?? 0),
                    (string)($data['promotion_code'] ?? ''),
                    (int)($_SESSION['stripe_checkout_order_id'] ?? 0)
                );
                $_SESSION['stripe_checkout_order_id'] = (int)$result['order_id'];
                $this->respond(array_merge([
                    'success' => true,
                    'publishable_key' => StripeConfig::publishableKey(),
                ], $result), 200);
                return;
            }

            if ($action === 'get_payment_status') {
                $payments = new CheckoutPayments(new Database());
                $result = $payments->paymentStatus($customerId, (int)($data['order_id'] ?? 0));
                if (!empty($result['complete'])) {
                    $_SESSION['shopping_cart_count'] = 0;
                    $_SESSION['shopping_cart_job_ids'] = [];
                    unset($_SESSION['stripe_checkout_order_id']);
                }
                $this->respond(array_merge(['success' => true], $result), 200);
                return;
            }

            $this->respond(['success' => false, 'error' => 'Unsupported checkout action.'], 400);
        } catch (CheckoutPaymentException $error) {
            $this->respond([
                'success' => false,
                'code' => $error->publicCode(),
                'error' => $error->getMessage(),
            ], $error->httpStatus());
        } catch (\Stripe\Exception\ApiErrorException $error) {
            error_log('Stripe checkout API error: ' . $error->getMessage());
            $this->respond([
                'success' => false,
                'code' => 'STRIPE_API_ERROR',
                'error' => 'Stripe could not prepare the payment. Please try again.',
            ], 502);
        } catch (Throwable $error) {
            error_log('Stripe checkout error: ' . $error->getMessage());
            $this->respond([
                'success' => false,
                'code' => 'CHECKOUT_ERROR',
                'error' => 'The checkout request could not be completed.',
            ], 500);
        }
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
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}

(new StripeCheckoutController())->handle();

