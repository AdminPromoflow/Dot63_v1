<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE && !headers_sent()) {
    session_start();
}

$styleFile = __DIR__ . '/style.css';
$isCustomerLoggedIn = !empty($_SESSION['customer_login'])
    && (int)($_SESSION['customer_id'] ?? 0) > 0
    && trim((string)($_SESSION['customer_email'] ?? '')) !== '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="PromoFlow makes custom promotional products simple, from branded bags to tech and event essentials.">
  <meta name="theme-color" content="#172b45">

  <title>PromoFlow | Promotional products made simple</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../view/main/style.css?v=<?= is_file($styleFile) ? filemtime($styleFile) : time() ?>">
</head>

<body class="body_main" data-customer-authenticated="<?= $isCustomerLoggedIn ? 'true' : 'false' ?>">
  <a class="skip-link" href="#main-content">Skip to content</a>
  <?php include __DIR__ . '/../global/menu_general/menu_general.php'; ?>
  <?php include __DIR__ . '/main/main.php'; ?>
</body>
</html>
