<?php
declare(strict_types=1);

$page = (string)($_GET['page'] ?? 'dashboard');
$views = [
  'dashboard' => '../../view/dashboard_supplier/dashboard_supplier/dashboard_supplier.php',
  'products' => '../../view/products_supplier/products/article.php',
  'category' => '../../view/category/addcategory/category.php',
  'group' => '../../view/group/group/group.php',
  'details' => '../../view/product_details/product_details/product_details.php',
  'variations' => '../../view/variations/varia/variations.php',
  'images' => '../../view/images/img/images.php',
  'items' => '../../view/items/items/items.php',
  'prices' => '../../view/prices/prices/prices.php',
];

if (!isset($views[$page])) {
  http_response_code(404);
  exit('Unknown preview.');
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="script-src 'none'">
  <title>Supplier UI preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../view/global/menu_supplier/menu_general.css">
</head>
<body class="<?= $page === 'dashboard' ? 'body_dashboard_supplier' : ($page === 'products' ? 'body_product' : 'body_product_details') ?>">
  <header class="site-header">
    <a class="brand" href="#" aria-label="PromoFlow supplier dashboard">
      <span class="brand-mark"><span>.</span>63</span>
      <span class="brand-copy"><strong>PromoFlow</strong><small>Supplier portal</small></span>
    </a>
    <nav class="nav">
      <ul class="nav-list">
        <li><a href="#">Dashboard</a></li>
        <li><a href="#">Products</a></li>
        <li><button class="cta" type="button">Log out</button></li>
      </ul>
    </nav>
  </header>

  <?php if ($page === 'dashboard'): ?>
    <?php include '../../view/dashboard_supplier/navigation/navigation.php'; ?>
  <?php elseif ($page === 'products'): ?>
    <?php include '../../view/products_supplier/navigation/navigation.php'; ?>
  <?php endif; ?>

  <?php
  ob_start();
  include $views[$page];
  $preview = (string)ob_get_clean();

  if ($page === 'category') {
    $cards = '<article class="cp-cat is-active"><span class="cp-cat-name">Bags</span><span class="cp-cat-meta">12 products</span></article>'
      . '<article class="cp-cat"><span class="cp-cat-name">Technology</span><span class="cp-cat-meta">8 products</span></article>'
      . '<article class="cp-cat"><span class="cp-cat-name">Drinkware</span><span class="cp-cat-meta">16 products</span></article>'
      . '<article class="cp-cat"><span class="cp-cat-name">Accessories</span><span class="cp-cat-meta">21 products</span></article>';
    $preview = str_replace('<div class="cp-cat-grid" id="category_list" role="list"></div>', '<div class="cp-cat-grid" id="category_list" role="list">' . $cards . '</div>', $preview);
  }

  if ($page === 'group') {
    $cards = '<article class="cp-group is-active"><span class="cp-group-name">Material</span><span class="cp-group-meta">Primary group</span></article>'
      . '<article class="cp-group"><span class="cp-group-name">Colour</span><span class="cp-group-meta">8 options</span></article>'
      . '<article class="cp-group"><span class="cp-group-name">Size</span><span class="cp-group-meta">5 options</span></article>'
      . '<article class="cp-group"><span class="cp-group-name">Finish</span><span class="cp-group-meta">4 options</span></article>';
    $preview = str_replace('<div class="cp-group-grid" id="group_list" role="list"></div>', '<div class="cp-group-grid" id="group_list" role="list">' . $cards . '</div>', $preview);
  }

  $stepLabels = [
    'category' => 'Category',
    'group' => 'Group',
    'details' => 'Product Details',
    'variations' => 'Variations',
    'images' => 'Images',
    'items' => 'Items',
    'prices' => 'Prices',
  ];

  if (isset($stepLabels[$page])) {
    $label = preg_quote($stepLabels[$page], '/');
    $preview = (string)preg_replace(
      '/<a class="cp-tab"([^>]*)>' . $label . '<\/a>/',
      '<a class="cp-tab active"$1>' . $stepLabels[$page] . '</a>',
      $preview,
      1
    );
  }

  echo $preview;
  include '../../view/global/supplier_ui/supplier_ui.php';
  ?>
</body>
</html>
