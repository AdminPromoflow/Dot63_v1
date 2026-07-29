class Items {
  constructor() {}

  deleteItems(typeId) {
    const wrapper = document.getElementById(`wrap-items-${typeId}`);
    if (!wrapper) return false;

    wrapper.remove();
    return true;
  }

  renderItems(itemsOnlyOfType = [], typeVariation) {
    const selectedVariation = window.previewLogic?.getSelectVariation?.() ?? "";
    const variationId = Number(String(selectedVariation).replace("variation_id_", ""));
    const parent = document.getElementById("wrap-items-group");

    if (!parent) return false;

    const typeId = String(typeVariation?.type_id ?? "null");
    const wrapId = `wrap-items-${typeId}`;

    this.deleteItems(typeId);

    const wrapper = document.createElement("div");
    wrapper.className = "wrap-items";
    wrapper.id = wrapId;
    wrapper.dataset.typeId = typeId;

    let renderedItems = 0;

    for (let i = 0; i < itemsOnlyOfType.length; i++) {
      const itemData = itemsOnlyOfType[i];

      if (Number(itemData?.variation_id) !== variationId) continue;

      const title = String(itemData?.name ?? "").trim();
      const description = String(itemData?.description ?? "").trim();

      if (!title && !description) continue;

      const item = document.createElement("div");
      item.className = "sp-item";

      item.innerHTML = `
        ${title ? `<strong class="sp-item-subtitle">${this.escapeHtml(title)}</strong>` : ""}
        ${description ? `<span>${this.escapeHtml(description)}</span>` : ""}
      `;

      wrapper.appendChild(item);
      renderedItems++;
    }

    if (renderedItems > 0) parent.appendChild(wrapper);

    return renderedItems > 0;
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

const items = new Items();
window.items = items;
