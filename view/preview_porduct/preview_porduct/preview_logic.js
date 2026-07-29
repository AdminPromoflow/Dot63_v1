// preview_logic.js

class PreviewLogic {
  constructor() {
    this.variations = new Variations(this);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.bindMainButtons();
    this.variations.init();
    this.getDataProduct();
  }

  bindMainButtons() {
    const backBtn = document.getElementById("btn_back_edit");
    const publishBtn = document.getElementById("btn_publish");

    if (backBtn && backBtn.dataset.bound !== "1") {
      backBtn.dataset.bound = "1";
      backBtn.addEventListener("click", () => this.backBtn());
    }

    if (publishBtn && publishBtn.dataset.bound !== "1") {
      publishBtn.dataset.bound = "1";
      publishBtn.addEventListener("click", () => this.publishBtn());
    }
  }

  publishBtn() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    if (!sku) {
      console.warn("No SKU in URL");
      return;
    }

    const url = "../../controller/products/product.php";

    const data = {
      action: "publish_product",
      sku: sku
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network error.");
        return response.text();
      })
      .then((text) => {
        let responseData;

        try {
          responseData = JSON.parse(text);
        } catch (error) {
          console.error("Invalid JSON:", error);
          alert(text);
          return;
        }

        alert(responseData.message || "Product published successfully.");

        if (responseData.success) location.reload();
      })
      .catch((error) => {
        console.error("Error publishing product:", error);
      });
  }

  backBtn() {
    const url = "../../view/product_details/index.php";
    const currentUrl = new URL(window.location.href);
    const destinationUrl = new URL(url, currentUrl);

    const sku = currentUrl.searchParams.get("sku");
    const skuVariation = currentUrl.searchParams.get("sku_variation");

    if (sku) destinationUrl.searchParams.set("sku", sku);
    if (skuVariation) destinationUrl.searchParams.set("sku_variation", skuVariation);

    window.location.assign(destinationUrl);
  }

  getDataProduct() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    if (!sku) {
      console.warn("No SKU in URL");
      return;
    }

    const url = "../../controller/order/product.php";

    const data = {
      action: "get_preview_product_details",
      sku: sku
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network error.");
        return response.text();
      })
      .then((text) => {
        const json = JSON.parse(text);

        if (!Array.isArray(json)) {
          throw new Error("Invalid product preview response.");
        }

        const companyName = json.find((row) => row.company_name)?.company_name ?? "";
        const categoryName = json.find((row) => row.category_name)?.category_name ?? "";
        const groupName = json.find((row) => row.group_name)?.group_name ?? "";
        const defaultVariationId = json.find((row) => row.default_variation_id)?.default_variation_id ?? "";
        const productDetails = json.find((row) => row.product_details)?.product_details ?? {};

        const productName = productDetails.product_name ?? "";
        const descriptiveTagline = productDetails.descriptive_tagline ?? "";
        const description = productDetails.description ?? "";
        const status = String(productDetails.status ?? "");
        const is_approved = String(productDetails.is_approved ?? "");

        const publishBtn = document.getElementById("btn_publish");
        const isApproved = Number(is_approved) === 1;

        if (publishBtn) {
          publishBtn.style.display = isApproved ? "none" : "";
        }

        // if (publishBtn) publishBtn.style.display = status === "2" ? "none" : "";

        this.renderBreadcrumb(categoryName, groupName);
        this.renderSectionLabel(categoryName);
        this.renderProductTitle(productName);
        this.renderBrandName(companyName);
        this.renderTagline(descriptiveTagline);
        this.renderDescription(description);

        this.variations.reset();
        this.deleteGroupsContent();
        this.variations.fetchChildVariationsById(defaultVariationId);
      })
      .catch((error) => {
        console.error("Error fetching preview:", error);
      });
  }

  deleteGroupsContent() {
    const groups = [
      document.getElementById("wrap-variations-group"),
      document.getElementById("wrap-images-group"),
      document.getElementById("wrap-items-group"),
      document.getElementById("wrap-prices-group"),
      document.getElementById("wrap-artworks-group")
    ];

    groups.forEach((group) => {
      if (group) group.innerHTML = "";
    });

    window.previewGallery?.clearGallery?.();
  }

  renderBreadcrumb(categoryName, groupName) {
    const breadcrumbs = document.getElementById("sp_breadcrumbs");

    if (!breadcrumbs) return;

    breadcrumbs.innerHTML = `
      <li><a href="#">${this.escapeHtml(categoryName)}</a></li>
      <li><a href="#">${this.escapeHtml(groupName)}</a></li>
    `;
  }

  renderSectionLabel(categoryName) {
    const category = document.getElementById("sp_category");

    if (category) category.textContent = categoryName || "";
  }

  renderProductTitle(productName) {
    const title = document.getElementById("sp-title");

    if (title) title.textContent = productName || "";
  }

  renderBrandName(companyName) {
    const brand = document.getElementById("sp-brand");

    if (brand) brand.textContent = companyName || "";
  }

  renderTagline(descriptiveTagline) {
    const subtitle = document.getElementById("sp_subtitle");

    if (subtitle) subtitle.textContent = descriptiveTagline || "";
  }

  renderDescription(description) {
    const descriptionElement = document.getElementById("sp_desc");

    if (descriptionElement) descriptionElement.textContent = description || "";
  }

  selectVariation(domId = "", automatic = false) {
    return this.variations.selectVariation(domId, automatic);
  }

  setSelectVariation(domId) {
    this.variations.setSelectVariation(domId);
  }

  getSelectVariation() {
    return this.variations.getSelectVariation();
  }

  getSelectedVariationId() {
    return this.variations.getSelectedVariationId();
  }

  getShouldDeleteItems() {
    return this.variations.getShouldDeleteItems();
  }

  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

let previewLogic = null;
let variations = null;

function createPreviewLogic() {
  previewLogic = new PreviewLogic();
  variations = previewLogic.variations;

  window.previewLogic = previewLogic;
  window.variations = variations;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createPreviewLogic);
} else {
  createPreviewLogic();
}
