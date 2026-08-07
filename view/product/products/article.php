<?php
$cssTime = filemtime('../../view/product/products/article.css');
$jsTime = filemtime('../../view/product/products/article.js');
?>
<link rel="stylesheet" href="../../view/product/products/article.css?v=<?= $cssTime ?>">

<section class="all_product">
  <div class="products">

    <input type="checkbox" id="filters-open" class="filters-toggle" hidden>
    <label for="filters-open" class="filters-btn"></label>

    <div class="filter_products">
      <h1>Filters</h1>

      <div class="filter-group filter-category">
        <h1>Category</h1>
        <div class="parent_category_filter scroll_filter category-scroll">
          <ul id="category_filter" class="checklist category-list">
            <li>Loading categories...</li>
          </ul>
        </div>
      </div>

      <div id="variation-filters"></div>


    </div>

    <div class="articles" id="articles">
      <div class="products-search-panel">
        <label for="product-search">Search products</label>
        <input
          type="search"
          id="product-search"
          placeholder="Search by name, description, tagline or item..."
          autocomplete="off"
        >
      </div>

      <h1>All Products</h1>
    </div>

  </div>
</section>

<script src="../../view/product/products/article.js?v=<?= $jsTime ?>" type="text/javascript"></script>
