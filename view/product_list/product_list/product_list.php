
<?php
$cssTime = filemtime('../../view/product_list/product_list/product_list.css');
$jsTime  = filemtime('../../view/product_list/product_list/product_list.js');
?>
<link rel="stylesheet" href="../../view/product_list/product_list/product_list.css?v=<?= $cssTime ?>">

<main class="product_list" aria-labelledby="pl-title">
  <h1 id="pl-title" class="sr-only">Product List</h1>

  <?php include "../../view/global/header_add_product/header_add_product.php" ?>

  <section class="pl-card" aria-labelledby="pl-products-title">
    <header class="pl-card-header">
      <div>
        <h2 id="pl-products-title">Products List</h2>
        <p class="pl-subtitle">View and manage your products.</p>
      </div>
    </header>

    <div class="pl-products-wrapper">
      <div class="pl-products-list" id="product_list" role="list">

        <div class="pl-product" role="listitem">
          <span class="pl-product-number">1</span>
          <span class="pl-product-name">Classic Lanyard</span>
        </div>

        <div class="pl-product" role="listitem">
          <span class="pl-product-number">2</span>
          <span class="pl-product-name">PVC Badge</span>
        </div>

        <div class="pl-product" role="listitem">
          <span class="pl-product-number">3</span>
          <span class="pl-product-name">Silicone Wristband</span>
        </div>

        <div class="pl-product" role="listitem">
          <span class="pl-product-number">4</span>
          <span class="pl-product-name">Printed Tote Bag</span>
        </div>

        <div class="pl-product" role="listitem">
          <span class="pl-product-number">5</span>
          <span class="pl-product-name">Custom Keyring</span>
        </div>

        <div class="pl-product" role="listitem">
          <span class="pl-product-number">6</span>
          <span class="pl-product-name">ID Card Holder</span>
        </div>

      </div>

      <p class="pl-product-hint">Click a product to view or edit its details.</p>
    </div>

    <hr class="pl-sep" aria-hidden="true">
  </section>

<div class="pl-footer">
    <button class="btn btn-danger" id="reset" type="button">Reset</button>

    <div class="pl-footer-actions">
      <button class="btn btn-primary" id="save" type="button">Save</button>
      <button class="btn" id="next_product" type="button">Save & Next</button>
    </div>
  </div>
</main>

<script src="../../view/product_list/product_list/product_list.js?v=<?= $jsTime ?>"></script>

