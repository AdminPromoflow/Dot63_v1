// variations.js

class Variations {
  constructor(previewLogic) {
    this.previewLogic = previewLogic;
    this.variationSelected = null;
    this.shouldDeleteItems = false;
    this.autoLoadedVariationIds = new Set();
  }

  init() {
    this.bindVariationCollapse();
  }

  reset() {
    this.variationSelected = null;
    this.shouldDeleteItems = false;
    this.autoLoadedVariationIds.clear();
  }

  bindVariationCollapse() {
    const parent = document.getElementById("wrap-variations-group");

    if (!parent || parent.dataset.collapseBound === "1") return;

    parent.dataset.collapseBound = "1";

    parent.addEventListener("click", (event) => {
      const header = event.target.closest(".var-collapse-header");

      if (!header || !parent.contains(header)) return;

      const group = header.closest(".wrap-variations");

      if (!group) return;

      const isOpen = group.classList.contains("is-open");

      group.classList.toggle("is-open", !isOpen);
      header.setAttribute("aria-expanded", String(!isOpen));
    });
  }

  openVariationGroup(group) {
    if (!group) return;

    const groups = document.querySelectorAll("#wrap-variations-group .wrap-variations.is-collapsible");

    groups.forEach((item) => {
      if (item === group) return;

      item.classList.remove("is-open");

      const header = item.querySelector(".var-collapse-header");

      if (header) header.setAttribute("aria-expanded", "false");
    });

    group.classList.add("is-open");

    const header = group.querySelector(".var-collapse-header");

    if (header) header.setAttribute("aria-expanded", "true");
  }

  updateVariationHeader(group, selectedText) {
    if (!group) return;

    const selectedLabel = group.querySelector(".js-selected-variation-label");
    const summaryPill = group.querySelector(".variation-summary-pill");

    if (selectedLabel) {
      selectedLabel.textContent = selectedText || "Select option";
    }

    if (summaryPill) {
      summaryPill.textContent = selectedText ? `Selected: ${selectedText}` : "Select an option";
    }
  }

