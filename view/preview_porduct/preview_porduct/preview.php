<?php
// -----------------------------------------------------------------------------
// Product Preview — Asset Versioning + Markup
// -----------------------------------------------------------------------------

$cssPath = '../../view/preview_porduct/preview_porduct/preview.css';
$jsPath  = '../../view/preview_porduct/preview_porduct/preview.js';
$jsPath2 = '../../view/preview_porduct/preview_porduct/preview_logic.js';

$cssTime = @filemtime($cssPath) ?: time();
$jsTime  = @filemtime($jsPath)  ?: time();
$jsTime2 = @filemtime($jsPath2) ?: time();
?>

<link rel="stylesheet" href="<?= $cssPath ?>?v=<?= $cssTime ?>">

<main class="sp-amz" aria-labelledby="sp-title">
  <div class="sp-shell">

    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" class="sp-breadcrumbs js-fade-up">
      <ol id="sp_breadcrumbs" class="crumbs">
        <li><a href="#">Office &amp; Stationery</a></li>
        <li><a href="#">Lanyards</a></li>
      </ol>
    </nav>

    <!-- GRID PRINCIPAL -->
    <section class="sp-grid">

      <!-- ===============================================================
        Col 1: Galería
      =============================================================== -->
      <aside class="sp-col sp-gallery" aria-label="Product media">
        <div class="sp-gallery-inner">

          <div class="sp-main-wrapper js-parallax">

            <button type="button" class="sp-nav sp-nav-prev" aria-label="Previous media">‹</button>

            <div class="sp-main wrap-images-group" id="wrap-images-group" aria-live="polite">

              <!-- ✅ 12-13: Aquí van imágenes y 1 video, agrupados con wrap-images -->

                <!-- Grupo 1: 2 imágenes -->
                <div class="wrap-images">
                  <img
                    class="preview-media"
                    src="../../view/preview_porduct/img/5ecd4b8a-c3ad-4bd4-a2ed-155007cec1f1.png"
                    alt="Preview image 1"
                    loading="lazy"
                    decoding="async"
                  >
                  <img
                    class="preview-media"
                    src="../../view/preview_porduct/img/0785090d-cff6-4a3b-abd9-d3000dfaf859 copy.png"
                    alt="Preview image 2"
                    loading="lazy"
                    decoding="async"
                  >
                </div>

                <!-- Grupo 2: 1 video -->
                <div class="wrap-images">
                  <video class="preview-media" controls preload="metadata">
                    <source src="" type="video/mp4">
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div class="wrap-images">
                  <img
                    class="preview-media"
                    src="../../view/preview_porduct/img/0785090d-cff6-4a3b-abd9-d3000dfaf859.png"
                    alt="Preview image 1"
                    loading="lazy"
                    decoding="async"
                  >
                  <img
                    class="preview-media"
                    src="../../view/preview_porduct/img/be2f5822-1db5-4ed3-aa84-8583b2b6c1cd.png"
                    alt="Preview image 2"
                    loading="lazy"
                    decoding="async"
                  >
                </div>
            </div>

            <button
              type="button"
              class="sp-nav sp-nav-next"
              aria-label="Next media"
              onclick="previewGallery.nextImage()">
              ›
            </button>

          </div>

          <!-- Miniaturas (JS debería inyectarlas). -->
          <div class="sp-thumbs" id="sp_thumbs" role="list"></div>

          <small class="cp-hint">Hover to zoom • Media changes every 5 seconds</small>

        </div>
      </aside>

      <!-- ===============================================================
        Col 2: Detalles del producto
      =============================================================== -->
      <section class="sp-col sp-details js-fade-up">

        <span id="sp_category" class="sp-category">Lanyards &amp; ID Accessories</span>

        <h1 id="sp-title" class="sp-title js-fade-up">
          Custom Printed Lanyards – 10mm to 35mm – Full Colour Logo – Breakaway Safety &amp; ID Badge Holders
        </h1>

        <div class="sp-meta js-fade-up">
          <span id="sp-brand" class="brand-link">Promoflow</span>
        </div>

        <p id="sp_subtitle" class="sp-subtitle js-fade-up">
          Choose the width, pack size and clip type that match your event, office or school, then upload your artwork for full colour printing.
        </p>


            <div class="sp-price-main js-fade-up">
              <span class="sp-price-symbol" id="sp_currency_symbol">£</span>
              <span id="sp_price" class="sp-price">
                8<span class="sp-price-minor">.00</span>
              </span>
              <span id="sp_unit_hint" class="sp-unit-hint">per 100 units</span>
            </div>


        <!-- VARIATIONS -->
        <section id="wrap-variations-group" class="sp-variations js-fade-up wrap-variations-group" aria-label="Product configuration">

          <!-- Width -->
          <div class="wrap-variations" aria-labelledby="var_label_size_1">
            <div class="var-label">
              <span class="var-name">Width</span>
              <strong id="var_label_size_1">20mm</strong>
            </div>

            <div class="var-options" >

              <button type="button" class="var-option js-scale-in">
                <img class="var-thumb" src="https://upload.wikimedia.org/wikipedia/commons/6/6d/Various_lanyards.jpg" alt="Slim lanyard sample">
                <span class="opt-main">10mm</span>
              </button>

              <button type="button" class="var-option js-scale-in">
                <img class="var-thumb" src="https://upload.wikimedia.org/wikipedia/commons/4/40/Red_lanyard.jpg" alt="Narrow lanyard sample">
                <span class="opt-main">15mm</span>
              </button>

              <button type="button" class="var-option is-selected js-scale-in">
                <img class="var-thumb" src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Lanyard_mit_Logo_bedruckt.jpg" alt="Standard 20mm printed lanyard">
                <span class="opt-main">20mm</span>
              </button>

              <button type="button" class="var-option js-scale-in">
                <img class="var-thumb" src="https://upload.wikimedia.org/wikipedia/commons/6/6d/Various_lanyards.jpg" alt="Wide strap lanyard">
                <span class="opt-main">25mm</span>
              </button>

              <button type="button" class="var-option js-scale-in">
                <img class="var-thumb" src="https://upload.wikimedia.org/wikipedia/commons/4/40/Red_lanyard.jpg" alt="Extra wide lanyard">
                <span class="opt-main">30mm</span>
              </button>

              <button type="button" class="var-option js-scale-in">
                <img class="var-thumb" src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Lanyard_mit_Logo_bedruckt.jpg" alt="Oversized sponsor lanyard">
                <span class="opt-main">35mm</span>
              </button>

            </div>
          </div>

          <!-- Print side -->
          <div class="wrap-variations" aria-labelledby="var_label_size_2">
            <div class="var-label">
              <span class="var-name">Print side</span>
              <strong id="var_label_size_2">Double sided</strong>
            </div>

            <div class="var-options">
              <button type="button" class="var-option is-selected js-scale-in">
                <span class="opt-main">Double sided</span>
              </button>

              <button type="button" class="var-option js-scale-in">
                <span class="opt-main">Single sided</span>
                <span class="opt-sub">Budget option</span>
              </button>
            </div>
          </div>

          <!-- Clip type -->
          <div class="wrap-variations" aria-labelledby="var_label_size_3">
            <div class="var-label">
              <span class="var-name">Clip type</span>
              <strong id="var_label_size_3">Swivel hook</strong>
            </div>

            <div class="var-options">

                <button type="button" class="var-option is-selected js-scale-in">
                  <span class="opt-main">Double sided</span>
                </button>

                <button type="button" class="var-option js-scale-in">
                  <span class="opt-main">Single sided</span>
                </button>
                <button type="button" class="var-option  js-scale-in">
                  <span class="opt-main">Double sided</span>
                </button>

                <button type="button" class="var-option js-scale-in">
                  <span class="opt-main">Single sided</span>
                </button>
                <button type="button" class="var-option  js-scale-in">
                  <span class="opt-main">Double sided</span>
                </button>

                <button type="button" class="var-option js-scale-in">
                  <span class="opt-main">Single sided</span>
                </button>
            </div>
          </div>

        </section>
      </section>

      <!-- VARIATIONS BOTTOM -->
      <section class="sp-variations-bottom js-fade-up" aria-label="More configuration options"></section>

      <!-- ===============================================================
        PACK SIZE
      =============================================================== -->
      <section class="sp-packsize js-fade-up" id="sp-packsize" aria-label="Pack sizes and bundle pricing">
        <div class="var-group var-group-pack" aria-labelledby="var_label_items">

          <div class="var-label">
            <span class="var-name">Pack size</span>
            <strong id="var_label_items">500 units</strong>
          </div>

          <!-- ✅ 10: Agrupar botones dentro de wrap-items (sin id) -->
            <div class="var-options wrap-prices-group" id="wrap-prices-group">

              <!-- Grupo A (2 botones) -->
              <div class="wrap-price">
                <button type="button" class="var-option js-scale-in">
                  <span class="opt-main">50</span>
                </button>

                <button type="button" class="var-option js-scale-in">
                  <span class="opt-main">100</span>
                </button>
              </div>

              <!-- Grupo B (4 botones) -->
              <div class="wrap-price">
                <button type="button" class="var-option js-scale-in">
                  <span class="opt-main">200</span>
                </button>

                <button type="button" class="var-option is-selected js-scale-in">
                  <span class="opt-main">500</span>
                </button>

                <button type="button" class="var-option js-scale-in">
                  <span class="opt-main">1,000</span>
                </button>

                <button type="button" class="var-option js-scale-in">
                  <span class="opt-main">2,000</span>
                </button>
              </div>

              <!-- Grupo C (2 botones) -->
              <div class="wrap-price">
                <button type="button" class="var-option js-scale-in">
                  <span class="opt-main">3,000</span>
                </button>

                <button type="button" class="var-option js-scale-in">
                  <span class="opt-main">5,000</span>
                </button>
              </div>

            </div>
        </div>
      </section>

      <!-- ===============================================================
        ARTWORK DOWNLOADS (PDF)
      =============================================================== -->
      <section class="sp-artwork-downloads js-fade-up" aria-label="Artwork templates">
        <h2 class="sp-artwork-heading">Download artwork templates (PDF)</h2>

        <!-- ✅ 1-5: wrap-artworks va aquí (dentro del grid), sin id -->
        <div class="sp-artwork-grid wrap-artworks-group" id="wrap-artworks-group">

          <!-- Grupo 1 (2 links) -->
          <div class="wrap-artworks">
            <a href="/templates/lanyard-10mm.pdf" class="btn btn-artwork" download>10&nbsp;mm template</a>
            <a href="/templates/lanyard-15mm.pdf" class="btn btn-artwork" download>15&nbsp;mm template</a>
          </div>

          <!-- Grupo 2 (4 links) -->
          <div class="wrap-artworks">
            <a href="/templates/lanyard-20mm.pdf" class="btn btn-artwork" download>20&nbsp;mm template</a>
            <a href="/templates/lanyard-25mm.pdf" class="btn btn-artwork" download>25&nbsp;mm template</a>
            <a href="/templates/lanyard-30mm.pdf" class="btn btn-artwork" download>30&nbsp;mm template</a>
            <a href="/templates/lanyard-35mm.pdf" class="btn btn-artwork" download>35&nbsp;mm template</a>
          </div>

        </div>

        <p class="sp-artwork-note">
          If you do not have a designer, you can still place your order and request help with artwork during checkout.
        </p>
      </section>

      <!-- ===============================================================
        ITEMS NOTE
      =============================================================== -->
      <section class="sp-items-note js-fade-up" id="sp-items-note" aria-label="Items information">

        <!-- ✅ 6-8: wrap-items-group agrupa 1 o 2 items (sin ul/li para HTML válido) -->
        <div class="sp-items-list wrap-items-group" id="wrap-items-group">

          <!-- Grupo 1 (2 items) -->
          <div class="wrap-items">
            <div class="sp-item">
              <strong class="sp-item-subtitle">What is one item?</strong>
              <span>Each item refers to a single printed lanyard produced with your selected width, pack size and clip type.</span>
            </div>

            <div class="sp-item">
              <strong class="sp-item-subtitle">How do pack sizes work?</strong>
              <span>Pack quantities indicate the total number of individual lanyards supplied in your order, ready to hand out to staff, visitors or guests.</span>
            </div>
          </div>

          <!-- Grupo 2 (1 item) -->
          <div class="wrap-items">
            <div class="sp-item">
              <strong class="sp-item-subtitle">Consistent branding every time</strong>
              <span>Your artwork, colours and logos are checked before production so each lanyard looks clean, sharp and on-brand.</span>
            </div>
          </div>

        </div>
      </section>

      <!-- ===============================================================
        Col 3: Buy box
      =============================================================== -->
      <aside class="sp-col sp-buybox" aria-label="Purchase options">
        <div class="box js-fade-up js-scale-in js-parallax">



              <div class="price-line">
                <span class="label">Unit</span>
                <strong id="bb_unit">£0.08</strong>
              </div>

              <div class="price-line">
                <span class="label">Total</span>
                <strong id="bb_total">£8.00</strong>
              </div>


          <div class="ship">
            <span>Delivery</span>
            <small>Delivery only in England. Standard dispatch in 2–3 weeks.</small>
          </div>

          <div class="stock in">In stock</div>

          <button type="button" class="btn btn-primary btn-buy js-scale-in" id="bb_add">
            Add to basket (disabled)
          </button>

          <button type="button" class="btn btn-ghost btn-buy js-scale-in" id="bb_buy" disabled>
            Buy now (disabled)
          </button>

        </div>
      </aside>

    </section>

    <!-- Product Description -->
    <section class="sp-about js-fade-up">
      <h2>Product Description</h2>
      <div id="sp_desc" class="sp-desc"></div>
    </section>

    <!-- Related -->
    <section class="sp-related js-fade-up">
      <h2>More products you might like</h2>
      <div class="related-grid"></div>
    </section>

  </div>

  <!-- Actions -->
  <div class="sp-actions">
    <button type="button" class="btn btn-back-preview" id="btn_back_edit">Back to editing</button>
    <button type="button" class="btn btn-publish-preview" id="btn_publish">Publish</button>
  </div>
</main>

<script src="<?= $jsPath ?>?v=<?= $jsTime ?>"></script>
<script src="<?= $jsPath2 ?>?v=<?= $jsTime2 ?>"></script>
