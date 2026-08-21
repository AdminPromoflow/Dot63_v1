class ProductsClass {
  constructor() {
    this.articles = document.getElementById("articles");
    this.categoryFilter = document.getElementById("category_filter");
    this.variationFilters = document.getElementById("variation-filters");
    this.productsData = [];
    this.variationRows = [];
    this.superLanyardProductIds = new Set();
    this.superLanyardAxisNames = new Set([
      "theme",
      "material",
      "width",
      "printtechnique",
      "printedsides",
      "colour",
      "color"
    ]);
    this.searchText = "";
    this.searchRequestController = null;

    this.bindSearchInput(document.getElementById("product-search"));
    this.bindSearchButton(document.getElementById("product-search-button"));

    this.categoryFilter?.addEventListener("change", () => this.applyFilters());
    this.variationFilters?.addEventListener("change", () => this.applyFilters());

    Promise.all([this.getCategoryFilters(), this.fetchGetProducts()])
      .then(() => {
        this.selectCategoriesForProducts(this.productsData);
        this.applyFilters();
      })
      .catch(error => console.error("Error loading product filters:", error));
  }

  async post(url, data, signal = null) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal
    });

    if (!response.ok) throw new Error("Network error.");
    return response.json();
  }

  async getCategoryFilters() {
    const result = await this.post("../../controller/filters/category_filters.php", {
      action: "get_categories_filter_and_their_groups",
      groups: []
    });

    if (!result.success || !this.categoryFilter) return;

    this.categoryFilter.innerHTML = "";
    (result.cateogories || [])
      .filter(category => Number(category.approved) === 1)
      .forEach(category => {
        const item = document.createElement("li");
        const label = document.createElement("label");
        const input = document.createElement("input");
        const text = document.createElement("span");

        input.type = "checkbox";
        input.name = "category[]";
        input.value = String(category.name || "");
        text.textContent = category.name || "Unnamed category";
        label.append(input, text);
        item.append(label);
        this.categoryFilter.append(item);
      });
  }

  async fetchGetProducts() {
    const result = await this.post("../../controller/products/product.php", {
      action: "get_products"
    });

    const initialProducts = this.getPublishedProducts(result.result);

    this.superLanyardProductIds = new Set(
      initialProducts
        .filter(product => this.isGeneratedSuperLanyard(product))
        .map(product => String(product.product_id))
    );

    await this.fetchTypeVariations(initialProducts.map(product => product.product_id));

    if (!this.searchText.trim()) {
      this.productsData = initialProducts;
    }

    return initialProducts;
  }

  selectCategoriesForProducts(products) {
    if (!this.categoryFilter) return;

    const productCategories = new Set(
      (Array.isArray(products) ? products : [])
        .map(product => String(product.category_name || "").trim())
        .filter(Boolean)
    );

    this.categoryFilter.querySelectorAll('input[name="category[]"]').forEach(input => {
      input.checked = productCategories.has(input.value);
    });
  }

  getPublishedProducts(products) {
    return (Array.isArray(products) ? products : []).filter(product =>
      Number(product.is_approved) === 1 &&
      !this.isSuperLanyardSource(product) &&
      product.category_name !== "Unassigned Category" &&
      product.group_name !== "Unassigned Group"
    );
  }

  isSuperLanyardSource(product) {
    if (this.isGeneratedSuperLanyard(product)) return false;

    return this.normaliseTypeName(product?.name) === "superlanyard";
  }

  async fetchSearchProducts(searchText) {
    this.searchRequestController?.abort();

    const requestController = new AbortController();
    this.searchRequestController = requestController;

    try {
      const result = await this.post("../../controller/products/product.php", {
        action: "search_products",
        search: String(searchText || "").trim()
      }, requestController.signal);

      if (this.searchRequestController !== requestController) return;

      this.productsData = this.getPublishedProducts(result.result);
      this.applyFilters();
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error searching products:", error);
      }
    } finally {
      if (this.searchRequestController === requestController) {
        this.searchRequestController = null;
      }
    }
  }

  bindSearchInput(search) {
    if (!search || search.dataset.searchBound === "true") return;

    search.dataset.searchBound = "true";
    search.addEventListener("input", event => {
      this.searchText = event.target.value;
      this.fetchSearchProducts(this.searchText);
    });

    search.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      this.searchText = event.target.value;
      this.fetchSearchProducts(this.searchText);
    });
  }

  bindSearchButton(button) {
    if (!button || button.dataset.searchBound === "true") return;

    button.dataset.searchBound = "true";
    button.addEventListener("click", () => {
      const search = document.getElementById("product-search");
      this.searchText = search?.value || "";
      this.fetchSearchProducts(this.searchText);
    });
  }

  async fetchTypeVariations(productIds) {
    const result = await this.post("../../controller/filters/category_filters.php", {
      action: "get_type_variations_by_products",
      product_ids: productIds
    });
    this.variationRows = Array.isArray(result.typeVariations) ? result.typeVariations : [];
  }

  getSelectedValues(container, selector) {
    return new Set(
      Array.from(container?.querySelectorAll(`${selector}:checked`) || [])
        .map(input => input.value)
    );
  }

  normaliseTypeName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  isSuperLanyardAxis(typeName) {
    return this.superLanyardAxisNames.has(this.normaliseTypeName(typeName));
  }

  isGeneratedSuperLanyard(product) {
    return Number(product?.is_super_lanyard_generated) === 1;
  }

  applyFilters() {
    const selectedCategories = this.getSelectedValues(this.categoryFilter, 'input[name="category[]"]');
    const selectionsByType = new Map();
    let hasSuperLanyardSelection = false;

    this.variationFilters?.querySelectorAll("input[data-type-id]:checked").forEach(input => {
      const typeId = input.dataset.typeId;
      if (!selectionsByType.has(typeId)) selectionsByType.set(typeId, new Set());
      selectionsByType.get(typeId).add(input.value);
      if (input.dataset.filterScope === "super-lanyard") {
        hasSuperLanyardSelection = true;
      }
    });

    const filtered = this.productsData.filter(product => {
      if (selectedCategories.size && !selectedCategories.has(String(product.category_name || ""))) {
        return false;
      }

      // Los seis filtros exclusivos nunca se aplican ni mezclan productos
      // normales. Al seleccionar uno, el resultado queda limitado a las
      // combinaciones generadas de Super Lanyard.
      if (hasSuperLanyardSelection && !this.isGeneratedSuperLanyard(product)) {
        return false;
      }

      return Array.from(selectionsByType).every(([typeId, options]) =>
        this.variationRows.some(row =>
          String(row.product_id) === String(product.product_id) &&
          String(row.type_id) === String(typeId) &&
          options.has(String(row.option_name))
        )
      );
    });

    this.drawProducts(filtered);
    this.drawTypeVariations(filtered.map(product => String(product.product_id)), selectionsByType);
  }

  drawTypeVariations(visibleProductIds, previousSelections = new Map()) {
    if (!this.variationFilters) return;

    const visibleIds = new Set(visibleProductIds);
    const grouped = new Map();
    this.variationRows.forEach(row => {
      if (!visibleIds.has(String(row.product_id))) return;
      const isSuperLanyardAxis = this.isSuperLanyardAxis(row.type_name);

      // Cuando existen combinaciones Super Lanyard, las seis dimensiones
      // solicitadas se alimentan exclusivamente de esos productos.
      if (isSuperLanyardAxis
          && this.superLanyardProductIds.size
          && !this.superLanyardProductIds.has(String(row.product_id))) {
        return;
      }

      const typeId = String(row.type_id);
      if (!grouped.has(typeId)) {
        grouped.set(typeId, {
          name: row.type_name,
          scope: isSuperLanyardAxis && this.superLanyardProductIds.size
            ? "super-lanyard"
            : "catalogue",
          options: new Map()
        });
      }
      const options = grouped.get(typeId).options;
      const optionName = String(row.option_name);
      if (!options.has(optionName)) options.set(optionName, new Set());
      options.get(optionName).add(String(row.product_id));
    });

    this.variationFilters.innerHTML = "";
    let colorIndex = 0;
    const colors = ["#7C3AED", "#2563EB", "#059669", "#EA580C", "#DC2626", "#0891B2"];

    grouped.forEach((type, typeId) => {
      const group = document.createElement("div");
      group.className = "filter-group";
      group.style.setProperty("--filter-accent", colors[colorIndex++ % colors.length]);

      const heading = document.createElement("h1");
      heading.textContent = type.name;
      const scroll = document.createElement("div");
      scroll.className = "scroll_filter";
      const list = document.createElement("ul");
      list.className = "checklist";

      type.options.forEach((productSet, optionName) => {
        const item = document.createElement("li");
        const label = document.createElement("label");
        const input = document.createElement("input");
        const text = document.createElement("span");
        input.type = "checkbox";
        input.dataset.typeId = typeId;
        input.dataset.filterScope = type.scope;
        input.value = optionName;
        input.checked = previousSelections.get(typeId)?.has(optionName) || false;
        text.textContent = `${optionName} (${productSet.size})`;
        label.append(input, text);
        item.append(label);
        list.append(item);
      });

      scroll.append(list);
      group.append(heading, scroll);
      this.variationFilters.append(group);
    });
  }

  drawProducts(products) {
    if (!this.articles) return;
    const shouldRestoreSearchFocus = document.activeElement?.id === "product-search";
    this.articles.innerHTML = "";

    const panel = document.createElement("div");
    panel.className = "products-search-panel";
    const label = document.createElement("label");
    label.htmlFor = "product-search";
    label.textContent = "Search products";
    const search = document.createElement("input");
    search.type = "search";
    search.id = "product-search";
    search.placeholder = "Search by product, category or group...";
    search.autocomplete = "off";
    search.value = this.searchText;
    this.bindSearchInput(search);
    const searchButton = document.createElement("button");
    searchButton.id = "product-search-button";
    searchButton.type = "button";
    searchButton.textContent = "Search";
    this.bindSearchButton(searchButton);
    const controls = document.createElement("div");
    controls.className = "products-search-controls";
    controls.append(search, searchButton);
    panel.append(label, controls);

    const title = document.createElement("h1");
    title.textContent = "All Products";
    this.articles.append(panel, title);

    if (shouldRestoreSearchFocus) {
      requestAnimationFrame(() => {
        search.focus();
        search.setSelectionRange(search.value.length, search.value.length);
      });
    }

    if (!products.length) {
      const empty = document.createElement("p");
      empty.textContent = "No products found.";
      this.articles.append(empty);
      return;
    }

    products.forEach(product => {
      const box = document.createElement("div");
      box.className = "box_article";
      const image = document.createElement("img");
      image.src = `../../${product.images?.[0] || "view/product/products/img/icon_products.png"}`;
      image.alt = product.name || "Product image";
      const name = document.createElement("h1");
      name.textContent = product.name || "Unnamed product";
      const category = document.createElement("p");
      category.textContent = product.category_name || "No category";
      const productGroup = document.createElement("p");
      productGroup.textContent = product.group_name || "No group";
      const button = document.createElement("button");
      button.className = "buttom_products";
      button.type = "button";
      button.textContent = "Buy";
      button.addEventListener("click", () => this.buyProduct(
        product.SKU,
        product.super_lanyard_variation_sku
      ));
      box.append(image, name, category, productGroup, button);
      this.articles.append(box);
    });
  }

  buyProduct(sku, variationSku = "") {
    const params = new URLSearchParams({ sku: String(sku || "") });
    if (String(variationSku || "").trim()) {
      params.set("sku_variation", String(variationSku).trim());
    }
    window.location.href = `../../view/preview_product_customers/index.php?${params.toString()}`;
  }
}

const productsClass = new ProductsClass();
