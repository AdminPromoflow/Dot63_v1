<?php
// [Customer 2] index.php llegó a este archivo para construir el configurador público del producto.
// [Customer 2.1] Estas rutas indican qué CSS y qué módulo JavaScript debe recibir el navegador.
$cssPath = '../../view/preview_product_customers/preview_porduct/preview.css';
$entryPath = '../../view/preview_product_customers/preview_porduct/preview_logic.js';
$cssFile = __DIR__ . '/preview.css';

// [Customer 2.2] Todos estos módulos forman una sola funcionalidad. Si cambia cualquiera,
// se actualiza la versión del entry point para evitar que el navegador use lógica antigua de caché.
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

<!-- [Customer 2.3] El navegador carga los estilos del preview con su versión actual. -->
<link rel="stylesheet" href="<?= htmlspecialchars($cssPath) ?>?v=<?= $cssTime ?>">

<!-- [Customer 2.4] Se entrega primero una estructura vacía; JavaScript la llenará con datos públicos del servidor. -->
<main class="supplier-preview customer-product-preview" aria-labelledby="sp-title">
  <!-- [Customer 2.4.1] Este estado permanece visible mientras se buscan el producto y sus opciones. -->
  <section id="preview_loading" class="preview-state preview-state--loading" aria-live="polite">
    <span class="preview-spinner" aria-hidden="true"></span>
    <div>
      <strong>Preparing this product</strong>
      <span>Loading the product, variations and pricing…</span>
    </div>
  </section>

  <!-- [Customer 2.4.2] Si falta el SKU o el producto no está disponible, se muestra este bloque. -->
  <section id="preview_fatal" class="preview-state preview-state--error" hidden role="alert">
    <span class="preview-state-icon" aria-hidden="true">!</span>
    <div>
      <strong>Product unavailable</strong>
      <span id="preview_fatal_message">This product could not be loaded.</span>
    </div>
  </section>

  <!-- [Customer 2.4.3] El contenido real empieza oculto y se muestra cuando termina la carga inicial. -->
  <div id="preview_content" class="preview-shell" hidden>
    <header class="preview-toolbar">
      <div class="preview-mode">
        <span class="preview-mode-icon" aria-hidden="true">◎</span>
        <div>
          <strong>Product configurator</strong>
          <span>Choose your options and quantity to see an estimated total.</span>
        </div>
      </div>

      <div class="preview-actions">
        <button type="button" class="btn btn-secondary" id="btn_back_products">
          Back to products
        </button>
      </div>
    </header>

    <div id="preview_notice" class="preview-notice" data-tone="info" hidden role="status"></div>

    <nav class="sp-breadcrumbs" aria-label="Product breadcrumb">
      <ol id="sp_breadcrumbs" class="crumbs"></ol>
    </nav>

    <!-- [Customer 2.4.4] Los módulos llenan estas tres zonas: galería, configuración y resumen. -->
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
            <span>This product does not require additional options.</span>
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
            <span>Please contact the supplier for pricing.</span>
          </div>
        </section>

        <section id="items_section" class="config-section" aria-labelledby="items_heading" hidden>
          <div class="section-heading">
            <div>
              <span class="section-kicker">Details</span>
              <h2 id="items_heading">What you should know</h2>
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
            This estimate updates automatically when you change a product option or quantity.
          </p>

          <div class="purchase-actions" aria-label="Purchase actions">
            <button type="button" class="btn btn-primary purchase-button" id="bb_add_to_cart" disabled>
              <span class="btn-spinner" aria-hidden="true"></span>
              <span class="purchase-button-label">addToCart</span>
            </button>
            <button type="button" class="btn btn-secondary purchase-button" id="bb_buy_now" disabled>
              <span class="btn-spinner" aria-hidden="true"></span>
              <span class="purchase-button-label">Buy now</span>
            </button>
          </div>
        </section>
      </aside>
    </section>

    <!-- [Customer 2.4.5] Esta sección solo aparece si la ruta seleccionada tiene archivos de artwork. -->
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

