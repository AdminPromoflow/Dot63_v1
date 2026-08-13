/*
 * MAPA DEL PREVIEW DEL PROVEEDOR
 * 3. Este archivo coordina todos los módulos.
 * 4. Se pide el producto al servidor.
 * 5. Se guarda y se pinta la información general.
 * 6. Se recorre el árbol de variaciones.
 * 7. Se pintan los recursos de la ruta seleccionada.
 * 8. Se calcula el precio.
 * 9. La pantalla queda lista para interacciones.
 * 10. El proveedor vuelve a editar o envía el producto para aprobación.
 */

// [Supplier 3.1] preview.php añadió una versión a esta URL. La reutilizamos en cada import
// para que todos los archivos pertenezcan a la misma versión y no se mezclen módulos de caché.
const moduleVersion = new URL(import.meta.url).searchParams.get("v") || "1";
const versionedModule = (path) => {
  const url = new URL(path, import.meta.url);
  url.searchParams.set("v", moduleVersion);
  return url.href;
};

// [Supplier 3.2] Los ocho módulos son independientes al descargarse, por eso se cargan en paralelo.
// Promise.all espera a que estén todos listos antes de crear la aplicación.
const [
  { PreviewApi },
  { PreviewStore },
  { PreviewGallery },
  { ImagesRenderer },
  { ItemsRenderer },
  { ArtworkRenderer },
  { PricesController },
  { VariationsController }
] = await Promise.all([
  import(versionedModule("./preview_api.js")),
  import(versionedModule("./preview_store.js")),
  import(versionedModule("./preview.js")),
  import(versionedModule("../images/images.js")),
  import(versionedModule("../items/items.js")),
  import(versionedModule("../artwork/artwork.js")),
  import(versionedModule("../prices/prices.js")),
  import(versionedModule("../variations/variations.js"))
]);

// [Supplier 3.3] Esta clase es el coordinador: no hace todo por sí sola, sino que conecta API,
// estado, galería, renderizadores, precios y variaciones en un único flujo legible.
class SupplierPreviewApp {
  constructor() {
    // [Supplier 3.3.1] El SKU de la URL identifica el producto que se debe consultar.
    this.params = new URLSearchParams(window.location.search);
    this.sku = String(this.params.get("sku") || "").trim();

    // [Supplier 3.3.2] API se comunica con PHP y Store conserva el estado compartido en memoria.
    this.api = new PreviewApi();
    this.store = new PreviewStore();
    this.loadController = null;
    this.submitController = null;

    // [Supplier 3.3.3] Cada módulo recibe solo las dependencias que necesita.
    this.gallery = new PreviewGallery();
    this.images = new ImagesRenderer();
    this.items = new ItemsRenderer();
    this.artwork = new ArtworkRenderer();
    this.prices = new PricesController({
      api: this.api,
      store: this.store,
      getSku: () => this.sku
    });
    this.variations = new VariationsController({
      api: this.api,
      store: this.store,
      prices: this.prices,
      renderPath: () => this.renderSelectedPath(),
      onError: (message) => this.showMessage(message, "error")
    });

    // [Supplier 3.3.4] Guardamos una sola referencia a cada elemento importante del DOM.
    // Esto evita repetir búsquedas y permite que los métodos posteriores sean más fáciles de leer.
    this.elements = {
      loading: document.getElementById("preview_loading"),
      content: document.getElementById("preview_content"),
      fatal: document.getElementById("preview_fatal"),
      fatalMessage: document.getElementById("preview_fatal_message"),
      notice: document.getElementById("preview_notice"),
      publish: document.getElementById("btn_publish"),
      back: document.getElementById("btn_back_edit"),
      status: document.getElementById("product_status"),
      readiness: document.getElementById("readiness_list"),
      readinessSummary: document.getElementById("readiness_summary"),
      itemsSection: document.getElementById("items_section"),
      artworkSection: document.getElementById("artwork_section")
    };

    this.bindEvents();
  }

  bindEvents() {
    // [Supplier 3.4] Los eventos se conectan una sola vez al construir la aplicación.
    this.elements.back?.addEventListener("click", () => this.goBack());
    this.elements.publish?.addEventListener("click", () => this.submitForApproval());
  }

  async init() {
    // [Supplier 3.5] La inicialización es el primer proceso que se ejecuta al final de este archivo.
    // Sin SKU no existe una consulta segura que hacer, así que mostramos un error y terminamos.
    if (!this.sku) {
      this.showFatal("The product SKU is missing from this preview link.");
      return;
    }

    this.setLoading(true);
    this.loadController?.abort();
    this.loadController = new AbortController();

    try {
      // [Supplier 4] PreviewApi envía el SKU al endpoint protegido del servidor.
      const payload = await this.api.getSupplierPreview(this.sku, {
        signal: this.loadController.signal
      });

      // [Supplier 5] Con una respuesta válida guardamos el producto y pintamos sus datos generales.
      this.store.setProduct(payload);
      this.renderProduct(payload);

      // [Supplier 6] Después recorremos las variaciones desde la raíz. Este proceso también elige
      // opciones predeterminadas y dispara los pasos 7 y 8 en cada cambio de ruta.
      await this.variations.loadRoot(payload.root_variation_id);

      // [Supplier 9] Solo mostramos la pantalla completa cuando producto, opciones y precio inicial
      // ya están coordinados. Así el proveedor no ve una interfaz incompleta durante la carga.
      this.setLoading(false);
    } catch (error) {
      // [Supplier 4.1] AbortError significa que una solicitud anterior fue reemplazada; no es un fallo visible.
      if (error.name === "AbortError") return;
      this.showFatal(error.message || "The product preview could not be loaded.", error.status === 401);
    }
  }

