// preview_logic.js

class PreviewLogic {
  constructor() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.getDataProduct());
    } else {
      this.getDataProduct();
    }
  }

  getDataProduct() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    if (!sku) {
      console.warn("No SKU in URL");
      return;
    }

    const url = "../../controller/order/product.php";
    const data = {
      action: "get_preview_product_details",
      sku: sku
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network error.");
        return response.text();
      })
      .then((text) => {
        const json = JSON.parse(text);

        const company_name  = (json.find(x => x.company_name)?.company_name) ?? "";
        const category_name = (json.find(x => x.category_name)?.category_name) ?? "";
        const group_name    = (json.find(x => x.group_name)?.group_name) ?? "";
        const default_variation_id = (json.find(x => x.default_variation_id)?.default_variation_id) ?? "";

        const product_details = (json.find(x => x.product_details)?.product_details) ?? {};
        const product_name = product_details.product_name ?? "";
        const descriptive_tagline = product_details.descriptive_tagline ?? "";
        const description = product_details.description ?? "";

        this.renderBreadcrumb(category_name, group_name);
        this.renderSectionLabel(category_name);
        this.renderProductTitle(product_name);
        this.renderBrandName(company_name);
        this.renderTagline(descriptive_tagline);
        this.renderDescription(description);

        this.deleteGroupsContent();

        this.fetchChildVariationsById(default_variation_id);
      })
      .catch((error) => {
        console.error("Error fetching preview:", error);
        alert("Error loading preview data.");
      });
  }

  deleteGroupsContent() {
    const wrapVariationsGroup = document.querySelector("#wrap-variations-group");
    const wrapImagesGroup     = document.querySelector("#wrap-images-group");
    const wrapItemsGroup      = document.querySelector("#wrap-items-group");
    const wrapPricesGroup     = document.querySelector("#wrap-prices-group");
    const wrapArtworksGroup   = document.querySelector("#wrap-artworks-group");

    if (wrapVariationsGroup) wrapVariationsGroup.innerHTML = "";
    if (wrapImagesGroup)     wrapImagesGroup.innerHTML = "";
    if (wrapItemsGroup)      wrapItemsGroup.innerHTML = "";
    if (wrapPricesGroup)     wrapPricesGroup.innerHTML = "";
    if (wrapArtworksGroup)   wrapArtworksGroup.innerHTML = "";

    window.previewGallery?.clearGallery?.();
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
      console.warn("No variation_id provided");
      return;
    }

    const url = "../../controller/order/product.php";
    const data = {
      action: "get_variation_children_by_id",
      variation_id: variation_id
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network error.");
        return response.text();
      })
      .then((text) => {
        alert(text);
        const json = JSON.parse(text);

        const variationTypes  = json.variationTypes || [];
        const childVariations = json.childVariations || [];
        const variationTypesForDelete = json.variationTypesForDelete || [];

        //  alert(JSON.stringify(variationTypesForDelete));

        // ✅ 1) BORRAR LO QUE YA EXISTE (por type) antes de volver a pintar
        if (variationTypesForDelete.length) {
          this.organizeVariationsForDelete(variationTypesForDelete);
        }

        // ✅ 2) PINTAR NUEVO
        if (childVariations.length && variationTypes.length) {
          this.organizeVariationsForRender(childVariations, variationTypes);
        }
          loader.hide();
      })
      .catch((error) => {
        console.error("Error fetching preview:", error);
        alert("Error loading preview data.");
      });
  }

  /* ============================================================================
    ✅ organizeVariationsForDelete(variationTypes)
    - Recorre tipos y elimina wrappers por type_id
  ============================================================================ */
  organizeVariationsForDelete(variationTypes = []) {
    //alert(JSON.stringify(variationTypes));
    if (!Array.isArray(variationTypes) || variationTypes.length === 0) return;

    for (const tv of variationTypes) {
      const typeId = tv?.type_id ?? null; // conserva null

      this.deleteVariations(typeId);
      this.deleteItems(typeId);
      this.deleteImages(typeId);
      this.deletePrices(typeId);
      this.deleteArtwork(typeId);
    }
  }

  organizeVariationsForRender(childVariations = [], variationTypes = []) {
    for (const typeVariation of variationTypes) {
      const typeName = typeVariation?.type_name ?? null;

      const variationsOnlyOfType = [];
      const itemsOnlyOfType      = [];
      const imagesOnlyOfType     = [];
      const pricesOnlyOfType     = [];
      const artworksOnlyOfType   = [];

      for (const row of childVariations) {
        const v = row?.variation;
        if (!v) continue;

        const vTypeName = v?.type_name ?? null;

        if (vTypeName === typeName) {
          variationsOnlyOfType.push(v);

          if (Array.isArray(row?.items) && row.items.length) {
            itemsOnlyOfType.push(...row.items);
          }

          if (Array.isArray(row?.images) && row.images.length) {
            imagesOnlyOfType.push(...row.images);
          }

          if (Array.isArray(row?.prices) && row.prices.length) {
            pricesOnlyOfType.push(...row.prices);
          }

          const art = row?.artwork ?? null;
          if (art) {
            const pdf  = String(art?.pdf_artwork ?? "").trim();
            const name = String(art?.name_pdf_artwork ?? "").trim();
            if (pdf || name) {
              artworksOnlyOfType.push({
                ...art,
                variation_id: v?.variation_id ?? null,
              });
            }
          }
        }
      }

      this.renderVariations(variationsOnlyOfType, typeVariation);
      this.renderItems(itemsOnlyOfType, typeVariation);
      this.renderImages(imagesOnlyOfType, typeVariation);
      this.renderPrices(pricesOnlyOfType, typeVariation);
      this.renderArtwork(artworksOnlyOfType, typeVariation);
    }

    // ✅ PACK SIZE: dejar SOLO 1 seleccionado, el primero en general
  //  window.previewGallery?.selectFirstPackSize?.();

    // ✅ Gallery: reconstruir desde el DOM recién inyectado (force=true)
    //window.previewGallery?.rebuildGalleryFromDom?.(0, true);
  }

  renderVariations(childVariationsOfType = [], typeVariation) {
    const parent = document.getElementById("wrap-variations-group");
    if (!parent) return;

    const typeId    = typeVariation?.type_id ?? "null";
    const labelId   = `var_label_size_${typeId}`;
    const optionsId = `var-options-${typeId}`;

    const existing = parent.querySelector(`.wrap-variations[data-type-id="${typeId}"]`);
    if (existing) existing.remove();

    const typeName = String(typeVariation?.type_name ?? "").trim();
    if (!typeName) return;

    const firstLabel = String(childVariationsOfType?.[0]?.name ?? "").trim();

    let buttonsHtml = "";
    let firstDomId = ""; // primer botón

    for (let i = 0; i < childVariationsOfType.length; i++) {
      const v = childVariationsOfType[i];

      const variationId = String(v?.variation_id ?? "").trim();
      const rawImg = String(v?.image ?? "").trim().replace(/^\/+/, "");

      const imgSrc = rawImg
        ? (
            rawImg.startsWith("http") || rawImg.startsWith("data:") || rawImg.startsWith("blob:")
              ? rawImg
              : (rawImg.startsWith("controller/")
                  ? "../../" + rawImg
                  : "../../controller/" + rawImg)
          )
        : "https://upload.wikimedia.org/wikipedia/commons/6/6d/Various_lanyards.jpg";

      const label = String(v?.name ?? "");
      const selectedClass = (i === 0) ? " is-selected" : "";

      const domId = variationId ? `variation_id_${variationId}` : "";

      // Guardar el primero (aunque esté vacío, lo guardamos igual)
      if (i === 0) firstDomId = domId;

      buttonsHtml += `
        <button
          type="button"
          class="var-option js-scale-in${selectedClass}"
          ${domId ? `id="${domId}"` : ""}
          ${domId ? `onclick="previewLogic.SelectVariation('${domId}')"` : ""}
        >
          <img class="var-thumb" src="${imgSrc}" alt="Option sample">
          <span class="opt-main">${label}</span>
        </button>
      `;
    }

    const blockHtml = `
      <div class="wrap-variations" aria-labelledby="${labelId}" data-type-id="${typeId}">
        <div class="var-label">
          <span class="var-name">${typeName}</span>
          <strong id="${labelId}">${firstLabel || ""}</strong>
        </div>

        <div class="var-options" id="${optionsId}">
          ${buttonsHtml}
        </div>
      </div>
    `;

    parent.insertAdjacentHTML("beforeend", blockHtml);

    // ✅ SIN IF: llamar sí o sí
    setTimeout(() => {
      previewLogic.SelectVariation(firstDomId);
    }, 0);

    window.previewGallery?.updatePrice?.();
  }




  /* ============================================================================
    ✅ NEW: SelectVariation(domId)
    - domId llega como: "variation_id_6"
    - Extrae el variation_id (ej: 6)
    - Aquí decides qué hacer: por ahora alerta + ejemplo de llamada
  ============================================================================ */
  SelectVariation(domId = "") {
    loader.show();


    const id = String(domId || "").trim();
    if (!id) return;

    // Esperado: "variation_id_6"
    const variationId = id.replace(/^variation_id_/, "").trim();
    if (!variationId) return;

    // ✅ correr fetch después de 1 segundo
    setTimeout(() => {
      this.fetchChildVariationsById(variationId);
    }, 1000);


  }



  renderItems(itemsOnlyOfType = [], typeVariation) {

  //  alert(JSON.stringify(itemsOnlyOfType) + JSON.stringify(typeVariation));
    const parent = document.getElementById("wrap-items-group");
    if (!parent) return;

    const typeId = typeVariation?.type_id ?? "null";
    const wrapId = `wrap-items-${typeId}`;

    const existing = parent.querySelector(`.wrap-items[data-type-id="${typeId}"]`);
    if (existing) existing.remove();

    const typeName = String(typeVariation?.type_name ?? "").trim();
    if (!typeName) return;

    if (!Array.isArray(itemsOnlyOfType) || itemsOnlyOfType.length === 0) return;

    let itemsHtml = "";
    for (const it of itemsOnlyOfType) {
      const title = String(it?.name ?? "").trim();
      const desc  = String(it?.description ?? "").trim();

      itemsHtml += `
        <div class="sp-item">
          <strong class="sp-item-subtitle">${title}</strong>
          <span>${desc}</span>
        </div>
      `;
    }

    const blockHtml = `
      <div class="wrap-items" id="${wrapId}" data-type-id="${typeId}">
        ${itemsHtml}
      </div>
    `;

    parent.insertAdjacentHTML("beforeend", blockHtml);
  }

  renderImages(imagesOnlyOfType = [], typeVariation) {
    const parent = document.getElementById("wrap-images-group");
    if (!parent) return;

    if (!Array.isArray(imagesOnlyOfType) || imagesOnlyOfType.length === 0) return;

    const typeId = String(typeVariation?.type_id ?? "null");
    const wrapId = `wrap-images-${typeId}`;

    // ✅ Buscar el wrapper SOLO dentro del parent (para evitar que coja otro igual en otra parte)
    let wrapper = parent.querySelector(`#${CSS.escape(wrapId)}`);

    // ✅ Si no existe, lo creamos sin borrar nada del parent
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "wrap-images";
      wrapper.id = wrapId;
      wrapper.dataset.typeId = typeId;
      parent.appendChild(wrapper);
    }

    // ✅ Limpia solo este wrapper (no borra otros types)
    wrapper.innerHTML = "";

    // ✅ Agregar imágenes dentro del wrapper
    for (let i = 0; i < imagesOnlyOfType.length; i++) {
      const imgObj = imagesOnlyOfType[i];

      const rawLink = String(imgObj?.link ?? "").trim().replace(/^\/+/, "");
      const src = rawLink
        ? (rawLink.startsWith("http") || rawLink.startsWith("data:") || rawLink.startsWith("blob:")
            ? rawLink
            : (rawLink.startsWith("controller/") ? "../../" + rawLink : "../../controller/" + rawLink))
        : "";

      if (!src) continue;

      const img = document.createElement("img");
      img.className = "preview-media";
      img.src = src;
      img.alt = `Preview image ${i + 1}`;
      img.loading = "lazy";
      img.decoding = "async";

      wrapper.appendChild(img);
    }
  }

  renderPrices(pricesOnlyOfType = [], typeVariation) {
  //  alert(JSON.stringify(pricesOnlyOfType));

    const parent = document.getElementById("wrap-prices-group");
    if (!parent) return;

    const typeId = String(typeVariation?.type_id ?? "null");
    const wrapId = `wrap-price-${typeId}`;

    const existing = parent.querySelector(`.wrap-price[data-type-id="${typeId}"]`);
    if (existing) existing.remove();

    if (!Array.isArray(pricesOnlyOfType) || pricesOnlyOfType.length === 0) return;

    let buttonsHtml = "";

    for (const p of pricesOnlyOfType) {
      const priceId = String(p?.price_id ?? "").trim();
      const minQty  = String(p?.min_quantity ?? "").trim();
      const maxQty  = String(p?.max_quantity ?? "").trim();
      const price   = String(p?.price ?? "").trim();

      if (maxQty === "") continue; // solo renderizamos si hay max_quantity

      // Botón: texto = max_quantity | value = price
      // También guardamos todo en data-* para enviarlo en el click
      buttonsHtml += `
        <button
          type="button"
          class="var-option js-scale-in js-price-option"
          value="${price}"
          data-price-id="${priceId}"
          data-min-quantity="${minQty}"
          data-max-quantity="${maxQty}"
          data-price="${price}"
        >
          <span class="opt-main">${maxQty}</span>
        </button>
      `;
    }

    if (!buttonsHtml.trim()) return;

    const blockHtml = `
      <div class="wrap-price" id="${wrapId}" data-type-id="${typeId}">
        ${buttonsHtml}
      </div>
    `;

    parent.insertAdjacentHTML("beforeend", blockHtml);

    // Activar clicks (solo dentro de este wrap)
    this.bindPriceButtons(`#${wrapId}`);
  }

  /* ============================================================================
    bindPriceButtons(scopeSelector)
  ============================================================================ */
  bindPriceButtons(scopeSelector) {
    const scope = document.querySelector(scopeSelector);
    if (!scope) return;

    const buttons = Array.from(scope.querySelectorAll(".js-price-option"));
    for (const btn of buttons) {
      btn.addEventListener("click", (e) => {
        const el = e.currentTarget;

        const payload = {
          price_id: String(el.dataset.priceId ?? ""),
          min_quantity: String(el.dataset.minQuantity ?? ""),
          max_quantity: String(el.dataset.maxQuantity ?? ""),
          price: String(el.dataset.price ?? ""),
          value: String(el.value ?? ""), // value del botón = price
        };

        this.onPriceSelected(payload);
      });
    }
  }

  /* ============================================================================
    onPriceSelected(payload)
  ============================================================================ */
  onPriceSelected(payload) {
    alert(
      "PRICE SELECTED:\n" +
      "price_id: " + payload.price_id + "\n" +
      "min_quantity: " + payload.min_quantity + "\n" +
      "max_quantity: " + payload.max_quantity + "\n" +
      "price: " + payload.price + "\n" +
      "button value: " + payload.value
    );
  }


  renderArtwork(artworksOnlyOfType = [], typeVariation) {
    const parent = document.getElementById("wrap-artworks-group");
    if (!parent) return;

    const typeId = typeVariation?.type_id ?? "null";
    const wrapId = `wrap-artworks-${typeId}`;

    const existing = parent.querySelector(`.wrap-artworks[data-type-id="${typeId}"]`);
    if (existing) existing.remove();

    const typeName = String(typeVariation?.type_name ?? "").trim();
    if (!typeName) return;

    if (!Array.isArray(artworksOnlyOfType) || artworksOnlyOfType.length === 0) return;

    let artHtml = "";

    for (const a of artworksOnlyOfType) {
      const name = String(a?.name_pdf_artwork ?? "").trim();
      const rawPdf = String(a?.pdf_artwork ?? "").trim().replace(/^\/+/, "");

      if (!name && !rawPdf) continue;

      const pdfSrc = rawPdf
        ? (
            rawPdf.startsWith("http") || rawPdf.startsWith("data:") || rawPdf.startsWith("blob:")
              ? rawPdf
              : (rawPdf.startsWith("controller/")
                  ? "../../" + rawPdf
                  : "../../controller/" + rawPdf)
          )
        : "";

      artHtml += `
        <div class="sp-artwork">
          ${name ? `<strong class="sp-artwork-name">${name}</strong>` : ""}
          ${pdfSrc ? `<a class="sp-artwork-link" href="${pdfSrc}" target="_blank" rel="noopener">Open PDF</a>` : ""}
        </div>
      `;
    }

    if (!artHtml.trim()) return;

    const blockHtml = `
      <div class="wrap-artworks" id="${wrapId}" data-type-id="${typeId}">
        ${artHtml}
      </div>
    `;

    parent.insertAdjacentHTML("beforeend", blockHtml);
  }

  /* ============================================================================
    DELETE helpers — remove the “wrapper by type”
  ============================================================================ */


  deleteVariations(id_type) {
    alert(JSON.stringify(id_type));
    const typeId = (id_type === null || id_type === undefined) ? "null" : String(id_type);

    // ✅ Selecciona TODOS los elementos con data-type-id = typeId
    const nodes = document.querySelectorAll(`[data-type-id="${CSS.escape(typeId)}"]`);
    if (!nodes || nodes.length === 0) return;

    // ✅ Vacía el contenido interno, sin borrar el contenedor
    for (const el of nodes) {
      el.innerHTML = "";
    }
  }


  deleteItems(typeId) {
    const id = (typeId === null || typeId === undefined) ? "null" : String(typeId);
    document.getElementById(`wrap-items-${id}`)?.remove();
  }

  deleteImages(typeId) {
    //alert(typeId);
    const id = (typeId === null || typeId === undefined) ? "null" : String(typeId);
    document.getElementById(`wrap-images-${id}`)?.remove();
  }

  deletePrices(typeId) {
    const id = (typeId === null || typeId === undefined) ? "null" : String(typeId);
    document.getElementById(`wrap-price-${id}`)?.remove();
  }

  deleteArtwork(typeId) {
    const id = (typeId === null || typeId === undefined) ? "null" : String(typeId);
    document.getElementById(`wrap-artworks-${id}`)?.remove();
  }
}

const previewLogic = new PreviewLogic();
