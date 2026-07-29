// variations.js

class Variations {
  constructor(previewLogic) {
    this.previewLogic = previewLogic;
    this.variationSelected = null;
    this.shouldDeleteItems = false;
    this.autoLoadedVariationIds = new Set();
    this.variationRows = new Map();
  }

  init() {
    this.bindVariationCollapse();
  }

  reset() {
    this.variationSelected = null;
    this.shouldDeleteItems = false;
    this.autoLoadedVariationIds.clear();
    this.variationRows.clear();
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

    const groups = document.querySelectorAll(
      "#wrap-variations-group .wrap-variations.is-collapsible"
    );

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

    const selectedLabel = group.querySelector(
      ".js-selected-variation-label"
    );

    const summaryPill = group.querySelector(
      ".variation-summary-pill"
    );

    if (selectedLabel) {
      selectedLabel.textContent = selectedText || "Select option";
    }

    if (summaryPill) {
      summaryPill.textContent = selectedText
        ? `Selected: ${selectedText}`
        : "Select an option";
    }
  }

  fetchChildVariationsById(variationId) {
    const currentVariationId = String(
      variationId ?? ""
    ).trim();

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
        let json;

        try {
          json = JSON.parse(text);
        } catch (error) {
          console.error("Invalid variation JSON:", text);
          throw error;
        }

        const variationTypes = this.normalizeArray(
          json?.variationTypes
        );

        const childVariations = this.normalizeArray(
          json?.childVariations
        );

        const variationTypesForDelete = this.normalizeArray(
          json?.variationTypesForDelete
        );

        const currentVariationData =
          json?.currentVariationData &&
          typeof json.currentVariationData === "object"
            ? json.currentVariationData
            : {};

        this.shouldDeleteItems =
          variationTypesForDelete.length > 0;

        /*
         * Guarda todos los registros recibidos.
         */
        this.cacheVariationRows(childVariations);

        /*
         * Combina la información actual con la información
         * que ya se había guardado para esa variación.
         */
        const mergedCurrentVariation =
          this.mergeVariationData(
            currentVariationId,
            currentVariationData
          );

        this.organizeCurrentVariation(
          mergedCurrentVariation
        );

        if (
          childVariations.length > 0 &&
          variationTypes.length > 0
        ) {
          this.organizeVariationsForRender(
            childVariations,
            variationTypes
          );

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
        console.error(
          "Error fetching child variations:",
          error
        );
      });
  }

  cacheVariationRows(rows = []) {
    const normalizedRows = this.normalizeArray(rows);

    normalizedRows.forEach((row) => {
      const variationId = String(
        row?.variation?.variation_id ?? ""
      ).trim();

      if (!variationId) return;

      const previousRow =
        this.variationRows.get(variationId) ?? {};

      this.variationRows.set(
        variationId,
        this.mergeRows(previousRow, row)
      );
    });
  }

  mergeVariationData(
    variationId,
    currentVariationData = {}
  ) {
    const id = String(variationId ?? "").trim();

    const cachedRow =
      this.variationRows.get(id) ?? {};

    const currentVariation =
      currentVariationData?.variation ?? null;

    const cachedVariation =
      cachedRow?.variation ?? null;

    const variation =
      currentVariation || cachedVariation || {
        variation_id: id
      };

    return {
      variation: variation,

      images: this.preferCollection(
        currentVariationData?.images,
        cachedRow?.images
      ),

      items: this.preferCollection(
        currentVariationData?.items,
        cachedRow?.items
      ),

      prices: this.preferCollection(
        currentVariationData?.prices,
        cachedRow?.prices
      ),

      artwork: this.preferArtwork(
        currentVariationData?.artwork ??
          currentVariationData?.artworks,
        cachedRow?.artwork ??
          cachedRow?.artworks
      )
    };
  }

  mergeRows(previousRow = {}, newRow = {}) {
    return {
      ...previousRow,
      ...newRow,

      variation:
        newRow?.variation ??
        previousRow?.variation ??
        null,

      images: this.preferCollection(
        newRow?.images,
        previousRow?.images
      ),

      items: this.preferCollection(
        newRow?.items,
        previousRow?.items
      ),

      prices: this.preferCollection(
        newRow?.prices,
        previousRow?.prices
      ),

      artwork: this.preferArtwork(
        newRow?.artwork ?? newRow?.artworks,
        previousRow?.artwork ??
          previousRow?.artworks
      )
    };
  }

  preferCollection(primaryValue, fallbackValue) {
    const primary = this.normalizeArray(primaryValue);

    if (primary.length > 0) {
      return primary;
    }

    return this.normalizeArray(fallbackValue);
  }

  preferArtwork(primaryValue, fallbackValue) {
    const primary = this.normalizeArtwork(primaryValue);

    if (primary.length > 0) {
      return primary;
    }

    return this.normalizeArtwork(fallbackValue);
  }

  normalizeArray(value) {
    if (Array.isArray(value)) {
      return value.filter(
        (item) => item !== null && item !== undefined
      );
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    if (typeof value === "string") {
      const trimmedValue = value.trim();

      if (!trimmedValue) return [];

      try {
        return this.normalizeArray(
          JSON.parse(trimmedValue)
        );
      } catch (error) {
        console.warn(
          "Could not parse collection:",
          trimmedValue
        );

        return [];
      }
    }

    if (typeof value === "object") {
      return [value];
    }

    return [];
  }

  normalizeArtwork(value) {
    const artworks = this.normalizeArray(value);

    return artworks.filter((artworkData) => {
      if (!artworkData || typeof artworkData !== "object") {
        return false;
      }

      const pdf = String(
        artworkData?.pdf_artwork ??
        artworkData?.pdf ??
        artworkData?.artwork_pdf ??
        artworkData?.file ??
        artworkData?.url ??
        ""
      ).trim();

      const name = String(
        artworkData?.name_pdf_artwork ??
        artworkData?.name ??
        artworkData?.filename ??
        artworkData?.file_name ??
        ""
      ).trim();

      return Boolean(pdf || name);
    });
  }

  autoLoadFirstChildVariation(
    childVariations = [],
    variationTypes = [],
    currentVariationId = ""
  ) {
    const rows = this.normalizeArray(
      childVariations
    );

    if (rows.length === 0) {
      return false;
    }

    const currentId = String(
      currentVariationId ?? ""
    ).trim();

    const firstTypeId = String(
      variationTypes?.[0]?.type_id ?? ""
    ).trim();

    const firstTypeName = String(
      variationTypes?.[0]?.type_name ?? ""
    ).trim();

    let selectedRow = null;

    for (const row of rows) {
      const variation = row?.variation;

      if (!variation) continue;

      const variationId = String(
        variation?.variation_id ?? ""
      ).trim();

      const variationTypeId = String(
        variation?.type_id ?? ""
      ).trim();

      const variationTypeName = String(
        variation?.type_name ?? ""
      ).trim();

      if (!variationId) continue;
      if (variationId === currentId) continue;

      if (
        this.autoLoadedVariationIds.has(
          variationId
        )
      ) {
        continue;
      }

      if (
        firstTypeId &&
        variationTypeId &&
        variationTypeId !== firstTypeId
      ) {
        continue;
      }

      if (
        !firstTypeId &&
        firstTypeName &&
        variationTypeName !== firstTypeName
      ) {
        continue;
      }

      selectedRow = row;
      break;
    }

    if (!selectedRow) {
      selectedRow = rows.find((row) => {
        const variationId = String(
          row?.variation?.variation_id ?? ""
        ).trim();

        return (
          variationId &&
          variationId !== currentId &&
          !this.autoLoadedVariationIds.has(
            variationId
          )
        );
      });
    }

    if (!selectedRow?.variation) {
      return false;
    }

    const nextVariationId = String(
      selectedRow.variation.variation_id ?? ""
    ).trim();

    if (!nextVariationId) return false;

    const domId =
      `variation_id_${nextVariationId}`;

    const button =
      document.getElementById(domId);

    if (!button) return false;

    this.variationRows.set(
      nextVariationId,
      this.mergeRows(
        this.variationRows.get(
          nextVariationId
        ) ?? {},
        selectedRow
      )
    );

    this.autoLoadedVariationIds.add(
      nextVariationId
    );

    window.setTimeout(() => {
      this.selectVariation(
        domId,
        true,
        selectedRow
      );
    }, 0);

    return true;
  }

  organizeCurrentVariation(
    currentVariationData = {}
  ) {
    try {
      const variation =
        currentVariationData?.variation ?? null;

      if (!variation) return false;

      const variationId = String(
        variation?.variation_id ?? ""
      ).trim();

      if (!variationId) return false;

      this.setSelectVariation(
        `variation_id_${variationId}`
      );

      return this.renderVariationAssets(
        currentVariationData
      );
    } catch (error) {
      console.error(
        "Error organizing current variation:",
        error
      );

      return false;
    }
  }

  renderVariationAssets(row = {}) {
    const variation = row?.variation ?? null;

    if (!variation) return false;

    const variationId = String(
      variation?.variation_id ?? ""
    ).trim();

    const typeId = String(
      variation?.type_id ?? "null"
    ).trim();

    const typeName = String(
      variation?.type_name ?? ""
    ).trim();

    if (!variationId || !typeId) {
      return false;
    }

    const typeVariation = {
      type_id: typeId,
      type_name: typeName
    };

    const imagesData = this.normalizeArray(
      row?.images
    ).map((imageData) => ({
      ...imageData,
      variation_id: variationId
    }));

    const itemsData = this.normalizeArray(
      row?.items
    ).map((itemData) => ({
      ...itemData,
      variation_id: variationId
    }));

    const pricesData = this.normalizeArray(
      row?.prices
    ).map((priceData) => ({
      ...priceData,
      variation_id: variationId,
      price_display_mode:
        priceData?.price_display_mode ??
        variation?.price_display_mode ??
        null
    }));

    const artworkData = this.normalizeArtwork(
      row?.artwork ?? row?.artworks
    ).map((currentArtwork) => ({
      ...currentArtwork,

      pdf_artwork:
        currentArtwork?.pdf_artwork ??
        currentArtwork?.pdf ??
        currentArtwork?.artwork_pdf ??
        currentArtwork?.file ??
        currentArtwork?.url ??
        "",

      name_pdf_artwork:
        currentArtwork?.name_pdf_artwork ??
        currentArtwork?.name ??
        currentArtwork?.filename ??
        currentArtwork?.file_name ??
        "Download artwork",

      variation_id: variationId
    }));

    /*
     * Cada sección se ejecuta independientemente.
     * Si prices genera un error, images, items y artwork
     * continúan funcionando.
     */
    this.safeRender(
      "images",
      () => {
        const imagesInstance =
          window.images;

        if (!imagesInstance) return;

        imagesInstance.deleteImages?.(typeId);

        if (imagesData.length > 0) {
          imagesInstance.renderImages?.(
            imagesData,
            typeVariation
          );
        }
      }
    );

    this.safeRender(
      "items",
      () => {
        const itemsInstance =
          window.items;

        if (!itemsInstance) return;

        itemsInstance.deleteItems?.(typeId);

        if (itemsData.length > 0) {
          itemsInstance.renderItems?.(
            itemsData,
            typeVariation
          );
        }
      }
    );

    this.safeRender(
      "prices",
      () => {
        const pricesInstance =
          window.prices;

        if (!pricesInstance) return;

        pricesInstance.deletePrices?.(typeId);

        if (pricesData.length > 0) {
          pricesInstance.renderPrices?.(
            pricesData,
            typeVariation
          );
        }
      }
    );

    this.safeRender(
      "artwork",
      () => {
        const artworkInstance =
          window.artwork;

        if (!artworkInstance) return;

        artworkInstance.deleteArtwork?.(typeId);

        if (artworkData.length > 0) {
          artworkInstance.renderArtwork?.(
            artworkData,
            typeVariation
          );
        }
      }
    );

    window.previewGallery?.refreshGallery?.(
      true
    );

    return true;
  }

  safeRender(sectionName, callback) {
    try {
      callback();
    } catch (error) {
      console.error(
        `Error rendering ${sectionName}:`,
        error
      );
    }
  }

  organizeVariationsForRender(
    childVariations = [],
    variationTypes = []
  ) {
    const rows = this.normalizeArray(
      childVariations
    );

    const types = this.normalizeArray(
      variationTypes
    );

    if (rows.length === 0 || types.length === 0) {
      return false;
    }

    this.cacheVariationRows(rows);

    for (const typeVariation of types) {
      const typeId = String(
        typeVariation?.type_id ?? ""
      ).trim();

      const typeName = String(
        typeVariation?.type_name ?? ""
      ).trim();

      if (!typeId && !typeName) continue;

      const variationsOnlyOfType =
        rows
          .map((row) => row?.variation)
          .filter((variation) => {
            if (!variation) return false;

            const variationTypeId = String(
              variation?.type_id ?? ""
            ).trim();

            const variationTypeName = String(
              variation?.type_name ?? ""
            ).trim();

            if (typeId && variationTypeId) {
              return variationTypeId === typeId;
            }

            return (
              typeName &&
              variationTypeName === typeName
            );
          });

      if (
        variationsOnlyOfType.length === 0
      ) {
        continue;
      }

      this.renderVariations(
        variationsOnlyOfType,
        typeVariation
      );
    }

    return true;
  }

  renderVariations(
    childVariationsOfType = [],
    typeVariation = {}
  ) {
    try {
      const parent = document.getElementById(
        "wrap-variations-group"
      );

      if (!parent) return false;

      if (
        !Array.isArray(
          childVariationsOfType
        ) ||
        childVariationsOfType.length === 0
      ) {
        return false;
      }

      const typeId = String(
        typeVariation?.type_id ?? "null"
      );

      const typeName = String(
        typeVariation?.type_name ?? ""
      ).trim();

      if (!typeName) return false;

      const labelId =
        `var-label-size-${typeId}`;

      const optionsId =
        `var-options-${typeId}`;

      const bodyId =
        `var-collapse-body-${typeId}`;

      const existing = parent.querySelector(
        `.wrap-variations[data-type-id="${CSS.escape(typeId)}"]`
      );

      if (existing) existing.remove();

      const firstLabel = String(
        childVariationsOfType?.[0]?.name ?? ""
      ).trim();

      let buttonsHtml = "";

      for (
        let index = 0;
        index <
        childVariationsOfType.length;
        index++
      ) {
        const variation =
          childVariationsOfType[index];

        const variationId = String(
          variation?.variation_id ?? ""
        ).trim();

        const label = String(
          variation?.name ?? ""
        ).trim();

        const rawImage = String(
          variation?.image ?? ""
        )
          .trim()
          .replace(/^\/+/, "");

        const imageSource =
          this.buildControllerAssetUrl(
            rawImage,
            "../../view/preview_porduct/img/icon_product.png"
          );

        const domId = variationId
          ? `variation_id_${variationId}`
          : "";

        const selectedClass =
          index === 0
            ? " is-selected"
            : "";

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

              <span class="var-collapse-hint">
                Click to view available options
              </span>
            </span>

            <span class="var-collapse-icon" aria-hidden="true">
              ⌄
            </span>
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

      parent.insertAdjacentHTML(
        "beforeend",
        blockHtml
      );

      const newGroup = parent.querySelector(
        `.wrap-variations[data-type-id="${CSS.escape(typeId)}"]`
      );

      if (newGroup) {
        const groupsCount =
          parent.querySelectorAll(
            ".wrap-variations.is-collapsible"
          ).length;

        if (groupsCount === 1) {
          this.openVariationGroup(
            newGroup
          );
        }
      }

      return true;
    } catch (error) {
      console.error(
        "Error rendering variations:",
        error
      );

      return false;
    }
  }

  selectVariation(
    domId = "",
    automatic = false,
    variationRow = null
  ) {
    const id = String(domId ?? "").trim();

    if (!id) return false;

    const variationId = id
      .replace(/^variation_id_/, "")
      .trim();

    if (!variationId) return false;

    const button =
      document.getElementById(id);

    if (!button) return false;

    const group = button.closest(
      ".wrap-variations"
    );

    if (group) {
      const variationButtons =
        group.querySelectorAll(
          ".var-option[id^='variation_id_']"
        );

      variationButtons.forEach((item) => {
        item.classList.remove(
          "is-selected"
        );

        item.setAttribute(
          "aria-pressed",
          "false"
        );
      });

      button.classList.add("is-selected");

      button.setAttribute(
        "aria-pressed",
        "true"
      );

      const selectedText =
        button.dataset.variationLabel ||
        button
          .querySelector(".opt-main")
          ?.textContent?.trim() ||
        "";

      this.updateVariationHeader(
        group,
        selectedText
      );
    }

    this.setSelectVariation(id);

    const savedRow =
      variationRow ||
      this.variationRows.get(
        variationId
      ) ||
      null;

    if (savedRow) {
      this.renderVariationAssets(
        savedRow
      );
    }

    if (!automatic) {
      this.autoLoadedVariationIds.clear();

      this.autoLoadedVariationIds.add(
        variationId
      );
    }

    this.fetchChildVariationsById(
      variationId
    );

    return true;
  }

  finishPrices() {
    const pricesInstance =
      window.prices;

    if (!pricesInstance) return;

    this.safeRender(
      "price update",
      () => {
        pricesInstance
          .updateVariationPrices?.();
      }
    );

    window.setTimeout(() => {
      this.safeRender(
        "first price",
        () => {
          if (
            typeof pricesInstance
              .selectFirstAvailablePrice ===
            "function"
          ) {
            pricesInstance
              .selectFirstAvailablePrice();

            return;
          }

          pricesInstance
            .selectFirstPrice?.();
        }
      );
    }, 500);
  }

  setSelectVariation(domId) {
    this.variationSelected =
      String(domId ?? "").trim() ||
      null;
  }

  getSelectVariation() {
    return this.variationSelected;
  }

  getSelectedVariationId() {
    const selectedVariation =
      this.getSelectVariation();

    if (!selectedVariation) return null;

    const variationId = Number(
      String(selectedVariation).replace(
        /^variation_id_/,
        ""
      )
    );

    return Number.isFinite(variationId)
      ? variationId
      : null;
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

  buildControllerAssetUrl(
    rawPath,
    fallback = ""
  ) {
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

    if (
      path.startsWith("controller/")
    ) {
      return `../../${path}`;
    }

    return `../../controller/${path}`;
  }
}
