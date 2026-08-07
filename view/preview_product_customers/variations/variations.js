export class VariationsController {
  constructor(options = {}) {
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
    const id = Number(variationId);
    const generation = Number(context.generation ?? this.generation);
    const ancestry = Array.isArray(context.ancestry) ? context.ancestry.map(Number) : [];
    const requestKey = String(context.requestKey || `variation:${id}`);

    if (!Number.isFinite(id) || id <= 0 || generation !== this.generation) return false;
    if (ancestry.includes(id)) {
      this.onError("A circular variation relationship was detected. Check the parent variation settings.");
      return false;
    }

    const request = this.startRequest(requestKey);

    try {
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

      this.removeDescendantsOfVariation(id);
      this.renderPath();

      const children = Array.isArray(result.children) ? result.children : [];
      const types = Array.isArray(result.types) ? result.types : [];

      if (children.length === 0) {
        if (context.isRoot) {
          this.setEmptyState(true, "No customer-selectable variations are configured yet.");
        }
        await this.prices.refreshVariationExtras();
        return true;
      }

      this.setEmptyState(false);
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

        const defaultButton = this.getAutomaticOption(group);
        if (defaultButton) await this.selectVariation(defaultButton, true);
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
      this.removeDescendantsOfVariation(previousVariationId);
    }

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
      "../../view/preview_product_customers/img/icon_product.png"
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
    if (!group) return null;

    const buttons = Array.from(
      group.querySelectorAll(".var-option[data-variation-id]")
    );

    const freeButton = buttons.find((button) => {
      const row = this.rowCache.get(String(button.dataset.variationId));
      return this.isFreeExtra(row);
    });

    return freeButton || buttons[0] || null;
  }

  isFreeExtra(row) {
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
    if (!this.root) return;
    const id = Number(variationId);
    if (!Number.isFinite(id) || id <= 0) return;

    const groups = Array.from(
      this.root.querySelectorAll(`.wrap-variations[data-parent-variation-id="${id}"]`)
    );
    groups.forEach((group) => this.removeGroupBranch(group));
  }

  removeGroupBranch(group) {
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
    this.requestControllers.get(requestKey)?.abort();
    const version = (this.requestVersions.get(requestKey) || 0) + 1;
    const controller = new AbortController();
    this.requestVersions.set(requestKey, version);
    this.requestControllers.set(requestKey, controller);
    return { version, controller };
  }

  invalidateRequest(requestKey) {
    if (!requestKey) return;
    this.requestControllers.get(requestKey)?.abort();
    this.requestControllers.delete(requestKey);
    this.requestVersions.set(requestKey, (this.requestVersions.get(requestKey) || 0) + 1);
  }

  isRequestCurrent(requestKey, version, variationId, generation, isRoot = false) {
    if (generation !== this.generation) return false;
    if (this.requestVersions.get(requestKey) !== version) return false;
    if (isRoot) return true;

    const selected = this.store.getGroupSelection(requestKey);
    return Number(selected?.row?.variation?.variation_id) === Number(variationId);
  }

  buildGroupKey(parentVariationId, typeId) {
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
    const path = String(rawPath ?? "").trim().replace(/^\/+/, "");
    if (!path) return fallback;
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    if (path.startsWith("controller/")) return `../../${path}`;
    return `../../controller/${path}`;
  }
}
