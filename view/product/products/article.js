class ProductsClass {
  constructor() {
    this.articles = document.getElementById("articles");
    this.categoryFilter = document.getElementById("category_filter");
    this.variationFilters = document.getElementById("variation-filters");
    this.productsData = [];
    this.variationRows = [];
    this.statusThreeProductsData = [];
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

    const productSets = await this.prepareProductSets(result.result);

    if (!this.searchText.trim()) {
      this.productsData = productSets.normalProducts;
      this.variationRows = productSets.variationRows;
      this.statusThreeProductsData = productSets.statusThreeProducts;
    }

    return productSets.normalProducts;
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
      product.category_name !== "Unassigned Category" &&
      product.group_name !== "Unassigned Group"
    );
  }

  async prepareProductSets(products, signal = null) {
    const publishedProducts = this.getPublishedProducts(products);
    const normalProducts = publishedProducts.filter(product => Number(product.status) === 2);
    const statusThreeSourceProducts = publishedProducts.filter(product => Number(product.status) === 3);

    const [variationRows, statusThreeProducts] = await Promise.all([
      this.fetchTypeVariations(normalProducts.map(product => product.product_id), signal),
      this.prepareStatusThreeProducts(statusThreeSourceProducts, signal)
    ]);

    return {
      normalProducts,
      variationRows,
      statusThreeProducts
    };
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

      const productSets = await this.prepareProductSets(result.result, requestController.signal);

      if (this.searchRequestController !== requestController) return;

      this.productsData = productSets.normalProducts;
      this.variationRows = productSets.variationRows;
      this.statusThreeProductsData = productSets.statusThreeProducts;
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

  async fetchTypeVariations(productIds, signal = null) {
    if (!Array.isArray(productIds) || productIds.length === 0) return [];

    const result = await this.post("../../controller/filters/category_filters.php", {
      action: "get_type_variations_by_products",
      product_ids: productIds
    }, signal);

    return Array.isArray(result.typeVariations) ? result.typeVariations : [];
  }

  async prepareStatusThreeProducts(products, signal = null) {
    if (!Array.isArray(products) || products.length === 0) return [];

    const result = await this.post("../../controller/products/product.php", {
      action: "get_status_three_variations",
      product_ids: products.map(product => product.product_id)
    }, signal);

    if (!result?.success) {
      throw new Error(result?.error || "Unable to load status 3 variations.");
    }

    const variationsByProduct = new Map();
    (Array.isArray(result.result) ? result.result : []).forEach(variation => {
      const productId = String(variation.product_id ?? "");
      if (!variationsByProduct.has(productId)) variationsByProduct.set(productId, []);
      variationsByProduct.get(productId).push(variation);
    });

    const preparedProducts = [];

    products.forEach(product => {
      const eligibleVariations = variationsByProduct.get(String(product.product_id)) || [];
      const variationGroups = this.groupEligibleVariations(eligibleVariations);
      const matrix = this.createCartesianMatrix(variationGroups);
      const finalObjects = this.createStatusThreeObjects(product, matrix);

      console.groupCollapsed(`[Products][status=3] ${product.name || product.SKU || product.product_id}`);
      console.log("Producto original con status = 3:", product);
      console.log("Variaciones elegibles detectadas:", eligibleVariations);
      console.log("Número total de combinaciones:", matrix.length);
      console.log("Matriz completa:", matrix);
      console.log("Objetos finales compatibles con Products (status = 2):", finalObjects);
      console.groupEnd();

      preparedProducts.push(...finalObjects);
    });

    return preparedProducts;
  }

  groupEligibleVariations(variations) {
    const groups = new Map();

    (Array.isArray(variations) ? variations : []).forEach(variation => {
      const typeId = String(variation.type_id ?? "").trim();
      const typeName = String(variation.type_name ?? "").trim();
      const optionName = String(variation.name ?? "").trim();
      const priceMode = String(variation.price_display_mode || "prices").trim().toLowerCase();

      if (!typeId || !typeName || !optionName || priceMode !== "prices") return;

      if (!groups.has(typeId)) {
        groups.set(typeId, {
          type_id: variation.type_id,
          type_name: typeName,
          options: new Map()
        });
      }

      const group = groups.get(typeId);
      const optionKey = optionName.toLocaleLowerCase().replace(/\s+/g, " ");
      const current = group.options.get(optionKey);

      if (current) {
        current.source_variation_ids = Array.from(new Set([
          ...current.source_variation_ids,
          variation.variation_id
        ]));
        current.source_variation_skus = Array.from(new Set([
          ...current.source_variation_skus,
          variation.SKU
        ].filter(Boolean)));
        current.images = this.mergeUniqueRows(current.images, variation.images, "image_id", "link");
        current.prices = this.mergeUniqueRows(current.prices, variation.prices, "price_id");
        return;
      }

      group.options.set(optionKey, {
        ...variation,
        name: optionName,
        type_name: typeName,
        price_display_mode: priceMode,
        images: Array.isArray(variation.images) ? [...variation.images] : [],
        prices: Array.isArray(variation.prices) ? [...variation.prices] : [],
        source_variation_ids: [variation.variation_id],
        source_variation_skus: variation.SKU ? [variation.SKU] : []
      });
    });

    return Array.from(groups.values()).map(group => ({
      type_id: group.type_id,
      type_name: group.type_name,
      options: Array.from(group.options.values())
    }));
  }

  mergeUniqueRows(currentRows, newRows, ...keyFields) {
    const merged = Array.isArray(currentRows) ? [...currentRows] : [];
    const keys = new Set(merged.map(row => this.getRowKey(row, keyFields)));

    (Array.isArray(newRows) ? newRows : []).forEach(row => {
      const key = this.getRowKey(row, keyFields);
      if (keys.has(key)) return;
      keys.add(key);
      merged.push(row);
    });

    return merged;
  }

  getRowKey(row, keyFields) {
    const matchingField = keyFields.find(field => row?.[field] !== null && row?.[field] !== undefined && row?.[field] !== "");
    return matchingField
      ? `${matchingField}:${row[matchingField]}`
      : JSON.stringify(row);
  }

  createCartesianMatrix(groups) {
    if (!Array.isArray(groups) || groups.length === 0) return [];

    const matrix = groups.reduce((combinations, group) => {
      if (!Array.isArray(group.options) || group.options.length === 0) return [];

      return combinations.flatMap(combination =>
        group.options.map(option => [
          ...combination,
          {
            ...option,
            type_id: group.type_id,
            type_name: group.type_name
          }
        ])
      );
    }, [[]]);

    const uniqueCombinations = new Map();
    matrix.forEach(combination => {
      const key = combination
        .map(option => `${option.type_id}:${String(option.name).trim().toLocaleLowerCase()}`)
        .join("|");
      if (!uniqueCombinations.has(key)) uniqueCombinations.set(key, combination);
    });

    return Array.from(uniqueCombinations.values());
  }

  createStatusThreeObjects(product, matrix) {
    return (Array.isArray(matrix) ? matrix : []).map(combination => {
      const selectedVariations = combination.map(variation => ({
        variation_id: variation.variation_id,
        source_variation_ids: variation.source_variation_ids,
        type_id: variation.type_id,
        type_name: variation.type_name,
        name: variation.name,
        SKU: variation.SKU,
        source_variation_skus: variation.source_variation_skus,
        price_display_mode: variation.price_display_mode,
        image: variation.image,
        images: variation.images,
        prices: variation.prices
      }));
      const variationIds = selectedVariations.map(variation => variation.variation_id);
      const combinationId = `${product.product_id}:${variationIds.join("-")}`;
      const titleParts = [product.name, ...selectedVariations.map(variation => variation.name)]
        .map(value => String(value || "").trim())
        .filter(Boolean);
      const images = Array.from(new Set([
        ...selectedVariations.flatMap(variation => [
          variation.image,
          ...(Array.isArray(variation.images) ? variation.images.map(image => image.link) : [])
        ]),
        ...(Array.isArray(product.images) ? product.images : [])
      ].map(value => String(value || "").trim()).filter(Boolean)));
      const prices = this.mergeUniqueRows(
        [],
        selectedVariations.flatMap(variation =>
          (Array.isArray(variation.prices) ? variation.prices : []).map(price => ({
            ...price,
            variation_id: variation.variation_id,
            variation_name: variation.name,
            type_id: variation.type_id,
            type_name: variation.type_name,
            price_display_mode: variation.price_display_mode
          }))
        ),
        "price_id"
      );
      const numericPrices = prices
        .map(price => Number(price.price))
        .filter(price => Number.isFinite(price));
      const minimumPrice = numericPrices.length ? Math.min(...numericPrices) : null;

      return {
        ...product,
        product_id: product.product_id,
        base_product_id: product.product_id,
        base_product_sku: product.SKU,
        combination_id: combinationId,
        SKU: `${product.SKU || `PRODUCT-${product.product_id}`}--${variationIds.map(id => `V${id}`).join("-")}`,
        name: titleParts.join(" — "),
        category_name: product.category_name,
        group_name: product.group_name,
        images,
        price: minimumPrice,
        price_info: {
          kind: prices.length ? "variable" : "no_additional_price",
          minimum_price: minimumPrice,
          ranges: prices
        },
        prices,
        variation_ids: variationIds,
        variation_values: Object.fromEntries(
          selectedVariations.map(variation => [variation.type_name, variation.name])
        ),
        selected_variations: selectedVariations,
        is_status_three_combination: true
      };
    });
  }

  getSelectedValues(container, selector) {
    return new Set(
      Array.from(container?.querySelectorAll(`${selector}:checked`) || [])
        .map(input => input.value)
    );
  }

  applyFilters() {
    const selectedCategories = this.getSelectedValues(this.categoryFilter, 'input[name="category[]"]');
    const selectionsByType = new Map();

    this.variationFilters?.querySelectorAll("input[data-type-id]:checked").forEach(input => {
      const typeId = input.dataset.typeId;
      if (!selectionsByType.has(typeId)) selectionsByType.set(typeId, new Set());
      selectionsByType.get(typeId).add(input.value);
    });

    const filtered = this.productsData.filter(product => {
      if (selectedCategories.size && !selectedCategories.has(String(product.category_name || ""))) {
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
      const typeId = String(row.type_id);
      if (!grouped.has(typeId)) {
        grouped.set(typeId, { name: row.type_name, options: new Map() });
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
      button.addEventListener("click", () => this.buyProduct(product.SKU));
      box.append(image, name, category, productGroup, button);
      this.articles.append(box);
    });
  }

  buyProduct(sku) {
    window.location.href = `../../view/preview_product_customers/index.php?sku=${encodeURIComponent(sku)}`;
  }
}

const productsClass = new ProductsClass();
