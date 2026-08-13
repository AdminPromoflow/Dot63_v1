/*
 * [Customer 8]
 * Este controlador une rangos de cantidad, extras de variaciones, disponibilidad
 * y el resumen matemático que habilita o bloquea la compra.
 */
export class PricesController {
  constructor(options = {}) {
    // [Customer 8.1] onSummaryChange informa al coordinador cuándo la selección ya se puede comprar.
    this.api = options.api;
    this.store = options.store;
    this.getSku = options.getSku || (() => "");
    this.onSummaryChange = options.onSummaryChange || (() => {});
    this.root = document.getElementById("wrap-prices-group");
    this.empty = document.getElementById("prices_empty");
    this.abortController = null;
    this.extraVersion = 0;

    this.elements = {
      unit: document.getElementById("bb_unit"),
      quantity: document.getElementById("bb_unit_quantity"),
      unitTotal: document.getElementById("bb_unit_total"),
      extraUnit: document.getElementById("bb_extra_unit"),
      extraQuantity: document.getElementById("bb_extra_quantity"),
      extraTotal: document.getElementById("bb_extra_total"),
      total: document.getElementById("bb_total"),
      mainPrice: document.getElementById("sp_price"),
      quantityLabel: document.getElementById("var_label_quantity"),
      unitHint: document.getElementById("sp_unit_hint")
    };
  }

  clear() {
    // [Customer 8.1.1] Cancelamos cálculos viejos y devolvemos precio/cantidad al estado inicial.
    this.abortController?.abort();
    this.abortController = null;
    this.extraVersion++;
    if (this.root) this.root.innerHTML = "";
    this.store.selectedPrice = null;
    this.store.selectedPriceId = null;
    this.store.selectedQuantity = null;
    this.setEmptyState(true);
    this.updateSummary();
  }

  render(rows = []) {
    // [Customer 8.1.2] Recordamos la cantidad para conservarla si otra variación ofrece el mismo rango.
    const preferredQuantity = Number(this.store.selectedQuantity);
    this.clear();
    if (!this.root || !Array.isArray(rows) || rows.length === 0) return false;

    // [Customer 8.1.3] Solo los registros de precio base se muestran como rangos y se ordenan.
    const sorted = [...rows]
      .filter((row) => String(row?.price_display_mode ?? "prices") === "prices")
      .sort((a, b) => Number(a?.min_quantity) - Number(b?.min_quantity));

    if (sorted.length === 0) return false;

    const fragment = document.createDocumentFragment();

    for (const row of sorted) {
      // [Customer 8.1.4] Cada precio válido se transforma en botón y conserva price_id para el carrito.
      const min = Number(row?.min_quantity);
      const max = Number(row?.max_quantity);
      const price = Number(row?.price);
      if (!Number.isFinite(min) || min <= 0 || !Number.isFinite(price)) continue;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "price-tier";
      button.dataset.priceId = String(row?.price_id ?? "");
      button.dataset.quantity = String(min);
      button.dataset.minQuantity = String(min);
      button.dataset.maxQuantity = Number.isFinite(max) ? String(max) : "";
      button.dataset.price = String(price);
      button.setAttribute("aria-pressed", "false");

      const quantity = document.createElement("strong");
      quantity.textContent = min.toLocaleString("en-GB");

      const range = document.createElement("span");
      range.textContent = Number.isFinite(max) && max >= min
        ? `${min.toLocaleString("en-GB")}–${max.toLocaleString("en-GB")} units`
        : `${min.toLocaleString("en-GB")}+ units`;

      const amount = document.createElement("span");
      amount.className = "price-tier-amount";
      amount.textContent = `£${this.formatMoney(price)} each`;

      button.append(quantity, range, amount);
      button.addEventListener("click", () => this.select(button));
      fragment.appendChild(button);
    }

    this.root.appendChild(fragment);
    const first = this.root.querySelector(".price-tier");
    if (!first) return false;

    // [Customer 8.2] Se elige la cantidad anterior si todavía existe; de lo contrario, el primer rango.
    const preferred = Number.isFinite(preferredQuantity)
      ? Array.from(this.root.querySelectorAll(".price-tier")).find(
          (button) => Number(button.dataset.quantity) === preferredQuantity
        )
      : null;

    this.setEmptyState(false);
    this.select(preferred || first);
    return true;
  }

