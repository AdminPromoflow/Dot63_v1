/*
 * MAPA DEL PREVIEW DEL CLIENTE
 * 3. Este archivo coordina todos los módulos.
 * 4. Se pide el producto al servidor.
 * 5. Se guarda y se pinta la información general.
 * 6. Se recorre el árbol de variaciones.
 * 7. Se pintan los recursos de la ruta seleccionada.
 * 8. Se calcula el precio.
 * 9. La pantalla queda lista para interacciones.
 * 10. El cliente agrega al carrito; si hace falta, se autentica y se reintenta.
 */

// [Customer 3.1] preview.php añadió una versión a esta URL. La reutilizamos en cada import
// para que todos los archivos pertenezcan a la misma versión y no se mezclen módulos de caché.
const moduleVersion = new URL(import.meta.url).searchParams.get("v") || "1";
const versionedModule = (path) => {
  const url = new URL(path, import.meta.url);
  url.searchParams.set("v", moduleVersion);
  return url.href;
};

// [Customer 3.2] Los ocho módulos son independientes al descargarse, por eso se cargan en paralelo.
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

// [Customer 10.4] Este módulo controla el modal que aparece únicamente cuando el carrito
// responde con 401/AUTH_REQUIRED. Conserva la selección mientras el cliente se identifica.
class CustomerAuthModal {
  constructor({ api, onAuthenticated, onDismissed }) {
    // [Customer 10.4.1] Se reciben callbacks para que el modal no tenga que conocer la lógica del carrito.
    this.api = api;
    this.onAuthenticated = onAuthenticated;
    this.onDismissed = onDismissed;
    this.modal = document.getElementById("customer_auth_modal");
    this.dialog = this.modal?.querySelector(".customer-auth-dialog") || null;
    this.feedback = document.getElementById("customer_auth_feedback");
    this.loginPanel = document.getElementById("customer_auth_login_panel");
    this.registerPanel = document.getElementById("customer_auth_register_panel");
    this.loginForm = document.getElementById("customer_login_form");
    this.registerForm = document.getElementById("customer_register_form");
    this.currentView = "login";
    this.busy = false;
    this.previousFocus = null;

    this.bindEvents();
  }

  bindEvents() {
    // [Customer 10.4.2] Se conectan cierre, cambio de pestaña, formularios y navegación por teclado.
    this.modal?.querySelectorAll("[data-auth-close]").forEach((button) => {
      button.addEventListener("click", () => this.close({ dismissed: true }));
    });

    this.modal?.querySelectorAll("[data-auth-view]").forEach((button) => {
      button.addEventListener("click", () => this.setView(button.dataset.authView));
    });

    this.loginForm?.addEventListener("submit", (event) => this.submitLogin(event));
    this.registerForm?.addEventListener("submit", (event) => this.submitRegistration(event));
    document.addEventListener("keydown", (event) => this.handleKeydown(event));
  }

  open(view = "login", message = "") {
    // [Customer 10.4.3] Se recuerda el foco anterior, se abre el modal y se enfoca el primer campo.
    if (!this.modal) return;

    this.previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    this.modal.hidden = false;
    document.body.classList.add("customer-auth-open");
    this.setView(view, { focus: false });
    this.showFeedback(message, message ? "info" : "");

    window.requestAnimationFrame(() => {
      this.modal?.classList.add("is-open");
      this.focusFirstField();
    });
  }

  close({ dismissed = false, restoreFocus = true } = {}) {
    // [Customer 10.4.4] Al cerrar se limpian contraseñas y se devuelve el foco por accesibilidad.
    if (!this.modal || this.modal.hidden || this.busy) return;

    this.modal.classList.remove("is-open");
    this.modal.hidden = true;
    document.body.classList.remove("customer-auth-open");
    this.clearPasswords();
    this.showFeedback("");

    if (restoreFocus) this.previousFocus?.focus?.();
    if (dismissed) this.onDismissed?.();
  }

