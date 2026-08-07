<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE && !headers_sent()) {
    session_start();
}

$styleFile = __DIR__ . '/style.css';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Meet PromoFlow, the team making custom promotional products simpler, clearer, and easier to bring to life.">
  <meta name="theme-color" content="#172b45">

  <title>About us | PromoFlow</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" href="../../assets/img/favicon.png">
  <link rel="stylesheet" href="../../view/about_us/style.css?v=<?= is_file($styleFile) ? filemtime($styleFile) : time() ?>">
</head>

<body class="about-body">
  <a class="skip-link" href="#main-content">Skip to content</a>
  <?php include __DIR__ . '/../global/menu_general/menu_general.php'; ?>
  <?php include __DIR__ . '/navigation/navigation.php'; ?>
  <?php include __DIR__ . '/about/about.php'; ?>
</body>
</html>
