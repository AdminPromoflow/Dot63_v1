class ProductsClass {
  constructor() {
    this.productsData = [];
    this.searchInput = document.getElementById("product-search");

    this.fetchGetProducts();
    this.initSearch();
  }

  initSearch() {
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
        if (response.ok) {
          return response.text();
        }

        throw new Error("Network error.");
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
    articles.innerHTML = `
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

    this.searchInput = document.getElementById("product-search");
    this.initSearch();

    if (!data || !data.success || !data.result || !data.result.length) {
      articles.innerHTML += `<p>No products found.</p>`;
      return;
    }

    for (var i = 0; i < data.result.length; i++) {
      var product = data.result[i];

      var firstImage = "../../../view/product/products/img/icon_products.png";

      articles.innerHTML += `
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

const articles = document.getElementById("articles");
const productsClass = new ProductsClass();
