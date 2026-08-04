import { PreviewApi } from "./preview_api.js";
import { PreviewStore } from "./preview_store.js";
import { PreviewGallery } from "./preview.js";
import { ImagesRenderer } from "../images/images.js";
import { ItemsRenderer } from "../items/items.js";
import { ArtworkRenderer } from "../artwork/artwork.js";
import { PricesController } from "../prices/prices.js";
import { VariationsController } from "../variations/variations.js";

class SupplierPreviewApp {
  constructor() {
    this.params = new URLSearchParams(window.location.search);
    this.sku = String(this.params.get("sku") || "").trim();
    this.api = new PreviewApi();
    this.store = new PreviewStore();
    this.loadController = null;
    this.submitController = null;

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
    this.elements.back?.addEventListener("click", () => this.goBack());
    this.elements.publish?.addEventListener("click", () => this.submitForApproval());
  }

  async init() {
    if (!this.sku) {
      this.showFatal("The product SKU is missing from this preview link.");
      return;
    }

    this.setLoading(true);
    this.loadController?.abort();
    this.loadController = new AbortController();

    try {
      const payload = await this.api.getSupplierPreview(this.sku, {
        signal: this.loadController.signal
      });

      this.store.setProduct(payload);
      this.renderProduct(payload);
      this.setLoading(false);
      await this.variations.loadRoot(payload.root_variation_id);
    } catch (error) {
      if (error.name === "AbortError") return;
      this.showFatal(error.message || "The product preview could not be loaded.", error.status === 401);
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

  async submitForApproval() {
    if (!this.store.permissions?.can_submit || !this.elements.publish) return;

    this.submitController?.abort();
    this.submitController = new AbortController();
    this.elements.publish.disabled = true;
    this.elements.publish.classList.add("is-loading");
    this.showMessage("Submitting your product for approval…", "info");

    try {
      const result = await this.api.submitForApproval(this.sku, {
        signal: this.submitController.signal
      });

      this.store.product.status = "2";
      this.store.permissions.can_submit = false;
      this.renderStatus(this.store.product);
      this.elements.publish.hidden = true;
      this.showMessage(result.message || "Product submitted for approval.", "success");
    } catch (error) {
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
    const destination = new URL("../../view/product_details/index.php", window.location.href);
    destination.searchParams.set("sku", this.sku);

    const selected = [...this.store.getSelectedRows()].reverse().find((row) => row?.variation?.SKU);
    const initialVariation = String(this.params.get("sku_variation") || "").trim();
    const variationSku = String(selected?.variation?.SKU || initialVariation).trim();
    if (variationSku) destination.searchParams.set("sku_variation", variationSku);

    window.location.assign(destination);
  }

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

const app = new SupplierPreviewApp();
app.init();
