class ProductsSupplierClass {
  constructor() {
    // 🔹 Elementos del DOM para filtros / contador / orden
    this.form = document.getElementById("product-filters");
    this.count = document.getElementById("product-count");
    this.sortSelect = document.getElementById("sort-select");

    // 🔹 Enlazar eventos de click/teclado en filas + filtros/orden
    this._bindRowDelegation();
    this._bindFilterEvents();

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

    let visible = 0;

    rows.forEach((tr) => {
      const name = (tr.dataset.name || "").toLowerCase();
      const sku = (tr.dataset.sku || "").toLowerCase();
      const c = tr.dataset.category || "";
      const s = tr.dataset.status || "";

      const passQ = !q || name.includes(q) || sku.includes(q);
      const passC = !cat || c === cat;
      const passS = !sts || s === sts;

      const show = passQ && passC && passS;
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

    fetch(url, {
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

        this.drawProductsSupplier(data);
        this.drawCategoriesOptiones(data);

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
      // Actualizamos contador
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

      const statusMap = {
        active:   { text: "Active",   cls: "badge-success" },
        draft:    { text: "Draft",    cls: "badge-warning" },
        inactive: { text: "Inactive", cls: "badge-info" },
        archived: { text: "Archived", cls: "badge-info" },
      };
      const st =
        statusMap[statusRaw] || { text: statusRaw || "Draft", cls: "badge-warning" };

      // ✅ URL exacta como pediste, con sku + sku_variation
      const href = `../../view/category/index.php?sku=${encodeURIComponent(
        sku
      )}&sku_variation=${encodeURIComponent(skuVariation)}`;

      tbody.innerHTML += `
        <tr class="row-link"
            data-name="${this._escAttr(name.toLowerCase())}"
            data-sku="${this._escAttr(sku.toLowerCase())}"
            data-category="${this._escAttr(category)}"
            data-status="${this._escAttr(st.text)}"
            tabindex="0">
          <td>${this._escHtml(sku)}</td>
          <td>
            <div class="prod-name">${this._escHtml(name)}</div>
            <small class="muted">—</small>
          </td>
          <td><span class="chip">${this._escHtml(category)}</span></td>
          <td class="center">
            <span class="badge ${st.cls}">
              <i></i>${this._escHtml(st.text)}
            </span>
          </td>
          <td class="center">
            <a class="btn btn-small" href="${this._escAttr(href)}">Edit</a>
          </td>
        </tr>
      `;
    }

    // Después de crear filas, aplicamos sort + filtros según el estado actual del form
    this.applySort();
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
