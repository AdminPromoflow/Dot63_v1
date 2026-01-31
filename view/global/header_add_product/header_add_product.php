<link rel="stylesheet" href="<?php $u='../../view/global/header_add_product/header_add_product.css'; $f=realpath(__DIR__.'/'.$u); echo $u.'?v='.( $f && file_exists($f) ? filemtime($f) : time()); ?>">

<nav class="cp-tabs" role="tablist" aria-label="Create product steps">
  <a class="cp-tab" data-href="../../view/category/index.php" tabindex="0">Category</a>
  <a class="cp-tab" data-href="../../view/group/index.php" tabindex="0">Group</a>
  <a class="cp-tab" data-href="../../view/product_details/index.php" tabindex="0">Product Details</a>
  <a class="cp-tab" data-href="../../view/variations/index.php" tabindex="0">Variations</a>
  <a class="cp-tab" data-href="../../view/images/index.php" tabindex="0">Images</a>
  <a class="cp-tab" data-href="../../view/items/index.php" tabindex="0">Items</a>
  <a class="cp-tab" data-href="../../view/prices/index.php" tabindex="0">Prices</a>
  <a class="cp-tab" data-href="../../view/preview_porduct/index.php" tabindex="0">Preview Product</a>
</nav>

<script src="<?php $u='../../view/global/header_add_product/header_add_product.js'; $f=realpath(__DIR__.'/'.$u); echo $u.'?v='.( $f && file_exists($f) ? filemtime($f) : time()); ?>"></script>
