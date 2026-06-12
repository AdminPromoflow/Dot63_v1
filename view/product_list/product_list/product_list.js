class ClassProductList {
  constructor() {
    document.addEventListener("DOMContentLoaded", () => {
      if (window.headerAddProduct) {
        headerAddProduct.setCurrentHeader("Products");
      }

      this.productList = document.getElementById("product_list");
      this.getProducts();
    });
  }
  drawProductSelected(){
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");
    this.drawBorderProduct(sku);
  }

  getProducts() {
    const url = "../../controller/products/product.php";

    const data = {
      action: "get_products_by_group"
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
        this.drawListProducts(data);

        const params = new URLSearchParams(window.location.search);
        const sku = params.get("sku");

        if (sku) {
          this.drawBorderProduct(sku);
        }
      })
      .catch(error => {
        console.error("Error:", error);
      });
  }

  drawListProducts(data) {
    if (!this.productList) return;

    this.productList.innerHTML = "";

    const list = data?.success && Array.isArray(data.result)
      ? data.result
      : [];

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
