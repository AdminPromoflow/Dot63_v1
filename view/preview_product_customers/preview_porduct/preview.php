<?php
$cssPath = '../../view/preview_product_customers/preview_porduct/preview.css';
$entryPath = '../../view/preview_product_customers/preview_porduct/preview_logic.js';
$cssFile = __DIR__ . '/preview.css';
$moduleFiles = [
  __DIR__ . '/preview_logic.js',
  __DIR__ . '/preview_api.js',
  __DIR__ . '/preview_store.js',
  __DIR__ . '/preview.js',
  dirname(__DIR__) . '/images/images.js',
  dirname(__DIR__) . '/items/items.js',
  dirname(__DIR__) . '/artwork/artwork.js',
  dirname(__DIR__) . '/prices/prices.js',
  dirname(__DIR__) . '/variations/variations.js',
];

$cssTime = is_file($cssFile) ? filemtime($cssFile) : '1';
$entryTime = 1;
foreach ($moduleFiles as $moduleFile) {
  if (is_file($moduleFile)) {
    $entryTime = max($entryTime, filemtime($moduleFile));
  }
}
?>

<link rel="stylesheet" href="<?= htmlspecialchars($cssPath) ?>?v=<?= $cssTime ?>">

<main class="supplier-preview" aria-labelledby="sp-title">
  <section id="preview_loading" class="preview-state preview-state--loading" aria-live="polite">
    <span class="preview-spinner" aria-hidden="true"></span>
    <div>
      <strong>Preparing your product preview</strong>
      <span>Loading the product, variations and pricing…</span>
    </div>
  </section>

  <section id="preview_fatal" class="preview-state preview-state--error" hidden role="alert">
    <span class="preview-state-icon" aria-hidden="true">!</span>
    <div>
      <strong>Preview unavailable</strong>
      <span id="preview_fatal_message">The product preview could not be loaded.</span>
      <a id="preview_login_link" class="btn btn-secondary btn-compact" href="../../view/log_inSupplier/index.php" hidden>
        Sign in again
      </a>
    </div>
  </section>

  <div id="preview_content" class="preview-shell" hidden>
    <header class="preview-toolbar">
      <div class="preview-mode">
        <span class="preview-mode-icon" aria-hidden="true">◎</span>
        <div>
          <strong>Customer preview</strong>
          <span>This is how customers will see the configured product.</span>
        </div>
      </div>

      <div class="preview-actions">
        <button type="button" class="btn btn-secondary" id="btn_back_edit">
          Back to editing
        </button>
        <button type="button" class="btn btn-primary" id="btn_publish">
          <span class="btn-label">Submit for approval</span>
          <span class="btn-spinner" aria-hidden="true"></span>
        </button>
      </div>
    </header>

    <div id="preview_notice" class="preview-notice" data-tone="info" hidden role="status"></div>

    <nav class="sp-breadcrumbs" aria-label="Product breadcrumb">
      <ol id="sp_breadcrumbs" class="crumbs"></ol>
    </nav>

    <section class="preview-layout">
      <aside class="preview-gallery-card" aria-label="Product media">
        <div class="preview-gallery-stage">
          <button id="gallery_previous" type="button" class="gallery-arrow gallery-arrow--previous" aria-label="Previous image">
            <span aria-hidden="true">←</span>
          </button>

          <div id="wrap-images-group" class="preview-gallery-media" aria-live="polite"></div>

          <button id="gallery_next" type="button" class="gallery-arrow gallery-arrow--next" aria-label="Next image">
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div id="sp_thumbs" class="sp-thumbs" aria-label="Product image thumbnails"></div>
        <p class="gallery-hint">Move over an image to inspect the details.</p>
      </aside>

      <article class="preview-product-card">
        <header class="product-heading">
          <div class="product-heading-topline">
            <span id="sp_category" class="sp-category"></span>
            <span id="product_status" class="status-pill" data-tone="draft">Draft</span>
          </div>

          <h1 id="sp-title" class="sp-title">Untitled product</h1>
          <p id="sp_subtitle" class="sp-subtitle"></p>

          <div class="product-meta">
            <span>By <strong id="sp-brand"></strong></span>
            <span class="meta-divider" aria-hidden="true"></span>
            <span>SKU <strong id="product_sku"></strong></span>
          </div>

          <div class="sp-price-main" aria-label="Selected unit price">
            <span class="sp-price-symbol">£</span>
            <strong id="sp_price" class="sp-price">—</strong>
            <span id="sp_unit_hint" class="sp-unit-hint">Pricing not configured</span>
          </div>
        </header>

        <section class="config-section" aria-labelledby="variations_heading">
          <div class="section-heading">
            <div>
              <span class="section-kicker">Configuration</span>
              <h2 id="variations_heading">Product options</h2>
            </div>
            <span class="section-helper">A default option is selected for each variation type.</span>
          </div>

          <div id="wrap-variations-group" class="variations-stack"></div>
          <div id="variations_empty" class="preview-empty" hidden>
            <strong>No variations configured</strong>
            <span>Add customer-selectable variations in the product editor.</span>
          </div>
        </section>

        <section class="config-section" aria-labelledby="pricing_heading">
          <div class="section-heading">
            <div>
              <span class="section-kicker">Quantity</span>
              <h2 id="pricing_heading">Price tiers</h2>
            </div>
            <strong id="var_label_quantity" class="selection-summary">Select a price tier</strong>
          </div>

          <div id="wrap-prices-group" class="price-tiers"></div>
          <div id="prices_empty" class="preview-empty" hidden>
            <strong>Pricing is not configured</strong>
            <span>Add at least one quantity and price range before submitting.</span>
          </div>
        </section>

        <section id="items_section" class="config-section" aria-labelledby="items_heading" hidden>
          <div class="section-heading">
            <div>
              <span class="section-kicker">Details</span>
              <h2 id="items_heading">What customers should know</h2>
            </div>
          </div>
          <div id="wrap-items-group" class="items-grid"></div>
        </section>

        <section class="config-section product-description" aria-labelledby="description_heading">
          <div class="section-heading">
            <div>
              <span class="section-kicker">Overview</span>
              <h2 id="description_heading">Product description</h2>
            </div>
          </div>
          <p id="sp_desc" class="sp-desc"></p>
        </section>
      </article>

      <aside class="preview-sidebar">
        <section class="readiness-card" aria-labelledby="readiness_heading">
          <div class="readiness-header">
            <span class="readiness-mark" aria-hidden="true">✓</span>
            <div>
              <span class="section-kicker">Readiness</span>
              <h2 id="readiness_heading">Product checklist</h2>
            </div>
          </div>

          <p id="readiness_summary" class="readiness-summary"></p>
          <ul id="readiness_list" class="readiness-list"></ul>
        </section>

        <section class="buybox" aria-labelledby="summary_heading">
          <div class="buybox-header">
            <span class="section-kicker">Customer summary</span>
            <h2 id="summary_heading">Order estimate</h2>
          </div>

          <dl class="price-summary">
            <div>
              <dt>Unit price</dt>
              <dd id="bb_unit">—</dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd id="bb_unit_quantity">—</dd>
            </div>
            <div>
              <dt>Base subtotal</dt>
              <dd id="bb_unit_total">—</dd>
            </div>
            <div>
              <dt>Extras per unit</dt>
              <dd id="bb_extra_unit">—</dd>
            </div>
            <div>
              <dt>Extras quantity</dt>
              <dd id="bb_extra_quantity">—</dd>
            </div>
            <div>
              <dt>Extras subtotal</dt>
              <dd id="bb_extra_total">—</dd>
            </div>
            <div class="price-summary-total">
              <dt>Estimated total</dt>
              <dd id="bb_total">—</dd>
            </div>
          </dl>

          <p class="preview-only-note">
            Checkout actions are disabled in supplier preview mode.
          </p>
          <button type="button" class="btn btn-customer-preview" disabled>Add to basket</button>
        </section>
      </aside>
    </section>

    <section id="artwork_section" class="artwork-section" aria-labelledby="artwork_heading" hidden>
      <div class="section-heading">
        <div>
          <span class="section-kicker">Production assets</span>
          <h2 id="artwork_heading">Artwork templates</h2>
        </div>
        <span class="section-helper">Templates update with the selected options.</span>
      </div>
      <div id="wrap-artworks-group" class="artwork-grid"></div>
    </section>
  </div>
</main>

<script type="module" src="<?= htmlspecialchars($entryPath) ?>?v=<?= $entryTime ?>"></script>
