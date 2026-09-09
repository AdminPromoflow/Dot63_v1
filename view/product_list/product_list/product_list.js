class ClassProductList {
  constructor() {
    const btn_back_products = document.getElementById("btn_back_products");
    const choose_product = document.getElementById("choose_product");
    const cancel_choose_product = document.getElementById("cancel_choose_product");
    const next_product = document.getElementById("next_product");
    btn_back_products.addEventListener("click", () => {
      headerAddProduct.goNext('../../view/group/index.php');
    });
    choose_product.addEventListener("click", () => {
      this.chooseProduct();
    });
    cancel_choose_product.addEventListener("click", () => {
      this.cancelChooseProduct();
    });
    next_product.addEventListener("click", () => {
      headerAddProduct.goNext('../../view/product_details/index.php');
    });
    document.addEventListener("DOMContentLoaded", () => {
      if (window.headerAddProduct) {
        headerAddProduct.setCurrentHeader("Products");
      }

      //    this.productList = document.getElementById("product_list");
      this.getProducts();
    });
    document.addEventListener("click", event => this.handleListClick(event));
  }

  async chooseProduct() {
    try {
      const choose_product = document.getElementById("choose_product");
      const cancel_choose_product = document.getElementById("cancel_choose_product");
      const params = new URLSearchParams(window.location.search);
      const sku = params.get("sku");
      const productList = document.getElementById("product_list");
      productList.classList.remove("pl-products-list-single");
      const url = "../../controller/products/product.php";
      const data = {
        action: "get_products_by_group",
        sku: sku
      };
      const response = await this.makeRequest(url, data);
      if (!response) return;
      choose_product.style.display = "none";
      cancel_choose_product.style.display = "block";
      this.drawListProducts(response["result"]);
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  async cancelChooseProduct() {
    try {
      const choose_product = document.getElementById("choose_product");
      const cancel_choose_product = document.getElementById("cancel_choose_product");
      const params = new URLSearchParams(window.location.search);
      const sku = params.get("sku");
      const productList = document.getElementById("product_list");
      productList.classList.add("pl-products-list-single");
      const url = "../../controller/products/product.php";
      const data = {
        action: "get_products_by_group",
        sku: sku
      };
      const response = await this.makeRequest(url, data);
      if (!response) return;
      choose_product.style.display = "block";
      cancel_choose_product.style.display = "none";
      for (var i = 0; i < response["result"].length; i++) {
        //  alert(response["result"][i]["SKU"] + "  " + sku);
        if (response["result"][i]["SKU"] == sku) {
          this.drawListProducts([response["result"][i]]);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  async getProducts() {
    try {
      const productList = document.getElementById("product_list");
      productList.classList.add("pl-products-list-single");
      const params = new URLSearchParams(window.location.search);
      const sku = params.get("sku");
      const url = "../../controller/products/product.php";
      const data = {
        action: "get_products_by_group",
        sku: sku
      };
      const response = await this.makeRequest(url, data);
      if (!response) return;

      //  alert(JSON.stringify(response));

      choose_product.style.display = "block";
      cancel_choose_product.style.display = "none";
      for (var i = 0; i < response["result"].length; i++) {
        //  alert(response["result"][i]["SKU"] + "  " + sku);
        if (response["result"][i]["SKU"] == sku) {
          this.drawListProducts([response["result"][i]]);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  drawProductSelected() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");
    this.drawBorderProduct(sku);
  }

  drawListProducts(data) {
    //alert(data);

    const productList = document.getElementById("product_list");
    productList.style.display = "flex";
    productList.style.flexDirection = "column";
    productList.style.alignItems = "center";
    if (!productList) {
      console.error("No existe el div con id product_list");
      return;
    }
    productList.innerHTML = "";
    const list = Array.isArray(data) ? data : [];
    if (list.length === 0) {
      productList.innerHTML = `
        <div class="pl-empty">No products found.</div>
      `;
      return;
    }
    for (let i = 0; i < list.length; i++) {
      const sku = list[i].SKU || "";
      const name = list[i].name || "Unnamed product";
      productList.innerHTML += `
        <div
          id="${sku}"
          class="pl-product"
          role="listitem"
          data-product-sku="${sku}"
        >
          <span class="pl-product-number">${i + 1}</span>
          <span class="pl-product-name">${name}</span>
        </div>
      `;
    }
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");
    if (sku) {
      this.drawBorderProduct(sku);
    }
  }

  drawBorderProduct(selectedId) {
    const productList = document.getElementById("product_list");
    const products = productList.querySelectorAll(".pl-product");
    const cleanSelectedId = String(selectedId || "").trim();
    products.forEach(product => {
      product.classList.remove("pl-product-selected");
    });
    const selectedProduct = document.getElementById(cleanSelectedId);
    if (!selectedProduct) return;
    selectedProduct.classList.add("pl-product-selected");
    selectedProduct.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  async selectProduct(selectedId) {
    const url = "../../controller/products/product.php";
    const data = {
      action: "get_default_variation_by_sku",
      sku: selectedId
    };
    try {
      const response = await this.makeRequest(url, data);

      //  alert(responseText);

      if (response["success"]) {
        window.location.href = `../../view/product_details/index.php?sku=${encodeURIComponent(selectedId)}&sku_variation=${encodeURIComponent(response["sku_variation"])}`;
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  handleListClick(event) {
    const item = event.target.closest("#product_list [data-product-sku]");
    if (item) this.selectProduct(item.dataset.productSku);
  }

  async makeRequest(url, data, options = {}) {
    const {
      requireSuccess = false,
      responseType = "json",
      ...requestOptions
    } = options;
    const isFormData = data instanceof FormData;
    const headers = new Headers(requestOptions.headers || {});
    if (!isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      ...requestOptions,
      headers,
      body: isFormData ? data : JSON.stringify(data)
    });
    const text = await response.text();
    let result;
    try {
      result = responseType === "text" ? text : JSON.parse(text);
    } catch {
      const error = new Error("The server returned an invalid response.");
      error.status = response.status;
      throw error;
    }
    if (!response.ok || requireSuccess && !result?.success) {
      const error = new Error(result?.error || result?.message || "The request could not be completed.");
      error.status = response.status;
      error.code = result?.code || null;
      error.details = result;
      throw error;
    }
    return result;
  }
}
const classProductList = new ClassProductList();
