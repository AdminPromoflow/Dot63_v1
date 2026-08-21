<?php
$cssTime = filemtime('../../view/product_list/product_list/product_list.css');
$jsTime  = filemtime('../../view/product_list/product_list/product_list.js');
?>
<link rel="stylesheet" href="../../view/product_list/product_list/product_list.css?v=<?= $cssTime ?>">

<main class="product_list" aria-labelledby="pl-title">
  <?php include "../../view/product_list/navigation/navigation.php" ?>

  <h1 id="pl-title" class="sr-only">Products</h1>

  <?php include "../../view/global/header_add_product/header_add_product.php" ?>

  <section class="sl-catalog" id="super_lanyard_catalog" aria-labelledby="sl-title">
    <header class="sl-hero">
      <div class="sl-hero__copy">
        <span class="sl-eyebrow">
          <span class="sl-eyebrow__dot" aria-hidden="true"></span>
          Configuration catalogue
        </span>
        <h2 id="sl-title">Super Lanyard</h2>
        <p id="sl-subtitle">Explore every available configuration.</p>
      </div>

      <div class="sl-hero__visual" aria-hidden="true">
        <svg viewBox="0 0 210 132" role="img">
          <defs>
            <linearGradient id="slRibbon" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stop-color="#ff8a34"/>
              <stop offset="1" stop-color="#ffb36f"/>
            </linearGradient>
          </defs>
          <path d="M57 8c25 2 44 14 56 35l32 55-25 15-33-56C81 47 70 42 56 41Z" fill="url(#slRibbon)"/>
          <path d="M153 9c-25 2-44 14-56 35L65 99l25 15 33-56c6-11 17-16 31-17Z" fill="#18496a"/>
          <rect x="88" y="96" width="34" height="26" rx="8" fill="#fff" stroke="#d9e3ec" stroke-width="3"/>
          <circle cx="105" cy="109" r="4" fill="#ff8a34"/>
        </svg>
      </div>

      <div class="sl-result-pill" aria-live="polite" aria-atomic="true">
        <strong id="sl-visible-count">Loading</strong>
        <span id="sl-visible-label">configurations</span>
      </div>
    </header>

    <div class="sl-toolbar" role="search">
      <label class="sl-search" for="sl-search-input">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m16.2 16.2 4.3 4.3"></path>
        </svg>
        <span class="sr-only">Search Super Lanyard configurations</span>
        <input
          id="sl-search-input"
          type="search"
          autocomplete="off"
          placeholder="Search by title, SKU or configuration..."
          disabled
        >
        <button class="sl-search__clear" id="sl-clear-search" type="button" aria-label="Clear search" hidden>
          &times;
        </button>
      </label>

      <button
        class="sl-filter-toggle"
        id="sl-filter-toggle"
        type="button"
        aria-expanded="false"
        aria-controls="sl-filter-panel"
        disabled
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M7 12h10M10 18h4"></path>
        </svg>
        Filters
        <span id="sl-filter-count" hidden>0</span>
      </button>
    </div>

    <div class="sl-layout">
      <button class="sl-filter-backdrop" id="sl-filter-backdrop" type="button" aria-label="Close filters" tabindex="-1"></button>

      <aside class="sl-filters" id="sl-filter-panel" aria-label="Filter Super Lanyard configurations">
        <div class="sl-filters__header">
          <div>
            <span class="sl-filters__eyebrow">Refine results</span>
            <h3>Filters</h3>
          </div>
          <button class="sl-filters__close" id="sl-filter-close" type="button" aria-label="Close filters">
            &times;
          </button>
        </div>

        <div class="sl-filter-groups" id="sl-filter-groups" aria-busy="true">
          <div class="sl-filter-skeleton" aria-hidden="true"></div>
          <div class="sl-filter-skeleton" aria-hidden="true"></div>
          <div class="sl-filter-skeleton" aria-hidden="true"></div>
        </div>

        <div class="sl-filters__footer">
          <button class="sl-clear-filters" id="sl-clear-filters" type="button" disabled>
            Clear all filters
          </button>
          <button class="sl-show-results" id="sl-show-results" type="button">
            Show results
          </button>
        </div>
      </aside>

      <div class="sl-results">
        <div class="sl-active-row" id="sl-active-row" hidden>
          <span>Active filters</span>
          <div class="sl-active-chips" id="sl-active-chips"></div>
        </div>

        <p class="sr-only" id="sl-live-status" role="status" aria-live="polite"></p>

        <div class="sl-products-grid" id="product_list" role="list" aria-busy="true">
          <?php for ($i = 0; $i < 8; $i++): ?>
            <article class="sl-skeleton-card" aria-hidden="true">
              <span class="sl-skeleton-card__media"></span>
              <span class="sl-skeleton-card__line sl-skeleton-card__line--short"></span>
              <span class="sl-skeleton-card__line"></span>
              <span class="sl-skeleton-card__line"></span>
            </article>
          <?php endfor; ?>
        </div>
      </div>
    </div>
  </section>

  <section class="pl-card" id="standard_product_list" aria-labelledby="pl-products-title" hidden>
    <header class="pl-card-header">
      <div>
        <h2 id="pl-products-title">Products</h2>
        <p class="pl-subtitle">Choose the product record you want to continue editing.</p>
      </div>
    </header>

    <div class="pl-products-wrapper">
      <div class="pl-products-list" id="standard_products" role="list"></div>
      <p class="pl-product-hint">Click a product to view or edit its details.</p>
    </div>

    <hr class="pl-sep" aria-hidden="true">
  </section>

  <div class="pl-footer" id="product_list_footer">
    <button class="btn btn-back" id="btn_back_products" type="button">
      <span aria-hidden="true">←</span> Back
    </button>

    <div class="pl-footer__actions">
      <button class="btn btn-choose-product" id="choose_product" type="button">
        Choose Product
      </button>

      <button class="btn btn-cancel-choose-product" id="cancel_choose_product" type="button">
        Cancel Choosing
      </button>

      <button class="btn btn-next" id="next_product" type="button">
        Next <span aria-hidden="true">→</span>
      </button>
    </div>
  </div>
</main>

<script src="../../view/product_list/product_list/product_list.js?v=<?= $jsTime ?>"></script>
