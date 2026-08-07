<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
  session_start();
}

require_once __DIR__ . '/../../controller/config/database.php';
require_once __DIR__ . '/../../model/jobs.php';

$cartItems = [];
$cartLoadError = '';
$isSupplierCartAuthenticated = !empty($_SESSION['login']) && trim((string)($_SESSION['email'] ?? '')) !== '';
$isCustomerCartAuthenticated = !empty($_SESSION['customer_login'])
  && (int)($_SESSION['customer_id'] ?? 0) > 0
  && trim((string)($_SESSION['customer_email'] ?? '')) !== '';
$isCartAuthenticated = $isSupplierCartAuthenticated || $isCustomerCartAuthenticated;
$cartEmail = $isCustomerCartAuthenticated
  ? (string)$_SESSION['customer_email']
  : (string)($_SESSION['email'] ?? '');

if ($isCartAuthenticated) {
  $cartResult = (new Jobs(new Database()))->getCartItems($cartEmail);
  if (!empty($cartResult['success'])) {
    $cartItems = is_array($cartResult['items'] ?? null) ? $cartResult['items'] : [];
    $_SESSION['shopping_cart_count'] = count($cartItems);
    $_SESSION['shopping_cart_job_ids'] = array_values(array_filter(array_map(
      static fn($item): int => (int)($item['cart_id'] ?? 0),
      $cartItems
    )));
  } else {
    $cartLoadError = (string)($cartResult['error'] ?? 'Your shopping cart could not be loaded.');
  }
} else {
  $cartLoadError = 'Please log in to view and manage your shopping cart.';
}

$styleFs = __DIR__ . '/style.css';
$cartCssFs = __DIR__ . '/shopping_cart/shopping_cart.css';
$cartJsFs = __DIR__ . '/shopping_cart/shopping_cart.js';

$styleVersion = is_file($styleFs) ? filemtime($styleFs) : time();
$cartCssVersion = is_file($cartCssFs) ? filemtime($cartCssFs) : time();
$cartJsVersion = is_file($cartJsFs) ? filemtime($cartJsFs) : time();
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="description" content="Review the products, variations and quantities in your PromoFlow shopping cart.">
  <meta name="author" content="PromoFlow">
  <meta name="keywords" content="PromoFlow, shopping cart, products, order">

  <title>Shopping Cart | PromoFlow</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" href="../../assets/img/favicon.png">
  <link rel="stylesheet" href="style.css?v=<?= $styleVersion ?>">
  <link rel="stylesheet" href="shopping_cart/shopping_cart.css?v=<?= $cartCssVersion ?>">
</head>

<body class="shopping-cart-body">
  <?php
  $menuFile = __DIR__ . '/../global/menu_general/menu_general.php';

  if (is_file($menuFile)) {
    include $menuFile;
  }

  $breadcrumbs = [
    ['label' => 'Products', 'href' => '../product/index.php'],
    ['label' => 'Shopping cart', 'href' => null],
  ];
  $navigationFile = __DIR__ . '/navigation/navigation.php';
  if (is_file($navigationFile)) {
    include $navigationFile;
  }

  $shoppingCartFile = __DIR__ . '/shopping_cart/shopping_cart.php';
  if (is_file($shoppingCartFile)) {
    include $shoppingCartFile;
  } else {
    echo '<p class="shopping-cart-file-error">Shopping cart component not found.</p>';
  }
  ?>

  <script src="shopping_cart/shopping_cart.js?v=<?= $cartJsVersion ?>"></script>
</body>
</html>
