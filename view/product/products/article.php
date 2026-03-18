<?php
$cssTime = filemtime('../../view/product/products/article.css');
$jsTime = filemtime('../../view/product/products/article.js');
?>
<link rel="stylesheet" href="../../view/product/products/article.css?v=<?= $cssTime ?>">

<section class="all_product">

  <div class="products">
    <input type="checkbox" id="filters-open" class="filters-toggle" hidden>
    <!-- <label for="filters-open" class="filters-btn"></label> -->

    <div class="filter_products">
      <h1>Filters</h1>

      <div class="filter-group">
        <h1>Category</h1>
        <ul class="checklist">
          <li>
            <label for="acepto">
              <input type="checkbox" id="acepto" name="acepto">
              Paper Bags
            </label>
          </li>
          <li>
            <label for="acepto">
              <input type="checkbox" id="acepto" name="acepto">
              Tech & USBs
            </label>
          </li>
          <li>
            <label for="acepto">
              <input type="checkbox" id="acepto" name="acepto">
              Badges & Accessories
            </label>
          </li>
          <li>
            <label for="acepto">
              <input type="checkbox" id="acepto" name="acepto">
              Gift & Seasonal
            </label>
          </li>
        </ul>
      </div>

      <div class="filter-group">
        <h1>Size</h1>
        <ul class="checklist">
          <li>
            <label for="acepto">
              <input type="checkbox" id="acepto" name="acepto">
              Small
            </label>
          </li>
          <li>
            <label for="acepto">
              <input type="checkbox" id="acepto" name="acepto">
              Medium
            </label>
          </li>
          <li>
            <label for="acepto">
              <input type="checkbox" id="acepto" name="acepto">
              Large
            </label>
          </li>
        </ul>
      </div>

      <div class="filter-group">
        <h1>Color</h1>
        <ul class="color-list">
          <li>
            <label class="swatch">
              <input type="radio" name="color[]" value="sand">
              <span class="dot" style="--c:#E1C9A1"></span>
              <span class="sr-only">Sand</span>
            </label>
          </li>
          <li>
            <label class="swatch">
              <input type="radio" name="color[]" value="brown">
              <span class="dot" style="--c:#7A4A21"></span>
              <span class="sr-only">Brown</span>
            </label>
          </li>
          <li>
            <label class="swatch">
              <input type="radio" name="color[]" value="olive">
              <span class="dot" style="--c:#7A8647"></span>
              <span class="sr-only">Olive</span>
            </label>
          </li>
          <li>
            <label class="swatch">
              <input type="radio" name="color[]" value="teal">
              <span class="dot" style="--c:#1F8A89"></span>
              <span class="sr-only">Teal</span>
            </label>
          </li>
          <li>
            <label class="swatch">
              <input type="radio" name="color[]" value="black">
              <span class="dot" style="--c:#111111"></span>
              <span class="sr-only">Black</span>
            </label>
          </li>
          <li>
            <label class="swatch">
              <input type="radio" name="color[]" value="warm-scale">
              <span class="dot" style="--c:linear-gradient(135deg,#F3E1C4,#B98045)"></span>
              <span class="sr-only">Warm scale</span>
            </label>
          </li>
          <li>
            <label class="swatch">
              <input type="radio" name="color[]" value="gray-scale">
              <span class="dot" style="--c:linear-gradient(135deg,#ffffff,#111111)"></span>
              <span class="sr-only">Greyscale</span>
            </label>
          </li>
        </ul>
      </div>

      <div class="filter-group">
        <h1>Price</h1>

        <div class="price-range" data-min="0" data-max="100">
          <input type="range" class="range min" id="price-min"
                 min="0" max="100" value="0" step="1" aria-label="Minimum price">

          <input type="range" class="range max" id="price-max"
                 min="0" max="100" value="100" step="1" aria-label="Maximum price">

          <div class="rail"></div>

          <div class="labels">
            <span>£0</span>
            <span>£100</span>
          </div>
        </div>
      </div>

      <div class="filter-group">
        <a href="#"><p>Clear Filters</p></a>
      </div>
    </div>

    <div class="articles">
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
