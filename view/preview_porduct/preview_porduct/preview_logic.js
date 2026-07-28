// preview_logic.js

class PreviewLogic {
  constructor() {
    this.variationSelected = null;
    this.max_quantity = null;
    this.shouldDeleteItems = false;
    this.priceSelected = null;

    /*
     * Stores variation requests currently being processed.
     * This prevents the same variation from being requested twice
     * at exactly the same time.
     */
    this.loadingVariationIds = new Set();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.init();
      });
    } else {
      this.init();
    }
  }

  /* ==========================================================================
     INITIALISATION
  ========================================================================== */

  init() {
    this.bindMainButtons();
    this.bindVariationButtons();
    this.getDataProduct();
  }

  /* ==========================================================================
     MAIN BUTTON EVENTS
  ========================================================================== */

  bindMainButtons() {
    const backBtn = document.getElementById("btn_back_edit");
    const publishBtn = document.getElementById("btn_publish");

    if (backBtn && backBtn.dataset.bound !== "1") {
      backBtn.dataset.bound = "1";

      backBtn.addEventListener("click", () => {
        this.backBtn();
      });
    }

    if (publishBtn && publishBtn.dataset.bound !== "1") {
      publishBtn.dataset.bound = "1";

      publishBtn.addEventListener("click", () => {
        this.publishBtn();
      });
    }
  }

  /* ==========================================================================
     VARIATION BUTTON EVENTS
     All variation groups remain visible.
  ========================================================================== */

  bindVariationButtons() {
    const parent = document.getElementById("wrap-variations-group");

    if (!parent) {
      return;
    }

    if (parent.dataset.variationBound === "1") {
      return;
    }

    parent.dataset.variationBound = "1";

    parent.addEventListener("click", (event) => {
      const button = event.target.closest(
        ".var-option[id^='variation_id_']"
      );

      if (!button || !parent.contains(button)) {
        return;
      }

      this.SelectVariation(button.id);
    });
  }

  updateVariationHeader(group, selectedText) {
    if (!group) {
      return;
    }

    const selectedLabel = group.querySelector(
      ".js-selected-variation-label"
    );

    const summaryPill = group.querySelector(
      ".variation-summary-pill"
    );

    if (selectedLabel) {
      selectedLabel.textContent =
        selectedText || "Select option";
    }

    if (summaryPill) {
      summaryPill.textContent = selectedText
        ? `Selected: ${selectedText}`
        : "Select an option";
    }
  }

  /* ==========================================================================
     GENERAL HELPERS
  ========================================================================== */

  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  buildFileUrl(rawPath, fallback = "") {
    const cleanPath = String(rawPath ?? "")
      .trim()
      .replace(/^\/+/, "");

    if (!cleanPath) {
      return fallback;
    }

    if (
      cleanPath.startsWith("http://") ||
      cleanPath.startsWith("https://") ||
      cleanPath.startsWith("data:") ||
      cleanPath.startsWith("blob:")
    ) {
      return cleanPath;
    }

    if (cleanPath.startsWith("controller/")) {
      return `../../${cleanPath}`;
    }

    return `../../controller/${cleanPath}`;
  }

  getVariationIdFromDomId(domId) {
    return String(domId ?? "")
      .replace(/^variation_id_/, "")
      .trim();
  }

  getSelectedVariationId() {
    return Number(
      this.getVariationIdFromDomId(
        this.getSelectVariation()
      )
    );
  }

  /* ==========================================================================
     PUBLISH PRODUCT
  ========================================================================== */

  publishBtn() {
    const params = new URLSearchParams(
      window.location.search
    );

    const sku = params.get("sku");

    if (!sku) {
      console.warn("No SKU in URL");
      return;
    }

    const url =
      "../../controller/products/product.php";

    const data = {
      action: "publish_product",
      sku: sku
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
        alert(text);

        try {
          JSON.parse(text);
          location.reload();
        } catch (error) {
          console.error("Invalid JSON:", error);
        }
      })
      .catch((error) => {
        console.error(
          "Error publishing product:",
          error
        );
      });
  }

  /* ==========================================================================
     BACK TO PRODUCT EDITING
  ========================================================================== */

  backBtn() {
    const url =
      "../../view/product_details/index.php";

    const current = new URL(
      window.location.href
    );

    const dest = new URL(url, current);

    const sku = current.searchParams.get("sku");
    const skuv =
      current.searchParams.get("sku_variation");

    if (sku) {
      dest.searchParams.set("sku", sku);
    }

    if (skuv) {
      dest.searchParams.set(
        "sku_variation",
        skuv
      );
    }

    window.location.assign(dest);
  }

  /* ==========================================================================
     PRODUCT INFORMATION
  ========================================================================== */

  getDataProduct() {
    const params = new URLSearchParams(
      window.location.search
    );

    const sku = params.get("sku");

    if (!sku) {
      console.warn("No SKU in URL");
      return;
    }

    const url =
      "../../controller/order/product.php";

    const data = {
      action: "get_preview_product_details",
      sku: sku
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

        const company_name =
          json.find((item) => item.company_name)
            ?.company_name ?? "";

        const category_name =
          json.find((item) => item.category_name)
            ?.category_name ?? "";

        const group_name =
          json.find((item) => item.group_name)
            ?.group_name ?? "";

        const default_variation_id =
          json.find(
            (item) => item.default_variation_id
          )?.default_variation_id ?? "";

        const product_details =
          json.find(
            (item) => item.product_details
          )?.product_details ?? {};

        const product_name =
          product_details.product_name ?? "";

        const descriptive_tagline =
          product_details.descriptive_tagline ?? "";

        const description =
          product_details.description ?? "";

        const status =
          product_details.status ?? "";

        const publishBtn =
          document.getElementById("btn_publish");

        if (
          String(status) === "2" &&
          publishBtn
        ) {
          publishBtn.style.display = "none";
        }

        this.renderBreadcrumb(
          category_name,
          group_name
        );

        this.renderSectionLabel(
          category_name
        );

        this.renderProductTitle(
          product_name
        );

        this.renderBrandName(
          company_name
        );

        this.renderTagline(
          descriptive_tagline
        );

        this.renderDescription(
          description
        );

        this.deleteGroupsContent();

        this.fetchChildVariationsById(
          default_variation_id
        );
      })
      .catch((error) => {
        console.error(
          "Error fetching preview:",
          error
        );
      });
  }

  /* ==========================================================================
     FETCH VARIATION CHILDREN
  ========================================================================== */

  fetchChildVariationsById(variation_id) {
    const cleanVariationId =
      String(variation_id ?? "").trim();

    if (!cleanVariationId) {
      console.warn(
        "No variation_id provided"
      );

      return;
    }

    if (
      this.loadingVariationIds.has(
        cleanVariationId
      )
    ) {
      return;
    }

    this.loadingVariationIds.add(
      cleanVariationId
    );

    const url =
      "../../controller/order/product.php";

    const data = {
      action: "get_variation_children_by_id",
      variation_id: cleanVariationId
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

        const variationTypes =
          json.variationTypes || [];

        const childVariations =
          json.childVariations || [];

        const variationTypesForDelete =
          json.variationTypesForDelete || [];

        const currentVariationData =
          json.currentVariationData || {};

        this.shouldDeleteItems =
          variationTypesForDelete.length > 0;

        /*
         * First update the media, items, prices and artwork
         * belonging to the currently selected variation.
         */
        this.organizeCurrentVariation(
          currentVariationData
        );

        /*
         * Remove groups that are no longer valid after
         * changing a parent variation.
         */
        this.deleteVariationTypes(
          variationTypesForDelete
        );

        if (
          childVariations.length &&
          variationTypes.length
        ) {
          this.organizeVariationsForRender(
            childVariations,
            variationTypes
          );
        } else if (
          childVariations == null ||
          childVariations.length == null ||
          childVariations.length === 0
        ) {
          /*
           * PRICE LOGIC PRESERVED.
           */
          this.updateVariationPrices();

          setTimeout(() => {
            const firstPriceButton =
              document.querySelector(
                "#wrap-prices-group .js-price-option"
              );

            if (firstPriceButton) {
              const allPriceButtons =
                document.querySelectorAll(
                  "#wrap-prices-group .js-price-option"
                );

              allPriceButtons.forEach((btn) => {
                btn.classList.remove(
                  "is-selected"
                );
              });

              this.updateProductSummaryBox(
                firstPriceButton.dataset
                  .minQuantity,
                firstPriceButton.value
              );

              firstPriceButton.classList.add(
                "is-selected"
              );

              const payload = {
                price_id: String(
                  firstPriceButton.dataset
                    .priceId ?? ""
                ),

                min_quantity: String(
                  firstPriceButton.dataset
                    .minQuantity ?? ""
                ),

                max_quantity: String(
                  firstPriceButton.dataset
                    .maxQuantity ?? ""
                ),

                price: String(
                  firstPriceButton.dataset
                    .price ?? ""
                ),

                value: String(
                  firstPriceButton.value ?? ""
                )
              };

              this.setSelectedPrice(payload);

              this.setMaxQuantity(
                payload["max_quantity"]
              );
            }
          }, 500);
        }
      })
      .catch((error) => {
        console.error(
          "Error fetching preview:",
          error
        );
      })
      .finally(() => {
        this.loadingVariationIds.delete(
          cleanVariationId
        );
      });
  }

  /* ==========================================================================
     CLEAR ALL DYNAMIC CONTENT
  ========================================================================== */

  deleteGroupsContent() {
    const wrapVariationsGroup =
      document.querySelector(
        "#wrap-variations-group"
      );

    const wrapImagesGroup =
      document.querySelector(
        "#wrap-images-group"
      );

    const wrapItemsGroup =
      document.querySelector(
        "#wrap-items-group"
      );

    const wrapPricesGroup =
      document.querySelector(
        "#wrap-prices-group"
      );

    const wrapArtworksGroup =
      document.querySelector(
        "#wrap-artworks-group"
      );

    if (wrapVariationsGroup) {
      wrapVariationsGroup.innerHTML = "";
    }

    if (wrapImagesGroup) {
      wrapImagesGroup.innerHTML = "";
    }

    if (wrapItemsGroup) {
      wrapItemsGroup.innerHTML = "";
    }

    if (wrapPricesGroup) {
      wrapPricesGroup.innerHTML = "";
    }

    if (wrapArtworksGroup) {
      wrapArtworksGroup.innerHTML = "";
    }

    this.variationSelected = null;
    this.priceSelected = null;
    this.max_quantity = null;

    window.previewGallery?.clearGallery?.();
  }

  /* ==========================================================================
     DELETE CONTENT BY VARIATION TYPE
  ========================================================================== */

  deleteVariationTypes(
    variationTypesForDelete = []
  ) {
    if (
      !Array.isArray(
        variationTypesForDelete
      )
    ) {
      return;
    }

    for (
      const variationType
      of variationTypesForDelete
    ) {
      const typeId = String(
        variationType?.type_id ??
        variationType?.variation_type_id ??
        variationType?.id ??
        ""
      ).trim();

      if (!typeId) {
        continue;
      }

      this.deleteVariationGroup(typeId);
      this.deleteImages(typeId);
      this.deleteItems(typeId);
      this.deletePrices(typeId);
      this.deleteArtwork(typeId);
    }

    window.previewGallery?.refreshGallery?.(
      true
    );
  }

  deleteVariationGroup(typeId) {
    const parent = document.getElementById(
      "wrap-variations-group"
    );

    if (!parent) {
      return false;
    }

    const group = parent.querySelector(
      `.wrap-variations[data-type-id="${CSS.escape(
        String(typeId)
      )}"]`
    );

    if (!group) {
      return false;
    }

    group.remove();

    return true;
  }

  deleteImages(typeId) {
    const wrapper = document.getElementById(
      `wrap-images-${typeId}`
    );

    if (!wrapper) {
      return false;
    }

    wrapper.remove();

    window.previewGallery?.refreshGallery?.(
      true
    );

    return true;
  }

  deleteItems(typeId) {
    const wrapper = document.getElementById(
      `wrap-items-${typeId}`
    );

    if (!wrapper) {
      return false;
    }

    wrapper.remove();

    return true;
  }

  deletePrices(typeId) {
    const wrapper = document.getElementById(
      `wrap-price-${typeId}`
    );

    if (!wrapper) {
      return false;
    }

    wrapper.remove();

    return true;
  }

  deleteArtwork(typeId) {
    const wrapper = document.getElementById(
      `wrap-artworks-${typeId}`
    );

    if (!wrapper) {
      return false;
    }

    wrapper.remove();

    return true;
  }

  /* ==========================================================================
     BASIC PRODUCT CONTENT
  ========================================================================== */

  renderBreadcrumb(
    category_name,
    group_name
  ) {
    const sp_breadcrumbs =
      document.getElementById(
        "sp_breadcrumbs"
      );

    if (!sp_breadcrumbs) {
      return;
    }

    sp_breadcrumbs.innerHTML = `
      <li>
        <a href="#">
          ${this.escapeHtml(category_name || "")}
        </a>
      </li>

      <li>
        <a href="#">
          ${this.escapeHtml(group_name || "")}
        </a>
      </li>
    `;
  }

  renderSectionLabel(category_name) {
    const sp_category =
      document.getElementById(
        "sp_category"
      );

    if (!sp_category) {
      return;
    }

    sp_category.textContent =
      category_name || "";
  }

  renderProductTitle(product_name) {
    const sp_title =
      document.getElementById(
        "sp-title"
      );

    if (!sp_title) {
      return;
    }

    sp_title.textContent =
      product_name || "";
  }

  renderBrandName(company_name) {
    const sp_brand =
      document.getElementById(
        "sp-brand"
      );

    if (!sp_brand) {
      return;
    }

    sp_brand.textContent =
      company_name || "";
  }

  renderTagline(
    descriptive_tagline
  ) {
    const sp_subtitle =
      document.getElementById(
        "sp_subtitle"
      );

    if (!sp_subtitle) {
      return;
    }

    sp_subtitle.textContent =
      descriptive_tagline || "";
  }

  renderDescription(description) {
    const sp_desc =
      document.getElementById(
        "sp_desc"
      );

    if (!sp_desc) {
      return;
    }

    sp_desc.textContent =
      description || "";
  }

  /* ==========================================================================
     ORGANISE CURRENT VARIATION CONTENT
     Updates images, items, prices and artwork for the selected variation.
  ========================================================================== */

  organizeCurrentVariation(
    currentVariationData = {}
  ) {
    try {
      const variation =
        currentVariationData?.variation ??
        null;

      if (!variation) {
        return false;
      }

      const variationId = String(
        variation?.variation_id ?? ""
      ).trim();

      const typeId = String(
        variation?.type_id ?? "null"
      ).trim();

      const typeName = String(
        variation?.type_name ?? ""
      ).trim();

      if (
        !variationId ||
        !typeId ||
        !typeName
      ) {
        return false;
      }

      const currentDomId =
        `variation_id_${variationId}`;

      this.setSelectVariation(
        currentDomId
      );

      const typeVariation = {
        type_id: typeId,
        type_name: typeName
      };

      const imagesOnlyOfType =
        Array.isArray(
          currentVariationData?.images
        )
          ? currentVariationData.images.map(
              (image) => ({
                ...image,
                variation_id: variationId
              })
            )
          : [];

      const itemsOnlyOfType =
        Array.isArray(
          currentVariationData?.items
        )
          ? currentVariationData.items.map(
              (item) => ({
                ...item,
                variation_id: variationId
              })
            )
          : [];

      const pricesOnlyOfType =
        Array.isArray(
          currentVariationData?.prices
        )
          ? currentVariationData.prices.map(
              (price) => ({
                ...price,
                variation_id: variationId,

                price_display_mode:
                  variation
                    ?.price_display_mode ??
                  null
              })
            )
          : [];

      const artworksOnlyOfType = [];

      const artwork =
        currentVariationData?.artwork ??
        null;

      if (artwork) {
        const pdf = String(
          artwork?.pdf_artwork ?? ""
        ).trim();

        const name = String(
          artwork?.name_pdf_artwork ?? ""
        ).trim();

        if (pdf || name) {
          artworksOnlyOfType.push({
            ...artwork,
            variation_id: variationId
          });
        }
      }

      /*
       * Remove the old content for this type before
       * rendering the new selected variation content.
       */
      this.deleteImages(typeId);
      this.deleteItems(typeId);
      this.deletePrices(typeId);
      this.deleteArtwork(typeId);

      if (imagesOnlyOfType.length > 0) {
        this.renderImages(
          imagesOnlyOfType,
          typeVariation
        );
      }

      if (itemsOnlyOfType.length > 0) {
        this.renderItems(
          itemsOnlyOfType,
          typeVariation
        );
      }

      if (pricesOnlyOfType.length > 0) {
        this.renderPrices(
          pricesOnlyOfType,
          typeVariation
        );
      }

      if (
        artworksOnlyOfType.length > 0
      ) {
        this.renderArtwork(
          artworksOnlyOfType,
          typeVariation
        );
      }

      window.previewGallery
        ?.refreshGallery?.(true);

      return true;
    } catch (error) {
      console.error(
        "Error in organizeCurrentVariation:",
        error
      );

      return false;
    }
  }

  /* ==========================================================================
     ORGANISE CHILD VARIATIONS
  ========================================================================== */

  organizeVariationsForRender(
    childVariations = [],
    variationTypes = []
  ) {
    if (
      !Array.isArray(childVariations) ||
      childVariations.length === 0
    ) {
      return;
    }

    if (
      !Array.isArray(variationTypes) ||
      variationTypes.length === 0
    ) {
      return;
    }

    for (
      const typeVariation
      of variationTypes
    ) {
      const typeName = String(
        typeVariation?.type_name ?? ""
      ).trim();

      if (!typeName) {
        continue;
      }

      const variationsOnlyOfType = [];
      const itemsOnlyOfType = [];
      const imagesOnlyOfType = [];
      const pricesOnlyOfType = [];
      const artworksOnlyOfType = [];

      for (
        const row
        of childVariations
      ) {
        const variation =
          row?.variation;

        if (!variation) {
          continue;
        }

        const variationTypeName =
          String(
            variation?.type_name ?? ""
          ).trim();

        if (
          variationTypeName !== typeName
        ) {
          continue;
        }

        variationsOnlyOfType.push(
          variation
        );

        if (
          Array.isArray(row?.items) &&
          row.items.length > 0
        ) {
          itemsOnlyOfType.push(
            ...row.items.map((item) => ({
              ...item,

              variation_id:
                variation?.variation_id ??
                null
            }))
          );
        }

        if (
          Array.isArray(row?.images) &&
          row.images.length > 0
        ) {
          imagesOnlyOfType.push(
            ...row.images.map((image) => ({
              ...image,

              variation_id:
                variation?.variation_id ??
                null
            }))
          );
        }

        if (
          Array.isArray(row?.prices) &&
          row.prices.length > 0
        ) {
          pricesOnlyOfType.push(
            ...row.prices.map((price) => ({
              ...price,

              variation_id:
                variation?.variation_id ??
                null,

              price_display_mode:
                variation
                  ?.price_display_mode ??
                null
            }))
          );
        }

        const artwork =
          row?.artwork ?? null;

        if (artwork) {
          const pdf = String(
            artwork?.pdf_artwork ?? ""
          ).trim();

          const name = String(
            artwork
              ?.name_pdf_artwork ?? ""
          ).trim();

          if (pdf || name) {
            artworksOnlyOfType.push({
              ...artwork,

              variation_id:
                variation?.variation_id ??
                null
            });
          }
        }
      }

      if (
        !variationsOnlyOfType.length
      ) {
        continue;
      }

      const variationsFinished =
        this.renderVariations(
          variationsOnlyOfType,
          typeVariation
        );

      if (!variationsFinished) {
        continue;
      }

      /*
       * The first variation of each newly rendered type
       * is selected by default.
       */
      const firstVariationId = String(
        variationsOnlyOfType[0]
          ?.variation_id ?? ""
      ).trim();

      if (firstVariationId) {
        this.setSelectVariation(
          `variation_id_${firstVariationId}`
        );
      }

      if (imagesOnlyOfType.length > 0) {
        this.renderImages(
          imagesOnlyOfType,
          typeVariation
        );
      }

      if (itemsOnlyOfType.length > 0) {
        this.renderItems(
          itemsOnlyOfType,
          typeVariation
        );
      }

      if (pricesOnlyOfType.length > 0) {
        this.renderPrices(
          pricesOnlyOfType,
          typeVariation
        );
      }

      if (
        artworksOnlyOfType.length > 0
      ) {
        this.renderArtwork(
          artworksOnlyOfType,
          typeVariation
        );
      }

      /*
       * Automatically load the first child so all
       * available variation levels are displayed.
       */
      if (firstVariationId) {
        this.fetchChildVariationsById(
          firstVariationId
        );
      }
    }

    window.previewGallery
      ?.refreshGallery?.(true);
  }

  /* ==========================================================================
     RENDER VARIATIONS
     No accordion. Every group and option is immediately visible.
  ========================================================================== */

  renderVariations(
    childVariationsOfType = [],
    typeVariation
  ) {
    try {
      const parent =
        document.getElementById(
          "wrap-variations-group"
        );

      if (!parent) {
        return false;
      }

      const typeId = String(
        typeVariation?.type_id ?? "null"
      );

      const labelId =
        `var_label_size_${typeId}`;

      const optionsId =
        `var-options-${typeId}`;

      const existing =
        parent.querySelector(
          `.wrap-variations[data-type-id="${CSS.escape(
            typeId
          )}"]`
        );

      if (existing) {
        existing.remove();
      }

      const typeName = String(
        typeVariation?.type_name ?? ""
      ).trim();

      if (!typeName) {
        return false;
      }

      if (
        !Array.isArray(
          childVariationsOfType
        ) ||
        childVariationsOfType.length === 0
      ) {
        return false;
      }

      const firstLabel = String(
        childVariationsOfType?.[0]
          ?.name ?? ""
      ).trim();

      let buttonsHtml = "";
      let firstDomId = "";

      for (
        let i = 0;
        i < childVariationsOfType.length;
        i++
      ) {
        const variation =
          childVariationsOfType[i];

        const variationId = String(
          variation?.variation_id ?? ""
        ).trim();

        const label = String(
          variation?.name ?? ""
        ).trim();

        const imgSrc =
          this.buildFileUrl(
            variation?.image,
            "../../view/preview_porduct/img/icon_product.png"
          );

        const selectedClass =
          i === 0
            ? " is-selected"
            : "";

        const ariaPressed =
          i === 0
            ? "true"
            : "false";

        const domId = variationId
          ? `variation_id_${variationId}`
          : "";

        if (i === 0) {
          firstDomId = domId;
        }

        buttonsHtml += `
          <button
            type="button"
            class="var-option js-scale-in${selectedClass}"
            ${domId ? `id="${domId}"` : ""}
            data-variation-label="${this.escapeHtml(label)}"
            aria-pressed="${ariaPressed}"
          >
            <img
              class="var-thumb"
              src="${this.escapeHtml(imgSrc)}"
              alt="${this.escapeHtml(label || "Option sample")}"
            >

            <span class="opt-copy">
              <span class="opt-main">
                ${this.escapeHtml(label)}
              </span>
            </span>
          </button>
        `;
      }

      const blockHtml = `
        <section
          class="wrap-variations"
          aria-labelledby="${labelId}"
          data-type-id="${this.escapeHtml(typeId)}"
        >
          <div class="variation-group-header">

            <div class="var-label">
              <span class="var-name">
                ${this.escapeHtml(typeName)}
              </span>

              <strong
                id="${labelId}"
                class="js-selected-variation-label"
              >
                ${this.escapeHtml(
                  firstLabel ||
                  "Select option"
                )}
              </strong>
            </div>

            <span class="variation-summary-pill">
              ${
                firstLabel
                  ? `Selected: ${this.escapeHtml(firstLabel)}`
                  : "Select an option"
              }
            </span>

          </div>

          <div
            class="var-options"
            id="${optionsId}"
          >
            ${buttonsHtml}
          </div>
        </section>
      `;

      parent.insertAdjacentHTML(
        "beforeend",
        blockHtml
      );

      if (firstDomId) {
        this.setSelectVariation(
          firstDomId
        );
      }

      return true;
    } catch (error) {
      console.error(
        "Error in renderVariations:",
        error
      );

      return false;
    }
  }

  /* ==========================================================================
     SELECT VARIATION
  ========================================================================== */

  SelectVariation(domId = "") {
    const id = String(domId || "").trim();

    if (!id) {
      return false;
    }

    const button =
      document.getElementById(id);

    if (!button) {
      return false;
    }

    const group = button.closest(
      ".wrap-variations"
    );

    if (!group) {
      return false;
    }

    /*
     * Remove variation groups that come after the
     * group whose selection is being changed.
     */
    this.deleteFollowingVariationGroups(
      group
    );

    group
      .querySelectorAll(
        ".var-option.is-selected"
      )
      .forEach((item) => {
        item.classList.remove(
          "is-selected"
        );

        item.setAttribute(
          "aria-pressed",
          "false"
        );
      });

    button.classList.add(
      "is-selected"
    );

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

    this.setSelectVariation(id);

    const variationId =
      this.getVariationIdFromDomId(id);

    if (!variationId) {
      return false;
    }

    this.fetchChildVariationsById(
      variationId
    );

    return true;
  }

  deleteFollowingVariationGroups(
    currentGroup
  ) {
    if (!currentGroup) {
      return;
    }

    let nextGroup =
      currentGroup.nextElementSibling;

    while (nextGroup) {
      const groupToDelete =
        nextGroup;

      nextGroup =
        nextGroup.nextElementSibling;

      if (
        !groupToDelete.classList.contains(
          "wrap-variations"
        )
      ) {
        continue;
      }

      const typeId = String(
        groupToDelete.dataset.typeId ??
        ""
      ).trim();

      if (typeId) {
        this.deleteImages(typeId);
        this.deleteItems(typeId);
        this.deletePrices(typeId);
        this.deleteArtwork(typeId);
      }

      groupToDelete.remove();
    }

    window.previewGallery
      ?.refreshGallery?.(true);
  }

  setSelectVariation(domId) {
    this.variationSelected = domId;
  }

  getSelectVariation() {
    return this.variationSelected;
  }

  /* ==========================================================================
     IMAGES
  ========================================================================== */

  renderImages(
    imagesOnlyOfType = [],
    typeVariation
  ) {
    const id_variation =
      this.getSelectedVariationId();

    const parent =
      document.getElementById(
        "wrap-images-group"
      );

    if (!parent) {
      return;
    }

    const typeId = String(
      typeVariation?.type_id ?? "null"
    );

    const wrapId =
      `wrap-images-${typeId}`;

    /*
     * Always replace the old image group for this type.
     */
    this.deleteImages(typeId);

    const wrapper =
      document.createElement("div");

    wrapper.className = "wrap-images";
    wrapper.id = wrapId;
    wrapper.dataset.typeId = typeId;

    let renderedImages = 0;

    for (
      let i = 0;
      i < imagesOnlyOfType.length;
      i++
    ) {
      const imgObj =
        imagesOnlyOfType[i];

      if (
        Number(imgObj?.variation_id) !==
        id_variation
      ) {
        continue;
      }

      const src = this.buildFileUrl(
        imgObj?.link
      );

      if (!src) {
        continue;
      }

      const img =
        document.createElement("img");

      img.className =
        "preview-media";

      img.src = src;

      img.alt =
        `Preview image ${renderedImages + 1}`;

      img.loading = "lazy";
      img.decoding = "async";
      img.draggable = false;

      wrapper.appendChild(img);

      renderedImages++;
    }

    if (renderedImages > 0) {
      parent.appendChild(wrapper);
    }

    /*
     * Notify preview.js so thumbnails, navigation,
     * autoplay and active image are rebuilt.
     */
    window.previewGallery
      ?.refreshGallery?.(true);
  }

  /* ==========================================================================
     ITEMS
  ========================================================================== */

  renderItems(
    itemsOnlyOfType = [],
    typeVariation
  ) {
    const id_variation =
      this.getSelectedVariationId();

    const parent =
      document.getElementById(
        "wrap-items-group"
      );

    if (!parent) {
      return;
    }

    const typeId = String(
      typeVariation?.type_id ?? "null"
    );

    const wrapId =
      `wrap-items-${typeId}`;

    /*
     * Always replace the old items for this type.
     */
    this.deleteItems(typeId);

    const wrapper =
      document.createElement("div");

    wrapper.className = "wrap-items";
    wrapper.id = wrapId;
    wrapper.dataset.typeId = typeId;

    let renderedItems = 0;

    for (
      let i = 0;
      i < itemsOnlyOfType.length;
      i++
    ) {
      const itemData =
        itemsOnlyOfType[i];

      if (
        Number(itemData?.variation_id) !==
        id_variation
      ) {
        continue;
      }

      const title = String(
        itemData?.name ?? ""
      ).trim();

      const description = String(
        itemData?.description ?? ""
      ).trim();

      if (!title && !description) {
        continue;
      }

      const item =
        document.createElement("div");

      item.className = "sp-item";

      item.innerHTML = `
        ${
          title
            ? `
              <strong class="sp-item-subtitle">
                ${this.escapeHtml(title)}
              </strong>
            `
            : ""
        }

        ${
          description
            ? `
              <span>
                ${this.escapeHtml(description)}
              </span>
            `
            : ""
        }
      `;

      wrapper.appendChild(item);

      renderedItems++;
    }

    if (renderedItems > 0) {
      parent.appendChild(wrapper);
    }
  }

  /* ==========================================================================
     PRICES
     The original price logic is preserved.
  ========================================================================== */

  renderPrices(
    pricesOnlyOfType = [],
    typeVariation
  ) {
    const id_variation = Number(
      String(
        this.getSelectVariation() ?? ""
      ).replace(
        "variation_id_",
        ""
      )
    );

    const parent =
      document.getElementById(
        "wrap-prices-group"
      );

    if (!parent) {
      return;
    }

    const typeId = String(
      typeVariation?.type_id ??
      "null"
    );

    const wrapId =
      `wrap-price-${typeId}`;

    let wrapper =
      parent.querySelector(
        `#${CSS.escape(wrapId)}`
      );

    if (!wrapper) {
      wrapper =
        document.createElement("div");

      wrapper.className =
        "wrap-price";

      wrapper.id = wrapId;

      wrapper.dataset.typeId =
        typeId;

      parent.appendChild(wrapper);
    }

    wrapper.innerHTML = "";

    for (
      let i = 0;
      i < pricesOnlyOfType.length;
      i++
    ) {
      const p =
        pricesOnlyOfType[i];

      if (
        Number(p?.variation_id) !==
        id_variation
      ) {
        continue;
      }

      if (
        String(
          p?.price_display_mode ??
          ""
        ).trim() !== "prices"
      ) {
        continue;
      }

      const priceId = String(
        p?.price_id ?? ""
      ).trim();

      const minQty = String(
        p?.min_quantity ?? ""
      ).trim();

      const maxQty = String(
        p?.max_quantity ?? ""
      ).trim();

      const price = String(
        p?.price ?? ""
      ).trim();

      if (maxQty === "") {
        continue;
      }

      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "var-option js-scale-in js-price-option";

      button.value = price;

      button.dataset.priceId =
        priceId;

      button.dataset.minQuantity =
        minQty;

      button.dataset.maxQuantity =
        maxQty;

      button.dataset.price =
        price;

      button.dataset.variationId =
        String(
          p?.variation_id ?? ""
        );

      button.dataset.priceDisplayMode =
        String(
          p?.price_display_mode ?? ""
        );

      button.innerHTML = `
        <span class="opt-main">
          ${this.escapeHtml(minQty)}
        </span>
      `;

      wrapper.appendChild(button);
    }

    this.bindPriceButtons(
      `#${wrapId}`
    );
  }

  bindPriceButtons(scopeSelector) {
    const scope =
      document.querySelector(
        scopeSelector
      );

    if (!scope) {
      return false;
    }

    const buttons = Array.from(
      scope.querySelectorAll(
        ".js-price-option"
      )
    );

    if (buttons.length === 0) {
      return false;
    }

    for (const btn of buttons) {
      if (
        btn.dataset.bound === "1"
      ) {
        continue;
      }

      btn.dataset.bound = "1";

      btn.addEventListener(
        "click",
        (event) => {
          const element =
            event.currentTarget;

          const updateVariationPrice =
            this.selectPriceButton(
              element,
              scope
            );

          if (updateVariationPrice) {
            this.updateProductSummaryBox(
              element.dataset
                .minQuantity,
              element.value
            );
          }
        }
      );
    }

    const updateVariationPrice =
      this.selectPriceButton(
        buttons[0],
        scope
      );

    setTimeout(() => {
      if (updateVariationPrice) {
        this.updateProductSummaryBox(
          buttons[0].dataset
            .minQuantity,
          buttons[0].value
        );
      }
    }, 500);

    return true;
  }

  updateProductSummaryBox(
    quantity,
    price
  ) {
    const is_selected =
      document.querySelectorAll(
        ".is-selected"
      );

    let totalExtraPrice = 0;

    for (
      let i = 0;
      i < is_selected.length;
      i++
    ) {
      if (
        !is_selected[i].querySelector(
          ".opt-price-extra"
        )
      ) {
        continue;
      }

      const priceExtraText =
        is_selected[i]
          .querySelector(
            ".opt-price-extra"
          )
          .innerHTML;

      const priceExtraNumber =
        Number(
          priceExtraText
            .replace("+", "")
            .replace("p/u", "")
            .trim()
        );

      totalExtraPrice =
        totalExtraPrice +
        priceExtraNumber;
    }

    const bb_unit =
      document.getElementById(
        "bb_unit"
      );

    const bb_unit_quantity =
      document.getElementById(
        "bb_unit_quantity"
      );

    const bb_unit_total =
      document.getElementById(
        "bb_unit_total"
      );

    const bb_extra_unit =
      document.getElementById(
        "bb_extra_unit"
      );

    const bb_extra_quantity =
      document.getElementById(
        "bb_extra_quantity"
      );

    const bb_extra_total =
      document.getElementById(
        "bb_extra_total"
      );

    const bb_total =
      document.getElementById(
        "bb_total"
      );

    const sp_price =
      document.getElementById(
        "sp_price"
      );

    const var_label_quantity =
      document.getElementById(
        "var_label_quantity"
      );

    const sp_unit_hint =
      document.getElementById(
        "sp_unit_hint"
      );

    if (bb_unit) {
      bb_unit.innerHTML =
        "£" +
        this.formatPrice(price);
    }

    if (bb_unit_quantity) {
      bb_unit_quantity.innerHTML =
        quantity;
    }

    if (bb_unit_total) {
      bb_unit_total.innerHTML =
        "£" +
        this.formatPrice(
          price * quantity
        );
    }

    if (sp_price) {
      sp_price.innerHTML =
        this.formatPrice(price);
    }

    if (var_label_quantity) {
      var_label_quantity.innerHTML =
        quantity;
    }

    if (sp_unit_hint) {
      sp_unit_hint.innerHTML =
        "per " +
        quantity +
        " units";
    }

    let quantityExtras;

    if (totalExtraPrice == 0) {
      quantityExtras = 0;
    } else {
      quantityExtras = quantity;
    }

    if (bb_extra_unit) {
      bb_extra_unit.innerHTML =
        "£" +
        this.formatPrice(
          totalExtraPrice
        );
    }

    if (bb_extra_quantity) {
      bb_extra_quantity.innerHTML =
        quantityExtras;
    }

    if (bb_extra_total) {
      bb_extra_total.innerHTML =
        "£" +
        this.formatPrice(
          totalExtraPrice *
          quantity
        );
    }

    if (bb_total) {
      bb_total.innerHTML =
        "£" +
        this.formatPrice(
          price * quantity +
          totalExtraPrice *
          quantity
        );
    }
  }

  formatPrice(value) {
    return Number(value).toFixed(2);
  }

  selectPriceButton(
    button,
    scope = null
  ) {
    if (!button) {
      return false;
    }

    const container =
      scope ||
      button.closest(
        ".wrap-price"
      );

    if (!container) {
      return false;
    }

    const buttons =
      container.querySelectorAll(
        ".js-price-option"
      );

    for (const btn of buttons) {
      btn.classList.remove(
        "is-selected"
      );

      btn.setAttribute(
        "aria-pressed",
        "false"
      );
    }

    button.classList.add(
      "is-selected"
    );

    button.setAttribute(
      "aria-pressed",
      "true"
    );

    const payload = {
      price_id: String(
        button.dataset.priceId ?? ""
      ),

      min_quantity: String(
        button.dataset
          .minQuantity ?? ""
      ),

      max_quantity: String(
        button.dataset
          .maxQuantity ?? ""
      ),

      price: String(
        button.dataset.price ?? ""
      ),

      value: String(
        button.value ?? ""
      )
    };

    this.setSelectedPrice(payload);

    this.onPriceSelected(
      payload,
      button
    );

    this.setMaxQuantity(
      payload["max_quantity"]
    );

    this.updateVariationPrices();

    return true;
  }

  setSelectedPrice(
    payload = null
  ) {
    this.priceSelected = payload;
  }

  setMaxQuantity(max_quantity) {
    this.max_quantity =
      max_quantity;
  }

  getMaxQuantity() {
    return this.max_quantity;
  }

  updateVariationPrices() {
    const variationsWithPrices =
      document.querySelectorAll(
        "#wrap-variations-group .var-option[id^='variation_id_']"
      );

    const ids = Array.from(
      variationsWithPrices
    )
      .map((button) =>
        Number(
          button.id.replace(
            "variation_id_",
            ""
          )
        )
      )
      .filter(
        (id) =>
          Number.isFinite(id) &&
          id > 0
      );

    const max_quantity =
      this.getMaxQuantity();

    const url =
      "../../controller/order/product.php";

    const data = {
      action:
        "get_variation_prices",

      ids: ids,

      max_quantity:
        max_quantity
    };

    fetch(url, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify(data)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Network error."
          );
        }

        return response.text();
      })
      .then((text) => {
        const data =
          JSON.parse(text);

        this.drawExtraVariationPrices(
          data["prices"] || []
        );
      })
      .catch((error) => {
        console.error(
          "Error fetching preview:",
          error
        );
      });
  }

  getSelectedPrice() {
    return this.priceSelected;
  }

  onPriceSelected(
    payload,
    button = null
  ) {
    // Optional hook.
  }

  drawExtraVariationPrices(data) {
    if (!Array.isArray(data)) {
      return;
    }

    for (
      let i = 0;
      i < data.length;
      i++
    ) {
      const variationId =
        "variation_id_" +
        data[i].variation_id;

      const htmlButton =
        document.getElementById(
          variationId
        );

      if (!htmlButton) {
        continue;
      }

      const existingPrice =
        htmlButton.querySelector(
          ".opt-price-extra"
        );

      if (existingPrice) {
        existingPrice.remove();
      }

      const copy =
        htmlButton.querySelector(
          ".opt-copy"
        ) || htmlButton;

      copy.insertAdjacentHTML(
        "beforeend",
        `
          <span class="opt-price-extra">
            +${this.escapeHtml(
              data[i].price.price
            )} p/u
          </span>
        `
      );
    }
  }

  /* ==========================================================================
     ARTWORK FILES
  ========================================================================== */

  renderArtwork(
    artworksOnlyOfType = [],
    typeVariation
  ) {
    const id_variation =
      this.getSelectedVariationId();

    const parent =
      document.getElementById(
        "wrap-artworks-group"
      );

    if (!parent) {
      return;
    }

    const typeId = String(
      typeVariation?.type_id ?? "null"
    );

    const wrapId =
      `wrap-artworks-${typeId}`;

    this.deleteArtwork(typeId);

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "wrap-artworks";

    wrapper.id = wrapId;

    wrapper.dataset.typeId =
      typeId;

    let renderedArtworks = 0;

    for (
      let i = 0;
      i < artworksOnlyOfType.length;
      i++
    ) {
      const artworkData =
        artworksOnlyOfType[i];

      if (
        Number(
          artworkData?.variation_id
        ) !== id_variation
      ) {
        continue;
      }

      const name = String(
        artworkData
          ?.name_pdf_artwork ?? ""
      ).trim();

      const pdfSrc =
        this.buildFileUrl(
          artworkData
            ?.pdf_artwork
        );

      if (!name && !pdfSrc) {
        continue;
      }

      const artwork =
        document.createElement("div");

      artwork.className =
        "sp-artwork";

      if (name) {
        const title =
          document.createElement(
            "strong"
          );

        title.className =
          "sp-artwork-name";

        title.textContent = name;

        artwork.appendChild(title);
      }

      if (pdfSrc) {
        const link =
          document.createElement("a");

        link.className =
          "btn btn-artwork sp-artwork-link";

        link.href = pdfSrc;
        link.target = "_blank";
        link.rel = "noopener";

        link.textContent =
          name || "Open PDF";

        artwork.appendChild(link);
      }

      wrapper.appendChild(artwork);

      renderedArtworks++;
    }

    if (renderedArtworks > 0) {
      parent.appendChild(wrapper);
    }
  }
}

/* ============================================================================
   GLOBAL INSTANCE
============================================================================ */

let previewLogic = null;

function initialisePreviewLogic() {
  if (previewLogic) {
    return;
  }

  previewLogic =
    new PreviewLogic();

  window.previewLogic =
    previewLogic;
}

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initialisePreviewLogic,
    {
      once: true
    }
  );
} else {
  initialisePreviewLogic();
}
