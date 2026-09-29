<?php

require_once __DIR__ . '/../../../controller/security/bootstrap.php';
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}
header('Cache-Control: no-store');
if (!empty($_SESSION['customer_login']) && (int)($_SESSION['customer_id'] ?? 0) > 0 && !empty($_SESSION['customer_email'])) {
    header('Location: ../product/index.php');
    exit;
}
$isRegistration = $customerAuthMode === 'register';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <?php require __DIR__ . '/../security/page_head.php'; ?>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Log in or create your PromoFlow account to customize products and save your delivery details.">
  <title><?= $isRegistration ? 'Create account' : 'Log in' ?> · PromoFlow</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <?php require __DIR__ . '/assets.php'; ?>
</head>
<body class="customer-auth-page">
  <a class="customer-auth-skip" href="#customer-auth-title">Skip to <?= $isRegistration ? 'registration' : 'login' ?></a>
  <?php require __DIR__ . '/../menu_general/menu_general.php'; ?>
  <main class="customer-auth-layout<?= $isRegistration ? ' customer-auth-layout--register' : '' ?>" aria-labelledby="customer-auth-title">
    <aside class="customer-auth-story">
      <a class="customer-auth-back" href="../product/index.php"><span aria-hidden="true">←</span> Back to products</a>
      <div class="customer-auth-story__copy">
        <p class="customer-auth-eyebrow"><span></span> MADE FOR YOUR BRAND</p>
        <h2>Small details.<br><em>Lasting impressions.</em></h2>
        <p>Bring your next idea to life with products people will want to keep.</p>
      </div>
      <img class="customer-auth-image" src="../main/main/img/hero-products-v2.jpg" alt="A coordinated collection of a tote bag, tumbler, notebook and promotional gifts" width="1200" height="1200">
      <p class="customer-auth-story__note"><span aria-hidden="true">✦</span> Your brand. Your products. All in one place.</p>
    </aside>
    <section class="customer-auth-content">
      <nav class="customer-auth-tabs" aria-label="Account access">
        <a href="../log_in/index.php" <?= !$isRegistration ? 'aria-current="page"' : '' ?>>Log in</a>
        <a href="../sign_up/index.php" <?= $isRegistration ? 'aria-current="page"' : '' ?>>Create account</a>
      </nav>
      <?php require $isRegistration ? __DIR__ . '/../../sign_up/sign/sign.php' : __DIR__ . '/../../log_in/log_in/login.php'; ?>
    </section>
  </main>
  <footer class="customer-auth-footer"><span>© <?= date('Y') ?> PromoFlow</span><span>Promotional products, made simple.</span></footer>
</body>
</html>
