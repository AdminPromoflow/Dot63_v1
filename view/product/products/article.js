class ProductsClass {
  constructor() {
    this.productsData = [];
    this.searchInput = document.getElementById("product-search");

    this.categoryFilter = document.getElementById("category_filter");
    this.articles = document.getElementById("articles");

    this.fetchGetProducts();
    this.initSearch();
    this.getCategoryFilters();
    this.initPriceRange();
  }

  initSearch() {
    this.searchInput = document.getElementById("product-search");

    if (!this.searchInput) return;

    this.searchInput.addEventListener("input", () => {
      const text = this.searchInput.value.toLowerCase().trim();

      const filteredProducts = this.productsData.filter(product => {
        return (
          String(product.name || "").toLowerCase().includes(text) ||
          String(product.category_name || "").toLowerCase().includes(text) ||
          String(product.group_name || "").toLowerCase().includes(text) ||
          String(product.SKU || "").toLowerCase().includes(text)
        );
      });

      this.drawProducts({
        success: true,
        result: filteredProducts
      });
    });
  }

  initPriceRange() {
  const priceRange = document.getElementById("priceRange");
  const priceValue = document.getElementById("priceValue");

  if (!priceRange || !priceValue) return;

  const updatePrice = () => {
    priceValue.textContent = `£${priceRange.value}`;
  };

  priceRange.addEventListener("input", updatePrice);
  updatePrice();
}

  getCategoryFilters() {
    const url = "../../controller/filters/category_filters.php";

    const data = {
      action: "get_categories_filter"
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (!response.ok) throw new Error("Network error.");
        return response.text();
      })
      .then(text => {
        const result = JSON.parse(text);

        this.categoryFilter.innerHTML = "";

        for (let i = 0; i < result.length; i++) {

          this.renderCategoriesFilter(result[i].name);

        }

        this.initCategoryAccordion();
      })
      .catch(error => {
        console.error("Error fetching categories:", error);
      });
  }

  renderCategoriesFilter(name) {


    const safeId = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    this.categoryFilter.insertAdjacentHTML("beforeend", `
      <li class="category-accordion-item">
        <button class="category-accordion-btn" type="button">
          <span>${name}</span>
          <span class="category-accordion-icon">+</span>
        </button>

        <div class="category-groups">
          <label>
            <input type="checkbox" name="category[]" value="${name}">
            <span>All ${name}</span>
          </label>

          <label>
            <input type="checkbox" name="group[]" value="${safeId}-group-1">
            <span>Bags</span>
          </label>

          <label>
            <input type="checkbox" name="group[]" value="${safeId}-group-2">
            <span>Drinkware</span>
          </label>

          <label>
            <input type="checkbox" name="group[]" value="${safeId}-group-3">
            <span>Pens & Writing</span>
          </label>
        </div>
      </li>
    `);
  }

  initCategoryAccordion() {
  const buttons = document.querySelectorAll(".category-accordion-btn");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const item = button.closest(".category-accordion-item");

      if (!item) return;

      item.classList.toggle("is-open");

      const icon = button.querySelector(".category-accordion-icon");
      if (icon) {
        icon.textContent = item.classList.contains("is-open") ? "−" : "+";
      }
    });
  });
}

  fetchGetProducts() {
    const url = "../../controller/products/product.php";

    const data = {
      action: "get_products"
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (!response.ok) throw new Error("Network error.");
        return response.text();
      })
      .then(result => {
        const data = JSON.parse(result);

        this.productsData = data.result || [];
        this.drawProducts(data);
      })
      .catch(error => {
        console.error("Error:", error);
      });
  }

  drawProducts(data) {
    this.articles.innerHTML = `
      <div class="products-search-panel">
        <label for="product-search">Search products</label>
        <input
          type="search"
          id="product-search"
          placeholder="Search by name, category, group or SKU..."
          value="${this.searchInput ? this.searchInput.value : ""}"
        >
      </div>

      <h1>All Products</h1>
    `;

    this.initSearch();

    if (!data || !data.success || !data.result || !data.result.length) {
      this.articles.innerHTML += `<p>No products found.</p>`;
      return;
    }

    for (let i = 0; i < data.result.length; i++) {
      const product = data.result[i];
      const firstImage = "../../../view/product/products/img/icon_products.png";

      this.articles.innerHTML += `
        <div class="box_article">
          <img src="../../${firstImage}" alt="${product.name}">
          <h1>${product.name}</h1>
          <p>${product.category_name}</p>
          <p>${product.group_name}</p>

          <button
            class="buttom_products"
            type="button"
            onclick="productsClass.buyProduct('${product.SKU}')"
          >
            Buy
          </button>
        </div>
      `;
    }
  }

  buyProduct(sku) {
    window.location.href = `../../view/preview_porduct/index.php?sku=${encodeURIComponent(sku)}`;
  }
}

const productsClass = new ProductsClass();
