/*
 * [Supplier 6]
 * Este controlador recorre el árbol de variaciones del producto. Cada opción elegida
 * puede pedir hijos al servidor, guardar una nueva ruta y volver a renderizar recursos/precios.
 */
export class VariationsController {
  constructor(options = {}) {
    // [Supplier 6.1] El coordinador inyecta API, Store, Prices y callbacks para mantener este módulo enfocado.
    this.api = options.api;
    this.store = options.store;
    this.prices = options.prices;
    this.renderPath = options.renderPath || (() => {});
    this.onError = options.onError || (() => {});
    this.root = document.getElementById("wrap-variations-group");
    this.empty = document.getElementById("variations_empty");
    this.rowCache = new Map();
    this.version = 0;
    this.abortController = null;
    this.visited = new Set();

    this.bindEvents();
  }

  bindEvents() {
    // [Supplier 9.2] Un solo listener atiende todas las opciones y headers, incluso los creados después.
    this.root?.addEventListener("click", (event) => {
      const option = event.target.closest(".var-option[data-variation-id]");
      if (option && this.root.contains(option)) {
        this.selectVariation(option, false);
        return;
      }

      const header = event.target.closest(".var-collapse-header");
      if (!header || !this.root.contains(header)) return;

      const group = header.closest(".wrap-variations");
      if (!group) return;

      const open = !group.classList.contains("is-open");
      group.classList.toggle("is-open", open);
      header.setAttribute("aria-expanded", String(open));
      const icon = header.querySelector(".var-collapse-icon");
      if (icon) icon.textContent = open ? "−" : "+";
    });
  }

  reset() {
    // [Supplier 6.1.1] Al empezar se cancela la petición anterior y se borran caché, ciclos y ruta visual.
    this.abortController?.abort();
    this.abortController = null;
    this.version++;
    this.rowCache.clear();
    this.visited.clear();
    this.store.selectedPath = [];
    if (this.root) this.root.innerHTML = "";
    this.setEmptyState(false);
  }

  async loadRoot(rootVariationId) {
    // [Supplier 6.1.2] La raíz es el punto de partida enviado por la primera respuesta del producto.
    this.reset();

    const rootId = Number(rootVariationId);
    if (!Number.isFinite(rootId) || rootId <= 0) {
      this.setEmptyState(true, "No root variation is configured for this product.");
      this.renderPath();
      return false;
    }

    const version = this.version;
    return this.loadNode(rootId, 0, version, true);
  }

