/*
 * [Supplier 6]
 * Este controlador recorre un árbol que puede tener varios grupos hermanos. Cada selección
 * puede crear otra rama, por eso las solicitudes y el estado se identifican por groupKey.
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
    this.generation = 0;
    this.requestVersions = new Map();
    this.requestControllers = new Map();

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
    // [Supplier 6.1.1] Se cancelan todas las ramas pendientes y se borra el árbol anterior.
    for (const controller of this.requestControllers.values()) controller.abort();
    this.requestControllers.clear();
    this.requestVersions.clear();
    this.rowCache.clear();
    this.generation++;
    this.store.clearVariationSelections();
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

    return this.loadNode(rootId, 0, {
      requestKey: "__root__",
      generation: this.generation,
      ancestry: [],
      isRoot: true,
      parentVariationId: 0,
      typeId: ""
    });
  }

  async loadNode(variationId, pathIndex, context = {}) {
    // [Supplier 6.2] Cada rama valida su contexto, pide datos, actualiza Store y sigue sus hijos.
    const id = Number(variationId);
    const generation = Number(context.generation ?? this.generation);
    const ancestry = Array.isArray(context.ancestry) ? context.ancestry.map(Number) : [];
    const requestKey = String(context.requestKey || `variation:${id}`);

    if (!Number.isFinite(id) || id <= 0 || generation !== this.generation) return false;
    // [Supplier 6.2.1] ancestry evita que una relación circular provoque solicitudes infinitas.
    if (ancestry.includes(id)) {
      this.onError("A circular variation relationship was detected. Check the parent variation settings.");
      return false;
    }

    // [Supplier 6.2.2] Una solicitud nueva cancela solo la de su propio grupo, no las ramas hermanas.
    const request = this.startRequest(requestKey);

    try {
      // [Supplier 6.2.3] PreviewApi continúa la ejecución en controller/order/product.php.
      const result = await this.api.getVariationChildren(id, {
        signal: request.controller.signal
      });

      if (!this.isRequestCurrent(requestKey, request.version, id, generation, context.isRoot)) {
        return false;
      }

      const current = result.current && typeof result.current === "object"
        ? result.current
        : null;

      if (current?.variation) {
        // [Supplier 6.3] La fila completa queda en caché y Store la ubica en raíz o grupo.
        this.rowCache.set(String(id), current);

        if (context.isRoot) {
          this.store.setRootVariation(current);
        } else {
          this.store.setGroupSelection(pathIndex, requestKey, current, {
            parentVariationId: context.parentVariationId,
            typeId: context.typeId
          });
        }
      }

      // [Supplier 6.4] Se quitan solo los descendientes del nodo actual; las ramas hermanas permanecen.
      this.removeDescendantsOfVariation(id);
      this.renderPath();

      const children = Array.isArray(result.children) ? result.children : [];
      const types = Array.isArray(result.types) ? result.types : [];

      if (children.length === 0) {
        // [Supplier 6.5] Una hoja termina solo esta rama; las ramas hermanas siguen intactas.
        if (context.isRoot) {
          this.setEmptyState(true, "No customer-selectable variations are configured yet.");
        }
        await this.prices.refreshVariationExtras();
        return true;
      }

      this.setEmptyState(false);
      // [Supplier 6.6] Los hijos se agrupan por tipo y cada grupo recibe una identidad independiente.
      const childAncestry = [...ancestry, id];
      const groups = this.renderChildGroups(
        children,
        types,
        pathIndex + 1,
        id,
        childAncestry
      );

      for (const group of groups) {
        if (!this.isRequestCurrent(requestKey, request.version, id, generation, context.isRoot)) {
          return false;
        }

        // [Supplier 6.7] Cada tipo recibe su propia selección automática inicial.
        const defaultButton = this.getAutomaticOption(group);
        if (defaultButton) await this.selectVariation(defaultButton);
      }

      return true;
    } catch (error) {
      if (error.name === "AbortError") return false;
      if (generation === this.generation) {
        this.onError(error.message || "Unable to load product variations.");
      }
      return false;
    } finally {
      if (this.requestControllers.get(requestKey) === request.controller) {
        this.requestControllers.delete(requestKey);
      }
    }
  }

  async selectVariation(button) {
    // [Supplier 9.2.1] La interacción identifica exactamente su grupo, padre y ancestros.
    if (!button) return false;

    const group = button.closest(".wrap-variations[data-group-key]");
    if (!group) return false;

    const variationId = Number(button.dataset.variationId);
    const pathIndex = Number(group.dataset.pathIndex);
    const groupKey = String(group.dataset.groupKey || "");
    const typeId = String(group.dataset.typeId || "");
    const parentVariationId = Number(group.dataset.parentVariationId);
    const ancestry = this.parseAncestry(group.dataset.ancestorIds);

    if (!Number.isFinite(variationId) || variationId <= 0 || !Number.isFinite(pathIndex) || !groupKey) {
      return false;
    }

    const row = this.rowCache.get(String(variationId));
    if (!row) return false;

    const previous = this.store.getGroupSelection(groupKey);
    const previousVariationId = Number(previous?.row?.variation?.variation_id);

    if (Number.isFinite(previousVariationId) && previousVariationId !== variationId) {
      // [Supplier 9.2.2] Solo los descendientes de la opción reemplazada dejan de ser válidos.
      this.removeDescendantsOfVariation(previousVariationId);
    }

    // [Supplier 9.2.3] La selección del grupo cambia sin tocar los botones de sus grupos hermanos.
    this.markSelected(button);
    this.store.setGroupSelection(pathIndex, groupKey, row, {
      parentVariationId,
      typeId
    });
    this.renderPath();

    return this.loadNode(variationId, pathIndex, {
      requestKey: groupKey,
      generation: this.generation,
      ancestry,
      isRoot: false,
      parentVariationId,
      typeId
    });
  }

  renderChildGroups(children, types, pathIndex, parentVariationId, ancestry) {
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
      // [Supplier 6.6.2] Padre + tipo forman una identidad estable para esta rama.
      const groupKey = this.buildGroupKey(parentVariationId, groupData.typeId);
      const existing = this.root.querySelector(`.wrap-variations[data-group-key="${CSS.escape(groupKey)}"]`);
      if (existing) this.removeGroupBranch(existing);

      const group = this.createGroup(
        groupData,
        pathIndex,
        parentVariationId,
        ancestry,
        groupKey
      );
      if (group) {
        this.root.appendChild(group);
        created.push(group);
      }
    }

    return created;
  }

  createGroup(groupData, pathIndex, parentVariationId, ancestry, groupKey) {
    // [Supplier 6.6.3] El DOM conserva la identidad y parentesco de cada grupo.
    const group = document.createElement("section");
    group.className = "wrap-variations is-collapsible";
    group.dataset.groupKey = groupKey;
    group.dataset.typeId = groupData.typeId;
    group.dataset.pathIndex = String(pathIndex);
    group.dataset.parentVariationId = String(parentVariationId);
    group.dataset.ancestorIds = ancestry.join(",");

    const bodyId = `variation-options-${pathIndex}-${parentVariationId}-${groupData.typeId}`;
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
      options.appendChild(this.createOption(row));
    }

    body.appendChild(options);
    group.append(header, body);
    return group;
  }

  createOption(row) {
    // [Supplier 6.6.4] El botón guarda solo metadatos simples; la fila completa permanece en rowCache.
    const variation = row.variation;
    const id = String(variation.variation_id);
    const label = String(variation.name || "Option");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "var-option";
    button.dataset.variationId = id;
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
    // [Supplier 9.2.4] Solo una opción del grupo actual queda presionada.
    const group = button.closest(".wrap-variations");
    if (!group) return;

    group.querySelectorAll(".var-option").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    const label = button.dataset.variationLabel || "Selected option";
    const selectedLabel = group.querySelector(".js-selected-variation-label");
    const summary = group.querySelector(".variation-summary-pill");
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

  removeDescendantsOfVariation(variationId) {
    // [Supplier 6.4.1] Se buscan únicamente grupos cuyo padre sea la variación invalidada.
    if (!this.root) return;
    const id = Number(variationId);
    if (!Number.isFinite(id) || id <= 0) return;

    const groups = Array.from(
      this.root.querySelectorAll(`.wrap-variations[data-parent-variation-id="${id}"]`)
    );
    groups.forEach((group) => this.removeGroupBranch(group));
  }

  removeGroupBranch(group) {
    // [Supplier 6.4.2] Primero se eliminan descendientes; luego request, Store y DOM de esta rama.
    if (!group) return;

    const groupKey = String(group.dataset.groupKey || "");
    const selected = this.store.getGroupSelection(groupKey);
    const selectedVariationId = Number(selected?.row?.variation?.variation_id);

    if (Number.isFinite(selectedVariationId) && selectedVariationId > 0) {
      this.removeDescendantsOfVariation(selectedVariationId);
    }

    this.invalidateRequest(groupKey);
    this.store.removeGroupSelection(groupKey);
    group.remove();
  }

  startRequest(requestKey) {
    // [Supplier 6.2.4] Cada groupKey tiene su propia versión y AbortController.
    this.requestControllers.get(requestKey)?.abort();
    const version = (this.requestVersions.get(requestKey) || 0) + 1;
    const controller = new AbortController();
    this.requestVersions.set(requestKey, version);
    this.requestControllers.set(requestKey, controller);
    return { version, controller };
  }

  invalidateRequest(requestKey) {
    // [Supplier 6.4.3] Una respuesta pendiente de una rama eliminada ya no puede aplicarse.
    if (!requestKey) return;
    this.requestControllers.get(requestKey)?.abort();
    this.requestControllers.delete(requestKey);
    this.requestVersions.set(requestKey, (this.requestVersions.get(requestKey) || 0) + 1);
  }

  isRequestCurrent(requestKey, version, variationId, generation, isRoot = false) {
    // [Supplier 6.2.5] La respuesta debe pertenecer al árbol y a la opción aún seleccionada.
    if (generation !== this.generation) return false;
    if (this.requestVersions.get(requestKey) !== version) return false;
    if (isRoot) return true;

    const selected = this.store.getGroupSelection(requestKey);
    return Number(selected?.row?.variation?.variation_id) === Number(variationId);
  }

  buildGroupKey(parentVariationId, typeId) {
    // [Supplier 6.6.5] Compartir padre no une grupos: el type_id también forma parte de la clave.
    return `${Number(parentVariationId) || 0}:${String(typeId || "")}`;
  }

  parseAncestry(value) {
    return String(value || "")
      .split(",")
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }

  setEmptyState(show, message = "No variations configured.") {
    if (!this.empty) return;
    this.empty.hidden = !show;
    const text = this.empty.querySelector("span:last-child");
    if (text) text.textContent = message;
  }

  resolveAssetPath(rawPath = "", fallback = "") {
    // [Supplier 6.6.6] Una opción sin imagen usa el icono local del producto.
    const path = String(rawPath ?? "").trim().replace(/^\/+/, "");
    if (!path) return fallback;
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    if (path.startsWith("controller/")) return `../../${path}`;
    return `../../controller/${path}`;
  }
}