  renderProduct(payload) {
    // [Supplier 5.1] Normalizamos valores opcionales para que la interfaz nunca muestre undefined.
    const product = payload.product || {};
    const category = product.category?.name || "Uncategorised";
    const group = product.group?.name || "No group";

    this.setText("sp_category", category);
    this.setText("sp-title", product.name || "Untitled product");
    this.setText("sp-brand", product.supplier_name || "Supplier");
    this.setText("sp_subtitle", product.tagline || "No product tagline has been added yet.");
    this.setText("sp_desc", product.description || "No product description has been added yet.");
    this.setText("product_sku", product.sku || this.sku);

    // [Supplier 5.2] Las migas se construyen con textContent, por lo que los datos del servidor
    // se muestran como texto y no se interpretan como HTML.
    const breadcrumbs = document.getElementById("sp_breadcrumbs");
    if (breadcrumbs) {
      breadcrumbs.innerHTML = "";
      [category, group, product.name || "Preview"].forEach((label, index, values) => {
        const item = document.createElement("li");
        const text = document.createElement("span");
        text.textContent = label;
        if (index === values.length - 1) text.setAttribute("aria-current", "page");
        item.appendChild(text);
        breadcrumbs.appendChild(item);
      });
    }

    // [Supplier 5.3] El estado y checklist determinan si el botón de aprobación puede habilitarse.
    this.renderStatus(product);
    this.renderReadiness(payload.readiness || {});

    const canSubmit = Boolean(payload.permissions?.can_submit);
    if (this.elements.publish) {
      this.elements.publish.hidden = product.is_approved || String(product.status) === "2";
      this.elements.publish.disabled = !canSubmit;
      this.elements.publish.title = canSubmit
        ? "Submit this product for approval"
        : "Complete every readiness check before submitting";
    }
  }

  renderStatus(product) {
    // [Supplier 5.3.1] Traducimos los valores del servidor a una etiqueta y tono entendibles.
    if (!this.elements.status) return;

    let label = "Draft";
    let tone = "draft";

    if (product.is_approved) {
      label = "Approved";
      tone = "approved";
    } else if (String(product.status) === "2") {
      label = "Pending approval";
      tone = "pending";
    }

    this.elements.status.textContent = label;
    this.elements.status.dataset.tone = tone;
  }

  renderReadiness(readiness) {
    // [Supplier 5.3.2] Cada requisito se pinta como completo o pendiente.
    if (!this.elements.readiness) return;
    this.elements.readiness.innerHTML = "";

    const checks = Array.isArray(readiness.checks) ? readiness.checks : [];
    for (const check of checks) {
      const item = document.createElement("li");
      item.className = check.complete ? "is-complete" : "is-incomplete";

      const icon = document.createElement("span");
      icon.className = "readiness-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = check.complete ? "✓" : "!";

      const label = document.createElement("span");
      label.textContent = check.label;
      item.append(icon, label);
      this.elements.readiness.appendChild(item);
    }

    if (this.elements.readinessSummary) {
      this.elements.readinessSummary.textContent = readiness.complete
        ? "Ready to submit for approval"
        : `${readiness.issues?.length || 0} item${readiness.issues?.length === 1 ? "" : "s"} need attention`;
      this.elements.readinessSummary.classList.toggle("is-ready", Boolean(readiness.complete));
    }
  }

