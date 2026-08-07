const moduleVersion = new URL(import.meta.url).searchParams.get("v") || "1";
const versionedModule = (path) => {
  const url = new URL(path, import.meta.url);
  url.searchParams.set("v", moduleVersion);
  return url.href;
};

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

class CustomerAuthModal {
  constructor({ api, onAuthenticated, onDismissed }) {
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
    this.setBusy(true);
    this.showFeedback("");

    try {
      const result = await request();
      this.showFeedback(result.message || "Authentication successful. Continuing your order…", "success");
      this.setBusy(false);
      this.close({ dismissed: false, restoreFocus: false });
      await this.onAuthenticated?.(result);
    } catch (error) {
      this.showFeedback(error.message || "Authentication could not be completed.", "error");
      this.setBusy(false);
    }
  }

  setBusy(busy) {
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

class CustomerPreviewApp {
  constructor() {
    this.params = new URLSearchParams(window.location.search);
    this.sku = String(this.params.get("sku") || "").trim();
    this.api = new PreviewApi();
    this.store = new PreviewStore();
    this.loadController = null;

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
      renderPath: () => this.renderSelectedPath(),
      onError: (message) => this.showMessage(message, "error")
    });

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

  bindEvents() {
    this.elements.back?.addEventListener("click", () => this.goBack());
    this.elements.addToCart?.addEventListener("click", () => this.submitPurchase(false));
    this.elements.buyNow?.addEventListener("click", () => this.submitPurchase(true));
  }

  async init() {
    if (!this.sku) {
      this.showFatal("The product SKU is missing from this link.");
      return;
    }

    this.setLoading(true);
    this.loadController?.abort();
    this.loadController = new AbortController();

    try {
      const payload = await this.api.getCustomerPreview(this.sku, {
        signal: this.loadController.signal
      });

      this.store.setProduct(payload);
      this.renderProduct(payload);
      await this.variations.loadRoot(payload.root_variation_id);
      this.setLoading(false);
    } catch (error) {
      if (error.name === "AbortError") return;
      this.showFatal(error.message || "The product could not be loaded.");
    }
  }

  renderProduct(payload) {
    const product = payload.product || {};
    const category = product.category?.name || "Uncategorised";
    const group = product.group?.name || "No group";

    this.setText("sp_category", category);
    this.setText("sp-title", product.name || "Untitled product");
    this.setText("sp-brand", product.supplier_name || "Supplier");
    this.setText("sp_subtitle", product.tagline || "No product tagline has been added yet.");
    this.setText("sp_desc", product.description || "No product description has been added yet.");
    this.setText("product_sku", product.sku || this.sku);

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
    this.images.clear();
    this.items.clear();
    this.artwork.clear();
    this.gallery.clear();

    const imageKeys = new Set();
    const itemKeys = new Set();
    let renderedItems = 0;
    let renderedArtwork = 0;

    const selectedRows = this.store.getSelectedRows();

    for (const row of selectedRows) {
      const variation = row?.variation || {};
      const variationName = String(variation.name || "").trim();

      const uniqueImages = (Array.isArray(row?.images) ? row.images : []).filter((image) => {
        const key = String(image?.image_id ?? image?.link ?? "");
        if (!key || imageKeys.has(key)) return false;
        imageKeys.add(key);
        return true;
      });

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
      renderedItems += this.items.render(uniqueItems);

      if (row?.artwork) {
        renderedArtwork += this.artwork.render(row.artwork, { variationName }) ? 1 : 0;
      }
    }

    this.images.renderEmpty();
    this.gallery.refresh({ keepIndex: false });

    if (this.elements.itemsSection) this.elements.itemsSection.hidden = renderedItems === 0;
    if (this.elements.artworkSection) this.elements.artworkSection.hidden = renderedArtwork === 0;

    const priceSource = [...selectedRows].reverse().find((row) => {
      return String(row?.variation?.price_display_mode ?? "prices") === "prices"
        && Array.isArray(row?.prices)
        && row.prices.length > 0;
    });

    if (priceSource) {
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
    window.location.assign(new URL("../../view/product/index.php", window.location.href));
  }

  updatePurchaseActions(summary = {}) {
    this.purchaseReady = Boolean(summary.ready);
    const disabled = !this.purchaseReady || this.purchasePending;
    if (this.elements.addToCart) this.elements.addToCart.disabled = disabled;
    if (this.elements.buyNow) this.elements.buyNow.disabled = disabled;
  }

  async submitPurchase(buyNow, savedPayload = null) {
    if (!this.purchaseReady || this.purchasePending) return;

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
      const result = await this.api.addToCart(purchasePayload);

      this.pendingPurchase = null;
      this.showMessage(result.message || "The product was added to your cart.", "success");
      window.dispatchEvent(new CustomEvent("promoflow:cart-updated", {
        detail: { count: Number(result.cart_count) || 1 }
      }));

      if (buyNow) {
        window.location.assign(new URL("../../view/shopping_cart/index.php", window.location.href));
      }
    } catch (error) {
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
    const pending = this.pendingPurchase;
    if (!pending) return;

    this.showMessage("You are signed in. Adding your selected product…", "info");
    await this.submitPurchase(pending.buyNow, pending.payload);
  }

  cancelPendingPurchase() {
    this.pendingPurchase = null;
    this.showMessage("Sign in or create an account when you are ready to continue.", "info");
  }

  setPurchasePending(pending, activeButton = null) {
    this.purchasePending = pending;

    [this.elements.addToCart, this.elements.buyNow].forEach((button) => {
      if (!button) return;
      button.disabled = pending || !this.purchaseReady;
      button.classList.toggle("is-loading", pending && button === activeButton);
      button.setAttribute("aria-busy", String(pending && button === activeButton));
    });
  }

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

const app = new CustomerPreviewApp();
app.init();