  fetchChildVariationsById(variationId) {
    const currentVariationId = String(variationId ?? "").trim();

    if (!currentVariationId) {
      console.warn("No variation_id provided");
      return;
    }

    const url = "../../controller/order/product.php";

    const data = {
      action: "get_variation_children_by_id",
      variation_id: currentVariationId
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network error.");
        }

        return response.text();
      })
      .then((text) => {
        const json = JSON.parse(text);

        const variationTypes = Array.isArray(json?.variationTypes) ? json.variationTypes : [];
        const childVariations = Array.isArray(json?.childVariations) ? json.childVariations : [];
        const variationTypesForDelete = Array.isArray(json?.variationTypesForDelete)
          ? json.variationTypesForDelete
          : [];

        const currentVariationData =
          json?.currentVariationData && typeof json.currentVariationData === "object"
            ? json.currentVariationData
            : {};

        this.shouldDeleteItems = variationTypesForDelete.length > 0;

        /*
         * Muestra los recursos de la variación consultada:
         * image, item, price y artwork.
         */
        this.organizeCurrentVariation(currentVariationData);

        if (childVariations.length > 0 && variationTypes.length > 0) {
          /*
           * Dibuja solamente los botones.
           * No dibuja los recursos de todas las opciones.
           */
          this.organizeVariationsForRender(childVariations, variationTypes);

          /*
           * Selecciona automáticamente la primera opción
           * y muestra sus recursos.
           */
          this.autoLoadFirstChildVariation(
            childVariations,
            variationTypes,
            currentVariationId
          );

          return;
        }

        this.finishPrices();
      })
      .catch((error) => {
        console.error("Error fetching child variations:", error);
      });
  }

  autoLoadFirstChildVariation(childVariations = [], variationTypes = [], currentVariationId = "") {
    if (!Array.isArray(childVariations) || childVariations.length === 0) {
      return false;
    }

    const currentId = String(currentVariationId ?? "").trim();
    const firstTypeName = String(variationTypes?.[0]?.type_name ?? "").trim();

    let selectedRow = null;

    /*
     * Primero intenta encontrar la primera variación
     * del primer tipo recibido.
     */
    for (const row of childVariations) {
      const variation = row?.variation;

      if (!variation) continue;

      const variationId = String(variation?.variation_id ?? "").trim();
      const variationTypeName = String(variation?.type_name ?? "").trim();

      if (!variationId) continue;
      if (variationId === currentId) continue;
      if (this.autoLoadedVariationIds.has(variationId)) continue;
      if (firstTypeName && variationTypeName !== firstTypeName) continue;

      selectedRow = row;
      break;
    }

    /*
     * Si no se encontró por tipo, toma la primera
     * variación disponible.
     */
    if (!selectedRow) {
      for (const row of childVariations) {
        const variationId = String(row?.variation?.variation_id ?? "").trim();

        if (!variationId) continue;
        if (variationId === currentId) continue;
        if (this.autoLoadedVariationIds.has(variationId)) continue;

        selectedRow = row;
        break;
      }
    }

    if (!selectedRow?.variation) return false;

    const nextVariationId = String(selectedRow.variation.variation_id ?? "").trim();

    if (!nextVariationId) return false;

    const domId = `variation_id_${nextVariationId}`;
    const button = document.getElementById(domId);

    if (!button) return false;

    this.autoLoadedVariationIds.add(nextVariationId);

    window.setTimeout(() => {
      /*
       * selectedRow permite mostrar inmediatamente
       * los recursos de la primera opción.
       */
      this.selectVariation(domId, true, selectedRow);
    }, 0);

    return true;
  }

  organizeCurrentVariation(currentVariationData = {}) {
    try {
      const variation = currentVariationData?.variation ?? null;

      if (!variation) return false;

      const variationId = String(variation?.variation_id ?? "").trim();
      const typeId = String(variation?.type_id ?? "null").trim();
      const typeName = String(variation?.type_name ?? "").trim();

      if (!variationId || !typeId || !typeName) {
        return false;
      }

      this.setSelectVariation(`variation_id_${variationId}`);

      return this.renderVariationAssets({
        variation: variation,
        images: currentVariationData?.images ?? [],
        items: currentVariationData?.items ?? [],
        prices: currentVariationData?.prices ?? [],
        artwork: currentVariationData?.artwork ?? null
      });
    } catch (error) {
      console.error("Error in organizeCurrentVariation:", error);
      return false;
    }
  }

  renderVariationAssets(row = {}) {
    try {
      const variation = row?.variation ?? null;

      if (!variation) return false;

      const variationId = String(variation?.variation_id ?? "").trim();
      const typeId = String(variation?.type_id ?? "null").trim();
      const typeName = String(variation?.type_name ?? "").trim();

      if (!variationId || !typeId || !typeName) {
        return false;
      }

      const typeVariation = {
        type_id: typeId,
        type_name: typeName
      };

      const imagesOnlyOfType = Array.isArray(row?.images)
        ? row.images.map((imageData) => ({
            ...imageData,
            variation_id: variationId
          }))
        : [];

      const itemsOnlyOfType = Array.isArray(row?.items)
        ? row.items.map((itemData) => ({
            ...itemData,
            variation_id: variationId
          }))
        : [];

      const pricesOnlyOfType = Array.isArray(row?.prices)
        ? row.prices.map((priceData) => ({
            ...priceData,
            variation_id: variationId,
            price_display_mode: variation?.price_display_mode ?? null
          }))
        : [];

      const artworksOnlyOfType = [];
      const artworkData = row?.artwork ?? null;

      if (artworkData) {
        const pdf = String(artworkData?.pdf_artwork ?? "").trim();
        const name = String(artworkData?.name_pdf_artwork ?? "").trim();

        if (pdf || name) {
          artworksOnlyOfType.push({
            ...artworkData,
            variation_id: variationId
          });
        }
      }

      /*
       * Elimina únicamente los recursos anteriores
       * pertenecientes al mismo tipo.
       */
      if (typeof images !== "undefined" && typeof images.deleteImages === "function") {
        images.deleteImages(typeId);
      }

      if (typeof items !== "undefined" && typeof items.deleteItems === "function") {
        items.deleteItems(typeId);
      }

      if (typeof prices !== "undefined" && typeof prices.deletePrices === "function") {
        prices.deletePrices(typeId);
      }

      if (typeof artwork !== "undefined" && typeof artwork.deleteArtwork === "function") {
        artwork.deleteArtwork(typeId);
      }

      /*
       * Muestra los recursos de la opción seleccionada.
       */
      if (
        imagesOnlyOfType.length > 0 &&
        typeof images !== "undefined" &&
        typeof images.renderImages === "function"
      ) {
        images.renderImages(imagesOnlyOfType, typeVariation);
      }

      if (
        itemsOnlyOfType.length > 0 &&
        typeof items !== "undefined" &&
        typeof items.renderItems === "function"
      ) {
        items.renderItems(itemsOnlyOfType, typeVariation);
      }

      if (
        pricesOnlyOfType.length > 0 &&
        typeof prices !== "undefined" &&
        typeof prices.renderPrices === "function"
      ) {
        prices.renderPrices(pricesOnlyOfType, typeVariation);
      }

      if (
        artworksOnlyOfType.length > 0 &&
        typeof artwork !== "undefined" &&
        typeof artwork.renderArtwork === "function"
      ) {
        artwork.renderArtwork(artworksOnlyOfType, typeVariation);
      }

      window.previewGallery?.refreshGallery?.(true);

      return true;
    } catch (error) {
      console.error("Error rendering variation assets:", error);
      return false;
    }
  }

  organizeVariationsForRender(childVariations = [], variationTypes = []) {
    if (!Array.isArray(childVariations) || childVariations.length === 0) {
      return false;
    }

    if (!Array.isArray(variationTypes) || variationTypes.length === 0) {
      return false;
    }

    for (const typeVariation of variationTypes) {
      const typeName = String(typeVariation?.type_name ?? "").trim();

      if (!typeName) continue;

      const variationsOnlyOfType = [];

      for (const row of childVariations) {
        const variation = row?.variation;

        if (!variation) continue;

        const variationTypeName = String(variation?.type_name ?? "").trim();

        if (variationTypeName !== typeName) continue;

        variationsOnlyOfType.push(variation);
      }

      if (variationsOnlyOfType.length === 0) continue;

      /*
       * Aquí solamente se dibujan los botones.
       * Los assets se dibujan cuando la opción queda seleccionada.
       */
      this.renderVariations(variationsOnlyOfType, typeVariation);
    }

    return true;
  }

  renderVariations(childVariationsOfType = [], typeVariation = {}) {
    try {
      const parent = document.getElementById("wrap-variations-group");

      if (!parent) return false;

      if (!Array.isArray(childVariationsOfType) || childVariationsOfType.length === 0) {
        return false;
      }

      const typeId = String(typeVariation?.type_id ?? "null");
      const typeName = String(typeVariation?.type_name ?? "").trim();

      if (!typeName) return false;

      const labelId = `var-label-size-${typeId}`;
      const optionsId = `var-options-${typeId}`;
      const bodyId = `var-collapse-body-${typeId}`;

      const existing = parent.querySelector(
        `.wrap-variations[data-type-id="${CSS.escape(typeId)}"]`
      );

      if (existing) existing.remove();

      const firstLabel = String(childVariationsOfType?.[0]?.name ?? "").trim();

      let buttonsHtml = "";

      for (let index = 0; index < childVariationsOfType.length; index++) {
        const variation = childVariationsOfType[index];
        const variationId = String(variation?.variation_id ?? "").trim();
        const label = String(variation?.name ?? "").trim();

        const rawImage = String(variation?.image ?? "")
          .trim()
          .replace(/^\/+/, "");

        const imageSource = this.buildControllerAssetUrl(
          rawImage,
          "../../view/preview_porduct/img/icon_product.png"
        );

        const domId = variationId ? `variation_id_${variationId}` : "";
        const selectedClass = index === 0 ? " is-selected" : "";

        buttonsHtml += `
          <button type="button" class="var-option js-scale-in${selectedClass}" ${domId ? `id="${domId}"` : ""} data-variation-label="${this.escapeHtml(label)}" aria-pressed="${index === 0 ? "true" : "false"}" ${domId ? `onclick="previewLogic.selectVariation('${domId}')"` : ""}>
            <img class="var-thumb" src="${this.escapeHtml(imageSource)}" alt="${this.escapeHtml(label || "Option sample")}">
            <span class="opt-main">${this.escapeHtml(label)}</span>
          </button>
        `;
      }

      const blockHtml = `
        <div class="wrap-variations is-collapsible" aria-labelledby="${labelId}" data-type-id="${this.escapeHtml(typeId)}">
          <button type="button" class="var-collapse-header" aria-expanded="false" aria-controls="${bodyId}">
            <span class="var-collapse-left">
              <span class="var-collapse-title">
                <span class="var-name">${this.escapeHtml(typeName)}</span>
                <strong id="${labelId}" class="js-selected-variation-label">${this.escapeHtml(firstLabel || "Select option")}</strong>
              </span>

              <span class="variation-summary-pill">
                ${firstLabel ? `Selected: ${this.escapeHtml(firstLabel)}` : "Select an option"}
              </span>

              <span class="var-collapse-hint">Click to view available options</span>
            </span>

            <span class="var-collapse-icon" aria-hidden="true">⌄</span>
          </button>

          <div class="var-collapse-body" id="${bodyId}">
            <div class="var-collapse-inner">
              <div class="var-options" id="${optionsId}">
                ${buttonsHtml}
              </div>
            </div>
          </div>
        </div>
      `;

      parent.insertAdjacentHTML("beforeend", blockHtml);

      const newGroup = parent.querySelector(
        `.wrap-variations[data-type-id="${CSS.escape(typeId)}"]`
      );

      if (newGroup) {
        const groupsCount = parent.querySelectorAll(
          ".wrap-variations.is-collapsible"
        ).length;

        if (groupsCount === 1) {
          this.openVariationGroup(newGroup);
        }
      }

      return true;
    } catch (error) {
      console.error("Error in renderVariations:", error);
      return false;
    }
  }

  selectVariation(domId = "", automatic = false, variationRow = null) {
    const id = String(domId ?? "").trim();

    if (!id) return false;

    const variationId = id.replace(/^variation_id_/, "").trim();

    if (!variationId) return false;

    const button = document.getElementById(id);

    if (!button) return false;

    const group = button.closest(".wrap-variations");

    if (group) {
      const variationButtons = group.querySelectorAll(
        ".var-option[id^='variation_id_']"
      );

      variationButtons.forEach((item) => {
        item.classList.remove("is-selected");
        item.setAttribute("aria-pressed", "false");
      });

      button.classList.add("is-selected");
      button.setAttribute("aria-pressed", "true");

      const selectedText =
        button.dataset.variationLabel ||
        button.querySelector(".opt-main")?.textContent?.trim() ||
        "";

      this.updateVariationHeader(group, selectedText);
    }

    this.setSelectVariation(id);

    /*
     * Cuando la selección es automática, variationRow contiene
     * image, item, price y artwork de la primera opción.
     */
    if (variationRow && typeof variationRow === "object") {
      this.renderVariationAssets(variationRow);
    }

    if (!automatic) {
      this.autoLoadedVariationIds.clear();
      this.autoLoadedVariationIds.add(variationId);
    }

    this.fetchChildVariationsById(variationId);

    return true;
  }

  finishPrices() {
    if (
      typeof prices !== "undefined" &&
      typeof prices.updateVariationPrices === "function"
    ) {
      prices.updateVariationPrices();
    }

    window.setTimeout(() => {
      if (typeof prices === "undefined") return;

      if (typeof prices.selectFirstAvailablePrice === "function") {
        prices.selectFirstAvailablePrice();
      } else if (typeof prices.selectFirstPrice === "function") {
        prices.selectFirstPrice();
      }
    }, 500);
  }

  setSelectVariation(domId) {
    this.variationSelected = String(domId ?? "").trim() || null;
  }

  getSelectVariation() {
    return this.variationSelected;
  }

  getSelectedVariationId() {
    const selectedVariation = this.getSelectVariation();

    if (!selectedVariation) return null;

    const variationId = Number(
      String(selectedVariation).replace(/^variation_id_/, "")
    );

    return Number.isFinite(variationId) ? variationId : null;
  }

  getShouldDeleteItems() {
    return this.shouldDeleteItems;
  }

  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  buildControllerAssetUrl(rawPath, fallback = "") {
    const path = String(rawPath ?? "")
      .trim()
      .replace(/^\/+/, "");

    if (!path) return fallback;

    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:") ||
      path.startsWith("blob:")
    ) {
      return path;
    }

    if (path.startsWith("controller/")) {
      return `../../${path}`;
    }

    return `../../controller/${path}`;
  }
}
