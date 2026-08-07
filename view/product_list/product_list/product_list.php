<?php
$cssTime = filemtime('../../view/product_list/product_list/product_list.css');
$jsTime  = filemtime('../../view/product_list/product_list/product_list.js');
?>
<link rel="stylesheet" href="../../view/product_list/product_list/product_list.css?v=<?= $cssTime ?>">

<main class="product_list" aria-labelledby="pl-title">
  <?php include "../../view/product_list/navigation/navigation.php" ?>

  <h1 id="pl-title" class="sr-only">Product List</h1>

  <?php include "../../view/global/header_add_product/header_add_product.php" ?>

  <section class="pl-card" aria-labelledby="pl-products-title">
    <header class="pl-card-header">
      <div>
        <h2 id="pl-products-title">Products</h2>
        <p class="pl-subtitle">Choose the product record you want to continue editing.</p>
      </div>
    </header>

    <div class="pl-products-wrapper">
      <div class="pl-products-list" id="product_list" role="list"></div>
      <p class="pl-product-hint">Click a product to view or edit its details.</p>
    </div>

    <hr class="pl-sep" aria-hidden="true">
  </section>

  <div class="pl-footer">
    <button class="btn btn-back" id="btn_back_products" type="button">
      ← Back
    </button>

    <button class="btn btn-choose-product" id="choose_product" type="button">
      Choose Product
    </button>

    <button class="btn btn-cancel-choose-product" id="cancel_choose_product" type="button">
      Cancel Choosing
    </button>

    <button class="btn btn-next" id="next_product" type="button">
      Next
    </button>
  </div>
</main>

<script src="../../view/product_list/product_list/product_list.js?v=<?= $jsTime ?>"></script>
