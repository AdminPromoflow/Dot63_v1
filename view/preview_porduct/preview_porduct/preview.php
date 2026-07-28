<?php

$cssPath = '../../view/preview_porduct/preview_porduct/preview.css';
$jsPath = '../../view/preview_porduct/preview_porduct/preview.js';
$logicPath = '../../view/preview_porduct/preview_porduct/preview_logic.js';

$cssTime = is_file($cssPath) ? filemtime($cssPath) : time();
$jsTime = is_file($jsPath) ? filemtime($jsPath) : time();
$logicTime = is_file($logicPath) ? filemtime($logicPath) : time();

?>

<link rel="stylesheet" href="<?= htmlspecialchars($cssPath, ENT_QUOTES, 'UTF-8') ?>?v=<?= $cssTime ?>">

<main class="sp-amz" aria-labelledby="sp-title">
  <div class="sp-shell">

    <nav class="sp-breadcrumbs js-fade-up" aria-label="Breadcrumb">
      <ol id="sp_breadcrumbs" class="crumbs">
        <li><a href="#">Office &amp; Stationery</a></li>
        <li><a href="#">Lanyards</a></li>
      </ol>
    </nav>

    <section class="sp-grid">

      <aside class="sp-col sp-gallery" aria-label="Product media">
        <div class="sp-gallery-inner">

          <div class="sp-main-wrapper">
            <button type="button" class="sp-nav sp-nav-prev" aria-label="Previous media" onclick="previewGallery.prevImage()">‹</button>

            <div class="sp-main wrap-images-group" id="wrap-images-group" aria-live="polite"></div>

            <button type="button" class="sp-nav sp-nav-next" aria-label="Next media" onclick="previewGallery.nextImage()">›</button>
          </div>

          <div class="sp-thumbs" id="sp_thumbs" role="list"></div>

          <small class="cp-hint">Hover to zoom · Media changes every 5 seconds</small>
        </div>

        <section class="sp-variations js-fade-up" aria-label="Product configuration">
          <div class="sp-section-heading">
            <span class="sp-section-eyebrow">Configuration</span>
            <h2>Choose your options</h2>
          </div>

          <div id="wrap-variations-group" class="wrap-variations-group"></div>
        </section>
      </aside>

      <section class="sp-col sp-details js-fade-up">
        <span id="sp_category" class="sp-category">Lanyards &amp; ID Accessories</span>

        <h1 id="sp-title" class="sp-title">Custom Printed Lanyards</h1>

        <div class="sp-meta">
          <span id="sp-brand" class="brand-link">Promoflow</span>
        </div>

        <p id="sp_subtitle" class="sp-subtitle">Choose your preferred product configuration.</p>

        <div class="sp-price-main">
          <span class="sp-price-symbol" id="sp_currency_symbol">£</span>

          <span id="sp_price" class="sp-price">
            0<span class="sp-price-minor">.00</span>
          </span>

          <span id="sp_unit_hint" class="sp-unit-hint">per 100 units</span>
        </div>

        <section class="sp-items-note js-fade-up" id="sp-items-note" aria-label="Items information">
          <div class="sp-items-list wrap-items-group" id="wrap-items-group"></div>
        </section>
      </section>

      <aside class="sp-col sp-buybox" aria-label="Purchase options">
        <div class="box js-fade-up js-scale-in">

          <div class="price-group">
            <div class="price-row price-row--head">
              <span class="label">Unit</span>
              <strong id="bb_unit">£0.00</strong>
            </div>

            <div class="price-subrow">
              <span>Quantity</span>
              <strong id="bb_unit_quantity">0</strong>
            </div>

            <div class="price-subrow">
              <span>Total</span>
              <strong id="bb_unit_total">£0.00</strong>
            </div>
          </div>

          <div class="price-group">
            <div class="price-row price-row--head">
              <span class="label">Extras</span>
              <strong id="bb_extra_unit">£0.00</strong>
            </div>

            <div class="price-subrow">
              <span>Quantity</span>
              <strong id="bb_extra_quantity">0</strong>
            </div>

            <div class="price-subrow">
              <span>Total</span>
              <strong id="bb_extra_total">£0.00</strong>
            </div>
          </div>

          <div class="price-line price-line--total">
            <span class="label">Total</span>
            <strong id="bb_total">£0.00</strong>
          </div>

          <div class="ship">
            <span>Delivery</span>
            <small>Delivery only in England. Standard dispatch in 2–3 weeks.</small>
          </div>

          <div class="stock in">In stock</div>

          <button type="button" class="btn btn-primary btn-buy js-scale-in" id="bb_add">Add to basket</button>
          <button type="button" class="btn btn-ghost btn-buy js-scale-in" id="bb_buy" disabled>Buy now</button>
        </div>
      </aside>

      <section class="sp-packsize js-fade-up" id="sp-packsize" aria-label="Pack sizes and bundle pricing">
        <div class="var-group var-group-pack" aria-labelledby="var_label_quantity">

          <div class="var-label">
            <span class="var-name">Pack size</span>
            <strong id="var_label_quantity">0 units</strong>
          </div>

          <div class="var-options wrap-prices-group" id="wrap-prices-group"></div>
        </div>
      </section>

      <section class="sp-artwork-downloads js-fade-up" aria-label="Artwork templates">
        <h2 class="sp-artwork-heading">Download artwork templates</h2>

        <div class="sp-artwork-grid wrap-artworks-group" id="wrap-artworks-group"></div>

        <p class="sp-artwork-note">
          If you do not have a designer, you can place your order and request artwork support during checkout.
        </p>
      </section>

    </section>

    <section class="sp-about js-fade-up">
      <h2>Product Description</h2>
      <div id="sp_desc" class="sp-desc"></div>
    </section>

    <section class="sp-related js-fade-up">
      <h2>More products you might like</h2>
      <div class="related-grid"></div>
    </section>

  </div>

  <div class="sp-actions">
    <button type="button" class="btn btn-back-preview" id="btn_back_edit">Back to editing</button>
    <button type="button" class="btn btn-publish-preview" id="btn_publish">Publish</button>
  </div>
</main>

<script src="<?= htmlspecialchars($jsPath, ENT_QUOTES, 'UTF-8') ?>?v=<?= $jsTime ?>"></script>
<script src="<?= htmlspecialchars($logicPath, ENT_QUOTES, 'UTF-8') ?>?v=<?= $logicTime ?>"></script>
