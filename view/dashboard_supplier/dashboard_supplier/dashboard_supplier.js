class ClassDashboardSupplier {
  constructor() {
    this.catalogUrl = "../../controller/products/catalog_browser.php";
    this.catalogList = document.getElementById("catalog-list");
    this.catalogTitle = document.getElementById("catalog-browser-title");
    this.catalogDescription = document.getElementById("catalog-description");
    this.catalogStatus = document.getElementById("catalog-status");
    this.catalogBack = document.getElementById("catalog-back");
    this.selectedCategory = null;
    this.selectedGroup = null;
    this.currentLevel = "categories";
    this.activeRequest = null;

    if (open_supplier_dashboard) {
      open_supplier_dashboard.addEventListener("click", function() {
      menu_supplier.verifyLogin();

      window.location.href = "../../view/supplier_profile/index.php";
      });
    }

    if (button_new_product) {
      button_new_product.addEventListener("click", () => this.createNewProduct());
    }

    if (this.catalogBack) {
      this.catalogBack.addEventListener("click", () => this.goBack());
    }

    if (this.catalogList) {
      this.loadCategories();
    }
  }

  async requestCatalog(action, payload = {}) {
    if (this.activeRequest) {
      this.activeRequest.abort();
    }

    this.activeRequest = new AbortController();

    const response = await fetch(this.catalogUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
      signal: this.activeRequest.signal
    });

    let result;
    try {
      result = await response.json();
    } catch (error) {
      throw new Error("The server returned an invalid response.");
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || "The catalogue could not be loaded.");
    }

    return result;
  }

  async loadCategories() {
    this.currentLevel = "categories";
    this.selectedCategory = null;
    this.selectedGroup = null;
    this.setCatalogHeader("Categories", "Select a category to view its groups.", false);
    this.setLoading("Loading categories…");

    try {
      const result = await this.requestCatalog("get_dashboard_categories");
      this.renderCategories(result.data);
    } catch (error) {
      this.handleCatalogError(error, () => this.loadCategories());
    }
  }

  async loadGroups(categoryId, categoryName = "") {
    this.currentLevel = "groups";
    this.selectedCategory = { categoryId: Number(categoryId), name: categoryName };
    this.selectedGroup = null;
    this.setCatalogHeader(categoryName || "Groups", "Select a group to view its products.", true);
    this.setLoading("Loading groups…");

    try {
      const result = await this.requestCatalog("get_dashboard_groups", {
        category_id: Number(categoryId)
      });
      this.selectedCategory.name = result.category.name;
      this.setCatalogHeader(`${result.category.name} · Groups`, "Select a group to view its products.", true);
      this.renderGroups(result.data);
    } catch (error) {
      this.handleCatalogError(error, () => this.loadGroups(categoryId, categoryName));
    }
  }

  async loadProducts(groupId, groupName = "") {
    this.currentLevel = "products";
    this.selectedGroup = { groupId: Number(groupId), name: groupName };
    this.setCatalogHeader(groupName || "Products", "Products assigned to this group.", true);
    this.setLoading("Loading products…");

    try {
      const result = await this.requestCatalog("get_dashboard_products", {
        group_id: Number(groupId)
      });
      this.selectedGroup.name = result.group.name;
      this.setCatalogHeader(`${result.group.name} · Products`, "Products assigned to this group.", true);
      this.renderProducts(result.data);
    } catch (error) {
      this.handleCatalogError(error, () => this.loadProducts(groupId, groupName));
    }
  }

  goBack() {
    if (this.currentLevel === "products" && this.selectedCategory) {
      this.loadGroups(this.selectedCategory.categoryId, this.selectedCategory.name);
      return;
    }

    if (this.currentLevel === "groups") {
      this.loadCategories();
    }
  }

  renderCategories(categories) {
    this.catalogList.replaceChildren();
    this.clearStatus();

    if (!categories.length) {
      this.showEmpty("No categories were found.");
      return;
    }

    categories.forEach(category => {
      const categoryId = Number(category.category_id);
      const item = this.createCatalogButton(
        category.name || `Category ${categoryId}`,
        `ID ${categoryId} · ${this.pluralize(category.groups_count, "group")}`,
        "category"
      );
      item.dataset.categoryId = String(categoryId);
      item.onclick = () => this.loadGroups(categoryId, category.name);
      this.catalogList.appendChild(item);
    });
  }

  renderGroups(groups) {
    this.catalogList.replaceChildren();
    this.clearStatus();

    if (!groups.length) {
      this.showEmpty("This category has no groups.");
      return;
    }

    groups.forEach(group => {
      const groupId = Number(group.group_id);
      const item = this.createCatalogButton(
        group.name || `Group ${groupId}`,
        `ID ${groupId} · ${this.pluralize(group.products_count, "product")}`,
        "group"
      );
      item.dataset.groupId = String(groupId);
      item.onclick = () => this.loadProducts(groupId, group.name);
      this.catalogList.appendChild(item);
    });
  }

  renderProducts(products) {
    this.catalogList.replaceChildren();
    this.clearStatus();

    if (!products.length) {
      this.showEmpty("This group has no products.");
      return;
    }

    products.forEach(product => {
      const productId = Number(product.product_id);
      const metaParts = [`ID ${productId}`];

      if (product.sku) {
        metaParts.push(`SKU ${product.sku}`);
      }
      if (product.status) {
        metaParts.push(product.status);
      }

      const item = this.createCatalogItem(
        product.name || `Product ${productId}`,
        metaParts.join(" · "),
        "product"
      );
      item.dataset.productId = String(productId);
      this.catalogList.appendChild(item);
    });
  }

  createCatalogButton(name, meta, type) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "catalog-item catalog-item-button";
    button.append(...this.createCatalogItemContent(name, meta, type));

    const arrow = document.createElement("span");
    arrow.className = "catalog-item-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    button.appendChild(arrow);

    return button;
  }

  createCatalogItem(name, meta, type) {
    const item = document.createElement("article");
    item.className = "catalog-item catalog-product";
    item.append(...this.createCatalogItemContent(name, meta, type));
    return item;
  }

  createCatalogItemContent(name, meta, type) {
    const icon = document.createElement("span");
    icon.className = `catalog-item-icon catalog-item-icon-${type}`;
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = type === "category" ? "C" : type === "group" ? "G" : "P";

    const copy = document.createElement("span");
    copy.className = "catalog-item-copy";

    const title = document.createElement("strong");
    title.textContent = name;

    const details = document.createElement("small");
    details.textContent = meta;

    copy.append(title, details);
    return [icon, copy];
  }

  setCatalogHeader(title, description, showBack) {
    this.catalogTitle.textContent = title;
    this.catalogDescription.textContent = description;
    this.catalogBack.hidden = !showBack;
  }

  setLoading(message) {
    this.catalogList.replaceChildren();
    this.catalogList.setAttribute("aria-busy", "true");
    this.catalogStatus.className = "catalog-status is-loading";
    this.catalogStatus.textContent = message;
  }

  clearStatus() {
    this.catalogList.removeAttribute("aria-busy");
    this.catalogStatus.className = "catalog-status";
    this.catalogStatus.textContent = "";
  }

  showEmpty(message) {
    this.catalogList.removeAttribute("aria-busy");
    this.catalogStatus.className = "catalog-status is-empty";
    this.catalogStatus.textContent = message;
  }

  handleCatalogError(error, retry) {
    if (error.name === "AbortError") {
      return;
    }

    this.catalogList.replaceChildren();
    this.catalogList.removeAttribute("aria-busy");
    this.catalogStatus.className = "catalog-status is-error";

    const message = document.createElement("span");
    message.textContent = error.message || "The catalogue could not be loaded.";

    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "catalog-retry";
    retryButton.textContent = "Try again";
    retryButton.onclick = retry;

    this.catalogStatus.replaceChildren(message, retryButton);
  }

  pluralize(value, singular) {
    const count = Number(value) || 0;
    return `${count} ${singular}${count === 1 ? "" : "s"}`;
  }

  createNewProduct() {

    const url = "../../controller/products/product.php";
    const data = {
      action: "create_new_product"
    };
    // Make a fetch request to the given URL with the specified data.
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        // Check if the response is okay, if so, return the response text.
        if (response.ok) {
          return response.text();
        }
        // If the response is not okay, throw an error.
        throw new Error("Network error.");
      })
      .then(data => {
       data = JSON.parse(data);

       const sku = data["sku"];
       const sku_variation = data["all_variation"]["variation"]["SKU"];

        if (data["success"]) {

          window.location.href =
            `../../view/category/index.php?sku=${encodeURIComponent(sku)}&sku_variation=${encodeURIComponent(sku_variation)}`;
        }


      })
      .catch(error => {
        // Log any errors to the console.
        console.error("Error:", error);
      });

  }

}

const open_supplier_dashboard = document.getElementById("open-supplier-dashboard");
const button_new_product = document.getElementById("button_new_product");
const classDashboardSupplier = new ClassDashboardSupplier();
