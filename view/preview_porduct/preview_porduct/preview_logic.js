// preview_logic.js

/**
 * PreviewLogic
 * ------------
 * Handles:
 * - Fetching preview data for a product/variation (via SKU in the URL)
 * - Rendering header/product details
 * - Rendering variation groups (first level)
 * - Handling selection behaviour (buttons + updating selected label)
 * - Rendering images/items/prices for the selected variation
 * - Basic gallery state (next image, change main image)
 */
class PreviewLogic {
  constructor() {
    /**
     * Gallery state (thumbs + main image)
     */
    this.currentImages = [];
    this.currentImageIndex = 0;

    /**
     * Variation cache used by selectVariation()
     * (Populated in drawVariationsFirstLevel)
     */
    // this.variationsFirstLevel will be initialised lazily

    /**
     * Load preview data immediately (SKU comes from URL)
     * Note: getDataProduct() exists as an alternative flow (currently not called here).
     */
    this.getDataProduct();
    // this.getDataProduct();
  }

  getDataProduct() {
    // 1) Get SKU from the URL query string
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    //alert(sku);

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
        // Network-level validation
        if (!response.ok) {
          throw new Error("Network error.");
        }
        return response.text();
      })
      .then(text => {
        alert(text);
        let json;
        json = JSON.parse(text);

        // Clear variations section before rendering (if present)
        // const section_variations = document.getElementById("section_variations");
        // if (section_variations) {
        //   section_variations.innerHTML = "";
        // }
        // Debug: inspect the variations payload
  //    previewLogic.getDataVariationBySKU(variationsBlock.default_variation_sku)


    //  this.drawHeaders(supplierBlock, categoryBlock, productBlock);

    //  this.drawProductDetails(productBlock);


      })
      .catch(error => {
        console.error("Error fetching preview:", error);
      //  alert("Error loading preview data.");
      });
  }



  getDataVariationBySKU(sku_variation){

    if (!sku_variation) {
      console.warn("No SKU in URL");
      return;
    }

    // 2) Prepare request (server endpoint + payload)
    const url = "../../controller/order/product.php";
    const data = {
      action: "get_data_variation_by_sku_variation",
      sku_variation: sku_variation
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
        alert("Buenas" + text);
        let json;

          json = JSON.parse(text);
      })
      .catch(error => {
        console.error("Error fetching preview:", error);
        alert("Error loading preview data.");
      });
  }



  /**
   * Render product title/tagline/description
   * productBlock: { product_details: { sku, product_name, description, descriptive_tagline, status } }
   */
  drawProductDetails(productBlock) {
    if (!productBlock || !productBlock.product_details) return;

    const details = productBlock.product_details;

    const titleEl = document.getElementById("sp-title");
    const subtitleEl = document.getElementById("sp_subtitle");
    const descEl = document.getElementById("sp_desc");

    if (titleEl && details.product_name) {
      titleEl.textContent = details.product_name;
    }

    if (subtitleEl && details.descriptive_tagline) {
      subtitleEl.textContent = details.descriptive_tagline;
    }

    if (descEl && details.description) {
      descEl.textContent = details.description;
    }
  }

  // ===== Header rendering =====
  // supplierBlock:  { company_name: "Aleina" }
  // categoryBlock:  { category_name: "LANYARDS & ID ACCESSORIES" }
  // productBlock:   { product_details: { sku, product_name, description, descriptive_tagline, status } }

  drawHeaders(supplierBlock, categoryBlock, productBlock) {
  //  this.drawBreadcrumbs(supplierBlock, categoryBlock, productBlock);

  //  this.drawCategoryText(categoryBlock);
    this.drawBrandText(supplierBlock);
  }

  /**
   * Breadcrumbs: company / category / product
   */
  drawBreadcrumbs(supplierBlock, categoryBlock, productBlock) {
    const breadcrumbs = document.getElementById("sp_breadcrumbs");
    if (!breadcrumbs) return;

    const companyName = supplierBlock.company_name;
    const categoryName = categoryBlock.category_name;
    const productName = productBlock.product_details.product_name;

    breadcrumbs.innerHTML = `
      <li><a href="#">${companyName}</a></li>
      <li><a href="#">${categoryName}</a></li>
      <li>${productName}</li>
    `;
  }

  /**
   * Category label in #sp_category
   */
  drawCategoryText(categoryBlock) {
    const categoryEl = document.getElementById("sp_category");
    if (!categoryEl) return;

    categoryEl.textContent = categoryBlock.category_name;
  }

  /**
   * Brand/company name in #sp-brand
   */
  drawBrandText(supplierBlock) {
    const brandEl = document.getElementById("sp-brand");
    if (!brandEl) return;

    brandEl.textContent = supplierBlock.company_name;
  }



  /**
   * Handle a variation selection:
   * - Visual selection state (within the group)
   * - Update label <strong> for the group
   * - Render images / items / prices for the selected variation
   */
  selectVariation(variationId, extraClass, indexSelected, variationsBlock) {
    // 1) Visual selection (only for the passed group class)
    const baseClass = (extraClass || "").split(" ")[0];

    // Will point to the <strong> label for the current group so we can update the displayed value
    let strongEl = null;

    if (baseClass) {
      const buttons = document.querySelectorAll("." + baseClass);
      buttons.forEach(b => b.classList.remove("is-selected"));
      buttons[indexSelected]?.classList.add("is-selected");

      // group is derived from: "button_variation_${group}"
      const group = baseClass.replace(/^button_variation_/, "");
      strongEl = document.getElementById(`var_label_size_${group}`);
    }

    // 2) Base list: what we cached in drawVariationsFirstLevel
    let list = this.variationsFirstLevel;
    if (!Array.isArray(list) || list.length === 0) return;

    // 3) Find the selected variation by ID
    const selected = list.find(v => String(v.variation_id) === String(variationId));
    if (!selected) return;

    // Update the displayed label for the group
    if (strongEl) strongEl.textContent = selected.name ?? "";

    // Render related blocks only when present
    if (Array.isArray(selected.images) && selected.images.length) {
      this.drawThumbImages(selected.images);
    }

    if (Array.isArray(selected.items) && selected.items.length) {
      this.drawItems(selected.items);
    }

    if (Array.isArray(selected.prices) && selected.prices.length) {
      this.drawPrices(selected.prices);
    }
  }

  /**
   * Render price bands for a selected variation
   */
  drawPrices(prices) {
    const container = document.getElementById("sp_var_group_items");
    if (!container) return;

    // Clear container
    container.innerHTML = "";

    // Empty state
    if (!Array.isArray(prices) || prices.length === 0) {
      container.innerHTML = `
        <div class="var-empty">
          <span>No price bands available for this variation.</span>
        </div>
      `;
      return;
    }

    // Render each price band as a button (first is selected by default)
    for (let i = 0; i < prices.length; i++) {
      const p = prices[i];

      const minQ = Number(p.min_quantity ?? 0);
      const maxQ = p.max_quantity === null || typeof p.max_quantity === "undefined"
        ? null
        : Number(p.max_quantity);

      // Quantity range label
      let mainValue = "";
      if (maxQ === null) {
        mainValue = `${minQ}+`;
      } else {
        mainValue = `${minQ}–${maxQ}`;
      }

      // Unit price label (always 2 decimals)
      const unitPrice = Number(p.price ?? 0);
      const unitPriceText = unitPrice.toFixed(2);
      const subText = `From £${unitPriceText} each`;

      const isSelected = i === 0;
      const selectedClass = isSelected ? " is-selected" : "";

      container.innerHTML += `
        <button
          type="button"
          class="var-option js-scale-in${selectedClass}"
          data-price-id="${p.price_id}"
          data-min-qty="${minQ}"
          data-max-qty="${maxQ === null ? "" : maxQ}"
          data-unit-price="${unitPrice}"
        >
          <span class="opt-main">${mainValue}</span>
          <span class="opt-sub">${subText}</span>
        </button>
      `;
    }
  }

  /**
   * Render items/info notes for a selected variation
   */
  drawItems(items) {
    //alert(JSON.stringify(items));

    const section = document.getElementById("sp-items-note");
    if (!section) return;

    // Clear container
    section.innerHTML = "";

    // Empty state
    if (!Array.isArray(items) || items.length === 0) {
      section.innerHTML = `
        <ul class="sp-items-list">
          <li>
            <strong class="sp-item-subtitle">Items information</strong>
            <span>No extra information for this variation.</span>
          </li>
        </ul>
      `;
      return;
    }

    // Create list container
    section.innerHTML = `
      <ul class="sp-items-list"></ul>
    `;

    const ul = section.querySelector(".sp-items-list");
    if (!ul) return;

    // Render each item as an <li>
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const name = item.name || `Item ${i + 1}`;
      const desc = item.description || "";

      ul.innerHTML += `
        <li>
          <strong class="sp-item-subtitle">${name}</strong>
          <span>${desc}</span>
        </li>
      `;
    }
  }

  /**
   * Render thumbnail images and set default main image
   */
  drawThumbImages(images) {
    const sp_thumbs = document.getElementById("sp_thumbs");
    if (!sp_thumbs) return;

    sp_thumbs.innerHTML = '';

    // Store gallery state
    this.currentImages = Array.isArray(images) ? images : [];
    this.currentImageIndex = 0;

    // Empty state: placeholder thumb + clear main image
    if (!Array.isArray(images) || images.length === 0) {
      sp_thumbs.innerHTML = `
        <button type="button"
                class="sp-thumb js-scale-in"
                role="listitem"
                data-type="image"
                data-src="">
          <img src="https://via.placeholder.com/200x80?text=No+image"
              alt="No image available">
        </button>
      `;

      this.changeMainImage('', 'No image available');
      return;
    }

    const BASE_PATH = "../../";

    // Render each thumb button
    for (let i = 0; i < images.length; i++) {
      const imgObj = images[i];
      const src = BASE_PATH + imgObj.link;
      const alt = `Product image ${i + 1}`;

      sp_thumbs.innerHTML += `
        <button type="button"
                class="sp-thumb js-scale-in"
                role="listitem"
                data-type="image"
                data-src="${src}"
                onclick="previewLogic.changeMainImage('${src}', '${alt}')">
          <img src="${src}"
              alt="${alt}">
        </button>
      `;
    }

    // Default main image: first image
    const firstSrc = BASE_PATH + images[0].link;
    this.changeMainImage(firstSrc, "Product image 1");
  }

  /**
   * Advance to the next image in the gallery (loops around)
   */
  nextImage() {
    const images = this.currentImages || [];
    if (!Array.isArray(images) || images.length === 0) return;

    this.currentImageIndex = (this.currentImageIndex + 1) % images.length;

    const BASE_PATH = "../../";
    const imgObj = images[this.currentImageIndex];
    const src = BASE_PATH + imgObj.link;
    const alt = `Product image ${this.currentImageIndex + 1}`;

    this.changeMainImage(src, alt);
  }

  /**
   * Replace the main media area with the provided image
   */
  changeMainImage(src, altText = "Product image") {
    const sp_main = document.getElementById("sp_main");
    if (!sp_main) return;

    if (!src) {
      sp_main.innerHTML = '<div class="cp-empty">No media</div>';
      return;
    }

    sp_main.innerHTML = `
      <img src="${src}" alt="${altText}">
    `;
  }
}

