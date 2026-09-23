<link rel="stylesheet" href="../../view/global/header_add_product/header_add_product.css?v=<?= filemtime(__DIR__ . '/header_add_product.css') ?>">

<section class="editor-selection" aria-label="Current product selection" aria-live="polite" aria-atomic="true" aria-busy="true">
  <dl class="editor-selection__list" id="editor_selection">
    <?php foreach (['category' => 'Category', 'group' => 'Group', 'product' => 'Product', 'variation' => 'Variation'] as $key => $label): ?>
    <div class="editor-selection__entry" data-selection="<?= $key ?>">
      <dt><?= $label ?></dt>
      <dd data-selection-value="<?= $key ?>">—</dd>
    </div>
    <?php endforeach; ?>
  </dl>
  <p class="editor-selection__notice" id="editor_selection_notice" hidden></p>
</section>

<nav class="cp-tabs" role="tablist" aria-label="Create product steps">
  <a class="cp-tab" data-href="../../view/category/index.php" tabindex="0">Category</a>
  <a class="cp-tab" data-href="../../view/group/index.php" tabindex="0">Group</a>
  <a class="cp-tab" data-href="../../view/product_list/index.php" tabindex="0">Products</a>
  <a class="cp-tab" data-href="../../view/product_details/index.php" tabindex="0">Product Details</a>
  <a class="cp-tab" data-href="../../view/variations/index.php" tabindex="0">Variations</a>
  <a class="cp-tab" data-href="../../view/images/index.php" tabindex="0">Images</a>
  <a class="cp-tab" data-href="../../view/items/index.php" tabindex="0">Items</a>
  <a class="cp-tab" data-href="../../view/prices/index.php" tabindex="0">Prices</a>
  <a class="cp-tab" data-href="../../view/preview_porduct/index.php" tabindex="0">Preview Product</a>
</nav>

<script src="../../view/global/header_add_product/header_add_product.js?v=<?= filemtime(__DIR__ . '/header_add_product.js') ?>"></script>