  select(button) {
    // [Customer 8.2.1] La selección visual, cantidad, precio y price_id se actualizan juntos.
    if (!button || !this.root) return false;

    this.root.querySelectorAll(".price-tier").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    const quantity = Number(button.dataset.quantity);
    const price = Number(button.dataset.price);
    const priceId = Number(button.dataset.priceId);

    this.store.selectedQuantity = Number.isFinite(quantity) ? quantity : null;
    this.store.selectedPrice = Number.isFinite(price) ? price : null;
    this.store.selectedPriceId = Number.isInteger(priceId) && priceId > 0 ? priceId : null;

    // [Customer 8.2.2] Cambiar cantidad puede cambiar precio o disponibilidad de todos los extras.
    this.refreshVariationExtras();
    this.updateSummary();
    return true;
  }

  async refreshVariationExtras() {
    // [Customer 8.3] La versión permite ignorar respuestas antiguas si la cantidad cambia rápido.
    const requestVersion = ++this.extraVersion;
    this.resetVariationPriceOptions();

    const quantity = Number(this.store.selectedQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      this.updateSummary();
      return;
    }

    // [Customer 8.3.1] Todos los IDs visibles viajan en una sola solicitud.
    const buttons = Array.from(
      document.querySelectorAll("#wrap-variations-group .var-option[data-variation-id]")
    );
    const ids = buttons
      .map((button) => Number(button.dataset.variationId))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (ids.length === 0) {
      this.updateSummary();
      return;
    }

    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      // [Customer 8.3.2] PreviewApi continúa el flujo en controller/order/product.php.
      const result = await this.api.getVariationPrices(
        this.getSku(),
        ids,
        quantity,
        { signal: this.abortController.signal }
      );

      if (requestVersion !== this.extraVersion) return;

      // [Customer 8.3.3] Limpiamos otra vez porque el DOM pudo cambiar durante la espera.
      this.resetVariationPriceOptions();

      // [Customer 8.3.4] Un Map resuelve extras y un Set distingue precio cero de rango inexistente.
      const priceById = new Map(
        (result.prices || []).map((row) => [String(row.variation_id), Number(row.price)])
      );
      const pricedVariationIds = new Set(
        (result.priced_variation_ids || []).map((id) => String(id))
      );

      for (const button of buttons) {
        const variationId = String(button.dataset.variationId);
        const hasApplicablePrice = priceById.has(variationId);
        const extra = priceById.get(variationId);

        if (hasApplicablePrice && Number.isFinite(extra)) {
          button.dataset.extraPrice = String(Math.max(0, extra));

          if (extra > 0) {
            const label = document.createElement("span");
            label.className = "opt-price-extra";
            label.textContent = `+£${this.formatMoney(extra)} each`;
            button.appendChild(label);
          }
        } else if (button.dataset.priceDisplayMode === "variation" && pricedVariationIds.has(variationId)) {
          // [Customer 8.3.5] Esta opción sí tiene precios configurados, pero ninguno cubre la cantidad elegida.
          button.classList.add("is-price-unavailable");
          button.disabled = true;
          button.title = "This option has no price for the selected quantity";

          const label = document.createElement("span");
          label.className = "opt-price-extra is-unavailable";
          label.textContent = "Unavailable";
          button.appendChild(label);
        } else if (button.dataset.priceDisplayMode === "variation") {
          button.dataset.extraPrice = "0";
        }
      }

      this.updateSummary();
    } catch (error) {
      // [Customer 8.3.6] Una cancelación es esperada; otros errores se registran para diagnóstico.
      if (error.name !== "AbortError") {
        console.error("Unable to load variation prices:", error);
      }
    }
  }

  updateSummary() {
    // [Customer 8.4] Se suman precio base y extras por unidad, luego se multiplican por cantidad.
    const quantity = Number(this.store.selectedQuantity);
    const basePrice = Number(this.store.selectedPrice);
    const hasPrice = Number.isFinite(quantity) && quantity > 0 && Number.isFinite(basePrice);

    let extrasPerUnit = 0;
    const selectedOptions = Array.from(
      document.querySelectorAll("#wrap-variations-group .var-option.is-selected")
    );
    const hasUnavailableSelection = selectedOptions.some((button) => (
      button.classList.contains("is-price-unavailable")
    ));

    selectedOptions.forEach((button) => {
      const value = Number(button.dataset.extraPrice);
      if (Number.isFinite(value)) extrasPerUnit += value;
    });

    const safeQuantity = hasPrice ? quantity : 0;
    const safeBase = hasPrice ? basePrice : 0;
    const baseTotal = safeBase * safeQuantity;
    const extrasTotal = extrasPerUnit * safeQuantity;
    const total = baseTotal + extrasTotal;

    // [Customer 8.4.1] Si la opción seleccionada no tiene precio, no mostramos un total engañoso.
    this.setText(this.elements.unit, hasPrice ? `£${this.formatMoney(safeBase)}` : "—");
    this.setText(this.elements.quantity, hasPrice ? safeQuantity.toLocaleString("en-GB") : "—");
    this.setText(this.elements.unitTotal, hasPrice ? `£${this.formatMoney(baseTotal)}` : "—");
    this.setText(this.elements.extraUnit, hasPrice && !hasUnavailableSelection ? `£${this.formatMoney(extrasPerUnit)}` : "—");
    this.setText(this.elements.extraQuantity, hasPrice && !hasUnavailableSelection && extrasPerUnit > 0
      ? safeQuantity.toLocaleString("en-GB")
      : "—");
    this.setText(this.elements.extraTotal, hasPrice && !hasUnavailableSelection ? `£${this.formatMoney(extrasTotal)}` : "—");
    this.setText(this.elements.total, hasPrice && !hasUnavailableSelection ? `£${this.formatMoney(total)}` : "—");
    this.setText(this.elements.mainPrice, hasPrice ? this.formatMoney(safeBase) : "—");
    this.setText(this.elements.quantityLabel, hasPrice
      ? `${safeQuantity.toLocaleString("en-GB")} units`
      : "Select a price tier");
    this.setText(this.elements.unitHint, hasPrice
      ? hasUnavailableSelection
        ? "Choose an available option for this quantity"
        : `per unit at ${safeQuantity.toLocaleString("en-GB")} units`
      : "Pricing not configured");

    // [Customer 8.5] Solo una combinación con precio base, price_id y extras disponibles queda lista.
    this.onSummaryChange({
      ready: hasPrice && !hasUnavailableSelection && Number(this.store.selectedPriceId) > 0,
      quantity: safeQuantity,
      basePrice: safeBase,
      extrasPerUnit,
      total
    });
  }

  resetVariationPriceOptions() {
    // [Customer 8.3.7] Este helper concentra la limpieza usada antes y después de la solicitud.
    document.querySelectorAll("#wrap-variations-group .opt-price-extra").forEach((node) => node.remove());
    document.querySelectorAll("#wrap-variations-group .var-option").forEach((button) => {
      delete button.dataset.extraPrice;
      button.classList.remove("is-price-unavailable");
      button.disabled = false;
      button.removeAttribute("title");
    });
  }

  setEmptyState(show) {
    if (this.empty) this.empty.hidden = !show;
  }

  setText(element, value) {
    if (element) element.textContent = value;
  }

  formatMoney(value) {
    // [Customer 8.4.2] La interfaz siempre presenta dos decimales y nunca muestra NaN.
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : "0.00";
  }
}
