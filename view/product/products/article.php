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
            <li><label><input type="checkbox" name="category[]" value="low"> Low price</label></li>
            <li><label><input type="checkbox" name="category[]" value="medium"> Medium price</label></li>
            <li><label><input type="checkbox" name="category[]" value="high"> High price</label></li>
          </ul>
        </div>
      </div>

      <div class="filter-group filter-quantity">
        <h1>Quantity</h1>
        <div class="parent_quantity_filter scroll_filter quantity-scroll">
          <ul id="quantity_filter" class="checklist quantity-list quantity-pills">
            <li><label><input type="checkbox" name="quantity[]" value="100"><span>100</span></label></li>
            <li><label><input type="checkbox" name="quantity[]" value="200"><span>200</span></label></li>
            <li><label><input type="checkbox" name="quantity[]" value="300"><span>300</span></label></li>
            <li><label><input type="checkbox" name="quantity[]" value="500"><span>500</span></label></li>
            <li><label><input type="checkbox" name="quantity[]" value="1000"><span>1000</span></label></li>
          </ul>
        </div>
      </div>

      <div class="filter-group filter-price">
        <h1>Price</h1>

        <div class="price-range-box">
          <div class="price-range-top">
            <span>Maximum price</span>
            <strong id="priceValue">£50</strong>
          </div>

          <input
            type="range"
            id="priceRange"
            name="price_range"
            min="0"
            max="500"
            step="10"
            value="50"
          >

          <div class="price-range-labels">
            <span>£0</span>
            <span>£500</span>
          </div>
        </div>
      </div>

      <div class="filter-group filter-stock">
        <h1>Stock</h1>
        <div class="parent_stock_filter scroll_filter stock-scroll">
          <ul id="stock_filter" class="checklist stock-list">
            <li><label><input type="checkbox" name="stock[]" value="in-stock"> In stock</label></li>
            <li><label><input type="checkbox" name="stock[]" value="low-stock"> Low stock</label></li>
            <li><label><input type="checkbox" name="stock[]" value="pre-order"> Pre-order</label></li>
            <li><label><input type="checkbox" name="stock[]" value="out-stock"> Out of stock</label></li>
          </ul>
        </div>
      </div>

      <div class="filter-group filter-brand">
        <h1>Brand</h1>
        <div class="parent_brand_filter scroll_filter brand-scroll">
          <ul id="brand_filter" class="checklist brand-list">
            <li><label><input type="checkbox" name="brand[]" value="pf-concept"> PF Concept</label></li>
            <li><label><input type="checkbox" name="brand[]" value="promo"> Promo</label></li>
            <li><label><input type="checkbox" name="brand[]" value="custom"> Custom</label></li>
            <li><label><input type="checkbox" name="brand[]" value="unbranded"> Unbranded</label></li>
          </ul>
        </div>
      </div>


      <div id="groups-filter-group" class="">

      </div>


    </div>

    <div class="articles" id="articles">
      <div class="products-search-panel">
        <label for="product-search">Search products</label>
        <input
          type="search"
          id="product-search"
          placeholder="Search by name, category, group or SKU..."
        >
      </div>

      <h1>All Products</h1>
    </div>

  </div>
</section>

<script src="../../view/product/products/article.js?v=<?= $jsTime ?>" type="text/javascript"></script>
