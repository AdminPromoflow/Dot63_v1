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

      <div class="filter-group">
        <h1>Price</h1>
        <ul class="checklist">
          <li><label><input type="checkbox" name="price[]" value="low"> Low price</label></li>
          <li><label><input type="checkbox" name="price[]" value="medium"> Medium price</label></li>
          <li><label><input type="checkbox" name="price[]" value="high"> High price</label></li>
        </ul>
      </div>

      <div class="filter-group">
        <h1>Colour</h1>
        <ul class="color-list">
          <li><label class="swatch"><input type="radio" name="colour" value="black"><span class="dot" style="--c:#111111"></span><span class="sr-only">Black</span></label></li>
          <li><label class="swatch"><input type="radio" name="colour" value="white"><span class="dot" style="--c:#ffffff"></span><span class="sr-only">White</span></label></li>
          <li><label class="swatch"><input type="radio" name="colour" value="blue"><span class="dot" style="--c:#2563eb"></span><span class="sr-only">Blue</span></label></li>
          <li><label class="swatch"><input type="radio" name="colour" value="red"><span class="dot" style="--c:#dc2626"></span><span class="sr-only">Red</span></label></li>
          <li><label class="swatch"><input type="radio" name="colour" value="green"><span class="dot" style="--c:#16a34a"></span><span class="sr-only">Green</span></label></li>
        </ul>
      </div>

      <div class="filter-group">
        <h1>Print technique</h1>
        <ul class="checklist">
          <li><label><input type="checkbox" name="print_technique[]" value="screen-print"> Screen print</label></li>
          <li><label><input type="checkbox" name="print_technique[]" value="digital-print"> Digital print</label></li>
          <li><label><input type="checkbox" name="print_technique[]" value="embroidery"> Embroidery</label></li>
          <li><label><input type="checkbox" name="print_technique[]" value="laser-engraving"> Laser engraving</label></li>
        </ul>
      </div>

      <div class="filter-group">
        <h1>Material</h1>
        <ul class="checklist">
          <li><label><input type="checkbox" name="material[]" value="cotton"> Cotton</label></li>
          <li><label><input type="checkbox" name="material[]" value="polyester"> Polyester</label></li>
          <li><label><input type="checkbox" name="material[]" value="paper"> Paper</label></li>
          <li><label><input type="checkbox" name="material[]" value="plastic"> Plastic</label></li>
          <li><label><input type="checkbox" name="material[]" value="metal"> Metal</label></li>
        </ul>
      </div>

      <div class="filter-group">
        <h1>Theme</h1>
        <ul class="checklist">
          <li><label><input type="checkbox" name="theme[]" value="eco"> Eco</label></li>
          <li><label><input type="checkbox" name="theme[]" value="office"> Office</label></li>
          <li><label><input type="checkbox" name="theme[]" value="events"> Events</label></li>
          <li><label><input type="checkbox" name="theme[]" value="seasonal"> Seasonal</label></li>
        </ul>
      </div>

      <div class="filter-group">
        <h1>Stock location</h1>
        <ul class="checklist">
          <li><label><input type="checkbox" name="stock_location[]" value="uk"> UK</label></li>
          <li><label><input type="checkbox" name="stock_location[]" value="eu"> Europe</label></li>
          <li><label><input type="checkbox" name="stock_location[]" value="china"> China</label></li>
        </ul>
      </div>

      <div class="filter-group">
        <h1>Impact Index</h1>
        <ul class="checklist">
          <li><label><input type="checkbox" name="impact_index[]" value="low"> Low impact</label></li>
          <li><label><input type="checkbox" name="impact_index[]" value="medium"> Medium impact</label></li>
          <li><label><input type="checkbox" name="impact_index[]" value="high"> High impact</label></li>
        </ul>
      </div>

      <div class="filter-group">
        <a href="#"><p>Clear Filters</p></a>
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

      <div class="box_article">
        <img src="../../view/login/main/img/bags.png" alt="">
        <h1>Classic Coose</h1>
        <p>Paper Bags</p>
        <p>Large</p>
        <p>£ 0.6</p>
        <button class="buttom_products" type="button" name="button">Buy</button>
      </div>

      <div class="box_article">
        <img src="../../view/login/main/img/USBs.png" alt="">
        <h1>Butterfly</h1>
        <p>USB</p>
        <p>16GB</p>
        <p>£ 0.63</p>
        <button class="buttom_products" type="button" name="button">Buy</button>
      </div>

      <div class="box_article">
        <img src="../../view/login/main/img/accesories.png" alt="">
        <h1>Button</h1>
        <p>Circle</p>
        <p>25mm</p>
        <p>£ 0.3</p>
        <button class="buttom_products" type="button" name="button">Buy</button>
      </div>

      <div class="box_article">
        <img src="../../view/login/main/img/gift.png" alt="">
        <h1>Shoelaces</h1>
        <p>Accessories</p>
        <p>Full colour</p>
        <p>£ 0.4</p>
        <button class="buttom_products" type="button" name="button">Buy</button>
      </div>

      <div class="box_article">
        <img src="../../view/login/main/img/gift.png" alt="">
        <h1>Shoelaces</h1>
        <p>Accessories</p>
        <p>Full colour</p>
        <p>£ 0.4</p>
        <button class="buttom_products" type="button" name="button">Buy</button>
      </div>

      <div class="box_article">
        <img src="../../view/login/main/img/gift.png" alt="">
        <h1>Shoelaces</h1>
        <p>Accessories</p>
        <p>Full colour</p>
        <p>£ 0.4</p>
        <button class="buttom_products" type="button" name="button">Buy</button>
      </div>

      <div class="box_article">
        <img src="../../view/login/main/img/gift.png" alt="">
        <h1>Shoelaces</h1>
        <p>Accessories</p>
        <p>Full colour</p>
        <p>£ 0.4</p>
        <button class="buttom_products" type="button" name="button">Buy</button>
      </div>

      <div class="box_article">
        <img src="../../view/login/main/img/gift.png" alt="">
        <h1>Shoelaces</h1>
        <p>Accessories</p>
        <p>Full colour</p>
        <p>£ 0.4</p>
        <button class="buttom_products" type="button" name="button">Buy</button>
      </div>

      <div class="box_article">
        <img src="../../view/login/main/img/gift.png" alt="">
        <h1>Shoelaces</h1>
        <p>Accessories</p>
        <p>Full colour</p>
        <p>£ 0.4</p>
        <button class="buttom_products" type="button" name="button">Buy</button>
      </div>

      <div class="box_article">
        <img src="../../view/login/main/img/gift.png" alt="">
        <h1>Shoelaces</h1>
        <p>Accessories</p>
        <p>Full colour</p>
        <p>£ 0.4</p>
        <button class="buttom_products" type="button" name="button">Buy</button>
      </div>
    </div>
  </div>

</section>

<script src="../../view/product/products/article.js?v=<?= $jsTime ?>" type="text/javascript"></script>