  setView(view, { focus = true } = {}) {
    // [Customer 10.4.5] Solo un panel y una pestaña pueden estar activos al mismo tiempo.
    if (this.busy) return;
    this.currentView = view === "register" ? "register" : "login";

    const showingLogin = this.currentView === "login";
    if (this.loginPanel) this.loginPanel.hidden = !showingLogin;
    if (this.registerPanel) this.registerPanel.hidden = showingLogin;

    this.modal?.querySelectorAll('[role="tab"][data-auth-view]').forEach((tab) => {
      const active = tab.dataset.authView === this.currentView;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    this.showFeedback("");
    if (focus && !this.modal?.hidden) this.focusFirstField();
  }

  async submitLogin(event) {
    // [Customer 10.4.6] El navegador valida los campos antes de enviar email y contraseña a PreviewApi.
    event.preventDefault();
    if (this.busy || !this.loginForm) return;

    if (!this.loginForm.checkValidity()) {
      this.loginForm.reportValidity();
      return;
    }

    const formData = new FormData(this.loginForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    await this.authenticate(() => this.api.loginCustomer(email, password));
  }

  async submitRegistration(event) {
    // [Customer 10.4.7] Además de la validación HTML, comprobamos fortaleza y coincidencia de contraseñas.
    event.preventDefault();
    if (this.busy || !this.registerForm) return;

    const password = document.getElementById("customer_register_password");
    const confirmation = document.getElementById("customer_register_password_confirm");
    const passwordValue = String(password?.value || "");
    const passwordIsStrong = passwordValue.length >= 8
      && /[A-Z]/.test(passwordValue)
      && /[a-z]/.test(passwordValue)
      && /[0-9]/.test(passwordValue)
      && /[^A-Za-z0-9]/.test(passwordValue);

    password?.setCustomValidity(passwordIsStrong
      ? ""
      : "Use at least 8 characters with uppercase, lowercase, a number and a symbol.");
    confirmation?.setCustomValidity(passwordValue === String(confirmation?.value || "")
      ? ""
      : "Passwords do not match.");

    if (!this.registerForm.checkValidity()) {
      this.registerForm.reportValidity();
      return;
    }

    const formData = new FormData(this.registerForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();

    await this.authenticate(() => this.api.registerCustomer(name, email, passwordValue));
  }

  async authenticate(request) {
    // [Customer 10.4.8] Login y registro comparten el mismo manejo de espera, éxito y error.
    this.setBusy(true);
    this.showFeedback("");

    try {
      const result = await request();
      this.showFeedback(result.message || "Authentication successful. Continuing your order…", "success");
      this.setBusy(false);
      this.close({ dismissed: false, restoreFocus: false });
      // [Customer 10.6] El callback vuelve a CustomerPreviewApp para reintentar la compra guardada.
      await this.onAuthenticated?.(result);
    } catch (error) {
      this.showFeedback(error.message || "Authentication could not be completed.", "error");
      this.setBusy(false);
    }
  }

  setBusy(busy) {
    // [Customer 10.4.9] Mientras hay una solicitud se evita el doble submit y se muestra un spinner.
    this.busy = busy;
    [this.loginForm, this.registerForm].forEach((form) => {
      if (!form) return;
      form.setAttribute("aria-busy", String(busy));
      form.querySelectorAll("button[type='submit']").forEach((button) => {
        button.disabled = busy;
        button.classList.toggle("is-loading", busy && !form.hidden && !form.closest("[hidden]"));
      });
    });
  }

  showFeedback(message, tone = "info") {
    if (!this.feedback) return;
    this.feedback.textContent = message;
    this.feedback.dataset.tone = tone || "info";
    this.feedback.setAttribute("role", tone === "error" ? "alert" : "status");
    this.feedback.hidden = !message;
  }

  focusFirstField() {
    const panel = this.currentView === "register" ? this.registerPanel : this.loginPanel;
    panel?.querySelector("input:not([disabled])")?.focus();
  }

  clearPasswords() {
    this.modal?.querySelectorAll('input[type="password"]').forEach((input) => {
      input.value = "";
      input.setCustomValidity("");
    });
  }

  handleKeydown(event) {
    // [Customer 10.4.10] Escape cierra; Tab y Shift+Tab permanecen dentro del diálogo abierto.
    if (!this.modal || this.modal.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      this.close({ dismissed: true });
      return;
    }

    if (event.key !== "Tab" || !this.dialog) return;
    const focusable = [...this.dialog.querySelectorAll(
      'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([type="hidden"]), a[href]'
    )].filter((element) => !element.closest("[hidden]"));

    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

// [Customer 3.3] Esta clase es el coordinador: conecta API, estado, renderizadores,
// precios, variaciones, carrito y autenticación en un único flujo.
class CustomerPreviewApp {
  constructor() {
    // [Customer 3.3.1] El SKU de la URL identifica el producto público que se debe consultar.
    this.params = new URLSearchParams(window.location.search);
    this.sku = String(this.params.get("sku") || "").trim();
    this.preselectedVariations = this.getPreselectedVariations(this.params);
    this.api = new PreviewApi();
    this.store = new PreviewStore();
    this.loadController = null;

    // [Customer 3.3.2] Cada módulo recibe solo las dependencias y callbacks que necesita.
    this.gallery = new PreviewGallery();
    this.images = new ImagesRenderer();
    this.items = new ItemsRenderer();
    this.artwork = new ArtworkRenderer();
    this.prices = new PricesController({
      api: this.api,
      store: this.store,
      getSku: () => this.sku,
      onSummaryChange: (summary) => this.updatePurchaseActions(summary)
    });
    this.variations = new VariationsController({
      api: this.api,
      store: this.store,
      prices: this.prices,
      preferredOptions: this.preselectedVariations,
      renderPath: () => this.renderSelectedPath(),
      onError: (message) => this.showMessage(message, "error")
    });

    // [Customer 3.3.3] Guardamos una sola referencia a cada elemento importante del DOM.
    this.elements = {
      loading: document.getElementById("preview_loading"),
      content: document.getElementById("preview_content"),
      fatal: document.getElementById("preview_fatal"),
      fatalMessage: document.getElementById("preview_fatal_message"),
      notice: document.getElementById("preview_notice"),
      back: document.getElementById("btn_back_products"),
      addToCart: document.getElementById("bb_add_to_cart"),
      buyNow: document.getElementById("bb_buy_now"),
      itemsSection: document.getElementById("items_section"),
      artworkSection: document.getElementById("artwork_section")
    };

    this.purchaseReady = false;
    this.purchasePending = false;
    this.pendingPurchase = null;
    this.auth = new CustomerAuthModal({
      api: this.api,
      onAuthenticated: () => this.resumePendingPurchase(),
      onDismissed: () => this.cancelPendingPurchase()
    });

    this.bindEvents();
  }

  getPreselectedVariations(params) {
    const reservedParameters = new Set([
      "sku",
      "combination_id",
      "variation_ids",
      "intent"
    ]);
    const selections = {};

    params.forEach((value, key) => {
      const typeName = String(key || "").trim();
      const optionName = String(value || "").trim();
      if (!typeName || !optionName || reservedParameters.has(typeName.toLowerCase())) return;
      selections[typeName] = optionName;
    });

    return selections;
  }

  bindEvents() {
    // [Customer 3.4] Los eventos se conectan una sola vez al construir la aplicación.
    this.elements.back?.addEventListener("click", () => this.goBack());
    this.elements.addToCart?.addEventListener("click", () => this.submitPurchase(false));
    this.elements.buyNow?.addEventListener("click", () => this.submitPurchase(true));
  }

  async init() {
    // [Customer 3.5] Sin SKU no existe una consulta que hacer, así que mostramos un error y terminamos.
    if (!this.sku) {
      this.showFatal("The product SKU is missing from this link.");
      return;
    }

    this.setLoading(true);
    this.loadController?.abort();
    this.loadController = new AbortController();

    try {
      // [Customer 4] PreviewApi envía el SKU al endpoint público del servidor.
      const payload = await this.api.getCustomerPreview(this.sku, {
        signal: this.loadController.signal
      });

      // [Customer 5] Con una respuesta válida guardamos el producto y pintamos sus datos generales.
      this.store.setProduct(payload);
      this.renderProduct(payload);

      // [Customer 6] Después recorremos las variaciones desde la raíz. Este proceso también elige
      // opciones predeterminadas y dispara los pasos 7 y 8 en cada cambio de ruta.
      await this.variations.loadRoot(payload.root_variation_id);

      // [Customer 9] Solo mostramos la pantalla cuando producto, opciones y precio inicial están coordinados.
      this.setLoading(false);
    } catch (error) {
      // [Customer 4.1] AbortError significa que una solicitud anterior fue reemplazada; no es un fallo visible.
      if (error.name === "AbortError") return;
      this.showFatal(error.message || "The product could not be loaded.");
    }
  }

  renderProduct(payload) {
    // [Customer 5.1] Normalizamos valores opcionales para que la interfaz nunca muestre undefined.
    const product = payload.product || {};
    const category = product.category?.name || "Uncategorised";
    const group = product.group?.name || "No group";

    this.setText("sp_category", category);
    this.setText("sp-title", product.name || "Untitled product");
    this.setText("sp-brand", product.supplier_name || "Supplier");
    this.setText("sp_subtitle", product.tagline || "No product tagline has been added yet.");
    this.setText("sp_desc", product.description || "No product description has been added yet.");
    this.setText("product_sku", product.sku || this.sku);

    // [Customer 5.2] Las migas se construyen con textContent, así los datos se muestran como texto seguro.
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

  }

  renderSelectedPath() {
    // [Customer 7] VariationsController llama este método cada vez que cambia una selección.
    // Primero se elimina la representación anterior para reconstruir una vista coherente.
    this.images.clear();
    this.items.clear();
    this.artwork.clear();
    this.gallery.clear();

    const imageKeys = new Set();
    const itemKeys = new Set();
    let renderedItems = 0;
    let renderedArtwork = 0;

    // [Customer 7.1] Store devuelve la raíz y todas las variaciones elegidas en orden.
    const selectedRows = this.store.getSelectedRows();

    for (const row of selectedRows) {
      const variation = row?.variation || {};
      const variationName = String(variation.name || "").trim();

      // [Customer 7.2] Los Set impiden pintar dos veces recursos que llegan desde varios niveles.
      const uniqueImages = (Array.isArray(row?.images) ? row.images : []).filter((image) => {
        const key = String(image?.image_id ?? image?.link ?? "");
        if (!key || imageKeys.has(key)) return false;
        imageKeys.add(key);
        return true;
      });

      // [Customer 7.3.1] ImagesRenderer crea las imágenes de este nivel.
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
      // [Customer 7.3.2] ItemsRenderer agrega datos complementarios del producto.
      renderedItems += this.items.render(uniqueItems);

      if (row?.artwork) {
        // [Customer 7.3.3] ArtworkRenderer agrega el PDF asociado, si existe.
        renderedArtwork += this.artwork.render(row.artwork, { variationName }) ? 1 : 0;
      }
    }

    // [Customer 7.4] Se pinta el estado vacío si corresponde y la galería vuelve a empezar.
    this.images.renderEmpty();
    this.gallery.refresh({ keepIndex: false });

    if (this.elements.itemsSection) this.elements.itemsSection.hidden = renderedItems === 0;
    if (this.elements.artworkSection) this.elements.artworkSection.hidden = renderedArtwork === 0;

    // [Customer 7.5] El precio base viene del nivel más específico con modo "prices";
    // las opciones con modo "variation" se calculan como extras.
    const priceSource = [...selectedRows].reverse().find((row) => {
      return String(row?.variation?.price_display_mode ?? "prices") === "prices"
        && Array.isArray(row?.prices)
        && row.prices.length > 0;
    });

    if (priceSource) {
      // [Customer 8] PricesController pinta los rangos, selecciona uno y calcula el resumen.
      const rows = priceSource.prices.map((price) => ({
        ...price,
        price_display_mode: priceSource.variation?.price_display_mode || "prices"
      }));
      this.prices.render(rows);
    } else {
      this.prices.clear();
    }
  }

  goBack() {
    // [Customer 9.1] Este botón regresa al listado público de productos.
    window.location.assign(new URL("../../view/product/index.php", window.location.href));
  }

  updatePurchaseActions(summary = {}) {
    // [Customer 8.5] PricesController informa si existe una combinación completa y comprable.
    this.purchaseReady = Boolean(summary.ready);
    const disabled = !this.purchaseReady || this.purchasePending;
    if (this.elements.addToCart) this.elements.addToCart.disabled = disabled;
    if (this.elements.buyNow) this.elements.buyNow.disabled = disabled;
  }

  async submitPurchase(buyNow, savedPayload = null) {
    // [Customer 10.1] No enviamos compras incompletas ni permitimos dos solicitudes simultáneas.
    if (!this.purchaseReady || this.purchasePending) return;

    // [Customer 10.1.1] Si venimos de autenticación usamos la copia guardada; de lo contrario,
    // tomamos la cantidad, price_id y variaciones seleccionadas actualmente.
    const quantity = Number(savedPayload?.quantity ?? this.store.selectedQuantity);
    const priceId = Number(savedPayload?.price_id ?? this.store.selectedPriceId);
    const variationIds = savedPayload?.variation_ids
      ? [...savedPayload.variation_ids]
      : [...new Set(this.store.getSelectedVariationIds())];

    if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isInteger(priceId) || priceId <= 0) {
      this.showMessage("Please choose a valid product quantity before continuing.", "error");
      return;
    }

    const purchasePayload = savedPayload || {
      sku: this.sku,
      quantity,
      price_id: priceId,
      variation_ids: variationIds,
      intent: buyNow ? "buy_now" : "add_to_cart"
    };

    this.setPurchasePending(true, buyNow ? this.elements.buyNow : this.elements.addToCart);
    this.hideMessage();

    try {
      // [Customer 10.2] PreviewApi envía la selección a controller/order/cart.php.
      const result = await this.api.addToCart(purchasePayload);

      // [Customer 10.3] En éxito limpiamos el intento pendiente y avisamos al contador global del carrito.
      this.pendingPurchase = null;
      this.showMessage(result.message || "The product was added to your cart.", "success");
      window.dispatchEvent(new CustomEvent("promoflow:cart-updated", {
        detail: { count: Number(result.cart_count) || 1 }
      }));

      if (buyNow) {
        // [Customer 10.7] "Buy now" usa el mismo carrito y luego lleva al cliente a revisarlo.
        window.location.assign(new URL("../../view/shopping_cart/index.php", window.location.href));
      }
    } catch (error) {
      // [Customer 10.4] Un 401/AUTH_REQUIRED no descarta la configuración: la guardamos y abrimos el modal.
      if (error.status === 401 && (!error.code || error.code === "AUTH_REQUIRED")) {
        this.pendingPurchase = { buyNow, payload: purchasePayload };
        this.showMessage(error.message, "info");
        this.auth.open("login", error.message);
        return;
      }

      this.pendingPurchase = null;
      this.showMessage(error.message || "The product could not be added to your cart.", "error");
    } finally {
      this.setPurchasePending(false);
    }
  }

  async resumePendingPurchase() {
    // [Customer 10.6] Después de login/registro se repite exactamente el payload que había fallado.
    const pending = this.pendingPurchase;
    if (!pending) return;

    this.showMessage("You are signed in. Adding your selected product…", "info");
    await this.submitPurchase(pending.buyNow, pending.payload);
  }

  cancelPendingPurchase() {
    // [Customer 10.4.11] Cerrar el modal cancela solo el intento; las opciones visibles siguen seleccionadas.
    this.pendingPurchase = null;
    this.showMessage("Sign in or create an account when you are ready to continue.", "info");
  }

  setPurchasePending(pending, activeButton = null) {
    // [Customer 10.1.2] Mientras el servidor responde, ambos botones quedan bloqueados.
    this.purchasePending = pending;

    [this.elements.addToCart, this.elements.buyNow].forEach((button) => {
      if (!button) return;
      button.disabled = pending || !this.purchaseReady;
      button.classList.toggle("is-loading", pending && button === activeButton);
      button.setAttribute("aria-busy", String(pending && button === activeButton));
    });
  }

  // [Customer 11] Estos métodos pequeños concentran cambios repetidos de interfaz.
  setLoading(loading) {
    if (this.elements.loading) this.elements.loading.hidden = !loading;
    if (this.elements.content) this.elements.content.hidden = loading;
  }

  showFatal(message) {
    this.setLoading(false);
    if (this.elements.content) this.elements.content.hidden = true;
    if (this.elements.fatal) this.elements.fatal.hidden = false;
    if (this.elements.fatalMessage) this.elements.fatalMessage.textContent = message;
  }

  showMessage(message, tone = "info") {
    if (!this.elements.notice) return;
    this.elements.notice.textContent = message;
    this.elements.notice.dataset.tone = tone;
    this.elements.notice.setAttribute("role", tone === "error" ? "alert" : "status");
    this.elements.notice.hidden = false;
  }

  hideMessage() {
    if (this.elements.notice) this.elements.notice.hidden = true;
  }

  setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value ?? "");
  }
}

// [Customer 3.5.1] Con todos los módulos definidos, se crea una sola aplicación y comienza init().
const app = new CustomerPreviewApp();
app.init();