// Single instance (global usage for inline onclick handlers)
const previewLogic = new PreviewLogic();
// getDataProduct() {
//   // 1) Get SKU from the URL query string
//   const params = new URLSearchParams(window.location.search);
//   const sku = params.get("sku");
//
//   //alert(sku);
//
//   if (!sku) {
//     console.warn("No SKU in URL");
//     return;
//   }
//
//   // 2) Prepare request (server endpoint + payload)
//   const url = "../../controller/order/product.php";
//   const data = {
//     action: "get_preview_product_details",
//     sku: sku
//   };
//
//   // 3) Make the request
//   fetch(url, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data)
//   })
//     .then(response => {
//       if (!response.ok) {
//         throw new Error("Network error.");
//       }
//       return response.text();
//     })
//     .then(text => {
//
//       alert("raro" + text);
//       let json;
//
//       // 4) Parse JSON with error handling
//       try {
//         json = JSON.parse(text);
//       } catch (e) {
//         console.error("Invalid JSON:", e, text);
//         return;
//       }
//
//       if (!Array.isArray(json)) {
//         console.error("Unexpected JSON format:", json);
//         return;
//       }
//
//       // Helper: find the first block containing a given key
//       const findBlock = (key) => json.find(obj => obj && obj[key]) || null;
//
//       const supplierBlock = findBlock("company_name");
//       const categoryBlock = findBlock("category_name");
//       const productBlock = findBlock("product_details");
//       const variationsBlock = findBlock("Variations");
//
//       // Clear variations section before rendering (if present)
//       const section_variations = document.getElementById("section_variations");
//       if (section_variations) {
//         section_variations.innerHTML = "";
//       }
//
//       // Debug: inspect the variations payload
//     //  alert(JSON.stringify(variationsBlock));
//
//       // alert(JSON.stringify(variationsBlock.Variations.Default));
//
//       /**
//        * Group variations (Default) by "group"
//        */
//       const list = variationsBlock?.Variations?.Default ?? [];
//
//       // Unique group names (fallback to UNGROUPED)
//       const groupNames = [...new Set(list.map(v => (v?.group || "UNGROUPED").trim()))];
//
//       // [{ group: "WIDTH", items: [...] }, ...]
//       let detailsByGroup = [];
//
//       // 1) Initialise container for each group
//       for (let j = 0; j < groupNames.length; j++) {
//         detailsByGroup.push({
//           group: groupNames[j],
//           items: []
//         });
//       }
//
//       // 2) Assign each variation to its matching group
//       for (let i = 0; i < list.length; i++) {
//         const v = list[i];
//         const g = (v?.group || "UNGROUPED").trim();
//
//         const index = detailsByGroup.findIndex(x => x.group === g);
//
//         if (index !== -1) {
//           detailsByGroup[index].items.push(v);
//         }
//       }
//
//       // 5) Render header + product details
//       this.drawHeaders(supplierBlock, categoryBlock, productBlock);
//       this.drawProductDetails(productBlock);
//
//       // 6) Render each first-level variation group
//       for (let k = 0; k < detailsByGroup.length; k++) {
//         this.drawVariationsFirstLevel(groupNames[k], detailsByGroup[k].items);
//
//         // alert(JSON.stringify(detailsByGroup[k].items + " " + groupNames[k]));
//       }
//
//       ;
//     })
//     .catch(error => {
//       console.error("Error fetching preview:", error);
//       alert("Error loading preview data.");
//     });
// }








