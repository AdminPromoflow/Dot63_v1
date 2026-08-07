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

  async submitPurchase(buyNow) {
    if (!this.purchaseReady || this.purchasePending) return;

    const quantity = Number(this.store.selectedQuantity);
    const priceId = Number(this.store.selectedPriceId);
    const variationIds = [...new Set(this.store.getSelectedVariationIds())];

    if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isInteger(priceId) || priceId <= 0) {
      this.showMessage("Please choose a valid product quantity before continuing.", "error");
      return;
    }

    this.setPurchasePending(true, buyNow ? this.elements.buyNow : this.elements.addToCart);
    this.hideMessage();

    try {
      const result = await this.api.addToCart({
        sku: this.sku,
        quantity,
        price_id: priceId,
        variation_ids: variationIds,
        intent: buyNow ? "buy_now" : "add_to_cart"
      });

      this.showMessage(result.message || "The product was added to your cart.", "success");

      if (buyNow) {
        window.location.assign(new URL("../../view/shopping_cart/index.php", window.location.href));
      }
    } catch (error) {
      this.showMessage(error.message || "The product could not be added to your cart.", "error");
    } finally {
      this.setPurchasePending(false);
    }
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