  renderSelectedPath() {
    // [Supplier 7] VariationsController llama este método cada vez que cambia una selección.
    // Primero se elimina la representación anterior para reconstruir una vista coherente.
    this.images.clear();
    this.items.clear();
    this.artwork.clear();
    this.gallery.clear();

    const imageKeys = new Set();
    const itemKeys = new Set();
    let renderedItems = 0;
    let renderedArtwork = 0;

    // [Supplier 7.1] Store devuelve la raíz y todas las variaciones elegidas en orden.
    const selectedRows = this.store.getSelectedRows();

    for (const row of selectedRows) {
      const variation = row?.variation || {};
      const variationName = String(variation.name || "").trim();

      // [Supplier 7.2] Una imagen o item puede venir repetido desde varios niveles.
      // Los Set permiten pintar cada recurso una sola vez.
      const uniqueImages = (Array.isArray(row?.images) ? row.images : []).filter((image) => {
        const key = String(image?.image_id ?? image?.link ?? "");
        if (!key || imageKeys.has(key)) return false;
        imageKeys.add(key);
        return true;
      });

      // [Supplier 7.3.1] ImagesRenderer crea las imágenes de este nivel.
      this.images.render(uniqueImages, {
        productName: this.store.product?.name,
        variationName
      });

      const uniqueItems = (Array.isArray(row?.items) ? row.items : []).filter((item) => {
        const key = String(item?.item_id ?? `${item?.name}:${item?.description}`);
        if (!key || itemKeys.has(key)) return false;
        itemKeys.add(key);
        return true;
      });
      // [Supplier 7.3.2] ItemsRenderer agrega datos complementarios del producto.
      renderedItems += this.items.render(uniqueItems);

      if (row?.artwork) {
        // [Supplier 7.3.3] ArtworkRenderer agrega el PDF asociado, si existe.
        renderedArtwork += this.artwork.render(row.artwork, { variationName }) ? 1 : 0;
      }
    }

    // [Supplier 7.4] Si no hubo imágenes se pinta el estado vacío; luego la galería
    // vuelve a leer sus elementos y comienza desde la primera imagen.
    this.images.renderEmpty();
    this.gallery.refresh({ keepIndex: false });

    if (this.elements.itemsSection) this.elements.itemsSection.hidden = renderedItems === 0;
    if (this.elements.artworkSection) this.elements.artworkSection.hidden = renderedArtwork === 0;

    // [Supplier 7.5] El precio base viene del nivel seleccionado más específico que use
    // price_display_mode="prices". Las opciones con modo "variation" son extras.
    const priceSource = [...selectedRows].reverse().find((row) => {
      return String(row?.variation?.price_display_mode ?? "prices") === "prices"
        && Array.isArray(row?.prices)
        && row.prices.length > 0;
    });

    if (priceSource) {
      // [Supplier 8] PricesController pinta los rangos, selecciona uno y calcula el resumen.
      const rows = priceSource.prices.map((price) => ({
        ...price,
        price_display_mode: priceSource.variation?.price_display_mode || "prices"
      }));
      this.prices.render(rows);
    } else {
      this.prices.clear();
    }
  }

  async submitForApproval() {
    // [Supplier 10.1] El envío solo continúa si el backend ya confirmó que todos los requisitos se cumplen.
    if (!this.store.permissions?.can_submit || !this.elements.publish) return;

    this.submitController?.abort();
    this.submitController = new AbortController();
    this.elements.publish.disabled = true;
    this.elements.publish.classList.add("is-loading");
    this.showMessage("Submitting your product for approval…", "info");

    try {
      // [Supplier 10.2] PreviewApi envía el SKU a controller/products/product.php.
      const result = await this.api.submitForApproval(this.sku, {
        signal: this.submitController.signal
      });

      // [Supplier 10.4] Cuando PHP confirma el envío, actualizamos el estado local sin recargar la página.
      this.store.product.status = "2";
      this.store.permissions.can_submit = false;
      this.renderStatus(this.store.product);
      this.elements.publish.hidden = true;
      this.showMessage(result.message || "Product submitted for approval.", "success");
    } catch (error) {
      // [Supplier 10.5] Si falla, mantenemos el producto editable y explicamos qué falta.
      if (error.name !== "AbortError") {
        const missing = Array.isArray(error.details?.missing)
          ? ` Missing: ${error.details.missing.join(", ")}.`
          : "";
        this.showMessage(`${error.message}${missing}`, "error");
        this.elements.publish.disabled = false;
      }
    } finally {
      this.elements.publish.classList.remove("is-loading");
    }
  }

  goBack() {
    // [Supplier 10.6] Volvemos al editor conservando el SKU del producto y, si existe,
    // el SKU de la variación más profunda que estaba seleccionada.
    const destination = new URL("../../view/product_details/index.php", window.location.href);
    destination.searchParams.set("sku", this.sku);

    const selected = [...this.store.getSelectedRows()].reverse().find((row) => row?.variation?.SKU);
    const initialVariation = String(this.params.get("sku_variation") || "").trim();
    const variationSku = String(selected?.variation?.SKU || initialVariation).trim();
    if (variationSku) destination.searchParams.set("sku_variation", variationSku);

    window.location.assign(destination);
  }

  // [Supplier 11] Estos métodos pequeños concentran cambios repetidos de interfaz.
  setLoading(loading) {
    if (this.elements.loading) this.elements.loading.hidden = !loading;
    if (this.elements.content) this.elements.content.hidden = loading;
  }

  showFatal(message, showLogin = false) {
    this.setLoading(false);
    if (this.elements.content) this.elements.content.hidden = true;
    if (this.elements.fatal) this.elements.fatal.hidden = false;
    if (this.elements.fatalMessage) this.elements.fatalMessage.textContent = message;

    const loginLink = document.getElementById("preview_login_link");
    if (loginLink) loginLink.hidden = !showLogin;
  }

  showMessage(message, tone = "info") {
    if (!this.elements.notice) return;
    this.elements.notice.textContent = message;
    this.elements.notice.dataset.tone = tone;
    this.elements.notice.hidden = false;
  }

  setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value ?? "");
  }
}

// [Supplier 3.5.1] Con todos los módulos definidos, se crea una sola aplicación y comienza init().
const app = new SupplierPreviewApp();
app.init();
