// preview_logic.js

class PreviewLogic {
  constructor() {
    this.currentImages = [];
    this.currentImageIndex = 0;

    this.getDataProduct();
  }

  getDataProduct() {
    // 1) Get SKU from the URL query string
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    if (!sku) {
      console.warn("No SKU in URL");
      return;
    }

    // 2) Prepare request (server endpoint + payload)
    const url = "../../controller/order/product.php";
    const data = {
      action: "get_preview_product_details",
      sku: sku
    };

    // 3) Make the request
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (!response.ok) throw new Error("Network error.");
        return response.text();
      })
      .then(text => {
        //alert(text);
        let json = JSON.parse(text);

        // Tu respuesta es un array: [{company_name},{category_name},{group_name},{product_details:{...}},...]
        const company_name  = (json.find(x => x.company_name)?.company_name) ?? "";
        const category_name = (json.find(x => x.category_name)?.category_name) ?? "";
        const group_name    = (json.find(x => x.group_name)?.group_name) ?? "";
        const default_variation_id = (json.find(x => x.default_variation_id)?.default_variation_id) ?? "";

        const product_details = (json.find(x => x.product_details)?.product_details) ?? {};
        const product_name = product_details.product_name ?? "";
        const descriptive_tagline = product_details.descriptive_tagline ?? "";
        const description = product_details.description ?? "";

        // 4) Llamar funciones y pintar
        previewLogic.renderBreadcrumb(category_name, group_name);
        previewLogic.renderSectionLabel(category_name);
        previewLogic.renderProductTitle(product_name);
        previewLogic.renderBrandName(company_name);
        previewLogic.renderTagline(descriptive_tagline);
        previewLogic.renderDescription(description);
        previewLogic.deleteGroupsContent();
        previewLogic.fetchChildVariationsById(default_variation_id);
      })
      .catch(error => {
        console.error("Error fetching preview:", error);
        alert("Error loading preview data.");
      });
  }

  deleteGroupsContent() {
    // const wrapImagesGroup   = document.querySelector("#wrap-images-group");
    // const wrapItemsGroup    = document.querySelector("#wrap-items-group");
    // const wrapPricesGroup   = document.querySelector("#wrap-prices-group");
    // const wrapArtworksGroup = document.querySelector("#wrap-artworks-group");
    //
    // if (wrapImagesGroup)   wrapImagesGroup.innerHTML = "";
    // if (wrapItemsGroup)    wrapItemsGroup.innerHTML = "";
    // if (wrapPricesGroup)   wrapPricesGroup.innerHTML = "";
    // if (wrapArtworksGroup) wrapArtworksGroup.innerHTML = "";
  }

  renderBreadcrumb(category_name, group_name) {
    const sp_breadcrumbs = document.getElementById("sp_breadcrumbs");
    if (!sp_breadcrumbs) return;

    sp_breadcrumbs.innerHTML = `
      <li><a href="#">${category_name || ""}</a></li>
      <li><a href="#">${group_name || ""}</a></li>
    `;
  }

  renderSectionLabel(category_name) {
    const sp_category = document.getElementById("sp_category");
    if (!sp_category) return;

    sp_category.textContent = category_name || "";
  }

  renderProductTitle(product_name) {
    const sp_title = document.getElementById("sp-title");
    if (!sp_title) return;

    sp_title.textContent = product_name || "";
  }

  renderBrandName(company_name) {
    const sp_brand = document.getElementById("sp-brand");
    if (!sp_brand) return;

    sp_brand.textContent = company_name || "";
  }

  renderTagline(descriptive_tagline) {
    const sp_subtitle = document.getElementById("sp_subtitle");
    if (!sp_subtitle) return;

    sp_subtitle.textContent = descriptive_tagline || "";
  }

  renderDescription(description) {
    const sp_desc = document.getElementById("sp_desc");
    if (!sp_desc) return;

    sp_desc.textContent = description || "";
  }

  fetchChildVariationsById(variation_id) {
    if (!variation_id) {
      console.warn("No ID in URL");
      return;
    }

    // 2) Prepare request (server endpoint + payload)
    const url = "../../controller/order/product.php";
    const data = {
      action: "get_variation_children_by_id",
      variation_id: variation_id
    };

    // 3) Make the request
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Network error.");
        }
        return response.text();
      })
      .then(text => {
        console.log(text);
        let json;
        json = JSON.parse(text);
      })
      .catch(error => {
        console.error("Error fetching preview:", error);
        alert("Error loading preview data.");
      });
  }
}

// Single instance (global usage for inline onclick handlers)
const previewLogic = new PreviewLogic();