  async loadNode(variationId, pathIndex, version, automatic = false) {
    // [Supplier 6.2] Cada nodo sigue el mismo ciclo: validar -> pedir datos -> guardar -> pintar -> seguir hijos.
    const id = Number(variationId);
    if (!Number.isFinite(id) || id <= 0 || version !== this.version) return false;

    // [Supplier 6.2.1] visited evita que una relación circular provoque solicitudes infinitas.
    const visitKey = `${version}:${id}`;
    if (this.visited.has(visitKey)) {
      this.onError("A circular variation relationship was detected. Check the parent variation settings.");
      return false;
    }
    this.visited.add(visitKey);

    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      // [Supplier 6.2.2] PreviewApi continúa la ejecución en controller/order/product.php.
      const result = await this.api.getVariationChildren(id, {
        signal: this.abortController.signal
      });

      if (version !== this.version) return false;

      const current = result.current && typeof result.current === "object"
        ? result.current
        : null;

      if (current?.variation) {
        // [Supplier 6.3] Cache evita depender del DOM para recuperar la fila completa de una opción.
        this.rowCache.set(String(id), current);
        this.store.setPathEntry(pathIndex, current);
      }

      // [Supplier 6.4] Se quitan grupos que pertenecían a una selección anterior y se redibujan recursos.
      this.removeGroupsAfter(pathIndex);
      this.renderPath();

      const children = Array.isArray(result.children) ? result.children : [];
      const types = Array.isArray(result.types) ? result.types : [];

      if (children.length === 0) {
        // [Supplier 6.5] Una hoja termina esta rama; solo resta actualizar extras del precio actual.
        this.setEmptyState(this.store.selectedPath.length <= 1, "No customer-selectable variations are configured yet.");
        await this.prices.refreshVariationExtras();
        return true;
      }

      this.setEmptyState(false);
      // [Supplier 6.6] Los hijos se agrupan por tipo para crear una sección visual por pregunta.
      const groups = this.renderChildGroups(children, types, pathIndex + 1);
      const defaultButton = this.getAutomaticOption(groups?.[0]);

      if (defaultButton && version === this.version) {
        // [Supplier 6.7] La primera opción válida se selecciona automáticamente para completar el preview.
        await this.selectVariation(defaultButton, true, version);
      }

      return true;
    } catch (error) {
      if (error.name === "AbortError") return false;
      if (version === this.version) this.onError(error.message || "Unable to load product variations.");
      return false;
    }
  }

  async selectVariation(button, automatic = false, inheritedVersion = null) {
    // [Supplier 9.2.1] Una selección manual crea una versión nueva y cancela el recorrido anterior.
    if (!button) return false;

    let version = inheritedVersion;
    if (!automatic) {
      this.version++;
      version = this.version;
      this.visited.clear();
      this.abortController?.abort();
    }

    if (version === null) version = this.version;

    const variationId = Number(button.dataset.variationId);
    const pathIndex = Number(button.dataset.pathIndex);
    if (!Number.isFinite(variationId) || !Number.isFinite(pathIndex)) return false;

    const row = this.rowCache.get(String(variationId));
    if (row) {
      this.store.setPathEntry(pathIndex, row);
    } else {
      this.store.truncatePath(pathIndex);
    }

    // [Supplier 9.2.2] Estado, selección visual y recursos cambian antes de pedir los hijos nuevos.
    this.removeGroupsAfter(pathIndex);
    this.markSelected(button);
    this.renderPath();

    return this.loadNode(variationId, pathIndex, version, automatic);
  }

  renderChildGroups(children, types, pathIndex) {
    // [Supplier 6.6.1] Los nombres de tipo se indexan una vez y los hijos se separan con Map.
    if (!this.root) return [];

    const typeNames = new Map(
      types.map((type) => [String(type?.type_id ?? ""), String(type?.type_name ?? "").trim()])
    );
    const grouped = new Map();

    for (const row of children) {
      const variation = row?.variation;
      const variationId = Number(variation?.variation_id);
      const typeId = String(variation?.type_id ?? "").trim();
      const typeName = String(variation?.type_name ?? typeNames.get(typeId) ?? "").trim();
      const label = String(variation?.name ?? "").trim();

      if (!Number.isFinite(variationId) || variationId <= 0 || !typeId || !typeName || !label) continue;

      this.rowCache.set(String(variationId), row);
      if (!grouped.has(typeId)) grouped.set(typeId, { typeId, typeName, rows: [] });
      grouped.get(typeId).rows.push(row);
    }

    const created = [];
    for (const groupData of grouped.values()) {
      const group = this.createGroup(groupData, pathIndex);
      if (group) {
        this.root.appendChild(group);
        created.push(group);
      }
    }

    if (created[0]) this.openGroup(created[0]);
    return created;
  }

  createGroup(groupData, pathIndex) {
    // [Supplier 6.6.2] Cada grupo es una sección colapsable accesible con su propio cuerpo e ID.
    const group = document.createElement("section");
    group.className = "wrap-variations is-collapsible";
    group.dataset.typeId = groupData.typeId;
    group.dataset.pathIndex = String(pathIndex);

    const bodyId = `variation-options-${pathIndex}-${groupData.typeId}`;
    const header = document.createElement("button");
    header.type = "button";
    header.className = "var-collapse-header";
    header.setAttribute("aria-expanded", "false");
    header.setAttribute("aria-controls", bodyId);

    const heading = document.createElement("span");
    heading.className = "var-collapse-heading";

    const eyebrow = document.createElement("span");
    eyebrow.className = "var-name";
    eyebrow.textContent = groupData.typeName;

    const selected = document.createElement("strong");
    selected.className = "js-selected-variation-label";
    selected.textContent = "Choose an option";

    heading.append(eyebrow, selected);

    const summary = document.createElement("span");
    summary.className = "variation-summary-pill";
    summary.textContent = `${groupData.rows.length} option${groupData.rows.length === 1 ? "" : "s"}`;

    const icon = document.createElement("span");
    icon.className = "var-collapse-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "+";

    header.append(heading, summary, icon);

    const body = document.createElement("div");
    body.id = bodyId;
    body.className = "var-collapse-body";

    const options = document.createElement("div");
    options.className = "var-options";

    for (const row of groupData.rows) {
      options.appendChild(this.createOption(row, pathIndex));
    }

    body.appendChild(options);
    group.append(header, body);
    return group;
  }

  createOption(row, pathIndex) {
    // [Supplier 6.6.3] El botón guarda solo metadatos simples; la fila completa permanece en rowCache.
    const variation = row.variation;
    const id = String(variation.variation_id);
    const label = String(variation.name || "Option");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "var-option";
    button.dataset.variationId = id;
    button.dataset.pathIndex = String(pathIndex);
    button.dataset.variationLabel = label;
    button.dataset.priceDisplayMode = String(variation.price_display_mode || "prices").toLowerCase();
    button.setAttribute("aria-pressed", "false");

    const image = document.createElement("img");
    image.className = "var-thumb";
    image.src = this.resolveAssetPath(
      variation.image,
      "../../view/preview_porduct/img/icon_product.png"
    );
    image.alt = "";
    image.loading = "lazy";

    const copy = document.createElement("span");
    copy.className = "opt-copy";

    const name = document.createElement("span");
    name.className = "opt-main";
    name.textContent = label;
    copy.appendChild(name);

    button.append(image, copy);
    return button;
  }

  getAutomaticOption(group) {
    // [Supplier 6.7.1] Se prefiere un extra incluido/gratis; si no existe, se usa la primera opción.
    if (!group) return null;

    const buttons = Array.from(
      group.querySelectorAll(".var-option[data-variation-id]")
    );

    return buttons.find((button) => {
      const row = this.rowCache.get(String(button.dataset.variationId));
      return this.isIncludedExtra(row);
    }) || buttons[0] || null;
  }

  isIncludedExtra(row) {
    // [Supplier 6.7.2] Un extra se considera incluido si no tiene costo aplicable para la cantidad actual.
    const mode = String(row?.variation?.price_display_mode || "prices").toLowerCase();
    if (mode !== "variation") return false;

    const prices = Array.isArray(row?.prices) ? row.prices : [];
    const quantity = Number(this.store.selectedQuantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return prices.length === 0 || prices.every((price) => Number(price?.price) <= 0);
    }

    const applicablePrice = prices.find((price) => {
      const min = Number(price?.min_quantity);
      const rawMax = price?.max_quantity;
      const max = rawMax === null || rawMax === "" ? null : Number(rawMax);
      const hasOpenMaximum = max === null || !Number.isFinite(max) || max <= 0;

      return Number.isFinite(min)
        && quantity >= min
        && (hasOpenMaximum || quantity <= max);
    });

    return !applicablePrice || Number(applicablePrice.price) <= 0;
  }

  markSelected(button) {
    // [Supplier 9.2.3] Solo una opción del grupo queda presionada y el header resume su nombre.
    const pathIndex = button.dataset.pathIndex;

    this.root?.querySelectorAll(`.wrap-variations[data-path-index="${CSS.escape(pathIndex)}"] .var-option`).forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    const group = button.closest(".wrap-variations");
    const label = button.dataset.variationLabel || "Selected option";
    const selectedLabel = group?.querySelector(".js-selected-variation-label");
    const summary = group?.querySelector(".variation-summary-pill");
    if (selectedLabel) selectedLabel.textContent = label;
    if (summary) summary.textContent = `Selected: ${label}`;
    this.openGroup(group);
  }

  openGroup(group) {
    if (!group) return;
    group.classList.add("is-open");
    const header = group.querySelector(".var-collapse-header");
    const icon = group.querySelector(".var-collapse-icon");
    header?.setAttribute("aria-expanded", "true");
    if (icon) icon.textContent = "−";
  }

  removeGroupsAfter(pathIndex) {
    // [Supplier 6.4.1] Cambiar un nivel invalida todos sus descendientes visuales y de Store.
    this.root?.querySelectorAll(".wrap-variations[data-path-index]").forEach((group) => {
      if (Number(group.dataset.pathIndex) > Number(pathIndex)) group.remove();
    });
    this.store.selectedPath = this.store.selectedPath.slice(0, Number(pathIndex) + 1);
  }

  setEmptyState(show, message = "No variations configured.") {
    if (!this.empty) return;
    this.empty.hidden = !show;
    const text = this.empty.querySelector("span:last-child");
    if (text) text.textContent = message;
  }

  resolveAssetPath(rawPath = "", fallback = "") {
    // [Supplier 6.6.4] Una opción sin imagen usa el icono local del producto.
    const path = String(rawPath ?? "").trim().replace(/^\/+/, "");
    if (!path) return fallback;
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    if (path.startsWith("controller/")) return `../../${path}`;
    return `../../controller/${path}`;
  }
}
