class Prices {
  constructor() {
    this.maxQuantity = null;
    this.selectedPrice = null;
  }

  deletePrices(typeId) {
    const wrapper = document.getElementById(`wrap-price-${typeId}`);
    if (!wrapper) return false;

    wrapper.remove();
    return true;
  }

  renderPrices(pricesOnlyOfType = [], typeVariation) {
    const selectedVariation = window.previewLogic?.getSelectVariation?.() ?? "";
    const variationId = Number(String(selectedVariation).replace("variation_id_", ""));
    const parent = document.getElementById("wrap-prices-group");

    if (!parent) return false;

    const typeId = String(typeVariation?.type_id ?? "null");
    const wrapId = `wrap-price-${typeId}`;

    this.deletePrices(typeId);

    const wrapper = document.createElement("div");
    wrapper.className = "wrap-price";
    wrapper.id = wrapId;
    wrapper.dataset.typeId = typeId;

    let renderedPrices = 0;

    for (let i = 0; i < pricesOnlyOfType.length; i++) {
      const priceData = pricesOnlyOfType[i];

      if (Number(priceData?.variation_id) !== variationId) continue;
      if (String(priceData?.price_display_mode ?? "").trim() !== "prices") continue;

      const priceId = String(priceData?.price_id ?? "").trim();
      const minQuantity = String(priceData?.min_quantity ?? "").trim();
      const maxQuantity = String(priceData?.max_quantity ?? "").trim();
      const price = String(priceData?.price ?? "").trim();

      if (!maxQuantity) continue;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "var-option js-scale-in js-price-option";
      button.value = price;
      button.dataset.priceId = priceId;
      button.dataset.minQuantity = minQuantity;
      button.dataset.maxQuantity = maxQuantity;
      button.dataset.price = price;
      button.dataset.variationId = String(priceData?.variation_id ?? "");
      button.dataset.priceDisplayMode = String(priceData?.price_display_mode ?? "");
      button.innerHTML = `<span class="opt-main">${this.escapeHtml(minQuantity)}</span>`;

      wrapper.appendChild(button);
      renderedPrices++;
    }

    if (renderedPrices === 0) return false;

    parent.appendChild(wrapper);
    this.bindPriceButtons(`#${CSS.escape(wrapId)}`);

    return true;
  }

  bindPriceButtons(scopeSelector) {
    const scope = document.querySelector(scopeSelector);
    if (!scope) return false;

    const buttons = Array.from(scope.querySelectorAll(".js-price-option"));
    if (buttons.length === 0) return false;

    for (const button of buttons) {
      if (button.dataset.bound === "1") continue;

      button.dataset.bound = "1";

      button.addEventListener("click", (event) => {
        const selectedButton = event.currentTarget;
        const selected = this.selectPriceButton(selectedButton, scope);

        if (selected) {
          this.updateProductSummaryBox(
            selectedButton.dataset.minQuantity,
            selectedButton.value
          );
        }
      });
    }

    const selected = this.selectPriceButton(buttons[0], scope);

    if (selected) {
      this.updateProductSummaryBox(
        buttons[0].dataset.minQuantity,
        buttons[0].value
      );
    }

    return true;
  }

  selectFirstAvailablePrice() {
    const firstPriceButton = document.querySelector(
      "#wrap-prices-group .js-price-option"
    );

    if (!firstPriceButton) return false;

    const scope = firstPriceButton.closest(".wrap-price");
    if (!scope) return false;

    const selected = this.selectPriceButton(firstPriceButton, scope);

    if (selected) {
      this.updateProductSummaryBox(
        firstPriceButton.dataset.minQuantity,
        firstPriceButton.value
      );
    }

    return selected;
  }

  selectPriceButton(button, scope = null) {
    if (!button) return false;

    const container = scope || button.closest(".wrap-price");
    if (!container) return false;

    const buttons = container.querySelectorAll(".js-price-option");

    for (const item of buttons) {
      item.classList.remove("is-selected");
      item.setAttribute("aria-pressed", "false");
    }

    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");

    const payload = {
      price_id: String(button.dataset.priceId ?? ""),
      min_quantity: String(button.dataset.minQuantity ?? ""),
      max_quantity: String(button.dataset.maxQuantity ?? ""),
      price: String(button.dataset.price ?? ""),
      value: String(button.value ?? "")
    };

    this.setSelectedPrice(payload);
    this.setMaxQuantity(payload.max_quantity);
    this.onPriceSelected(payload, button);
    this.updateVariationPrices();

    return true;
  }

