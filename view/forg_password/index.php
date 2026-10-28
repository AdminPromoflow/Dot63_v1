<?php
require_once __DIR__ . '/../../controller/security/bootstrap.php';
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
$accountType = ($_GET['account'] ?? '') === 'supplier' ? 'supplier' : 'customer';
$accountLabel = ucfirst($accountType);
$loginUrl = $accountType === 'supplier' ? '../log_inSupplier/index.php' : '../log_in/index.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="referrer" content="no-referrer">
  <title>Reset your password · .63</title>
  <?php require __DIR__ . '/../global/security/page_head.php'; ?>
  <link rel="stylesheet" href="password/password.css?v=<?= filemtime(__DIR__ . '/password/password.css') ?>">
</head>
<body class="recovery-page">
  <header class="recovery-header">
    <a class="recovery-brand" href="../main/index.php" aria-label=".63 home">.63</a>
    <a href="<?= $loginUrl ?>">Back to <?= $accountType ?> login <span aria-hidden="true">↗</span></a>
  </header>
  <?php require __DIR__ . '/password/password.php'; ?>
  <footer class="recovery-footer">© <?= date('Y') ?> .63 · Promotional products, made simple.</footer>
  <script src="password/password.js?v=<?= filemtime(__DIR__ . '/password/password.js') ?>" defer></script>
</body>
</html>