/**
 * Draw first-level variations (e.g. WIDTH) into #section_variations
 * variationsBlock is the array of variations for the given group.
 */
// drawVariationsFirstLevel(group, variationsBlock, selectedIndex = 0) {
//   // alert(JSON.stringify(variationsBlock))
//
//   const section = document.getElementById("section_variations");
//   if (!section) return;
//
//   /**
//    * Keep a flat cache of all first-level variations so selectVariation()
//    * can find the selected variation by ID later.
//    * Important: we remove any previous entries for this group, then append the new ones.
//    */
//   if (!Array.isArray(this.variationsFirstLevel)) this.variationsFirstLevel = [];
//   this.variationsFirstLevel = this.variationsFirstLevel
//     .filter(v => v?.group !== group)
//     .concat(variationsBlock || []);
//
//   const labelId = `var_label_size_${group}`;
//   const idGroup = `sp_var_group_size_${group}`;
//
//   // Append group container (do not overwrite other groups)
//   section.innerHTML += `<div class="var-group" aria-labelledby="${labelId}">
//       <div  class="var-label">
//         <span class="var-name">${group}</span>
//         <strong id="${labelId}">${variationsBlock?.[selectedIndex]?.name ?? ""}</strong>
//       </div>
//
//       <div class="var-options" id="${idGroup}">
//       </div>
//     </div>`;
//
//   const sectionGroup = document.getElementById(idGroup);
//   if (!sectionGroup) return;
//
//   var imageButton = '';
//
//   // Encode variationsBlock safely for inline onclick usage
//   const vbEnc = encodeURIComponent(JSON.stringify(variationsBlock || []));
//
//   // Render each option button
//   for (var i = 0; i < variationsBlock.length; i++) {
//     imageButton = variationsBlock[i]?.details?.image
//       ? `src=../../${variationsBlock[i].details.image}`
//       : '';
//
//     const selectedClass = i === selectedIndex ? " is-selected" : "";
//
//     sectionGroup.innerHTML += `
//         <button id="${variationsBlock[i].variation_id}"
//           onclick="previewLogic.selectVariation('${variationsBlock[i].variation_id}', 'button_variation_${group}', ${i}, '${vbEnc}')"
//           type="button"
//           class="var-option js-scale-in button_variation_${group}${selectedClass}">
//           <img class="var-thumb"
//                ${imageButton}
//                alt="Slim lanyard sample">
//           <span class="opt-main">${variationsBlock[i].name}</span>
//         </button>
//       `;
//   }
// }
