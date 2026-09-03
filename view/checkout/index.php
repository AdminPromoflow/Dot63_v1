<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE && !headers_sent()) {
  session_start();
}

require_once __DIR__ . '/../../controller/config/database.php';
require_once __DIR__ . '/../../controller/config/stripe.php';
require_once __DIR__ . '/../../model/jobs.php';

$checkoutItems = [];
$checkoutSuppliers = [];
$checkoutAddresses = [];
$checkoutLoadError = '';
if (empty($_SESSION['checkout_csrf_token'])) {
  $_SESSION['checkout_csrf_token'] = bin2hex(random_bytes(32));
}
$checkoutCsrfToken = (string)$_SESSION['checkout_csrf_token'];
$stripePublishableKey = StripeConfig::publishableKey();
$stripeConfigured = StripeConfig::isConfigured();

$isCustomerCheckoutAuthenticated = !empty($_SESSION['customer_login'])
  && (int)($_SESSION['customer_id'] ?? 0) > 0
  && trim((string)($_SESSION['customer_email'] ?? '')) !== '';
$isCheckoutAuthenticated = $isCustomerCheckoutAuthenticated;
$checkoutCustomerId = $isCustomerCheckoutAuthenticated ? (int)$_SESSION['customer_id'] : 0;
$checkoutCustomerName = trim((string)($_SESSION['customer_name'] ?? ''));
$checkoutEmail = $isCustomerCheckoutAuthenticated ? trim((string)$_SESSION['customer_email']) : '';

if ($isCheckoutAuthenticated) {
  $cartResult = (new Jobs(new Database()))->getCartItems($checkoutEmail);
  if (!empty($cartResult['success'])) {
    $checkoutItems = is_array($cartResult['items'] ?? null) ? $cartResult['items'] : [];
    $_SESSION['shopping_cart_count'] = count($checkoutItems);
  } else {
    $checkoutLoadError = (string)($cartResult['error'] ?? 'Your checkout details could not be loaded.');
  }

  try {
    $database = new Database();
    $pdo = $database->getConnection();

    if (!$pdo instanceof PDO) {
      throw new RuntimeException('The database connection is unavailable.');
    }

    if ($checkoutCustomerId > 0) {
      $addressStatement = $pdo->prepare('
        SELECT
          address_id,
          first_name,
          last_name,
          company_name,
          phone,
          email,
          street_address_1,
          street_address_2,
          town_city,
          country,
          postcode,
          customer_id
        FROM addresses
        WHERE customer_id = :customer_id
        ORDER BY address_id ASC
      ');
      $addressStatement->execute([':customer_id' => $checkoutCustomerId]);
      $checkoutAddresses = $addressStatement->fetchAll(PDO::FETCH_ASSOC);
    }

    if ($checkoutEmail !== '' && count($checkoutItems) > 0) {
      $supplierStatement = $pdo->prepare('
        SELECT DISTINCT
          s.supplier_id,
          s.contact_name,
          s.email,
          s.phone,
          s.company_name,
          s.country,
          s.city,
          s.address_line1,
          s.address_line2,
          s.postal_code
        FROM jobs j
        INNER JOIN job_details jd ON jd.job_id = j.job_id
        INNER JOIN variations v ON v.variation_id = jd.variation_id
        INNER JOIN products p ON p.product_id = v.product_id
        INNER JOIN suppliers s ON s.supplier_id = p.supplier_id
        WHERE j.status = \'cart\'
          AND LOWER(TRIM(SUBSTRING_INDEX(j.notes, \'Customer session:\', -1))) = :cart_owner
        ORDER BY s.company_name ASC, s.supplier_id ASC
      ');
      $supplierStatement->execute([
        ':cart_owner' => strtolower(trim($checkoutEmail)) . '.',
      ]);
      $checkoutSuppliers = $supplierStatement->fetchAll(PDO::FETCH_ASSOC);
    }
  } catch (Throwable $error) {
    error_log('Checkout interface load error: ' . $error->getMessage());
    if ($checkoutLoadError === '') {
      $checkoutLoadError = 'Some checkout information is temporarily unavailable.';
    }
  }
} else {
  $checkoutLoadError = 'Please log in to review your checkout details.';
}

$checkoutSubtotal = array_reduce(
  $checkoutItems,
  static function (float $total, array $item): float {
    $quantity = max(1, (int)($item['quantity'] ?? 1));
    $unitPrice = max(0, (float)($item['unit_price'] ?? 0));
    return $total + ($quantity * $unitPrice);
  },
  0.0
);
$checkoutDelivery = 0.0;
$checkoutTotal = $checkoutSubtotal + $checkoutDelivery;

$styleFile = __DIR__ . '/style.css';
$checkoutCssFile = __DIR__ . '/checkout/checkout.css';
$stripeCheckoutCssFile = __DIR__ . '/checkout/stripe_checkout.css';
$stripeCheckoutJsFile = __DIR__ . '/checkout/stripe_checkout.js';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Review supplier, delivery and payment details for your PromoFlow order.">
  <meta name="theme-color" content="#172b45">

  <title>Checkout | PromoFlow</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css?v=<?= is_file($styleFile) ? filemtime($styleFile) : time() ?>">
  <link rel="stylesheet" href="checkout/checkout.css?v=<?= is_file($checkoutCssFile) ? filemtime($checkoutCssFile) : time() ?>">
  <link rel="stylesheet" href="checkout/stripe_checkout.css?v=<?= is_file($stripeCheckoutCssFile) ? filemtime($stripeCheckoutCssFile) : time() ?>">
  <?php if ($stripeConfigured): ?>
    <script src="https://js.stripe.com/clover/stripe.js"></script>
  <?php endif; ?>
</head>

<body class="checkout-body">
  <?php include __DIR__ . '/../global/menu_general/menu_general.php'; ?>

  <?php include __DIR__ . '/checkout/checkout.php'; ?>

  <script>
    window.dot63CheckoutConfig = <?= json_encode([
      'apiUrl' => '../../controller/order/stripe_checkout.php',
      'csrfToken' => $checkoutCsrfToken,
      'publishableKey' => $stripePublishableKey,
      'stripeConfigured' => $stripeConfigured,
      'authenticated' => $isCustomerCheckoutAuthenticated,
      'customerEmail' => $checkoutEmail,
    ], JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;
  </script>
  <script src="checkout/stripe_checkout.js?v=<?= is_file($stripeCheckoutJsFile) ? filemtime($stripeCheckoutJsFile) : time() ?>"></script>
</body>
</html>