  updateProductSummaryBox(quantity, price) {
    const selectedOptions = document.querySelectorAll(".is-selected");
    let totalExtraPrice = 0;

    for (let i = 0; i < selectedOptions.length; i++) {
      const extraPrice = selectedOptions[i].querySelector(".opt-price-extra");
      if (!extraPrice) continue;

      const priceText = extraPrice.textContent ?? "";
      const priceNumber = Number(
        priceText.replace("+", "").replace("p/u", "").trim()
      );

      if (Number.isFinite(priceNumber)) {
        totalExtraPrice += priceNumber;
      }
    }

    const numericQuantity = Number(quantity);
    const numericPrice = Number(price);

    const safeQuantity = Number.isFinite(numericQuantity) ? numericQuantity : 0;
    const safePrice = Number.isFinite(numericPrice) ? numericPrice : 0;

    const unitTotal = safePrice * safeQuantity;
    const extrasQuantity = totalExtraPrice === 0 ? 0 : safeQuantity;
    const extrasTotal = totalExtraPrice * safeQuantity;
    const grandTotal = unitTotal + extrasTotal;

    const bbUnit = document.getElementById("bb_unit");
    const bbUnitQuantity = document.getElementById("bb_unit_quantity");
    const bbUnitTotal = document.getElementById("bb_unit_total");
    const bbExtraUnit = document.getElementById("bb_extra_unit");
    const bbExtraQuantity = document.getElementById("bb_extra_quantity");
    const bbExtraTotal = document.getElementById("bb_extra_total");
    const bbTotal = document.getElementById("bb_total");
    const spPrice = document.getElementById("sp_price");
    const quantityLabel = document.getElementById("var_label_quantity");
    const unitHint = document.getElementById("sp_unit_hint");

    if (bbUnit) bbUnit.textContent = "£" + this.formatPrice(safePrice);
    if (bbUnitQuantity) bbUnitQuantity.textContent = String(safeQuantity);
    if (bbUnitTotal) bbUnitTotal.textContent = "£" + this.formatPrice(unitTotal);
    if (bbExtraUnit) bbExtraUnit.textContent = "£" + this.formatPrice(totalExtraPrice);
    if (bbExtraQuantity) bbExtraQuantity.textContent = String(extrasQuantity);
    if (bbExtraTotal) bbExtraTotal.textContent = "£" + this.formatPrice(extrasTotal);
    if (bbTotal) bbTotal.textContent = "£" + this.formatPrice(grandTotal);
    if (spPrice) spPrice.textContent = this.formatPrice(safePrice);
    if (quantityLabel) quantityLabel.textContent = String(safeQuantity);
    if (unitHint) unitHint.textContent = `per ${safeQuantity} units`;
  }

  updateVariationPrices() {
    const variationButtons = document.querySelectorAll(
      "#wrap-variations-group .var-option[id^='variation_id_']"
    );

    const ids = Array.from(variationButtons)
      .map((button) => Number(button.id.replace("variation_id_", "")))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (ids.length === 0) return false;

    const url = "../../controller/order/product.php";

    const data = {
      action: "get_variation_prices",
      ids: ids,
      max_quantity: this.getMaxQuantity()
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
        const responseData = JSON.parse(text);
        this.drawExtraVariationPrices(responseData.prices || []);
      })
      .catch((error) => {
        console.error("Error fetching variation prices:", error);
      });

    return true;
  }

  drawExtraVariationPrices(data = []) {
    if (!Array.isArray(data)) return false;

    for (let i = 0; i < data.length; i++) {
      const variationId = `variation_id_${data[i]?.variation_id ?? ""}`;
      const button = document.getElementById(variationId);

      if (!button) continue;

      const existingPrice = button.querySelector(".opt-price-extra");
      if (existingPrice) existingPrice.remove();

      const extraPrice = data[i]?.price?.price;

      if (extraPrice === null || extraPrice === undefined || extraPrice === "") {
        continue;
      }

      const priceElement = document.createElement("span");
      priceElement.className = "opt-price-extra";
      priceElement.textContent = `+${extraPrice} p/u`;

      button.appendChild(priceElement);
    }

    const selectedPrice = this.getSelectedPrice();

    if (selectedPrice) {
      this.updateProductSummaryBox(
        selectedPrice.min_quantity,
        selectedPrice.price
      );
    }

    return true;
  }

  setSelectedPrice(payload = null) {
    this.selectedPrice = payload;
  }

  getSelectedPrice() {
    return this.selectedPrice;
  }

  setMaxQuantity(maxQuantity) {
    this.maxQuantity = maxQuantity;
  }

  getMaxQuantity() {
    return this.maxQuantity;
  }

  onPriceSelected(payload, button = null) {
    // Optional hook.
  }

  formatPrice(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : "0.00";
  }

  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

const prices = new Prices();
window.prices = prices;
