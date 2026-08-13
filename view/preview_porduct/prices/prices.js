/*
 * [Supplier 8]
 * Este controlador une tres cosas: rangos de cantidad, extras de variaciones
 * y el resumen matemático de la orden que ve el proveedor.
 */
export class PricesController {
  constructor(options = {}) {
    // [Supplier 8.1] API consulta extras, Store conserva la selección y getSku evita duplicar el SKU.
    this.api = options.api;
    this.store = options.store;
    this.getSku = options.getSku || (() => "");
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
    // [Supplier 8.1.1] Cancelamos cálculos viejos y devolvemos precio/cantidad al estado inicial.
    this.abortController?.abort();
    this.abortController = null;
    this.extraVersion++;
    if (this.root) this.root.innerHTML = "";
    this.store.selectedPrice = null;
    this.store.selectedQuantity = null;
    this.setEmptyState(true);
    this.updateSummary();
  }

  render(rows = []) {
    // [Supplier 8.1.2] Recordamos la cantidad para conservarla si otra variación ofrece el mismo rango.
    const preferredQuantity = Number(this.store.selectedQuantity);
    this.clear();
    if (!this.root || !Array.isArray(rows) || rows.length === 0) return false;

    // [Supplier 8.1.3] Solo los registros de precio base se muestran como rangos y se ordenan de menor a mayor.
    const sorted = [...rows]
      .filter((row) => String(row?.price_display_mode ?? "prices") === "prices")
      .sort((a, b) => Number(a?.min_quantity) - Number(b?.min_quantity));

    if (sorted.length === 0) return false;

    const fragment = document.createDocumentFragment();

    for (const row of sorted) {
      // [Supplier 8.1.4] Cada precio válido se transforma en un botón con sus valores dentro de dataset.
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

    // [Supplier 8.2] Se elige la cantidad anterior si todavía existe; de lo contrario, el primer rango.
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
    // [Supplier 8.2.1] La selección visual y el estado numérico se actualizan juntos.
    if (!button || !this.root) return false;

    this.root.querySelectorAll(".price-tier").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    const quantity = Number(button.dataset.quantity);
    const price = Number(button.dataset.price);

    this.store.selectedQuantity = Number.isFinite(quantity) ? quantity : null;
    this.store.selectedPrice = Number.isFinite(price) ? price : null;

    // [Supplier 8.2.2] Cambiar la cantidad puede cambiar todos los extras, por eso se consultan otra vez.
    this.refreshVariationExtras();
    this.updateSummary();
    return true;
  }

  async refreshVariationExtras() {
    // [Supplier 8.3] La versión permite ignorar una respuesta antigua si el usuario cambia rápido de cantidad.
    const requestVersion = ++this.extraVersion;
    this.resetVariationPriceOptions();

    const quantity = Number(this.store.selectedQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      this.updateSummary();
      return;
    }

    // [Supplier 8.3.1] Enviamos todos los IDs visibles en una sola solicitud, no una solicitud por botón.
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
      // [Supplier 8.3.2] PreviewApi continúa el flujo en controller/order/product.php.
      const result = await this.api.getVariationPrices(
        this.getSku(),
        ids,
        quantity,
        { signal: this.abortController.signal }
      );

      if (requestVersion !== this.extraVersion) return;

      // [Supplier 8.3.3] Limpiamos nuevamente porque el DOM pudo cambiar mientras esperaba la respuesta.
      this.resetVariationPriceOptions();

      // [Supplier 8.3.4] El Map permite encontrar el extra de cada botón en tiempo constante.
      const priceById = new Map(
        (result.prices || []).map((row) => [String(row.variation_id), Number(row.price)])
      );

      for (const button of buttons) {
        const extra = priceById.get(String(button.dataset.variationId));

        if (Number.isFinite(extra) && extra > 0) {
          button.dataset.extraPrice = String(extra);
          const label = document.createElement("span");
          label.className = "opt-price-extra";
          label.textContent = `+£${this.formatMoney(extra)} each`;
          button.appendChild(label);
        } else if (button.dataset.priceDisplayMode === "variation") {
          button.dataset.extraPrice = "0";
        }
      }

      this.updateSummary();
    } catch (error) {
      // [Supplier 8.3.5] Una cancelación es esperada; otros errores se registran para diagnóstico.
      if (error.name !== "AbortError") {
        console.error("Unable to load variation prices:", error);
      }
    }
  }

  updateSummary() {
    // [Supplier 8.4] Se suman precio base y extras por unidad, luego se multiplican por cantidad.
    const quantity = Number(this.store.selectedQuantity);
    const basePrice = Number(this.store.selectedPrice);
    const hasPrice = Number.isFinite(quantity) && quantity > 0 && Number.isFinite(basePrice);

    let extrasPerUnit = 0;
    document.querySelectorAll("#wrap-variations-group .var-option.is-selected").forEach((button) => {
      const value = Number(button.dataset.extraPrice);
      if (Number.isFinite(value)) extrasPerUnit += value;
    });

    const safeQuantity = hasPrice ? quantity : 0;
    const safeBase = hasPrice ? basePrice : 0;
    const baseTotal = safeBase * safeQuantity;
    const extrasTotal = extrasPerUnit * safeQuantity;
    const total = baseTotal + extrasTotal;

    // [Supplier 8.4.1] Todos los campos visibles se actualizan a partir del mismo cálculo.
    this.setText(this.elements.unit, hasPrice ? `£${this.formatMoney(safeBase)}` : "—");
    this.setText(this.elements.quantity, hasPrice ? safeQuantity.toLocaleString("en-GB") : "—");
    this.setText(this.elements.unitTotal, hasPrice ? `£${this.formatMoney(baseTotal)}` : "—");
    this.setText(this.elements.extraUnit, hasPrice ? `£${this.formatMoney(extrasPerUnit)}` : "—");
    this.setText(this.elements.extraQuantity, hasPrice && extrasPerUnit > 0
      ? safeQuantity.toLocaleString("en-GB")
      : "—");
    this.setText(this.elements.extraTotal, hasPrice ? `£${this.formatMoney(extrasTotal)}` : "—");
    this.setText(this.elements.total, hasPrice ? `£${this.formatMoney(total)}` : "—");
    this.setText(this.elements.mainPrice, hasPrice ? this.formatMoney(safeBase) : "—");
    this.setText(this.elements.quantityLabel, hasPrice
      ? `${safeQuantity.toLocaleString("en-GB")} units`
      : "Select a price tier");
    this.setText(this.elements.unitHint, hasPrice
      ? `per unit at ${safeQuantity.toLocaleString("en-GB")} units`
      : "Pricing not configured");
  }

  resetVariationPriceOptions() {
    // [Supplier 8.3.6] Este helper concentra la limpieza usada antes y después de la solicitud.
    document.querySelectorAll("#wrap-variations-group .opt-price-extra").forEach((node) => node.remove());
    document.querySelectorAll("#wrap-variations-group .var-option").forEach((button) => {
      delete button.dataset.extraPrice;
    });
  }

  setEmptyState(show) {
    if (this.empty) this.empty.hidden = !show;
  }

  setText(element, value) {
    if (element) element.textContent = value;
  }

  formatMoney(value) {
    // [Supplier 8.4.2] La interfaz siempre presenta dos decimales y nunca muestra NaN.
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : "0.00";
  }
}
