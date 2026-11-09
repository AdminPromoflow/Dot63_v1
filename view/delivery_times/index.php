<?php
require_once __DIR__ . '/../../controller/security/catalog_access.php';
require_once __DIR__ . '/../../model/delivery_settings.php';
Dot63Security::startSession();
if (empty($_SESSION['login']) || !is_string($_SESSION['email'] ?? null) || !filter_var($_SESSION['email'], FILTER_VALIDATE_EMAIL)) {
    header('Location: ../../view/log_inSupplier/index.php');
    exit;
}
header('Cache-Control: no-store');
$email = Dot63Security::supplierEmail();
$sku = is_string($_GET['sku'] ?? null) ? trim($_GET['sku']) : '';
$rows = [];
$priceRows = [];
$loadError = false;
try {
    $pdo = (new Database())->getConnection();
    if ($sku !== '' && CatalogAccess::ownedProductId($pdo, 'product', $sku, $email) === null) {
        Dot63Security::fail(403, 'You cannot access this product.');
    }
    $rows = DeliverySettings::variations($pdo, $email, $sku);
    $priceRows = DeliverySettings::priceRows($pdo, $email, $rows);
} catch (Throwable $error) {
    error_log('Delivery overview: ' . $error->getMessage());
    http_response_code(503);
    $loadError = true;
}
$escape = static function ($value): string { return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'); };
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Delivery Times | Supplier Portal</title>
  <?php require __DIR__ . '/../global/security/page_head.php'; ?>
  <link rel="stylesheet" href="delivery_times.css?v=<?= filemtime(__DIR__ . '/delivery_times.css') ?>">
</head>
<body class="body_delivery_times">
  <?php require __DIR__ . '/../global/menu_supplier/menu_general.php'; ?>
  <main class="delivery-page">
    <?php require __DIR__ . '/../global/header_add_product/header_add_product.php'; ?>
    <section class="delivery-card" aria-labelledby="delivery-title">
      <h1 id="delivery-title">Delivery Times</h1>
      <div class="delivery-tabs" role="tablist" aria-label="Delivery views">
        <button id="variations-tab" type="button" role="tab" aria-selected="true" aria-controls="variations-panel" tabindex="0">Variations</button>
        <button id="second-tab" type="button" role="tab" aria-selected="false" aria-controls="second-panel" tabindex="-1">Prices</button>
      </div>
      <div id="variations-panel" role="tabpanel" aria-labelledby="variations-tab" tabindex="0">
        <?php $kind = 'variation'; $listRows = $rows; require __DIR__ . '/list.php'; ?>
      </div>
      <div id="second-panel" role="tabpanel" aria-labelledby="second-tab" tabindex="0" hidden>
        <?php $kind = 'price'; $listRows = $priceRows; require __DIR__ . '/list.php'; ?>
      </div>
    </section>
    <div class="delivery-navigation">
      <button type="button" id="delivery-back">← Back to Prices</button>
      <button type="button" id="delivery-next">Preview Product →</button>
    </div>
  </main>
  <?php require __DIR__ . '/../global/supplier_ui/supplier_ui.php'; ?>
  <script src="delivery_times.js?v=<?= filemtime(__DIR__ . '/delivery_times.js') ?>"></script>
</body>
</html>
