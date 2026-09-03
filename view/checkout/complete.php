<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE && !headers_sent()) {
  session_start();
}

require_once __DIR__ . '/../../controller/config/stripe.php';

if (empty($_SESSION['checkout_csrf_token'])) {
  $_SESSION['checkout_csrf_token'] = bin2hex(random_bytes(32));
}

$orderId = max(0, (int)($_GET['order_id'] ?? 0));
$isCustomerAuthenticated = !empty($_SESSION['customer_login'])
  && (int)($_SESSION['customer_id'] ?? 0) > 0
  && trim((string)($_SESSION['customer_email'] ?? '')) !== '';
$publishableKey = StripeConfig::publishableKey();
$completeCss = __DIR__ . '/checkout/complete.css';
$completeJs = __DIR__ . '/checkout/complete.js';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Check the status of your PromoFlow payment.">
  <meta name="theme-color" content="#172b45">
  <title>Payment status | PromoFlow</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="checkout/complete.css?v=<?= is_file($completeCss) ? filemtime($completeCss) : time() ?>">
  <?php if ($publishableKey !== ''): ?>
    <script src="https://js.stripe.com/clover/stripe.js"></script>
  <?php endif; ?>
</head>
<body>
  <?php include __DIR__ . '/../global/menu_general/menu_general.php'; ?>

  <main
    class="payment-result-page"
    id="payment-result-page"
    data-api-url="../../controller/order/stripe_checkout.php"
    data-csrf-token="<?= htmlspecialchars((string)$_SESSION['checkout_csrf_token'], ENT_QUOTES, 'UTF-8') ?>"
    data-order-id="<?= $orderId ?>"
    data-publishable-key="<?= htmlspecialchars($publishableKey, ENT_QUOTES, 'UTF-8') ?>"
    data-authenticated="<?= $isCustomerAuthenticated ? 'true' : 'false' ?>"
  >
    <section class="payment-result-card" aria-labelledby="payment-result-title">
      <div class="result-icon is-loading" id="result-icon" aria-hidden="true">
        <svg class="result-spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>
        <svg class="result-success" viewBox="0 0 24 24"><path d="m6 12 4 4 8-8"/></svg>
        <svg class="result-error" viewBox="0 0 24 24"><path d="M12 8v5m0 3.5v.1M10.3 4.4 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0Z"/></svg>
      </div>

      <span class="result-kicker">Stripe payment</span>
      <h1 id="payment-result-title">Confirming your payment</h1>
      <p id="payment-result-message">Please keep this page open while Stripe and PromoFlow confirm your order.</p>

      <dl class="result-details">
        <div>
          <dt>Order</dt>
          <dd id="result-order-id"><?= $orderId > 0 ? '#' . $orderId : 'Unavailable' ?></dd>
        </div>
        <div>
          <dt>Payment status</dt>
          <dd id="result-payment-status">Checking…</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd id="result-total">—</dd>
        </div>
      </dl>

      <div class="result-actions">
        <a class="result-primary" id="result-primary-action" href="../product/index.php">Continue shopping</a>
        <a class="result-secondary" id="result-secondary-action" href="index.php">Return to checkout</a>
      </div>

      <p class="result-help">Your card details are handled directly by Stripe and are never stored by PromoFlow.</p>
    </section>
  </main>

  <script src="checkout/complete.js?v=<?= is_file($completeJs) ? filemtime($completeJs) : time() ?>"></script>
</body>
</html>
