class ClassProductList {
  constructor() {
    const btn_back_products = document.getElementById("btn_back_products");
    const choose_product = document.getElementById("choose_product");
    const cancel_choose_product = document.getElementById("cancel_choose_product");
    const next_product = document.getElementById("next_product");

    btn_back_products.addEventListener("click", function(){
      headerAddProduct.goNext('../../view/group/index.php');
    });

    choose_product.addEventListener("click", function(){
      classProductList.chooseProduct();
    });

    cancel_choose_product.addEventListener("click", function(){
      classProductList.cancelChooseProduct();
    });

    next_product.addEventListener("click", function(){
      headerAddProduct.goNext('../../view/product_details/index.php');
    });

    document.addEventListener("DOMContentLoaded", () => {
      if (window.headerAddProduct) {
        headerAddProduct.setCurrentHeader("Products");
      }

      this.productList = document.getElementById("product_list");
      this.getProducts();
    });
  }

  async cancelChooseProduct() {
    const choose_product = document.getElementById("choose_product");
    const cancel_choose_product = document.getElementById("cancel_choose_product");

    const url = "../../controller/products/product.php";

    const data = {
      action: "get_products_by_group"
    };

    const response = await this.makeRequest(url, data);

    if (!response) return;
  //  alert(JSON.stringify(response));
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

  //  alert(sku);

    choose_product.style.display = "block";
    cancel_choose_product.style.display = "none";

    for (var i = 0; i < response["result"].length; i++) {
      if (response["result"][i]["SKU"] == sku) {
          this.drawListProducts([response["result"][i]]);
      }

    }

  }

  async chooseProduct() {
    const choose_product = document.getElementById("choose_product");
    const cancel_choose_product = document.getElementById("cancel_choose_product");

    const url = "../../controller/products/product.php";

    const data = {
      action: "get_products_by_group"
    };

    const response = await this.makeRequest(url, data);

    if (!response) return;

    choose_product.style.display = "none";
    cancel_choose_product.style.display = "block";

    this.drawListProducts(response["result"]);

  }

  async getProducts() {
    const url = "../../controller/products/product.php";

    const data = {
      action: "get_products_by_group"
    };

    const response = await this.makeRequest(url, data);

    if (!response) return;

    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    for (var i = 0; i < response["result"].length; i++) {
      if (response["result"][i]["SKU"] ==  sku) {
        this.drawListProducts([response["result"][i]]);
      }

    }
  }

  async makeRequest(url, data) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error("Network error.");
      }

      return await response.json();

    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }
  drawProductSelected(){
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");
    this.drawBorderProduct(sku);
  }



  drawListProducts(data) {
    alert(JSON.stringify(data));
    if (!this.productList) return;

    this.productList.innerHTML = "";

    const list = Array.isArray(data) ? data : [];

    if (list.length === 0) {
      this.productList.innerHTML = `
        <div class="pl-empty">No products found.</div>
      `;
      return;
    }

    for (let i = 0; i < list.length; i++) {
      const sku = list[i].SKU || "";
      const name = list[i].name || "Unnamed product";

      this.productList.innerHTML += `
        <div
          id="${sku}"
          class="pl-product"
          role="listitem"
          onclick="classProductList.selectProduct('${sku}')"
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
    const products = this.productList.querySelectorAll(".pl-product");

    products.forEach((product) => {
      product.classList.remove("pl-product-selected");
    });

    const selectedProduct = document.getElementById(selectedId);

    if (!selectedProduct) return;

    selectedProduct.classList.add("pl-product-selected");

    console.log("Selected product:", selectedId);
  }
  selectProduct(selectedId) {
    const url = "../../controller/products/product.php";

    const data = {
      action: "get_default_variation_by_sku",
      sku: selectedId
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) return response.text();
        throw new Error("Network error.");
      })
      .then(responseText => {
      //  alert(responseText);
        const data = JSON.parse(responseText);

        if (data["success"]) {
          window.location.href =
          `../../view/product_details/index.php?sku=${encodeURIComponent(selectedId)}&sku_variation=${encodeURIComponent(data["sku_variation"])}`;

        }



      })
      .catch(error => {
        console.error("Error:", error);
      });




  }
}

const classProductList = new ClassProductList();
