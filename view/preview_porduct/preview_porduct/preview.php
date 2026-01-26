<?php
// -----------------------------------------------------------------------------
// Asset paths (CSS / JS)
// Nota: se usan rutas relativas desde este archivo hacia la carpeta view.
// -----------------------------------------------------------------------------
$cssPath = '../../view/preview_porduct/preview_porduct/preview.css';
$jsPath  = '../../view/preview_porduct/preview_porduct/preview.js';
$jsPath2 = '../../view/preview_porduct/preview_porduct/preview_logic.js';

// -----------------------------------------------------------------------------
// Cache-busting (versionado por timestamp)
// filemtime() devuelve la fecha de última modificación del archivo.
// Si por permisos/ruta falla, usamos time() como fallback para evitar romper la carga.
// El operador @ evita que se muestre el warning si el archivo no existe.
// -----------------------------------------------------------------------------
$cssTime = @filemtime($cssPath) ?: time();
$jsTime  = @filemtime($jsPath)  ?: time();
$jsTime2 = @filemtime($jsPath2) ?: time();
?>
<!-- Carga el CSS con parámetro ?v=timestamp para forzar refresh cuando el archivo cambie -->
<link rel="stylesheet" href="<?= $cssPath ?>?v=<?= $cssTime ?>">

<!--
  MAIN: Contenedor principal de la vista de preview del producto.
  aria-labelledby enlaza con el h1 (#sp-title) para accesibilidad.
-->
<main class="sp-amz" aria-labelledby="sp-title">

  <!-- Shell general: limita ancho / centra contenido / aplica padding según tu CSS -->
  <div class="sp-shell">

    <!-- Breadcrumb: navegación de migas para dar contexto de categoría/subcategoría -->
    <nav aria-label="Breadcrumb" class="sp-breadcrumbs js-fade-up">
      <ol id="sp_breadcrumbs" class="crumbs">
        <!-- En producción normalmente estas rutas se rellenan dinámicamente -->
        <li><a href="#">Office &amp; Stationery</a></li>
        <li><a href="#">Lanyards</a></li>
      </ol>
    </nav>

    <!-- GRID PRINCIPAL: estructura a 3 columnas (galería / detalles / buybox) -->
    <section class="sp-grid">

      <!-- Col 1: Galería (sticky + parallax ligero) -->
      <aside class="sp-col sp-gallery" aria-label="Product media">
        <div class="sp-gallery-inner">

          <!-- Wrapper principal del media (imagen/video) con clase js-parallax para efecto visual -->
          <div class="sp-main-wrapper js-parallax">

            <!-- Botón anterior (por ahora sin handler; lo puedes conectar en previewLogic) -->
            <button type="button" class="sp-nav sp-nav-prev" aria-label="Previous media">‹</button>

            <!-- Contenedor del media actual; aria-live para anunciar cambios en lectores de pantalla -->
            <div class="sp-main" id="sp_main" aria-live="polite">
              <!-- Placeholder si aún no hay media cargado por JS -->
              <div class="cp-empty">No media</div>
            </div>

            <!-- Botón siguiente: llama a previewLogic.nextImage() -->
            <button type="button"
                    class="sp-nav sp-nav-next"
                    aria-label="Next media"
                    onclick="previewLogic.nextImage()">
              ›
            </button>
          </div>

          <!-- Miniaturas (lista de imágenes/video).
               role="list" y role="listitem" para accesibilidad si se renderiza con botones. -->
          <div class="sp-thumbs" id="sp_thumbs" role="list">
            <!-- Aquí el JS debería inyectar miniaturas -->
            <!--
            Ejemplos (comentados):
            - data-type="image" / "video"
            - data-src: fuente del media para mostrar en sp_main
            -->
          </div>

          <!-- Nota UX: texto guía (si el cambio cada 5s depende de JS, conviene mantenerlo sincronizado) -->
          <small class="cp-hint">Hover to zoom • Media changes every 5 seconds</small>
        </div>
      </aside>

      <!-- Col 2: Detalles del producto (normalmente la columna más ancha) -->
      <section class="sp-col sp-details js-fade-up">

        <!-- Etiqueta de categoría (texto corto superior) -->
        <span id="sp_category" class="sp-category">
          Lanyards &amp; ID Accessories
        </span>

        <!-- Título principal (h1) enlazado por aria-labelledby desde el <main> -->
        <h1 id="sp-title" class="sp-title js-fade-up">
          Custom Printed Lanyards – 10mm to 35mm – Full Colour Logo – Breakaway Safety &amp; ID Badge Holders
        </h1>

        <!-- Meta: marca del producto (sin SKU, según tu comentario) -->
        <div class="sp-meta js-fade-up">
          <span id="sp-brand" class="brand-link">Promoflow</span>
        </div>

        <!-- Subtítulo / claim (inglés británico) -->
        <p id="sp_subtitle" class="sp-subtitle js-fade-up">
          Choose the width, pack size and clip type that match your event, office or school, then upload your artwork for full colour printing.
        </p>

        <!-- Precio principal (formato grande) -->
        <div class="sp-price-main js-fade-up">
          <span class="sp-price-symbol" id="sp_currency_symbol">£</span>
          <span id="sp_price" class="sp-price">
            8<span class="sp-price-minor">.00</span>
          </span>
          <span id="sp_unit_hint" class="sp-unit-hint">per 100 units</span>
        </div>

        <!-- VARIATIONS ARRIBA: configuraciones principales (width/print side/clip type) -->
        <section id="section_variations" class="sp-variations js-fade-up" aria-label="Product configuration">

          <!-- Grupo de variación: Width -->
          <div class="var-group" aria-labelledby="var_label_size_1">

            <!-- Etiqueta del grupo + valor seleccionado -->
            <div class="var-label">
              <span class="var-name">Width</span>
              <strong id="var_label_size_1">20mm</strong>
            </div>

            <!-- Opciones del grupo (idealmente aquí el JS marca .is-selected y actualiza el label) -->
            <div class="var-options" id="sp_var_group_size_1">

              <!-- Opción: 10mm -->
              <button type="button" class="var-option js-scale-in">
                <img class="var-thumb"
                     src="https://upload.wikimedia.org/wikipedia/commons/6/6d/Various_lanyards.jpg"
                     alt="Slim lanyard sample">
                <span class="opt-main">10mm</span>
              </button>

              <!-- Opción: 15mm -->
              <button type="button" class="var-option js-scale-in">
                <img class="var-thumb"
                     src="https://upload.wikimedia.org/wikipedia/commons/4/40/Red_lanyard.jpg"
                     alt="Narrow lanyard sample">
                <span class="opt-main">15mm</span>
                <span class="opt-sub">Lightweight</span>
              </button>

              <!-- Opción seleccionada por defecto: 20mm -->
              <button type="button" class="var-option is-selected js-scale-in">
                <img class="var-thumb"
                     src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Lanyard_mit_Logo_bedruckt.jpg"
                     alt="Standard 20mm printed lanyard">
                <span class="opt-main">20mm</span>
                <span class="opt-sub">Most popular</span>
              </button>

              <!-- Opción: 25mm -->
              <button type="button" class="var-option js-scale-in">
                <img class="var-thumb"
                     src="https://upload.wikimedia.org/wikipedia/commons/6/6d/Various_lanyards.jpg"
                     alt="Wide strap lanyard">
                <span class="opt-main">25mm</span>
                <span class="opt-sub">Extra logo space</span>
              </button>

              <!-- Opción: 30mm -->
              <button type="button" class="var-option js-scale-in">
                <img class="var-thumb"
                     src="https://upload.wikimedia.org/wikipedia/commons/4/40/Red_lanyard.jpg"
                     alt="Extra wide lanyard">
                <span class="opt-main">30mm</span>
                <span class="opt-sub">Bold branding</span>
              </button>

              <!-- Opción: 35mm -->
              <button type="button" class="var-option js-scale-in">
                <img class="var-thumb"
                     src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Lanyard_mit_Logo_bedruckt.jpg"
                     alt="Oversized sponsor lanyard">
                <span class="opt-main">35mm</span>
                <span class="opt-sub">Sponsor logos</span>
              </button>

            </div>
          </div>

          <!-- Grupo de variación: Print side -->
          <div class="var-group" aria-labelledby="var_label_size_2">

            <div class="var-label">
              <span class="var-name">Print side</span>
              <strong id="var_label_size_2">Double sided</strong>
            </div>

            <div class="var-options">
              <!-- Seleccionado por defecto -->
              <button type="button" class="var-option is-selected js-scale-in">
                <span class="opt-main">Double sided</span>
              </button>

              <button type="button" class="var-option js-scale-in">
                <span class="opt-main">Single sided</span>
                <span class="opt-sub">Budget option</span>
              </button>
            </div>

          </div>

          <!-- Grupo de variación: Clip type -->
          <div class="var-group" aria-labelledby="var_label_size_3">

            <div class="var-label">
              <span class="var-name">Clip type</span>
              <strong id="var_label_size_3">Swivel hook</strong>
            </div>

            <!-- Opciones del clip:
                 actualmente comentadas; el JS podría renderizarlas según el producto -->
            <div class="var-options">
              <!-- Opciones ejemplo comentadas -->
            </div>

          </div>

        </section>
      </section>

      <!-- VARIATIONS BOTTOM:
           Contenedor “overflow” para mover .var-group que no quepan arriba (lógica desde JS). -->
      <section class="sp-variations-bottom js-fade-up" aria-label="More configuration options">
        <!-- JS moverá aquí los .var-group que no quepan en .sp-variations -->
      </section>

      <!-- PACK SIZE: selección de cantidad/paquetes (sección de ancho mayor, entre columnas 1 y 2) -->
      <section class="sp-packsize js-fade-up" id="sp-packsize" aria-label="Pack sizes and bundle pricing">
        <div class="var-group var-group-pack" aria-labelledby="var_label_items">

          <div class="var-label">
            <span class="var-name">Pack size</span>
            <strong id="var_label_items">500 units</strong>
          </div>

          <!-- Opciones de pack size; el JS debería recalcular unit/total y actualizar buybox -->
          <div class="var-options" id="sp_var_group_items">
            <button type="button" class="var-option js-scale-in">
              <span class="opt-main">50</span>
              <span class="opt-sub">Small teams · from £0.25 each</span>
            </button>

            <button type="button" class="var-option js-scale-in">
              <span class="opt-main">100</span>
              <span class="opt-sub">Events · from £0.18 each</span>
            </button>

            <button type="button" class="var-option js-scale-in">
              <span class="opt-main">200</span>
              <span class="opt-sub">Schools · from £0.14 each</span>
            </button>

            <!-- Seleccionado por defecto -->
            <button type="button" class="var-option is-selected js-scale-in">
              <span class="opt-main">500</span>
              <span class="opt-sub">Best value · from £0.08 each</span>
            </button>

            <button type="button" class="var-option js-scale-in">
              <span class="opt-main">1,000</span>
              <span class="opt-sub">Conferences · bulk rates</span>
            </button>

            <button type="button" class="var-option js-scale-in">
              <span class="opt-main">2,000</span>
              <span class="opt-sub">Large venues · bulk rates</span>
            </button>

            <button type="button" class="var-option js-scale-in">
              <span class="opt-main">3,000</span>
              <span class="opt-sub">Trade shows · bulk rates</span>
            </button>

            <button type="button" class="var-option js-scale-in">
              <span class="opt-main">5,000</span>
              <span class="opt-sub">Multi-site · bulk rates</span>
            </button>
          </div>
        </div>
      </section>

      <!-- DESCARGA DE TEMPLATES (PDF):
           Links con download para bajar plantillas de arte por ancho. -->
      <section class="sp-artwork-downloads js-fade-up" aria-label="Artwork templates">
        <h2 class="sp-artwork-heading">Download artwork templates (PDF)</h2>

        <div class="sp-artwork-grid">
          <!-- Nota: reemplaza href por tus rutas reales -->
          <a href="/templates/lanyard-10mm.pdf" class="btn btn-artwork" download>10&nbsp;mm template</a>
          <a href="/templates/lanyard-15mm.pdf" class="btn btn-artwork" download>15&nbsp;mm template</a>
          <a href="/templates/lanyard-20mm.pdf" class="btn btn-artwork" download>20&nbsp;mm template</a>
          <a href="/templates/lanyard-25mm.pdf" class="btn btn-artwork" download>25&nbsp;mm template</a>
          <a href="/templates/lanyard-30mm.pdf" class="btn btn-artwork" download>30&nbsp;mm template</a>
          <a href="/templates/lanyard-35mm.pdf" class="btn btn-artwork" download>35&nbsp;mm template</a>
        </div>

        <p class="sp-artwork-note">
          If you do not have a designer, you can still place your order and request help with artwork during checkout.
        </p>
      </section>

      <!-- ITEMS NOTE: cuadro informativo (texto educativo para el usuario) -->
      <section class="sp-items-note js-fade-up" id="sp-items-note" aria-label="Items information">
        <ul class="sp-items-list">

          <li>
            <strong class="sp-item-subtitle">What is one item?</strong>
            <span>Each item refers to a single printed lanyard produced with your selected width, pack size and clip type.</span>
          </li>

          <li>
            <strong class="sp-item-subtitle">How do pack sizes work?</strong>
            <span>Pack quantities indicate the total number of individual lanyards supplied in your order, ready to hand out to staff, visitors or guests.</span>
          </li>

          <li>
            <strong class="sp-item-subtitle">Consistent branding every time</strong>
            <span>Your artwork, colours and logos are checked before production so each lanyard looks clean, sharp and on-brand.</span>
          </li>

        </ul>
      </section>

      <!-- Col 3: Buy box (sticky) -->
      <aside class="sp-col sp-buybox" aria-label="Purchase options">
        <div class="box js-fade-up js-scale-in js-parallax">

          <!-- Resumen de precios: unitario + total (idealmente actualizados por JS) -->
          <div class="price-line">
            <span class="label">Unit</span>
            <strong id="bb_unit">£0.08</strong>
          </div>

          <div class="price-line">
            <span class="label">Total</span>
            <strong id="bb_total">£8.00</strong>
          </div>

          <!-- Información de envío -->
          <div class="ship">
            <span>Delivery</span>
            <small>Delivery only in England. Standard dispatch in 2–3 weeks.</small>
          </div>

          <!-- Estado stock -->
          <div class="stock in">In stock</div>

          <!-- CTA: botones de compra (por ahora deshabilitados hasta que haya selección válida) -->
          <button type="button" class="btn btn-primary btn-buy js-scale-in" id="bb_add">
            Add to basket (disabled)
          </button>

          <button type="button" class="btn btn-ghost btn-buy js-scale-in" id="bb_buy" disabled>
            Buy now (disabled)
          </button>
        </div>
      </aside>
    </section>

    <!-- Product Description: bloque de descripción (relleno dinámico por JS) -->
    <section class="sp-about js-fade-up">
      <h2>Product Description</h2>

      <div id="sp_desc" class="sp-desc">
        <!-- Descripción dinámica -->
      </div>
    </section>

    <!-- Related products: cards (actualmente comentadas; JS o backend puede renderizar) -->
    <section class="sp-related js-fade-up">
      <h2>More products you might like</h2>

      <div class="related-grid">
        <!-- Cards ejemplo comentadas -->
      </div>
    </section>

  </div>

  <!-- Acciones flotantes: navegación y publicación -->
  <div class="sp-actions">

    <!-- Volver a la edición -->
    <button type="button"
            class="btn btn-back-preview"
            id="btn_back_edit">
      Back to editing
    </button>

    <!-- Publicar el producto -->
    <button type="button"
            class="btn btn-publish-preview"
            id="btn_publish">
      Publish
    </button>

  </div>
</main>

<!-- Carga los JS con cache-busting para evitar archivos antiguos en el navegador -->
<script src="<?= $jsPath ?>?v=<?= $jsTime ?>"></script>
<script src="<?= $jsPath2 ?>?v=<?= $jsTime2 ?>"></script>
