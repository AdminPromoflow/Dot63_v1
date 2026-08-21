class ClassProductList {
  constructor() {
    this.catalogProducts = [];
    this.catalog = null;
    this.groupProducts = [];
    this.selectedFilters = {};
    this.searchTerm = "";

    this.filterLabels = {
      theme: "Theme",
      material: "Material",
      width: "Width",
      print_technique: "Print Technique",
      printed_sides: "Printed Sides",
      colour: "Colour",
    };

    this.elements = {
      catalog: document.getElementById("super_lanyard_catalog"),
      standard: document.getElementById("standard_product_list"),
      standardList: document.getElementById("standard_products"),
      grid: document.getElementById("product_list"),
      footer: document.getElementById("product_list_footer"),
      back: document.getElementById("btn_back_products"),
      choose: document.getElementById("choose_product"),
      cancelChoose: document.getElementById("cancel_choose_product"),
      next: document.getElementById("next_product"),
      title: document.getElementById("sl-title"),
      subtitle: document.getElementById("sl-subtitle"),
      visibleCount: document.getElementById("sl-visible-count"),
      visibleLabel: document.getElementById("sl-visible-label"),
      liveStatus: document.getElementById("sl-live-status"),
      search: document.getElementById("sl-search-input"),
      clearSearch: document.getElementById("sl-clear-search"),
      filterToggle: document.getElementById("sl-filter-toggle"),
      filterCount: document.getElementById("sl-filter-count"),
      filterPanel: document.getElementById("sl-filter-panel"),
      filterBackdrop: document.getElementById("sl-filter-backdrop"),
      filterClose: document.getElementById("sl-filter-close"),
      filterGroups: document.getElementById("sl-filter-groups"),
      clearFilters: document.getElementById("sl-clear-filters"),
      showResults: document.getElementById("sl-show-results"),
      activeRow: document.getElementById("sl-active-row"),
      activeChips: document.getElementById("sl-active-chips"),
    };

    this.bindEvents();

    const initialise = () => {
      if (window.headerAddProduct) {
        window.headerAddProduct.setCurrentHeader("Products");
      }
      if (!window.location.hash) {
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
      }
      this.getProducts();
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initialise, { once: true });
    } else {
      initialise();
    }
  }

  bindEvents() {
    this.elements.back?.addEventListener("click", () => {
      window.headerAddProduct?.goNext("../../view/group/index.php");
    });

    this.elements.next?.addEventListener("click", () => {
      window.headerAddProduct?.goNext("../../view/product_details/index.php");
    });

    this.elements.choose?.addEventListener("click", () => this.chooseProduct());
    this.elements.cancelChoose?.addEventListener("click", () => this.cancelChooseProduct());

    this.elements.search?.addEventListener("input", (event) => {
      this.searchTerm = event.target.value.trim();
      this.elements.clearSearch.hidden = this.searchTerm === "";
      this.applyFilters();
    });

    this.elements.clearSearch?.addEventListener("click", () => {
      this.elements.search.value = "";
      this.searchTerm = "";
      this.elements.clearSearch.hidden = true;
      this.elements.search.focus();
      this.applyFilters();
    });

    this.elements.filterGroups?.addEventListener("change", (event) => {
      const input = event.target.closest("input[data-filter-key]");
      if (!input) return;

      const key = input.dataset.filterKey;
      const value = input.value;
      if (!this.selectedFilters[key]) this.selectedFilters[key] = new Set();

      if (input.checked) {
        this.selectedFilters[key].add(value);
      } else {
        this.selectedFilters[key].delete(value);
      }

      this.applyFilters();
    });

    this.elements.clearFilters?.addEventListener("click", () => this.clearAllFilters());
    this.elements.activeChips?.addEventListener("click", (event) => {
      const chip = event.target.closest("button[data-filter-key]");
      if (!chip) return;
      this.removeFilter(chip.dataset.filterKey, chip.dataset.filterValue);
    });

    this.elements.filterToggle?.addEventListener("click", () => this.openFilters());
    this.elements.filterClose?.addEventListener("click", () => this.closeFilters());
    this.elements.filterBackdrop?.addEventListener("click", () => this.closeFilters());
    this.elements.showResults?.addEventListener("click", () => this.closeFilters());

    this.elements.grid?.addEventListener("click", (event) => {
      const infoButton = event.target.closest('[data-action="toggle-configuration"]');
      if (infoButton) {
        const card = infoButton.closest(".sl-product-card");
        const shouldOpen = !card.classList.contains("is-expanded");
        this.closeConfigurationCards(card);
        card.classList.toggle("is-expanded", shouldOpen);
        infoButton.setAttribute("aria-expanded", String(shouldOpen));
        return;
      }

      const clearButton = event.target.closest('[data-action="clear-catalog"]');
      if (clearButton) {
        this.clearAllFilters(true);
        return;
      }

      const retryButton = event.target.closest('[data-action="retry-catalog"]');
      if (retryButton) this.getProducts();

      const productCard = event.target.closest(".sl-product-card[data-product-url]");
      if (productCard
          && !event.target.closest("a, button, .sl-configuration-popover")) {
        window.location.assign(productCard.dataset.productUrl);
      }
    });

    this.elements.grid?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target.closest("a, button")) return;

      const productCard = event.target.closest(".sl-product-card[data-product-url]");
      if (!productCard) return;

      event.preventDefault();
      window.location.assign(productCard.dataset.productUrl);
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".sl-product-card")) this.closeConfigurationCards();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      this.closeConfigurationCards();
      this.closeFilters();
    });
  }

  async getProducts() {
    const sku = new URLSearchParams(window.location.search).get("sku");
    this.renderLoading();

    const response = await this.makeRequest("../../controller/products/product.php", {
      action: "get_products_by_group",
      sku,
    });

    if (!response || !response.success) {
      this.showCatalogMode();
      this.renderState(
        "error",
        "We couldn't load the catalogue",
        "Check your connection and try again. Your filters have not been changed.",
        "Try again",
        "retry-catalog"
      );
      this.setVisibleCount(0);
      return;
    }

    this.groupProducts = Array.isArray(response.result) ? response.result : [];

    if (response.catalog_type === "super_lanyard" && response.catalog) {
      this.initialiseSuperLanyard(response.catalog);
      return;
    }

    this.showStandardMode();
  }

  initialiseSuperLanyard(catalog) {
    this.catalog = catalog;
    this.catalogProducts = Array.isArray(catalog.products) ? catalog.products : [];
    this.filterLabels = { ...this.filterLabels, ...(catalog.filter_labels || {}) };
    this.selectedFilters = Object.keys(this.filterLabels).reduce((filters, key) => {
      filters[key] = new Set();
      return filters;
    }, {});

    this.searchTerm = "";
    this.elements.search.value = "";
    this.elements.clearSearch.hidden = true;
    this.elements.title.textContent = catalog.title || "Super Lanyard";
    this.elements.subtitle.textContent = catalog.subtitle || "Explore every available configuration.";
    this.elements.search.disabled = false;
    this.elements.filterToggle.disabled = false;
    this.elements.clearFilters.disabled = true;

    this.renderFilterGroups(catalog.filter_options || {});
    this.showCatalogMode();
    this.applyFilters();
  }

  showCatalogMode() {
    this.elements.catalog.hidden = false;
    this.elements.standard.hidden = true;
    this.elements.footer?.classList.add("pl-footer--catalog");
    if (this.elements.choose) this.elements.choose.style.display = "none";
    if (this.elements.cancelChoose) this.elements.cancelChoose.style.display = "none";
  }

  showStandardMode() {
    this.elements.catalog.hidden = true;
    this.elements.standard.hidden = false;
    this.elements.footer?.classList.remove("pl-footer--catalog");
    if (this.elements.choose) this.elements.choose.style.display = "block";
    if (this.elements.cancelChoose) this.elements.cancelChoose.style.display = "none";

    const sku = new URLSearchParams(window.location.search).get("sku");
    const selected = this.groupProducts.find((product) => String(product.SKU) === String(sku));
    this.drawListProducts(selected ? [selected] : []);
  }

  renderFilterGroups(optionsByKey) {
    const fragment = document.createDocumentFragment();
    this.elements.filterGroups.replaceChildren();
    this.elements.filterGroups.setAttribute("aria-busy", "false");

    Object.entries(this.filterLabels).forEach(([key, label], index) => {
      const values = Array.isArray(optionsByKey[key]) ? optionsByKey[key] : [];
      if (values.length === 0) return;

      const fieldset = document.createElement("fieldset");
      fieldset.className = "sl-filter-group";

      const legend = document.createElement("legend");
      const labelText = document.createElement("span");
      labelText.textContent = label;
      const selectedCount = document.createElement("span");
      selectedCount.className = "sl-filter-group__count";
      selectedCount.dataset.selectedCount = key;
      selectedCount.hidden = true;
      legend.append(labelText, selectedCount);

      const options = document.createElement("div");
      options.className = "sl-filter-options";
      options.dataset.filterOptions = key;

      values.forEach((value, optionIndex) => {
        const optionLabel = document.createElement("label");
        optionLabel.className = "sl-filter-option";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = `filter_${key}[]`;
        input.value = value;
        input.dataset.filterKey = key;
        input.id = `sl-filter-${key}-${optionIndex}`;

        const mark = document.createElement("span");
        mark.className = "sl-filter-option__mark";
        mark.setAttribute("aria-hidden", "true");

        const text = document.createElement("span");
        text.className = "sl-filter-option__text";
        text.textContent = value;

        const available = document.createElement("span");
        available.className = "sl-filter-option__available";
        available.textContent = String(this.countProductsForOption(key, value));
        available.setAttribute("aria-label", `${available.textContent} configurations`);

        optionLabel.append(input, mark, text, available);
        options.appendChild(optionLabel);
      });

      fieldset.append(legend, options);
      if (index === Object.keys(this.filterLabels).length - 1) fieldset.classList.add("is-last");
      fragment.appendChild(fieldset);
    });

    this.elements.filterGroups.appendChild(fragment);
  }

  countProductsForOption(key, value) {
    return this.catalogProducts.filter((product) => product.configuration?.[key] === value).length;
  }

  applyFilters() {
    if (!this.catalog) return;

    const normalizedSearch = this.normalizeSearch(this.searchTerm);
    const filtered = this.catalogProducts.filter((product) => {
      const matchesFilters = Object.keys(this.filterLabels).every((key) => {
        const selections = this.selectedFilters[key];
        return !selections || selections.size === 0 || selections.has(product.configuration?.[key]);
      });

      if (!matchesFilters) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        product.title,
        product.sku,
        product.product_sku,
        ...Object.values(product.configuration || {}),
      ].join(" ");

      return this.normalizeSearch(haystack).includes(normalizedSearch);
    });

    this.renderActiveFilters();
    this.updateFilterControls();
    this.setVisibleCount(filtered.length);

    if (this.catalogProducts.length === 0) {
      this.renderState(
        "empty",
        "No configurations available yet",
        "Complete a Super Lanyard variation path to make it appear in this catalogue."
      );
      this.announce("No Super Lanyard configurations are available.");
      return;
    }

    if (filtered.length === 0) {
      this.renderState(
        "no-results",
        "No configurations match",
        "Try removing a filter or using a broader search term.",
        "Clear filters",
        "clear-catalog"
      );
      this.announce("No configurations match the current filters.");
      return;
    }

    this.renderProductCards(filtered);
    this.announce(`${filtered.length} ${filtered.length === 1 ? "configuration" : "configurations"} visible.`);
  }

  renderProductCards(products) {
    const fragment = document.createDocumentFragment();
    this.elements.grid.replaceChildren();
    this.elements.grid.setAttribute("aria-busy", "false");

    products.forEach((product) => fragment.appendChild(this.createProductCard(product)));
    this.elements.grid.appendChild(fragment);
  }

  createProductCard(product) {
    const card = document.createElement("article");
    card.className = "sl-product-card";
    card.setAttribute("role", "listitem");
    card.dataset.productId = String(product.id || "");
    card.dataset.productUrl = this.buildProductUrl(product);
    card.tabIndex = 0;
    card.setAttribute("aria-label", `Open ${product.title || "Super Lanyard"} with this combination selected`);

    const media = document.createElement("div");
    media.className = "sl-product-card__media";

    if (product.image) {
      const image = document.createElement("img");
      image.src = this.resolveAssetPath(product.image);
      image.alt = product.title || "Super Lanyard";
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => media.replaceChildren(this.createImagePlaceholder()));
      media.appendChild(image);
    } else {
      media.appendChild(this.createImagePlaceholder());
    }

    const badge = document.createElement("span");
    badge.className = "sl-product-badge";
    badge.textContent = "Super Lanyard";

    const popoverId = `sl-configuration-${String(product.id || "product").replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const infoButton = document.createElement("button");
    infoButton.className = "sl-info-button";
    infoButton.type = "button";
    infoButton.dataset.action = "toggle-configuration";
    infoButton.setAttribute("aria-label", `Show selected configuration for ${product.title}`);
    infoButton.setAttribute("aria-expanded", "false");
    infoButton.setAttribute("aria-controls", popoverId);
    infoButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v6M12 7.5h.01"></path></svg>';
    media.append(badge, infoButton);

    const content = document.createElement("div");
    content.className = "sl-product-card__content";

    const title = document.createElement("h3");
    title.textContent = product.title || "Super Lanyard";

    const summary = document.createElement("p");
    summary.className = "sl-product-card__summary";
    summary.textContent = [
      product.configuration?.theme,
      product.configuration?.material,
      product.configuration?.width,
    ].filter(Boolean).join(" · ");

    const footer = document.createElement("div");
    footer.className = "sl-product-card__footer";

    const price = document.createElement("p");
    price.className = "sl-product-price";
    if (Number.isFinite(Number(product.starting_price)) && Number(product.starting_price) > 0) {
      const prefix = document.createElement("span");
      prefix.textContent = "From";
      const amount = document.createElement("strong");
      amount.textContent = `£${this.formatPrice(Number(product.starting_price))}`;
      price.append(prefix, amount);
    } else {
      price.classList.add("sl-product-price--request");
      price.textContent = "Pricing available on request";
    }

    const viewLink = document.createElement("a");
    viewLink.className = "sl-product-link";
    viewLink.href = this.buildProductUrl(product);
    viewLink.setAttribute("aria-label", `View ${product.title}`);
    viewLink.innerHTML = '<span>View product</span><span aria-hidden="true">↗</span>';

    footer.append(price, viewLink);
    content.append(title, summary, footer);

    const popover = this.createConfigurationPopover(product, popoverId);
    card.append(media, content, popover);

    return card;
  }

  createImagePlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "sl-image-placeholder";
    placeholder.innerHTML = `
      <svg viewBox="0 0 180 120" aria-hidden="true">
        <path d="M49 16c21 1 36 12 47 29l24 39-20 13-25-41c-6-9-14-13-27-13Z" fill="currentColor" opacity=".95"/>
        <path d="M131 17c-21 1-36 12-47 29L60 85l20 13 25-41c6-9 14-13 27-13Z" fill="currentColor" opacity=".48"/>
        <rect x="76" y="83" width="29" height="24" rx="7" fill="#fff" stroke="currentColor" stroke-width="2"/>
      </svg>
      <span>Image coming soon</span>
    `;
    return placeholder;
  }

  createConfigurationPopover(product, id) {
    const popover = document.createElement("aside");
    popover.className = "sl-configuration-popover";
    popover.id = id;
    popover.setAttribute("aria-label", "Selected configuration");

    const heading = document.createElement("div");
    heading.className = "sl-configuration-popover__heading";
    const eyebrow = document.createElement("span");
    eyebrow.textContent = "Configuration";
    const title = document.createElement("strong");
    title.textContent = "Selected configuration";
    heading.append(eyebrow, title);

    const list = document.createElement("dl");
    Object.entries(this.filterLabels).forEach(([key, label]) => {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const detail = document.createElement("dd");
      term.textContent = label;
      detail.textContent = product.configuration?.[key] || "—";
      row.append(term, detail);
      list.appendChild(row);
    });

    if (product.sku) {
      const skuRow = document.createElement("div");
      skuRow.className = "sl-configuration-popover__sku";
      const term = document.createElement("dt");
      const detail = document.createElement("dd");
      term.textContent = "SKU";
      detail.textContent = product.sku;
      skuRow.append(term, detail);
      list.appendChild(skuRow);
    }

    const link = document.createElement("a");
    link.className = "sl-popover-link";
    link.href = this.buildProductUrl(product);
    link.textContent = "View product";
    link.setAttribute("aria-label", `View ${product.title}`);

    popover.append(heading, list, link);
    return popover;
  }

  buildProductUrl(product) {
    // Open the generated product in the supplier preview. sku_variation points
    // at the final Colour node, allowing the preview to restore the complete
    // Theme -> Material -> Width -> Print Technique -> Printed Sides -> Colour path.
    const url = new URL("../../view/preview_porduct/index.php", window.location.href);
    const productSku = product.product_sku || this.catalog?.current_sku || "";
    if (productSku) url.searchParams.set("sku", productSku);
    if (product.sku) url.searchParams.set("sku_variation", product.sku);
    return url.toString();
  }

  resolveAssetPath(rawPath = "") {
    const path = String(rawPath || "").trim().replace(/^\/+/, "");
    if (!path) return "";
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    if (path.startsWith("controller/")) return `../../${path}`;
    return `../../controller/${path}`;
  }

  formatPrice(value) {
    return new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(value);
  }

  renderActiveFilters() {
    const fragment = document.createDocumentFragment();
    let count = 0;

    Object.entries(this.filterLabels).forEach(([key, label]) => {
      const selections = this.selectedFilters[key] || new Set();
      selections.forEach((value) => {
        count += 1;
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "sl-active-chip";
        chip.dataset.filterKey = key;
        chip.dataset.filterValue = value;
        chip.setAttribute("aria-label", `Remove ${label}: ${value}`);

        const text = document.createElement("span");
        text.textContent = `${label}: ${value}`;
        const close = document.createElement("span");
        close.setAttribute("aria-hidden", "true");
        close.textContent = "×";
        chip.append(text, close);
        fragment.appendChild(chip);
      });
    });

    this.elements.activeChips.replaceChildren(fragment);
    this.elements.activeRow.hidden = count === 0;
    this.elements.filterCount.hidden = count === 0;
    this.elements.filterCount.textContent = String(count);
    this.elements.clearFilters.disabled = count === 0 && this.searchTerm === "";

    this.elements.filterGroups.querySelectorAll("[data-selected-count]").forEach((badge) => {
      const selected = this.selectedFilters[badge.dataset.selectedCount]?.size || 0;
      badge.hidden = selected === 0;
      badge.textContent = String(selected);
    });
  }

  updateFilterControls() {
    Object.entries(this.selectedFilters).forEach(([key, selections]) => {
      this.elements.filterGroups.querySelectorAll(`input[data-filter-key="${key}"]`).forEach((input) => {
        input.checked = selections.has(input.value);
      });
    });
  }

  removeFilter(key, value) {
    this.selectedFilters[key]?.delete(value);
    this.applyFilters();
  }

  clearAllFilters(includeSearch = false) {
    Object.values(this.selectedFilters).forEach((values) => values.clear());
    if (includeSearch || this.searchTerm !== "") {
      this.searchTerm = "";
      this.elements.search.value = "";
      this.elements.clearSearch.hidden = true;
    }
    this.applyFilters();
  }

  openFilters() {
    this.elements.filterPanel.classList.add("is-open");
    this.elements.filterBackdrop.classList.add("is-open");
    this.elements.filterToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("sl-filters-open");
    window.setTimeout(() => this.elements.filterClose.focus(), 50);
  }

  closeFilters() {
    const wasOpen = this.elements.filterPanel.classList.contains("is-open");
    this.elements.filterPanel.classList.remove("is-open");
    this.elements.filterBackdrop.classList.remove("is-open");
    this.elements.filterToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("sl-filters-open");
    if (wasOpen && window.innerWidth < 900) this.elements.filterToggle.focus();
  }

  closeConfigurationCards(except = null) {
    this.elements.grid.querySelectorAll(".sl-product-card.is-expanded").forEach((card) => {
      if (card === except) return;
      card.classList.remove("is-expanded");
      card.querySelector('[data-action="toggle-configuration"]')?.setAttribute("aria-expanded", "false");
    });
  }

  setVisibleCount(count) {
    this.elements.visibleCount.textContent = String(count);
    this.elements.visibleLabel.textContent = count === 1 ? "configuration" : "configurations";
  }

  announce(message) {
    this.elements.liveStatus.textContent = "";
    window.setTimeout(() => {
      this.elements.liveStatus.textContent = message;
    }, 30);
  }

  normalizeSearch(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("en-GB")
      .replace(/\s+/g, " ")
      .trim();
  }

  renderLoading() {
    if (!this.elements.catalog.hidden) {
      this.elements.grid.setAttribute("aria-busy", "true");
      this.elements.grid.innerHTML = Array.from({ length: 8 }, () => `
        <article class="sl-skeleton-card" aria-hidden="true">
          <span class="sl-skeleton-card__media"></span>
          <span class="sl-skeleton-card__line sl-skeleton-card__line--short"></span>
          <span class="sl-skeleton-card__line"></span>
          <span class="sl-skeleton-card__line"></span>
        </article>
      `).join("");
    }
  }

  renderState(type, title, copy, buttonText = "", action = "") {
    this.elements.grid.replaceChildren();
    this.elements.grid.setAttribute("aria-busy", "false");

    const state = document.createElement("div");
    state.className = `sl-state sl-state--${type}`;
    state.setAttribute("role", type === "error" ? "alert" : "status");

    const icon = document.createElement("span");
    icon.className = "sl-state__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = type === "error"
      ? '<svg viewBox="0 0 24 24"><path d="M12 8v5M12 17h.01"></path><circle cx="12" cy="12" r="9"></circle></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M4 7h16M7 12h10M10 17h4"></path></svg>';

    const heading = document.createElement("h3");
    heading.textContent = title;
    const description = document.createElement("p");
    description.textContent = copy;
    state.append(icon, heading, description);

    if (buttonText && action) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sl-state__button";
      button.dataset.action = action;
      button.textContent = buttonText;
      state.appendChild(button);
    }

    this.elements.grid.appendChild(state);
  }

  async chooseProduct() {
    this.elements.standardList.classList.remove("pl-products-list-single");
    this.elements.choose.style.display = "none";
    this.elements.cancelChoose.style.display = "block";
    this.drawListProducts(this.groupProducts);
  }

  async cancelChooseProduct() {
    const sku = new URLSearchParams(window.location.search).get("sku");
    const selected = this.groupProducts.find((product) => String(product.SKU) === String(sku));
    this.elements.standardList.classList.add("pl-products-list-single");
    this.elements.choose.style.display = "block";
    this.elements.cancelChoose.style.display = "none";
    this.drawListProducts(selected ? [selected] : []);
  }

  drawListProducts(data) {
    const productList = this.elements.standardList;
    const list = Array.isArray(data) ? data : [];
    productList.replaceChildren();

    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "pl-empty";
      empty.textContent = "No products found.";
      productList.appendChild(empty);
      return;
    }

    list.forEach((product, index) => {
      const row = document.createElement("button");
      row.type = "button";
      row.id = product.SKU || `product-${index}`;
      row.className = "pl-product";
      row.setAttribute("role", "listitem");
      row.addEventListener("click", () => this.selectProduct(product.SKU || ""));

      const number = document.createElement("span");
      number.className = "pl-product-number";
      number.textContent = String(index + 1);
      const name = document.createElement("span");
      name.className = "pl-product-name";
      name.textContent = product.name || "Unnamed product";
      row.append(number, name);
      productList.appendChild(row);
    });

    const sku = new URLSearchParams(window.location.search).get("sku");
    if (sku) this.drawBorderProduct(sku);
  }

  drawBorderProduct(selectedId) {
    const products = this.elements.standardList.querySelectorAll(".pl-product");
    products.forEach((product) => product.classList.remove("pl-product-selected"));
    const selected = Array.from(products).find((product) => product.id === String(selectedId || "").trim());
    if (!selected) return;
    selected.classList.add("pl-product-selected");
    selected.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
  }

  async selectProduct(selectedId) {
    const response = await this.makeRequest("../../controller/products/product.php", {
      action: "get_default_variation_by_sku",
      sku: selectedId,
    });

    if (!response?.success) return;
    const url = new URL("../../view/product_details/index.php", window.location.href);
    url.searchParams.set("sku", selectedId);
    url.searchParams.set("sku_variation", response.sku_variation || "");
    window.location.assign(url);
  }

  async makeRequest(url, data) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Network error.");
      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }
}

const classProductList = new ClassProductList();
