class PreviewLogic {
  constructor() {
    this.variationSelected = null;
    this.maxQuantity = null;
    this.shouldDeleteItems = false;
    this.priceSelected = null;
    this.loadedVariationIds = new Set();

    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.start());
      return;
    }

    this.start();
  }

  start() {
    this.bindMainButtons();
    this.bindVariationEvents();
    this.getDataProduct();
  }

  bindMainButtons() {
    const backButton = document.getElementById("btn_back_edit");
    const publishButton = document.getElementById("btn_publish");

    if (backButton && backButton.dataset.bound !== "1") {
      backButton.dataset.bound = "1";
      backButton.addEventListener("click", () => this.backBtn());
    }

    if (publishButton && publishButton.dataset.bound !== "1") {
      publishButton.dataset.bound = "1";
      publishButton.addEventListener("click", () => this.publishBtn());
    }
  }

  bindVariationEvents() {
    const parent = document.getElementById("wrap-variations-group");

    if (!parent || parent.dataset.variationBound === "1") {
      return;
    }

    parent.dataset.variationBound = "1";

    parent.addEventListener("click", (event) => {
      const option = event.target.closest(".var-option[id^='variation_id_']");

      if (!option || !parent.contains(option)) {
        return;
      }

      this.SelectVariation(option.id);
    });
  }

  updateVariationHeader(group, selectedText) {
    if (!group) {
      return;
    }

    const selectedLabel = group.querySelector(".js-selected-variation-label");
    const summaryPill = group.querySelector(".variation-summary-pill");

    if (selectedLabel) {
      selectedLabel.textContent = selectedText || "Select option";
    }

    if (summaryPill) {
      summaryPill.textContent = selectedText || "Select an option";
    }
  }

  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  buildControllerUrl(path) {
    return new URL(path, window.location.href).toString();
  }

  async postJson(url, data) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(responseText || "Network error.");
    }

    try {
      return JSON.parse(responseText);
    } catch (error) {
      throw new Error("Invalid JSON response.");
    }
  }

  async publishBtn() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    if (!sku) {
      alert("No product SKU was found.");
      return;
    }

    const url = this.buildControllerUrl("../../controller/products/product.php");

    try {
      const json = await this.postJson(url, {
        action: "publish_product",
        sku: sku
      });

      if (json.success) {
        alert(json.message || "The product was published successfully.");
        window.location.reload();
        return;
      }

      alert(json.error || json.message || "The product could not be published.");
    } catch (error) {
      console.error("Error publishing product:", error);
      alert(error.message || "The product could not be published.");
    }
  }

  backBtn() {
    const currentUrl = new URL(window.location.href);
    const destinationUrl = new URL("../../view/product_details/index.php", currentUrl);

    const sku = currentUrl.searchParams.get("sku");
    const skuVariation = currentUrl.searchParams.get("sku_variation");

    if (sku) {
      destinationUrl.searchParams.set("sku", sku);
    }

    if (skuVariation) {
      destinationUrl.searchParams.set("sku_variation", skuVariation);
    }

    window.location.assign(destinationUrl);
  }

  async getDataProduct() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    if (!sku) {
      console.warn("No SKU in URL.");
      return;
    }

    const url = this.buildControllerUrl("../../controller/order/product.php");

    try {
      const json = await this.postJson(url, {
        action: "get_preview_product_details",
        sku: sku
      });

      if (!Array.isArray(json)) {
        throw new Error("Invalid product data.");
      }

      const companyName = json.find((item) => item.company_name)?.company_name ?? "";
      const categoryName = json.find((item) => item.category_name)?.category_name ?? "";
      const groupName = json.find((item) => item.group_name)?.group_name ?? "";
      const defaultVariationId = json.find((item) => item.default_variation_id)?.default_variation_id ?? "";
      const productDetails = json.find((item) => item.product_details)?.product_details ?? {};

      const productName = productDetails.product_name ?? "";
      const descriptiveTagline = productDetails.descriptive_tagline ?? "";
      const description = productDetails.description ?? "";
      const status = String(productDetails.status ?? "");

      const publishButton = document.getElementById("btn_publish");

      if (publishButton) {
        publishButton.hidden = status === "2";
      }

      this.renderBreadcrumb(categoryName, groupName);
      this.renderSectionLabel(categoryName);
      this.renderProductTitle(productName);
      this.renderBrandName(companyName);
      this.renderTagline(descriptiveTagline);
      this.renderDescription(description);

      this.deleteGroupsContent();
      await this.fetchChildVariationsById(defaultVariationId);
    } catch (error) {
      console.error("Error fetching preview:", error);
    }
  }

  async fetchChildVariationsById(variationId) {
    const cleanVariationId = String(variationId ?? "").trim();

    if (!cleanVariationId) {
      console.warn("No variation ID was provided.");
      return;
    }

    if (this.loadedVariationIds.has(cleanVariationId)) {
      return;
    }

    this.loadedVariationIds.add(cleanVariationId);

    const url = this.buildControllerUrl("../../controller/order/product.php");

    try {
      const json = await this.postJson(url, {
        action: "get_variation_children_by_id",
        variation_id: cleanVariationId
      });

      const variationTypes = Array.isArray(json.variationTypes) ? json.variationTypes : [];
      const childVariations = Array.isArray(json.childVariations) ? json.childVariations : [];
      const variationTypesForDelete = Array.isArray(json.variationTypesForDelete) ? json.variationTypesForDelete : [];
      const currentVariationData = json.currentVariationData ?? {};

      this.shouldDeleteItems = variationTypesForDelete.length > 0;

      this.organizeCurrentVariation(currentVariationData);

      if (childVariations.length > 0 && variationTypes.length > 0) {
        const firstChildIds = this.organizeVariationsForRender(childVariations, variationTypes);

        for (const firstChildId of firstChildIds) {
          await this.fetchChildVariationsById(firstChildId);
        }

        return;
      }

      this.updateVariationPrices();
      this.selectFirstPriceButton();
    } catch (error) {
      this.loadedVariationIds.delete(cleanVariationId);
      console.error("Error fetching variation data:", error);
    }
  }

  selectFirstPriceButton() {
    window.setTimeout(() => {
      const firstPriceButton = document.querySelector("#wrap-prices-group .js-price-option");

      if (!firstPriceButton) {
        return;
      }

      const selectedButton = document.querySelector("#wrap-prices-group .js-price-option.is-selected");

      if (selectedButton) {
        return;
      }

      const scope = firstPriceButton.closest(".wrap-price") || document.getElementById("wrap-prices-group");

      this.selectPriceButton(firstPriceButton, scope);
      this.updateProductSummaryBox(firstPriceButton.dataset.minQuantity, firstPriceButton.value);
    }, 300);
  }

  deleteGroupsContent() {
    const selectors = [
      "#wrap-variations-group",
      "#wrap-images-group",
      "#wrap-items-group",
      "#wrap-prices-group",
      "#wrap-artworks-group"
    ];

    selectors.forEach((selector) => {
      const element = document.querySelector(selector);

      if (element) {
        element.innerHTML = "";
      }
    });

    this.loadedVariationIds.clear();
    window.previewGallery?.clearGallery?.();
  }

  renderBreadcrumb(categoryName, groupName) {
    const breadcrumbs = document.getElementById("sp_breadcrumbs");

    if (!breadcrumbs) {
      return;
    }

    breadcrumbs.innerHTML = `
      <li><a href="#">${this.escapeHtml(categoryName)}</a></li>
      <li><a href="#">${this.escapeHtml(groupName)}</a></li>
    `;
  }

  renderSectionLabel(categoryName) {
    const category = document.getElementById("sp_category");

    if (category) {
      category.textContent = categoryName || "";
    }
  }

  renderProductTitle(productName) {
    const title = document.getElementById("sp-title");

    if (title) {
      title.textContent = productName || "";
    }
  }

  renderBrandName(companyName) {
    const brand = document.getElementById("sp-brand");

    if (brand) {
      brand.textContent = companyName || "";
    }
  }

  renderTagline(descriptiveTagline) {
    const subtitle = document.getElementById("sp_subtitle");

    if (subtitle) {
      subtitle.textContent = descriptiveTagline || "";
    }
  }

  renderDescription(description) {
    const descriptionElement = document.getElementById("sp_desc");

    if (descriptionElement) {
      descriptionElement.textContent = description || "";
    }
  }

  organizeCurrentVariation(currentVariationData = {}) {
    try {
      const variation = currentVariationData.variation ?? null;

      if (!variation) {
        return false;
      }

      const variationId = String(variation.variation_id ?? "").trim();
      const typeId = String(variation.type_id ?? "null").trim();
      const typeName = String(variation.type_name ?? "").trim();

      if (!variationId || !typeName) {
        return false;
      }

      this.setSelectVariation(`variation_id_${variationId}`);

      const typeVariation = {
        type_id: typeId,
        type_name: typeName
      };

      const images = Array.isArray(currentVariationData.images)
        ? currentVariationData.images.map((image) => ({ ...image, variation_id: variationId }))
        : [];

      const items = Array.isArray(currentVariationData.items)
        ? currentVariationData.items.map((item) => ({ ...item, variation_id: variationId }))
        : [];

      const prices = Array.isArray(currentVariationData.prices)
        ? currentVariationData.prices.map((price) => ({
            ...price,
            variation_id: variationId,
            price_display_mode: variation.price_display_mode ?? null
          }))
        : [];

      const artworks = [];
      const artwork = currentVariationData.artwork ?? null;

      if (artwork) {
        const pdf = String(artwork.pdf_artwork ?? "").trim();
        const name = String(artwork.name_pdf_artwork ?? "").trim();

        if (pdf || name) {
          artworks.push({ ...artwork, variation_id: variationId });
        }
      }

      this.removeTypeContent(typeId);

      if (images.length > 0) {
        this.renderImages(images, typeVariation);
      }

      if (items.length > 0) {
        this.renderItems(items, typeVariation);
      }

      if (prices.length > 0) {
        this.renderPrices(prices, typeVariation);
      }

      if (artworks.length > 0) {
        this.renderArtwork(artworks, typeVariation);
      }

      return true;
    } catch (error) {
      console.error("Error organising current variation:", error);
      return false;
    }
  }

  removeTypeContent(typeId) {
    const ids = [
      `wrap-items-${typeId}`,
      `wrap-images-${typeId}`,
      `wrap-price-${typeId}`,
      `wrap-artworks-${typeId}`
    ];

    ids.forEach((id) => {
      document.getElementById(id)?.remove();
    });
  }

  organizeVariationsForRender(childVariations = [], variationTypes = []) {
    const firstChildIds = [];

    if (!childVariations.length || !variationTypes.length) {
      return firstChildIds;
    }

    for (const typeVariation of variationTypes) {
      const typeName = String(typeVariation.type_name ?? "").trim();

      if (!typeName) {
        continue;
      }

      const variations = [];
      const items = [];
      const images = [];
      const prices = [];
      const artworks = [];

      for (const row of childVariations) {
        const variation = row.variation;

        if (!variation || String(variation.type_name ?? "").trim() !== typeName) {
          continue;
        }

        variations.push(variation);

        if (Array.isArray(row.items)) {
          items.push(...row.items.map((item) => ({
            ...item,
            variation_id: variation.variation_id
          })));
        }

        if (Array.isArray(row.images)) {
          images.push(...row.images.map((image) => ({
            ...image,
            variation_id: variation.variation_id
          })));
        }

        if (Array.isArray(row.prices)) {
          prices.push(...row.prices.map((price) => ({
            ...price,
            variation_id: variation.variation_id,
            price_display_mode: variation.price_display_mode ?? null
          })));
        }

        const artwork = row.artwork ?? null;

        if (artwork) {
          const pdf = String(artwork.pdf_artwork ?? "").trim();
          const name = String(artwork.name_pdf_artwork ?? "").trim();

          if (pdf || name) {
            artworks.push({
              ...artwork,
              variation_id: variation.variation_id
            });
          }
        }
      }

      if (!variations.length) {
        continue;
      }

      const renderedVariationId = this.renderVariations(variations, typeVariation);

      if (!renderedVariationId) {
        continue;
      }

      firstChildIds.push(renderedVariationId);
      this.setSelectVariation(`variation_id_${renderedVariationId}`);

      if (images.length > 0) {
        this.renderImages(images, typeVariation);
      }

      if (items.length > 0) {
        this.renderItems(items, typeVariation);
      }

      if (prices.length > 0) {
        this.renderPrices(prices, typeVariation);
      }

      if (artworks.length > 0) {
        this.renderArtwork(artworks, typeVariation);
      }
    }

    return firstChildIds;
  }

  renderVariations(childVariations = [], typeVariation = {}) {
    try {
      const parent = document.getElementById("wrap-variations-group");

      if (!parent || !childVariations.length) {
        return null;
      }

      const typeId = String(typeVariation.type_id ?? "null");
      const typeName = String(typeVariation.type_name ?? "").trim();
      const labelId = `variation-label-${typeId}`;

      if (!typeName) {
        return null;
      }

      parent.querySelector(`.wrap-variations[data-type-id="${CSS.escape(typeId)}"]`)?.remove();

      const firstVariation = childVariations[0];
      const firstVariationId = String(firstVariation.variation_id ?? "").trim();
      const firstLabel = String(firstVariation.name ?? "").trim();

      const buttonsHtml = childVariations.map((variation, index) => {
        const variationId = String(variation.variation_id ?? "").trim();
        const label = String(variation.name ?? "").trim();
        const rawImage = String(variation.image ?? "").trim();
        const imageSource = this.buildMediaSource(rawImage, "../../view/preview_porduct/img/icon_product.png");
        const selectedClass = index === 0 ? " is-selected" : "";
        const pressed = index === 0 ? "true" : "false";

        return `
          <button type="button" class="var-option js-scale-in${selectedClass}" id="variation_id_${this.escapeHtml(variationId)}" data-variation-label="${this.escapeHtml(label)}" aria-pressed="${pressed}">
            <img class="var-thumb" src="${this.escapeHtml(imageSource)}" alt="${this.escapeHtml(label || "Variation option")}">
            <span class="opt-copy">
              <span class="opt-main">${this.escapeHtml(label)}</span>
            </span>
          </button>
        `;
      }).join("");

      const groupHtml = `
        <div class="wrap-variations" data-type-id="${this.escapeHtml(typeId)}" aria-labelledby="${labelId}">
          <div class="var-label">
            <span class="var-name">${this.escapeHtml(typeName)}</span>
            <strong id="${labelId}" class="js-selected-variation-label">${this.escapeHtml(firstLabel || "Select option")}</strong>
          </div>

          <div class="var-options">${buttonsHtml}</div>
        </div>
      `;

      parent.insertAdjacentHTML("beforeend", groupHtml);

      return firstVariationId || null;
    } catch (error) {
      console.error("Error rendering variations:", error);
      return null;
    }
  }

  SelectVariation(domId = "") {
    const button = document.getElementById(domId);

    if (!button) {
      return false;
    }

    const group = button.closest(".wrap-variations");

    if (!group) {
      return false;
    }

    group.querySelectorAll(".var-option.is-selected").forEach((item) => {
      item.classList.remove("is-selected");
      item.setAttribute("aria-pressed", "false");
    });

    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");

    const selectedText = button.dataset.variationLabel || button.querySelector(".opt-main")?.textContent?.trim() || "";

    this.updateVariationHeader(group, selectedText);
    this.setSelectVariation(domId);

    const variationId = String(domId).replace(/^variation_id_/, "").trim();

    if (!variationId) {
      return false;
    }

    this.removeVariationGroupsAfter(group);
    this.fetchChildVariationsById(variationId);

    return true;
  }

  removeVariationGroupsAfter(currentGroup) {
    let nextGroup = currentGroup.nextElementSibling;

    while (nextGroup) {
      const groupToRemove = nextGroup;
      nextGroup = nextGroup.nextElementSibling;

      if (groupToRemove.classList.contains("wrap-variations")) {
        groupToRemove.remove();
      }
    }
  }

  setSelectVariation(domId) {
    this.variationSelected = domId;
  }

  getSelectVariation() {
    return this.variationSelected;
  }

  getSelectedVariationId() {
    return Number(String(this.getSelectVariation() ?? "").replace("variation_id_", ""));
  }

  buildMediaSource(rawPath, fallback = "") {
    const path = String(rawPath ?? "").trim().replace(/^\/+/, "");

    if (!path) {
      return fallback;
    }

    if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) {
      return path;
    }

    if (path.startsWith("controller/")) {
      return `../../${path}`;
    }

    return `../../controller/${path}`;
  }

  getOrCreateWrapper(parentId, wrapperId, className, typeId) {
    const parent = document.getElementById(parentId);

    if (!parent) {
      return null;
    }

    let wrapper = document.getElementById(wrapperId);

    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = wrapperId;
      wrapper.className = className;
      wrapper.dataset.typeId = typeId;
      parent.appendChild(wrapper);
    }

    wrapper.innerHTML = "";

    return wrapper;
  }

  renderItems(items = [], typeVariation = {}) {
    const variationId = this.getSelectedVariationId();
    const typeId = String(typeVariation.type_id ?? "null");
    const wrapper = this.getOrCreateWrapper("wrap-items-group", `wrap-items-${typeId}`, "wrap-items", typeId);

    if (!wrapper) {
      return;
    }

    items.forEach((itemData) => {
      if (Number(itemData.variation_id) !== variationId) {
        return;
      }

      const title = String(itemData.name ?? "").trim();
      const description = String(itemData.description ?? "").trim();

      if (!title && !description) {
        return;
      }

      const item = document.createElement("div");
      item.className = "sp-item";
      item.innerHTML = `
        <strong class="sp-item-subtitle">${this.escapeHtml(title)}</strong>
        <span>${this.escapeHtml(description)}</span>
      `;

      wrapper.appendChild(item);
    });
  }

  renderImages(images = [], typeVariation = {}) {
    const variationId = this.getSelectedVariationId();
    const typeId = String(typeVariation.type_id ?? "null");
    const wrapper = this.getOrCreateWrapper("wrap-images-group", `wrap-images-${typeId}`, "wrap-images", typeId);

    if (!wrapper) {
      return;
    }

    images.forEach((imageData, index) => {
      if (Number(imageData.variation_id) !== variationId) {
        return;
      }

      const source = this.buildMediaSource(imageData.link);

      if (!source) {
        return;
      }

      const image = document.createElement("img");
      image.className = "preview-media";
      image.src = source;
      image.alt = `Preview image ${index + 1}`;
      image.loading = "lazy";
      image.decoding = "async";

      wrapper.appendChild(image);
    });
  }

  renderPrices(prices = [], typeVariation = {}) {
    const variationId = this.getSelectedVariationId();
    const typeId = String(typeVariation.type_id ?? "null");
    const wrapperId = `wrap-price-${typeId}`;
    const wrapper = this.getOrCreateWrapper("wrap-prices-group", wrapperId, "wrap-price", typeId);

    if (!wrapper) {
      return;
    }

    prices.forEach((priceData) => {
      if (Number(priceData.variation_id) !== variationId) {
        return;
      }

      if (String(priceData.price_display_mode ?? "").trim() !== "prices") {
        return;
      }

      const maxQuantity = String(priceData.max_quantity ?? "").trim();

      if (!maxQuantity) {
        return;
      }

      const button = document.createElement("button");

      button.type = "button";
      button.className = "var-option js-scale-in js-price-option";
      button.value = String(priceData.price ?? "");
      button.dataset.priceId = String(priceData.price_id ?? "");
      button.dataset.minQuantity = String(priceData.min_quantity ?? "");
      button.dataset.maxQuantity = maxQuantity;
      button.dataset.price = String(priceData.price ?? "");
      button.dataset.variationId = String(priceData.variation_id ?? "");
      button.setAttribute("aria-pressed", "false");

      button.innerHTML = `<span class="opt-main">${this.escapeHtml(priceData.min_quantity ?? "")}</span>`;

      wrapper.appendChild(button);
    });

    this.bindPriceButtons(`#${wrapperId}`);
  }

  bindPriceButtons(scopeSelector) {
    const scope = document.querySelector(scopeSelector);

    if (!scope) {
      return false;
    }

    const buttons = Array.from(scope.querySelectorAll(".js-price-option"));

    if (!buttons.length) {
      return false;
    }

    buttons.forEach((button) => {
      if (button.dataset.bound === "1") {
        return;
      }

      button.dataset.bound = "1";

      button.addEventListener("click", () => {
        if (this.selectPriceButton(button, scope)) {
          this.updateProductSummaryBox(button.dataset.minQuantity, button.value);
        }
      });
    });

    if (!document.querySelector("#wrap-prices-group .js-price-option.is-selected")) {
      if (this.selectPriceButton(buttons[0], scope)) {
        window.setTimeout(() => {
          this.updateProductSummaryBox(buttons[0].dataset.minQuantity, buttons[0].value);
        }, 300);
      }
    }

    return true;
  }

  updateProductSummaryBox(quantity, price) {
    const selectedOptions = document.querySelectorAll(".var-option.is-selected");
    let totalExtraPrice = 0;

    selectedOptions.forEach((option) => {
      const extraPrice = option.querySelector(".opt-price-extra");

      if (!extraPrice) {
        return;
      }

      const value = Number(extraPrice.textContent.replace("+", "").replace("p/u", "").trim());

      if (Number.isFinite(value)) {
        totalExtraPrice += value;
      }
    });

    const numericQuantity = Number(String(quantity).replace(/,/g, "")) || 0;
    const numericPrice = Number(price) || 0;
    const unitTotal = numericPrice * numericQuantity;
    const extrasTotal = totalExtraPrice * numericQuantity;
    const finalTotal = unitTotal + extrasTotal;
    const extrasQuantity = totalExtraPrice > 0 ? numericQuantity : 0;

    this.setText("bb_unit", `£${this.formatPrice(numericPrice)}`);
    this.setText("bb_unit_quantity", numericQuantity);
    this.setText("bb_unit_total", `£${this.formatPrice(unitTotal)}`);
    this.setText("bb_extra_unit", `£${this.formatPrice(totalExtraPrice)}`);
    this.setText("bb_extra_quantity", extrasQuantity);
    this.setText("bb_extra_total", `£${this.formatPrice(extrasTotal)}`);
    this.setText("bb_total", `£${this.formatPrice(finalTotal)}`);
    this.setText("var_label_quantity", `${numericQuantity} units`);
    this.setText("sp_unit_hint", `per ${numericQuantity} units`);

    const priceElement = document.getElementById("sp_price");

    if (priceElement) {
      const [major, minor] = this.formatPrice(numericPrice).split(".");
      priceElement.innerHTML = `${major}<span class="sp-price-minor">.${minor}</span>`;
    }
  }

  setText(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
      element.textContent = value;
    }
  }

  formatPrice(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00";
  }

  selectPriceButton(button, scope = null) {
    if (!button) {
      return false;
    }

    const container = scope || button.closest(".wrap-price");

    if (!container) {
      return false;
    }

    document.querySelectorAll("#wrap-prices-group .js-price-option").forEach((item) => {
      item.classList.remove("is-selected");
      item.setAttribute("aria-pressed", "false");
    });

    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");

    const payload = {
      price_id: String(button.dataset.priceId ?? ""),
      min_quantity: String(button.dataset.minQuantity ?? ""),
      max_quantity: String(button.dataset.maxQuantity ?? ""),
      price: String(button.dataset.price ?? ""),
      value: String(button.value ?? "")
    };

    this.setSelectedPrice(payload);
    this.setMaxQuantity(payload.max_quantity);
    this.onPriceSelected(payload, button);
    this.updateVariationPrices();

    return true;
  }

  setSelectedPrice(payload = null) {
    this.priceSelected = payload;
  }

  getSelectedPrice() {
    return this.priceSelected;
  }

  setMaxQuantity(maxQuantity) {
    this.maxQuantity = maxQuantity;
  }

  getMaxQuantity() {
    return this.maxQuantity;
  }

  onPriceSelected(payload, button = null) {
    return { payload, button };
  }

  async updateVariationPrices() {
    const variationButtons = document.querySelectorAll("#wrap-variations-group .var-option[id^='variation_id_']");

    const ids = Array.from(variationButtons)
      .map((button) => Number(button.id.replace("variation_id_", "")))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (!ids.length || !this.getMaxQuantity()) {
      return;
    }

    const url = this.buildControllerUrl("../../controller/order/product.php");

    try {
      const json = await this.postJson(url, {
        action: "get_variation_prices",
        ids: ids,
        max_quantity: this.getMaxQuantity()
      });

      this.drawExtraVariationPrices(json.prices || []);
    } catch (error) {
      console.error("Error fetching variation prices:", error);
    }
  }

  drawExtraVariationPrices(prices) {
    if (!Array.isArray(prices)) {
      return;
    }

    document.querySelectorAll("#wrap-variations-group .opt-price-extra").forEach((element) => {
      element.remove();
    });

    prices.forEach((priceData) => {
      const button = document.getElementById(`variation_id_${priceData.variation_id}`);

      if (!button || priceData.price?.price == null) {
        return;
      }

      const priceExtra = document.createElement("span");
      priceExtra.className = "opt-price-extra";
      priceExtra.textContent = `+${priceData.price.price} p/u`;

      const copy = button.querySelector(".opt-copy") || button;
      copy.appendChild(priceExtra);
    });
  }

  renderArtwork(artworks = [], typeVariation = {}) {
    const variationId = this.getSelectedVariationId();
    const typeId = String(typeVariation.type_id ?? "null");
    const wrapper = this.getOrCreateWrapper("wrap-artworks-group", `wrap-artworks-${typeId}`, "wrap-artworks", typeId);

    if (!wrapper) {
      return;
    }

    artworks.forEach((artworkData) => {
      if (Number(artworkData.variation_id) !== variationId) {
        return;
      }

      const name = String(artworkData.name_pdf_artwork ?? "").trim();
      const pdfSource = this.buildMediaSource(artworkData.pdf_artwork);

      if (!name && !pdfSource) {
        return;
      }

      const artwork = document.createElement("div");
      artwork.className = "sp-artwork";

      if (name) {
        const title = document.createElement("strong");
        title.className = "sp-artwork-name";
        title.textContent = name;
        artwork.appendChild(title);
      }

      if (pdfSource) {
        const link = document.createElement("a");
        link.className = "btn btn-artwork";
        link.href = pdfSource;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = name || "Open PDF";
        artwork.appendChild(link);
      }

      wrapper.appendChild(artwork);
    });
  }
}

const previewLogic = new PreviewLogic();
window.previewLogic = previewLogic;
