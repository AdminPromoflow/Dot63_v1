class ProductsSupplierClass {
  constructor() {
    // 🔹 Elementos del DOM para filtros / contador / orden
    this.form = document.getElementById("product-filters");
    this.count = document.getElementById("product-count");
    this.sortSelect = document.getElementById("sort-select");
    this.productsData = [];
    this.superLanyardPreviewToken = null;
    this.superLanyardAxes = [
      ["theme", "Theme"],
      ["material", "Material"],
      ["width", "Width"],
      ["print_technique", "Print Technique"],
      ["printed_sides", "Printed Sides"],
      ["colour", "Colour"]
    ];

    // 🔹 Enlazar eventos de click/teclado en filas + filtros/orden
    this._bindRowDelegation();
    this._bindFilterEvents();
    this._bindSuperLanyardGenerator();

    // 🔹 Cargar datos desde el servidor
    this.updateProductsSupplier();

    // 🔹 Aplicar sort/filters por si hay filas demo
    this.applySort();
  }

  // =========================
  //   Helpers de tabla (UI)
  // =========================

  _getRows() {
    return Array.from(
      document.querySelectorAll("tbody#products__table tr.row-link")
    );
  }

  _bindRowDelegation() {
    // ✅ Delegación de click: sirve aunque las filas se agreguen luego por fetch
    document.addEventListener("click", (e) => {
      const tr = e.target.closest("tr.row-link");
      if (!tr) return;
      // Si el click fue en un <a> o <button> interno, no redirigimos desde la fila
      if (e.target.closest("a, button")) return;

      const href = tr.getAttribute("data-href");
      if (href) window.location.href = href;
    });

    // ✅ Accesibilidad con teclado (Enter / Space sobre la fila)
    document.addEventListener("keydown", (e) => {
      const tr = e.target.closest("tr.row-link");
      if (!tr) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();

      const href = tr.getAttribute("data-href");
      if (href) window.location.href = href;
    });
  }

  _bindFilterEvents() {
    // ✅ Filtros (formulario)
    if (this.form) {
      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.applyFilters();
      });

      this.form.addEventListener("reset", () => {
        // Espera a que se resetee el form para leer los nuevos valores
        setTimeout(() => this.applyFilters(), 0);
      });
    }

    // ✅ Orden (select)
    if (this.sortSelect) {
      this.sortSelect.addEventListener("change", () => this.applySort());
    }
  }

  // =========================
  //   Filtros / Orden
  // =========================

  applyFilters() {
    const rows = this._getRows();
    if (!this.form) return;

    const data = new FormData(this.form);
    const q = (data.get("q") || "").toString().trim().toLowerCase();
    const cat = (data.get("category") || "").toString();
    const sts = (data.get("status") || "").toString();
    const superSelections = new Map();

    this.form.querySelectorAll("select[data-super-lanyard-axis]").forEach(select => {
      const value = String(select.value || "");
      if (value) superSelections.set(select.dataset.superLanyardAxis, value);
    });

    let visible = 0;

    rows.forEach((tr) => {
      const name = (tr.dataset.name || "").toLowerCase();
      const sku = (tr.dataset.sku || "").toLowerCase();
      const c = tr.dataset.category || "";
      const s = tr.dataset.status || "";
      const isGeneratedSuperLanyard = tr.dataset.superLanyardGenerated === "1";

      const passQ = !q || name.includes(q) || sku.includes(q);
      const passC = !cat || c === cat;
      const passS = !sts || s === sts;
      const passSuperLanyard = !superSelections.size || (
        isGeneratedSuperLanyard &&
        Array.from(superSelections).every(([axis, value]) =>
          String(tr.dataset[this._axisDatasetKey(axis)] || "") === value
        )
      );

      const show = passQ && passC && passS && passSuperLanyard;
      tr.style.display = show ? "" : "none";
      if (show) visible++;
    });

    if (this.count) {
      this.count.textContent = `${visible} product${visible === 1 ? "" : "s"}`;
    }
  }

  applySort() {
    const rows = this._getRows();
    const tbody = document.querySelector(
      ".products__table tbody#products__table"
    );
    if (!tbody) return;

    const val = this.sortSelect?.value || "name-asc";

    const getName = (tr) => (tr.dataset.name || "").toString();
    const getPrice = (tr) =>
      parseFloat(tr.querySelector("td[data-price]")?.dataset.price || "0");

    const sorted = [...rows].sort((a, b) => {
      if (val === "price-asc") return getPrice(a) - getPrice(b);
      if (val === "price-desc") return getPrice(b) - getPrice(a);
      // default: ordenar por nombre ascendente
      return getName(a).localeCompare(getName(b));
    });

    sorted.forEach((tr) => tbody.appendChild(tr));

    // Después de reordenar, volvemos a aplicar filtros
    this.applyFilters();
  }

  // =========================
  //   Fetch + pintado tabla
  // =========================

  updateProductsSupplier() {
    const url = "../../controller/products/product.php";
    const payload = { action: "get_all_products_supplier" };

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) return response.text();
        throw new Error("Network error.");
      })
      .then((txt) => {
      //  alert(txt);
        const res = JSON.parse(txt);

        // ✅ res esperado: { success:true, data:[...] }
        const data = res?.data || [];
        this.productsData = Array.isArray(data) ? data : [];

        this.drawProductsSupplier(data);
        this.drawCategoriesOptiones(data);
        this.drawSuperLanyardFilters(data);

        // ✅ Re-aplica orden/filtros con las nuevas filas
        this.applySort();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // =========================
  //   Categorías únicas <select>
  // =========================

  drawCategoriesOptiones(list) {
    const uniqueCategories = [];

    const list_categories = document.getElementById("list_categories");
    if (!list_categories) return;

    // Opción por defecto
    list_categories.innerHTML = `<option value="">All</option>`;

    for (let i = 0; i < list.length; i++) {
      const category = list[i].category_name;

      // Saltar nulos o vacíos
      if (category === null || category === "") continue;

      // Solo agregar si no existe aún
      if (!uniqueCategories.includes(category)) {
        uniqueCategories.push(category);

        // value = category para que el filtro funcione (data-category === value)
        list_categories.innerHTML += `<option value="${this._escAttr(
          category
        )}">${this._escHtml(category)}</option>`;
      }
    }
  }

  // =========================
  //   Pintar filas de productos
  // =========================

  drawProductsSupplier(list) {
    const tbody = document.getElementById("products__table");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div style="padding:12px; color: var(--muted);">No products found.</div>
          </td>
        </tr>
      `;
      this.applyFilters();
      return;
    }

    for (let i = 0; i < list.length; i++) {
      const p = list[i] || {};
      const sku = (p.sku || "").toString();
      const skuVariation = (p.first_variation_sku || "").toString();
      const name = (p.product_name || "Untitled product").toString();
      const category = (p.category_name || "—").toString();
      const statusRaw = (p.status || "draft").toString().toLowerCase();
      const isGeneratedSuperLanyard = Number(p.is_super_lanyard_generated) === 1;
      const superOptions = p.super_lanyard_options || {};
      const superVariationSku = String(p.super_lanyard_variation_sku || "");

      const statusMap = {
        active: { text: "Active", cls: "badge-success" },
        draft: { text: "Draft", cls: "badge-warning" },
        inactive: { text: "Inactive", cls: "badge-info" },
        archived: { text: "Archived", cls: "badge-info" },
      };

      const st = statusMap[statusRaw] || {
        text: statusRaw || "Draft",
        cls: "badge-warning"
      };

      const href = isGeneratedSuperLanyard
        ? `../../view/preview_porduct/index.php?sku=${encodeURIComponent(sku)}&sku_variation=${encodeURIComponent(superVariationSku || skuVariation)}`
        : `../../view/category/index.php?sku=${encodeURIComponent(sku)}&sku_variation=${encodeURIComponent(skuVariation)}&mode=edit`;
      const actionText = isGeneratedSuperLanyard ? "Open" : "Edit";

      tbody.innerHTML += `
        <tr class="row-link"
            data-name="${this._escAttr(name.toLowerCase())}"
            data-sku="${this._escAttr(sku.toLowerCase())}"
            data-category="${this._escAttr(category)}"
            data-status="${this._escAttr(st.text)}"
            data-super-lanyard-generated="${isGeneratedSuperLanyard ? "1" : "0"}"
            data-super-theme="${this._escAttr(superOptions.theme || "")}"
            data-super-material="${this._escAttr(superOptions.material || "")}"
            data-super-width="${this._escAttr(superOptions.width || "")}"
            data-super-print-technique="${this._escAttr(superOptions.print_technique || "")}"
            data-super-printed-sides="${this._escAttr(superOptions.printed_sides || "")}"
            data-super-colour="${this._escAttr(superOptions.colour || "")}"
            data-href="${this._escAttr(href)}"
            tabindex="0">
          <td>${this._escHtml(sku)}</td>
          <td>
            <div class="prod-name">${this._escHtml(name)}${isGeneratedSuperLanyard ? '<span class="super-lanyard-generated-chip">Generated</span>' : ""}</div>
            <small class="muted">—</small>
          </td>
          <td><span class="chip">${this._escHtml(category)}</span></td>
          <td class="center">
            <span class="badge ${st.cls}">
              <i></i>${this._escHtml(st.text)}
            </span>
          </td>
          <td class="center">
            <a class="btn btn-small" href="${this._escAttr(href)}">${actionText}</a>
          </td>
        </tr>
      `;
    }

    this.applySort();
  }

  _axisDatasetKey(axis) {
    return `super${String(axis || "")
      .split("_")
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")}`;
  }

  drawSuperLanyardFilters(list) {
    const fieldset = document.getElementById("super-lanyard-product-filters");
    const fields = document.getElementById("super-lanyard-filter-fields");
    if (!fieldset || !fields) return;

    const currentSelections = new Map(
      Array.from(fields.querySelectorAll("select[data-super-lanyard-axis]"))
        .map(select => [select.dataset.superLanyardAxis, select.value])
    );
    const generated = (Array.isArray(list) ? list : [])
      .filter(product => Number(product?.is_super_lanyard_generated) === 1);

    fields.innerHTML = "";
    fieldset.hidden = generated.length === 0;
    if (!generated.length) return;

    this.superLanyardAxes.forEach(([axis, labelText]) => {
      const values = Array.from(new Set(
        generated
          .map(product => String(product?.super_lanyard_options?.[axis] || "").trim())
          .filter(Boolean)
      )).sort((a, b) => a.localeCompare(b));

      if (!values.length) return;

      const label = document.createElement("label");
      const text = document.createElement("span");
      const select = document.createElement("select");
      const allOption = document.createElement("option");

      text.textContent = labelText;
      allOption.value = "";
      allOption.textContent = "All";
      select.dataset.superLanyardAxis = axis;
      select.name = `super_lanyard_${axis}`;
      select.append(allOption);

      values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.append(option);
      });

      const previousValue = currentSelections.get(axis) || "";
      if (values.includes(previousValue)) select.value = previousValue;

      label.append(text, select);
      fields.append(label);
    });
  }

  _bindSuperLanyardGenerator() {
    document.getElementById("preview-super-lanyard")
      ?.addEventListener("click", () => this.previewSuperLanyard());
    document.getElementById("generate-super-lanyard")
      ?.addEventListener("click", () => this.generateSuperLanyard());
    document.getElementById("close-super-lanyard")
      ?.addEventListener("click", () => {
        const panel = document.getElementById("super-lanyard-generator");
        if (panel) panel.hidden = true;
      });
  }

  async postSuperLanyard(action, extra = {}) {
    const response = await fetch("../../controller/products/super_lanyard.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra })
    });

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      payload = { success: false, error: "Invalid response from the server." };
    }

    if (!response.ok) {
      const requestError = new Error(payload?.error || "Super Lanyard request failed.");
      requestError.payload = payload;
      throw requestError;
    }

    return payload;
  }

  async previewSuperLanyard() {
    const panel = document.getElementById("super-lanyard-generator");
    const preview = document.getElementById("super-lanyard-preview");
    const report = document.getElementById("super-lanyard-report");
    const status = document.getElementById("super-lanyard-status");
    const button = document.getElementById("preview-super-lanyard");

    if (panel) panel.hidden = false;
    if (preview) preview.hidden = true;
    if (report) report.hidden = true;
    if (status) status.textContent = "Calculating active variation combinations…";
    if (button) button.disabled = true;
    this.superLanyardPreviewToken = null;

    try {
      const result = await this.postSuperLanyard("preview_super_lanyard");
      this.superLanyardPreviewToken = result.preview_token;
      this.renderSuperLanyardPreview(result);
      if (status) {
        status.textContent = `Preview ready for ${result.source?.name || "Super Lanyard"}. Review it before creating products.`;
      }
      panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      this.renderSuperLanyardError(error.message);
      if (status) status.textContent = "Preview could not be prepared.";
    } finally {
      if (button) button.disabled = false;
    }
  }

  renderSuperLanyardPreview(result) {
    const preview = document.getElementById("super-lanyard-preview");
    const total = document.getElementById("super-lanyard-total");
    const pending = document.getElementById("super-lanyard-pending");
    const existing = document.getElementById("super-lanyard-existing");
    const dimensions = document.getElementById("super-lanyard-dimensions");
    const rows = document.getElementById("super-lanyard-preview-rows");
    const note = document.getElementById("super-lanyard-preview-note");
    const generateButton = document.getElementById("generate-super-lanyard");

    if (total) total.textContent = String(result.total_combinations || 0);
    if (pending) pending.textContent = String(result.pending_combinations || 0);
    if (existing) existing.textContent = String(result.existing_combinations || 0);

    if (dimensions) {
      dimensions.innerHTML = (result.dimensions || []).map(dimension =>
        `<span class="chip">${this._escHtml(dimension.label)}: ${this._escHtml(dimension.options_count)} active</span>`
      ).join("");
    }

    if (rows) {
      rows.innerHTML = (result.preview || []).map(row => `
        <tr>
          <td>${this._escHtml(row.title)}</td>
          <td>${this._escHtml(row.sku)}</td>
          <td class="center">
            <span class="badge ${row.exists ? "badge-info" : "badge-success"}">
              <i></i>${row.exists ? "Skip" : "Create"}
            </span>
          </td>
        </tr>
      `).join("");
    }

    if (note) {
      note.textContent = result.preview_truncated
        ? `Showing the first ${result.preview_limit} of ${result.total_combinations} combinations.`
        : `Showing all ${result.total_combinations} combinations.`;
    }
    if (generateButton) generateButton.disabled = Number(result.pending_combinations) === 0;
    if (preview) preview.hidden = false;
  }

  async generateSuperLanyard() {
    if (!this.superLanyardPreviewToken) {
      this.renderSuperLanyardError("Create a new preview before generating products.");
      return;
    }

    const button = document.getElementById("generate-super-lanyard");
    const status = document.getElementById("super-lanyard-status");
    if (button) button.disabled = true;
    if (status) status.textContent = "Creating Super Lanyard products…";

    try {
      const result = await this.postSuperLanyard("generate_super_lanyard", {
        preview_token: this.superLanyardPreviewToken
      });
      this.superLanyardPreviewToken = null;
      this.renderSuperLanyardReport(result);
      if (status) status.textContent = "Generation completed.";
      await this.updateProductsSupplier();
    } catch (error) {
      this.superLanyardPreviewToken = null;
      this.renderSuperLanyardError(error.message);
      if (status) status.textContent = "Generation could not be completed.";
    }
  }

  renderSuperLanyardReport(result) {
    const report = document.getElementById("super-lanyard-report");
    if (!report) return;

    const errorItems = (result.errors || []).map(item =>
      `<li>${this._escHtml(item.title)} — ${this._escHtml(item.error)}</li>`
    ).join("");

    report.classList.toggle("is-error", Number(result.errors_count) > 0);
    report.innerHTML = `
      <strong>Generation report</strong>
      <p>${this._escHtml(result.created || 0)} created · ${this._escHtml(result.skipped || 0)} skipped · ${this._escHtml(result.errors_count || 0)} errors</p>
      ${errorItems ? `<ul>${errorItems}</ul>` : ""}
    `;
    report.hidden = false;
  }

  renderSuperLanyardError(message) {
    const report = document.getElementById("super-lanyard-report");
    if (!report) return;
    report.classList.add("is-error");
    report.innerHTML = `<strong>Super Lanyard</strong><p>${this._escHtml(message)}</p>`;
    report.hidden = false;
  }
  // =========================
  //   Helpers de escape
  // =========================

  _escHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _escAttr(str) {
    return this._escHtml(str).replaceAll("`", "&#096;");
  }
}

// 🔹 Instancia global (puedes cambiar el nombre si quieres)
const productsSupplierClass = new ProductsSupplierClass();
