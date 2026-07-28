// Variations page controller.
class Variations {
  constructor() {
    // Main form.
    this.form = document.getElementById("variationForm");

    // Decision controls.
    this.variationsNoRadio =
      document.getElementById("variations_no");

    this.variationsYesRadio =
      document.getElementById("variations_yes");

    this.noVariationsTip =
      document.getElementById("no_variations_tip");

    // Variation fields.
    this.parentSelect =
      document.getElementById("parent_variations");

    this.nameInput =
      document.getElementById("variation_name");

    this.typeSelect =
      document.getElementById("group");

    this.namePdfInput =
      document.getElementById("name_pdf_artwork");

    // Image fields.
    this.imgInput =
      document.getElementById("variation_image");

    this.imgPreview =
      document.getElementById("img_preview");

    this.clearImgBtn =
      document.getElementById("clear_image");

    // PDF fields.
    this.pdfInput =
      document.getElementById("variation_pdf");

    this.pdfPreview =
      document.getElementById("pdf_preview");

    this.clearPdfBtn =
      document.getElementById("clear_pdf");

    // Variation menu.
    this.menuBtn =
      document.getElementById("menu_btn");

    this.menuList =
      document.getElementById("menu_list");

    // Buttons.
    this.addBtn =
      document.getElementById("add_variation");

    this.saveBtn =
      document.getElementById("save_variation");

    this.nextBtn =
      document.getElementById("next_variations");

    this.resetBtn =
      document.getElementById("reset_form");

    this.backBtn =
      document.getElementById("btn_back_variations");

    // Delete variation button.
    this.deleteVariationBtn =
      document.getElementById("delete_variation");

    // File state.
    this.attachImage = false;
    this.attachPDF = false;

    // Used to remove old image preview URLs.
    this.currentImageObjectUrl = null;

    this.init();
  }

  /* =========================
     Initialisation
  ========================= */

