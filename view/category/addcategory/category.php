<?php
$cssTime = filemtime('../../view/category/addcategory/category.css');
$jsTime  = filemtime('../../view/category/addcategory/category.js');
?>
<link rel="stylesheet" href="../../view/category/addcategory/category.css?v=<?= $cssTime ?>">

<main class="create_product" aria-labelledby="cp-title">
  <h1 id="cp-title" class="sr-only">Create Product</h1>

  <?php include "../../view/global/header_add_product/header_add_product.php" ?>

  <section class="cp-card" aria-labelledby="cp-cat-title">
    <header class="cp-card-header">
      <div>
        <h2 id="cp-cat-title">Categories</h2>
        <br>
        <p class="cp-subtitle">Choose an existing category</p>
      </div>
    </header>

    <div class="cp-cat-wrapper">
      <div class="cp-cat-grid" id="category_list" role="list"></div>

      <p class="cp-cat-hint">Click a category to assign it to this product.</p>
      <br>
    </div>

    <hr class="cp-sep" aria-hidden="true">
  </section>

  <div class="cp-footer">
    <button class="btn btn-edit-categories" id="edit_categories" type="button">
      Edit Categories
    </button>

    <button class="btn btn-next" id="next_category" type="button">
      Next
    </button>
  </div>
</main>

<script src="../../view/category/addcategory/category.js?v=<?= $jsTime ?>"></script>
