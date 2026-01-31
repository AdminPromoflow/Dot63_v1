class ClassAddProductDetails {
  constructor() {
    const reset = document.getElementById("reset");
    const save  = document.getElementById("save");

    document.addEventListener("DOMContentLoaded", () => {
      headerAddProduct.setCurrentHeader("product details");
    });


    let pdNameAlertShown = false;

    pd_name.addEventListener("input", () => {
      const len = pd_name.value.length;

      // Si pasa de 150, recorta (por si pega texto)
      if (len > 150) {
        pd_name.value = pd_name.value.slice(0, 150);
      }

      // Alert cuando cruza 150 (solo una vez)
      if (len > 149 && !pdNameAlertShown) {
        alert("Name must be 150 characters or fewer.");
        pdNameAlertShown = true;
      }

      // Si vuelve a 150 o menos, permitimos que vuelva a alertar si vuelve a pasar
      if (len <= 149) {
        pdNameAlertShown = false;
      }
    });

    reset.addEventListener("click", function () {
      pd_name.value = "";
      pd_status.value = "";
      pd_desc.value = "";
      pd_tagline.value = "";

      classAddProductDetails.saveProductDetails(false);
      alert("The product fields have been reset.");
    });

    save.addEventListener("click", () => {
      classAddProductDetails.saveProductDetails(false);
      alert("The product details have been saved.");
    });

    next_product_details.addEventListener("click", () => {
      classAddProductDetails.saveProductDetails(true);
    });

    this.getProductDetails();
  }

  getProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    const url = "../../controller/products/product.php";
    const data = {
      action: "get_product_details",
      sku: sku,
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) return response.text();
        throw new Error("Network error.");
      })
      .then((data) => {
      //  alert(data)
        data = JSON.parse(data);

        if (data.success) {
          pd_name.value = data.data.name;
          pd_desc.value = data.data.description;
          pd_status.value = data.data.status;
          pd_tagline.value = data.data.descriptive_tagline;
        }
        classAddProductDetails.toggleProductActiveStatus(data.data.is_approved != 0);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  toggleProductActiveStatus(active) {
    const active_product = document.getElementById("active_product");
    active_product.disabled = !active;
  }

  saveProductDetails(goNext = false) {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    const url = "../../controller/products/product.php";
    const data = {
      action: "save_product_details",
      name: pd_name.value,
      status: pd_status.value,
      description: pd_desc.value,
      pd_tagline: pd_tagline.value,
      sku: sku,
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) return response.text();
        throw new Error("Network error.");
      })
      .then((data) => {
        data = JSON.parse(data);

        if (data.success && goNext) {
          headerAddProduct.goNext("../../view/variations/index.php");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
}

const pd_name = document.getElementById("pd_name");
const pd_status = document.getElementById("pd_status");
const pd_desc = document.getElementById("pd_desc");
const pd_tagline = document.getElementById("pd_tagline");
const next_product_details = document.getElementById("next_product_details");

const classAddProductDetails = new ClassAddProductDetails();