  init() {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        if (
          window.headerAddProduct
            ?.setCurrentHeader
        ) {
          window.headerAddProduct
            .setCurrentHeader(
              "variations"
            );
        }
      }
    );

    if (this.typeSelect) {
      this.typeSelect.innerHTML = `
        <option value="" disabled selected>
          Select a variation type
        </option>
      `;

      this.typeSelect.value = "";
    }

    this.bindDecisionUi();
    this.bindFileInputs();
    this.bindMenu();
    this.bindButtons();

    this.getVariationDetails();
  }

  /* =========================
     Decision interface
  ========================= */

  bindDecisionUi() {
    const noChoice =
      this.variationsNoRadio
        ?.closest(".cp-choice");

    const yesChoice =
      this.variationsYesRadio
        ?.closest(".cp-choice");

    const updateUi = () => {
      const isNo =
        Boolean(
          this.variationsNoRadio
            ?.checked
        );

      if (this.noVariationsTip) {
        this.noVariationsTip.hidden =
          !isNo;
      }

      if (noChoice) {
        noChoice.classList.toggle(
          "is-selected",
          isNo
        );
      }

      if (yesChoice) {
        yesChoice.classList.toggle(
          "is-selected",
          !isNo
        );
      }

      if (this.form) {
        this.form.classList.toggle(
          "is-hidden",
          isNo
        );
      }
    };

    if (this.variationsNoRadio) {
      this.variationsNoRadio
        .addEventListener(
          "change",
          updateUi
        );
    }

    if (this.variationsYesRadio) {
      this.variationsYesRadio
        .addEventListener(
          "change",
          updateUi
        );
    }

    updateUi();
  }

  /* =========================
     Button events
  ========================= */

  bindButtons() {
    // Back.
    if (this.backBtn) {
      this.backBtn.addEventListener(
        "click",
        () => {
          const destination =
            "../../view/product_details/index.php";

          if (
            window.headerAddProduct
              ?.goNext
          ) {
            window.headerAddProduct
              .goNext(destination);

            return;
          }

          window.location.href =
            destination;
        }
      );
    }

    // Reset.
    if (this.resetBtn) {
      this.resetBtn.addEventListener(
        "click",
        (event) => {
          event.preventDefault();

          alert(
            "(pending implementation)."
          );
        }
      );
    }

    // Save and next.
    if (this.nextBtn) {
      this.nextBtn.addEventListener(
        "click",
        () => {
          const name =
            String(
              this.nameInput
                ?.value || ""
            ).trim();

          if (!name) {
            alert(
              "Please add a name to the variation."
            );

            this.nameInput?.focus();

            return;
          }

          this.saveVariationDetails(
            true
          );
        }
      );
    }

    // Save.
    if (this.saveBtn) {
      this.saveBtn.addEventListener(
        "click",
        async () => {
          const name =
            String(
              this.nameInput
                ?.value || ""
            ).trim();

          if (!name) {
            alert(
              "Please add a name to the variation."
            );

            this.nameInput?.focus();

            return;
          }

          const wasSaved =
            await this
              .saveVariationDetails(
                false
              );

          if (wasSaved) {
            await this
              .getDefaultVariation();
          }
        }
      );
    }

    // New variation.
    if (this.addBtn) {
      this.addBtn.addEventListener(
        "click",
        () => {
          this.addNewVariation();
        }
      );
    }

    // Delete variation.
    if (this.deleteVariationBtn) {
      this.deleteVariationBtn
        .addEventListener(
          "click",
          () => {
            this.deleteVariation();
          }
        );
    }
  }

  /* =========================
     Delete variation
  ========================= */

  deleteVariation() {
    const {
      skuProduct,
      skuVariation
    } = this.readSkuParamsFromUrl();

    alert(
      "Delete variation clicked.\n\n" +
      `Product SKU: ${skuProduct}\n` +
      `Variation SKU: ${skuVariation}`
    );
  }

  /* =========================
     Variation menu
  ========================= */

  bindMenu() {
    if (
      !this.menuBtn ||
      !this.menuList
    ) {
      return;
    }

    this.menuBtn.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        const willOpen =
          this.menuList.hidden;

        this.menuList.hidden =
          !willOpen;

        this.menuBtn.setAttribute(
          "aria-expanded",
          String(willOpen)
        );
      }
    );

    document.addEventListener(
      "click",
      (event) => {
        const clickedButton =
          this.menuBtn.contains(
            event.target
          );

        const clickedMenu =
          this.menuList.contains(
            event.target
          );

        if (
          !clickedButton &&
          !clickedMenu
        ) {
          this.menuList.hidden =
            true;

          this.menuBtn.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape" &&
          !this.menuList.hidden
        ) {
          this.menuList.hidden =
            true;

          this.menuBtn.setAttribute(
            "aria-expanded",
            "false"
          );

          this.menuBtn.focus();
        }
      }
    );

    this.menuList.addEventListener(
      "click",
      (event) => {
        const listItem =
          event.target.closest("li");

        if (
          !listItem ||
          !this.menuList.contains(
            listItem
          )
        ) {
          return;
        }

        this.menuList
          .querySelectorAll(
            ".is-selected"
          )
          .forEach((item) => {
            item.classList.remove(
              "is-selected"
            );
          });

        listItem.classList.add(
          "is-selected"
        );

        const skuVariation =
          String(
            listItem.dataset?.sku ||
            ""
          ).trim();

        if (!skuVariation) {
          return;
        }

        this.menuList.hidden = true;

        this.menuBtn.setAttribute(
          "aria-expanded",
          "false"
        );

        const { skuProduct } =
          this.readSkuParamsFromUrl();

        window.location.href =
          "../../view/variations/index.php" +
          `?sku=${encodeURIComponent(
            skuProduct
          )}` +
          `&sku_variation=${encodeURIComponent(
            skuVariation
          )}`;
      }
    );
  }

  /* =========================
     File inputs
  ========================= */

  bindFileInputs() {
    // Image preview.
    if (
      this.imgInput &&
      this.imgPreview
    ) {
      this.imgInput.addEventListener(
        "change",
        () => {
          const file =
            this.imgInput.files?.[0];

          this.imgPreview.innerHTML =
            "";

          if (!file) {
            this.attachImage =
              false;

            return;
          }

          if (
            !file.type.startsWith(
              "image/"
            )
          ) {
            alert(
              "The selected image file is not valid."
            );

            this.imgInput.value =
              "";

            this.attachImage =
              false;

            return;
          }

          this.attachImage = true;

          if (
            this
              .currentImageObjectUrl
          ) {
            URL.revokeObjectURL(
              this
                .currentImageObjectUrl
            );

            this
              .currentImageObjectUrl =
              null;
          }

          const imageUrl =
            URL.createObjectURL(
              file
            );

          this
            .currentImageObjectUrl =
            imageUrl;

          const image =
            document.createElement(
              "img"
            );

          image.src = imageUrl;

          image.alt =
            "Selected variation image preview";

          image.loading = "lazy";
          image.decoding = "async";

          this.imgPreview
            .appendChild(image);
        }
      );
    }

    // Remove image.
    if (
      this.clearImgBtn &&
      this.imgInput &&
      this.imgPreview
    ) {
      this.clearImgBtn
        .addEventListener(
          "click",
          () => {
            this.imgInput.value =
              "";

            this.imgPreview.innerHTML =
              "";

            this.attachImage =
              false;

            if (
              this
                .currentImageObjectUrl
            ) {
              URL.revokeObjectURL(
                this
                  .currentImageObjectUrl
              );

              this
                .currentImageObjectUrl =
                null;
            }
          }
        );
    }

    // PDF preview.
    if (
      this.pdfInput &&
      this.pdfPreview
    ) {
      this.pdfInput.addEventListener(
        "change",
        () => {
          const file =
            this.pdfInput.files?.[0];

          this.pdfPreview.innerHTML =
            "";

          if (!file) {
            this.attachPDF = false;

            return;
          }

          if (!this.isValidPdf(file)) {
            alert(
              "Please select a valid PDF file."
            );

            this.pdfInput.value =
              "";

            this.attachPDF =
              false;

            return;
          }

          this.attachPDF = true;

          const pill =
            document.createElement(
              "div"
            );

          pill.className =
            "cp-file-pill";

          const name =
            document.createElement(
              "span"
            );

          name.className =
            "cp-file-pill-main";

          name.textContent =
            file.name;

          const size =
            document.createElement(
              "small"
            );

          size.textContent =
            `(${Math.round(
              file.size / 1024
            )} KB)`;

          pill.appendChild(name);
          pill.appendChild(size);

          this.pdfPreview
            .appendChild(pill);
        }
      );
    }

    // Remove PDF.
    if (
      this.clearPdfBtn &&
      this.pdfInput &&
      this.pdfPreview
    ) {
      this.clearPdfBtn
        .addEventListener(
          "click",
          () => {
            this.pdfInput.value =
              "";

            this.pdfPreview.innerHTML =
              "";

            this.attachPDF =
              false;
          }
        );
    }
  }

  /* =========================
     Default variation
  ========================= */

  async getDefaultVariation() {
    const { skuProduct } =
      this.readSkuParamsFromUrl();

    try {
      const response =
        await fetch(
          "../../controller/products/variations.php",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              action:
                "get_sku_default_variation",

              sku:
                String(
                  skuProduct
                ).trim()
            })
          }
        );

      if (!response.ok) {
        throw new Error(
          `Network error (${response.status})`
        );
      }

      const data =
        await this.parseResponse(
          response
        );

      if (!data?.success) {
        console.warn(
          "Unexpected response:",
          data
        );

        return;
      }

      const skuVariation =
        String(
          data
            ?.sku_default_variation ||
          ""
        ).trim();

      if (!skuVariation) {
        return;
      }

      alert(
        "The variation details have been saved successfully."
      );

      window.location.href =
        "../../view/variations/index.php" +
        `?sku=${encodeURIComponent(
          skuProduct
        )}` +
        `&sku_variation=${encodeURIComponent(
          skuVariation
        )}`;
    } catch (error) {
      console.error(
        "getDefaultVariation error:",
        error
      );
    }
  }

  /* =========================
     Data loading
  ========================= */

  getVariationDetails() {
    const {
      skuProduct,
      skuVariation
    } = this.readSkuParamsFromUrl();

    const payload = {
      action:
        "get_variation_details",

      sku:
        skuProduct,

      sku_variation:
        skuVariation
    };

    fetch(
      "../../controller/products/variations.php",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(payload)
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Network error."
          );
        }

        return response.text();
      })
      .then((responseText) => {
        console.log(
          "Response text:",
          responseText
        );

        const json =
          this.safeJsonParse(
            responseText
          );

        if (!json?.success) {
          return;
        }

        this.renderTopMenu(
          json.variations,
          skuVariation
        );

        this
          .renderCurrentNameAndDefaultRules(
            json.current
          );

        this.renderParentSelect(
          json.variations,
          json.current,
          json.parent,
          json.product
        );

        this
          .renderTypeVariationsSelect(
            json.type_variations,
            json.current?.type_id
          );

        this.renderServerPreviews(
          json.current
        );

        this.attachImage = false;
        this.attachPDF = false;
      })
      .catch((error) => {
        console.error(
          "Error loading variation details:",
          error
        );
      });
  }

  /* =========================
     Rendering
  ========================= */

  renderTopMenu(
    variationsRaw,
    skuVariation
  ) {
    if (!this.menuList) {
      return;
    }

    this.menuList.innerHTML = "";

    const variations =
      Array.isArray(
        variationsRaw
      )
        ? variationsRaw
        : [];

    const levelColors = [
      "#0f2140",
      "#0b6b6b",
      "#7a4d0f",
      "#5a2d82",
      "#1d6b2a"
    ];

    const selectedSku =
      String(
        skuVariation || ""
      )
        .trim()
        .toUpperCase();

    const fragment =
      document
        .createDocumentFragment();

    for (
      let index = 0;
      index < variations.length;
      index += 1
    ) {
      const variation =
        variations[index] || {};

      const name =
        String(
          variation?.name ??
          "(unnamed)"
        );

      const sku =
        String(
          variation?.SKU ??
          variation?.sku ??
          ""
        );

      const level =
        Number(
          variation?.level ?? 0
        ) || 0;

      const color =
        levelColors[level] ||
        levelColors[
          levelColors.length - 1
        ];

      const indentation =
        28 + level * 18;

      const listItem =
        document.createElement(
          "li"
        );

      listItem.dataset.sku = sku;

      listItem.style.position =
        "relative";

      listItem.style.padding =
        "8px 10px";

      listItem.style.paddingLeft =
        `${indentation}px`;

      listItem.style.borderRadius =
        "10px";

      listItem.style.cursor =
        "pointer";

      listItem.style.marginBottom =
        "6px";

      listItem.style.borderLeft =
        `4px solid ${color}`;

      listItem.style.background =
        "rgba(255,255,255,0.03)";

      const dot =
        document.createElement(
          "span"
        );

      dot.setAttribute(
        "aria-hidden",
        "true"
      );

      dot.style.position =
        "absolute";

      dot.style.left =
        `${Math.max(
          8,
          indentation - 14
        )}px`;

      dot.style.top = "50%";

      dot.style.transform =
        "translateY(-50%)";

      dot.style.width = "8px";
      dot.style.height = "8px";

      dot.style.borderRadius =
        "999px";

      dot.style.background =
        color;

      dot.style.opacity = ".85";

      const nameElement =
        document.createElement(
          "strong"
        );

      nameElement.textContent =
        name;

      const hiddenSku =
        document.createElement(
          "span"
        );

      hiddenSku.textContent = sku;

      hiddenSku.style.position =
        "absolute";

      hiddenSku.style.left =
        "-9999px";

      hiddenSku.style.width =
        "1px";

      hiddenSku.style.height =
        "1px";

      hiddenSku.style.overflow =
        "hidden";

      listItem.appendChild(dot);
      listItem.appendChild(
        nameElement
      );
      listItem.appendChild(
        hiddenSku
      );

      const candidateSku =
        String(sku)
          .trim()
          .toUpperCase();

      if (
        candidateSku &&
        candidateSku === selectedSku
      ) {
        listItem.classList.add(
          "is-selected"
        );

        listItem.setAttribute(
          "aria-selected",
          "true"
        );

        listItem.style.background =
          "rgba(255,255,255,0.10)";

        listItem.style.outline =
          "2px solid rgba(255,255,255,0.28)";

        listItem.style.boxShadow =
          "0 10px 22px rgba(0,0,0,0.18)";

        listItem.style.borderLeft =
          `6px solid ${color}`;

        const selectedIcon =
          document.createElement(
            "span"
          );

        selectedIcon.textContent =
          "✓";

        selectedIcon.setAttribute(
          "aria-hidden",
          "true"
        );

        selectedIcon.style.position =
          "absolute";

        selectedIcon.style.right =
          "10px";

        selectedIcon.style.top =
          "50%";

        selectedIcon.style.transform =
          "translateY(-50%)";

        selectedIcon.style.width =
          "18px";

        selectedIcon.style.height =
          "18px";

        selectedIcon.style.borderRadius =
          "999px";

        selectedIcon.style.border =
          `2px solid ${color}`;

        selectedIcon.style.display =
          "flex";

        selectedIcon.style.alignItems =
          "center";

        selectedIcon.style.justifyContent =
          "center";

        selectedIcon.style.fontSize =
          "12px";

        selectedIcon.style.color =
          color;

        listItem.appendChild(
          selectedIcon
        );
      } else {
        listItem.setAttribute(
          "aria-selected",
          "false"
        );
      }

      fragment.appendChild(
        listItem
      );
    }

    this.menuList.appendChild(
      fragment
    );

    this.menuList.hidden = true;

    this.menuBtn?.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  renderCurrentNameAndDefaultRules(
    current
  ) {
    const currentName =
      String(
        current?.name ?? ""
      );

    if (this.nameInput) {
      this.nameInput.value =
        currentName;
    }

    if (!this.form) {
      return;
    }

    const isDefault =
      currentName === "Default";

    this.form.style.display =
      isDefault
        ? "none"
        : "grid";

  }

  renderParentSelect(
    variationsRaw,
    current,
    parent,
    product
  ) {
    if (!this.parentSelect) {
      return;
    }

    const variations =
      Array.isArray(
        variationsRaw
      )
        ? variationsRaw
        : [];

    const currentSku =
      String(
        current?.sku ??
        current?.SKU ??
        ""
      ).trim();

    this.parentSelect.innerHTML = `
      <option value="" disabled selected>
        Select a parent
      </option>
    `;

    const fragment =
      document
        .createDocumentFragment();

    for (
      let index = 0;
      index < variations.length;
      index += 1
    ) {
      const variation =
        variations[index] || {};

      const sku =
        String(
          variation?.SKU ??
          variation?.sku ??
          ""
        ).trim();

      if (
        !sku ||
        sku === currentSku
      ) {
        continue;
      }

      const name =
        String(
          variation?.name ??
          "(unnamed variation)"
        );

      const option =
        document.createElement(
          "option"
        );

      option.value = sku;
      option.dataset.sku = sku;
      option.textContent = name;

      fragment.appendChild(
        option
      );
    }

    this.parentSelect.appendChild(
      fragment
    );

    const targetParent =
      String(
        parent?.sku ??
        parent?.SKU ??
        ""
      ) ||
      String(
        product?.product_sku ??
        ""
      );

    const wanted =
      targetParent
        .trim()
        .toUpperCase();

    if (!wanted) {
      return;
    }

    for (
      const option of
      this.parentSelect.options
    ) {
      const value =
        String(
          option.value || ""
        )
          .trim()
          .toUpperCase();

      const dataSku =
        String(
          option.dataset?.sku ||
          ""
        )
          .trim()
          .toUpperCase();

      if (
        value === wanted ||
        dataSku === wanted
      ) {
        option.selected = true;

        this.parentSelect.value =
          option.value;

        break;
      }
    }
  }

  renderTypeVariationsSelect(
    typeVariationsRaw,
    selectedTypeId
  ) {
    if (
      !this.typeSelect ||
      !Array.isArray(
        typeVariationsRaw
      )
    ) {
      return;
    }

    this.typeSelect.innerHTML = `
      <option value="" disabled selected>
        Select type variation
      </option>
    `;

    for (
      let index = 0;
      index <
      typeVariationsRaw.length;
      index += 1
    ) {
      const type =
        typeVariationsRaw[index] ||
        {};

      const typeId =
        String(
          type?.type_id ?? ""
        ).trim();

      const typeName =
        String(
          type?.type_name ?? ""
        ).trim();

      if (
        !typeId ||
        !typeName
      ) {
        continue;
      }

      const option =
        document.createElement(
          "option"
        );

      option.value = typeId;
      option.id =
        `type_${typeId}`;

      option.textContent =
        typeName;

      this.typeSelect.appendChild(
        option
      );
    }

    const selected =
      selectedTypeId === null ||
      selectedTypeId === undefined
        ? ""
        : String(
            selectedTypeId
          ).trim();

    this.typeSelect.value =
      selected || "";

    if (
      selected &&
      this.typeSelect.value !==
        selected
    ) {
      this.typeSelect.value = "";
    }
  }

  renderServerPreviews(
    current
  ) {
    const toAssetUrl = (
      path
    ) => {
      const raw =
        String(path ?? "").trim();

      if (!raw) {
        return "";
      }

      if (
        raw.startsWith("http") ||
        raw.startsWith("data:") ||
        raw.startsWith("blob:")
      ) {
        return raw;
      }

      const relativePath =
        raw.replace(/^\/+/, "");

      if (
        relativePath.startsWith(
          "controller/"
        )
      ) {
        return (
          "../../" +
          relativePath
        );
      }

      return (
        "../../controller/" +
        relativePath
      );
    };

    // Image.
    if (this.imgPreview) {
      const serverImage =
        String(
          current?.image ?? ""
        ).trim();

      const imageSource =
        serverImage
          ? (
              toAssetUrl(
                serverImage
              ) ||
              "../../view/variations/images/add_image.png"
            )
          : "../../view/variations/images/add_image.png";

      this.imgPreview.innerHTML =
        "";

      const image =
        document.createElement(
          "img"
        );

      image.alt =
        "Selected variation image preview";

      image.loading = "lazy";
      image.decoding = "async";
      image.src = imageSource;

      this.imgPreview.appendChild(
        image
      );
    }

    // PDF name.
    if (this.namePdfInput) {
      this.namePdfInput.value =
        String(
          current
            ?.name_pdf_artwork ??
          ""
        );
    }

    if (!this.pdfPreview) {
      return;
    }

    const serverPdf =
      String(
        current?.pdf_artwork ??
        ""
      ).trim();

    if (!serverPdf) {
      this.pdfPreview.innerHTML =
        "";

      return;
    }

    const pdfName =
      String(
        current
          ?.name_pdf_artwork ??
        ""
      ).trim();

    const displayName =
      pdfName ||
      serverPdf
        .split("/")
        .pop() ||
      "artwork.pdf";

    const downloadName =
      displayName
        .toLowerCase()
        .endsWith(".pdf")
        ? displayName
        : `${displayName}.pdf`;

    const href =
      toAssetUrl(serverPdf);

    const pill =
      document.createElement(
        "div"
      );

    pill.className =
      "cp-file-pill";

    const openLink =
      document.createElement(
        "a"
      );

    openLink.href = href;
    openLink.target = "_blank";
    openLink.rel =
      "noopener noreferrer";

    openLink.className =
      "cp-file-pill-main";

    openLink.textContent =
      displayName;

    openLink.style.color =
      "var(--brand)";

    openLink.style.textDecoration =
      "none";

    const downloadLink =
      document.createElement(
        "a"
      );

    downloadLink.href = href;

    downloadLink.download =
      downloadName;

    downloadLink.textContent =
      "↓ Download";

    downloadLink.style.marginLeft =
      "8px";

    downloadLink.style.fontSize =
      "0.85em";

    downloadLink.style.color =
      "var(--muted)";

    pill.appendChild(openLink);

    pill.appendChild(
      downloadLink
    );

    this.pdfPreview.innerHTML = "";

    this.pdfPreview.appendChild(
      pill
    );
  }

  /* =========================
     Save variation
  ========================= */

  async saveVariationDetails(
    goNext = true
  ) {
    const {
      skuProduct,
      skuVariation
    } = this.readSkuParamsFromUrl();

    let skuParentVariation = "";

    const selectedParent =
      this.parentSelect
        ?.selectedOptions?.[0];

    if (selectedParent) {
      skuParentVariation =
        String(
          selectedParent.dataset
            ?.sku ||
          selectedParent.value ||
          ""
        ).trim();
    }

    const typeId =
      String(
        this.typeSelect?.value ||
        ""
      ).trim();

    const imageFile =
      this.imgInput
        ?.files?.[0] ||
      null;

    const pdfFile =
      this.pdfInput
        ?.files?.[0] ||
      null;

    if (
      imageFile &&
      !imageFile.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "The selected image file is not valid."
      );

      return false;
    }

    if (
      pdfFile &&
      !this.isValidPdf(pdfFile)
    ) {
      alert(
        "Please select a valid PDF file."
      );

      return false;
    }

    const formData =
      new FormData();

    formData.append(
      "action",
      "save_variation_details"
    );

    formData.append(
      "sku_product",
      skuProduct
    );

    formData.append(
      "sku_variation",
      skuVariation
    );

    formData.append(
      "isAttachAnImage",
      imageFile ? "1" : "0"
    );

    formData.append(
      "isAttachAPDF",
      pdfFile ? "1" : "0"
    );

    formData.append(
      "name",
      String(
        this.nameInput?.value ||
        ""
      ).trim()
    );

    formData.append(
      "name_pdf_artwork",
      String(
        this.namePdfInput
          ?.value || ""
      ).trim()
    );

    formData.append(
      "type_id",
      typeId
    );

    if (skuParentVariation) {
      formData.append(
        "sku_parent_variation",
        skuParentVariation
      );
    }

    if (imageFile) {
      formData.append(
        "imageFile",
        imageFile
      );
    }

    if (pdfFile) {
      formData.append(
        "pdfFile",
        pdfFile
      );
    }

    try {
      const response =
        await fetch(
          "../../controller/products/variations.php",
          {
            method: "POST",

            headers: {
              "X-Requested-With":
                "XMLHttpRequest"
            },

            body: formData
          }
        );

      if (!response.ok) {
        throw new Error(
          `Network error (${response.status})`
        );
      }

      const data =
        await response.json();

      if (!data?.success) {
        console.error(
          "Save failed:",
          data
        );

        alert(
          data?.message ||
          "Could not save the variation."
        );

        return false;
      }

      if (goNext) {
        const destination =
          "../../view/images/index.php";

        if (
          window.headerAddProduct
            ?.goNext
        ) {
          window.headerAddProduct
            .goNext(destination);
        } else {
          window.location.href =
            destination;
        }
      }

      return true;
    } catch (error) {
      console.error(
        "Save error:",
        error
      );

      alert(
        "Network/server error while saving."
      );

      return false;
    }
  }

  /* =========================
     Create variation
  ========================= */

  addNewVariation() {
    const { skuProduct } =
      this.readSkuParamsFromUrl();

    if (!skuProduct) {
      alert(
        "The product SKU was not found."
      );

      return;
    }

    fetch(
      "../../controller/products/variations.php",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          action:
            "create_new_variation",

          sku:
            skuProduct
        })
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Network error."
          );
        }

        return response.text();
      })
      .then((responseText) => {
        const json =
          this.safeJsonParse(
            responseText
          );

        if (!json?.success) {
          alert(
            json?.message ||
            "The variation could not be created."
          );

          return;
        }

        const skuVariation =
          String(
            json.sku_variation ||
            ""
          ).trim();

        if (!skuVariation) {
          return;
        }

        alert(
          "The new variation has been successfully created. " +
          "Please fill in the details and save once you have finished."
        );

        window.location.href =
          "../../view/variations/index.php" +
          `?sku=${encodeURIComponent(
            skuProduct
          )}` +
          `&sku_variation=${encodeURIComponent(
            skuVariation
          )}`;
      })
      .catch((error) => {
        console.error(
          "Create variation error:",
          error
        );
      });
  }

  /* =========================
     Helpers
  ========================= */

  readSkuParamsFromUrl() {
    const parameters =
      new URLSearchParams(
        window.location.search
      );

    return {
      skuProduct:
        parameters.get("sku") ||
        "",

      skuVariation:
        parameters.get(
          "sku_variation"
        ) || ""
    };
  }

  isValidPdf(file) {
    if (!file) {
      return false;
    }

    return (
      file.type ===
        "application/pdf" ||
      file.type ===
        "application/x-pdf" ||
      file.type ===
        "application/acrobat" ||
      file.type ===
        "application/x-bzpdf" ||
      file.name
        .toLowerCase()
        .endsWith(".pdf")
    );
  }

  async parseResponse(
    response
  ) {
    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      return response.json();
    }

    const responseText =
      await response.text();

    const parsed =
      this.safeJsonParse(
        responseText
      );

    if (parsed) {
      return parsed;
    }

    return {
      success: false,
      message: responseText
    };
  }

  safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error(
        "Invalid JSON:",
        error
      );

      return null;
    }
  }
}

// Create one instance.
new Variations();