<!-- [Customer 2.5] El modal permanece oculto hasta que el carrito responde que hace falta autenticarse. -->
<div class="customer-auth-modal" id="customer_auth_modal" hidden>
  <button type="button" class="customer-auth-backdrop" data-auth-close aria-label="Close authentication window"></button>

  <section class="customer-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="customer_auth_title">
    <header class="customer-auth-header">
      <div>
        <span class="section-kicker">Continue your order</span>
        <h2 id="customer_auth_title">Sign in or create an account</h2>
        <p>Your selected product will stay ready while you authenticate.</p>
      </div>
      <button type="button" class="customer-auth-close" data-auth-close aria-label="Close authentication window">×</button>
    </header>

    <div class="customer-auth-tabs" role="tablist" aria-label="Authentication options">
      <button type="button" id="customer_auth_login_tab" class="customer-auth-tab is-active" role="tab" aria-selected="true" aria-controls="customer_auth_login_panel" data-auth-view="login">
        Log in
      </button>
      <button type="button" id="customer_auth_register_tab" class="customer-auth-tab" role="tab" aria-selected="false" aria-controls="customer_auth_register_panel" data-auth-view="register" tabindex="-1">
        Register
      </button>
    </div>

    <div id="customer_auth_feedback" class="customer-auth-feedback" role="status" aria-live="polite" hidden></div>

    <div id="customer_auth_login_panel" class="customer-auth-panel" role="tabpanel" aria-labelledby="customer_auth_login_tab">
      <form id="customer_login_form" novalidate>
        <div class="customer-auth-field">
          <label for="customer_login_email">Email address</label>
          <input id="customer_login_email" name="email" type="email" autocomplete="email" maxlength="50" required>
        </div>

        <div class="customer-auth-field">
          <label for="customer_login_password">Password</label>
          <input id="customer_login_password" name="password" type="password" autocomplete="current-password" required>
        </div>

        <button type="submit" class="btn btn-primary customer-auth-submit">
          <span class="btn-spinner" aria-hidden="true"></span>
          <span class="customer-auth-submit-label">Log in and continue</span>
        </button>

        <p class="customer-auth-switch">New to Promoflow? <button type="button" data-auth-view="register">Create an account</button></p>
      </form>
    </div>

    <div id="customer_auth_register_panel" class="customer-auth-panel" role="tabpanel" aria-labelledby="customer_auth_register_tab" hidden>
      <form id="customer_register_form" novalidate>
        <div class="customer-auth-field">
          <label for="customer_register_name">Full name</label>
          <input id="customer_register_name" name="name" type="text" autocomplete="name" maxlength="50" required>
        </div>

        <div class="customer-auth-field">
          <label for="customer_register_email">Email address</label>
          <input id="customer_register_email" name="email" type="email" autocomplete="email" maxlength="50" required>
        </div>

        <div class="customer-auth-field">
          <label for="customer_register_password">Password</label>
          <input id="customer_register_password" name="password" type="password" autocomplete="new-password" minlength="8" aria-describedby="customer_password_help" required>
          <small id="customer_password_help">At least 8 characters with uppercase, lowercase, a number and a symbol.</small>
        </div>

        <div class="customer-auth-field">
          <label for="customer_register_password_confirm">Confirm password</label>
          <input id="customer_register_password_confirm" name="password_confirmation" type="password" autocomplete="new-password" minlength="8" required>
        </div>

        <button type="submit" class="btn btn-primary customer-auth-submit">
          <span class="btn-spinner" aria-hidden="true"></span>
          <span class="customer-auth-submit-label">Register and continue</span>
        </button>

        <p class="customer-auth-switch">Already registered? <button type="button" data-auth-view="login">Log in</button></p>
      </form>
    </div>
  </section>
</div>

<!-- [Customer 2.6] Al final se ejecuta preview_logic.js como módulo; desde allí continúa el paso 3. -->
<script type="module" src="<?= htmlspecialchars($entryPath) ?>?v=<?= $entryTime ?>"></script>
