/* [Customer 7.3.2] Convierte detalles cortos del producto en tarjetas legibles. */
export class ItemsRenderer {
  constructor(rootId = "wrap-items-group") {
    this.root = document.getElementById(rootId);
  }

  clear() {
    // [Customer 7.3.2.1] Los detalles siempre corresponden a la ruta actualmente elegida.
    if (this.root) this.root.innerHTML = "";
  }

  render(rows = []) {
    // [Customer 7.3.2.2] Ignoramos filas vacías y usamos textContent para no interpretar HTML externo.
    if (!this.root || !Array.isArray(rows) || rows.length === 0) return 0;

    let count = 0;
    const fragment = document.createDocumentFragment();

    for (const row of rows) {
      const title = String(row?.name ?? "").trim();
      const description = String(row?.description ?? "").trim();
      if (!title && !description) continue;

      const item = document.createElement("article");
      item.className = "sp-item";

      if (title) {
        const heading = document.createElement("strong");
        heading.className = "sp-item-subtitle";
        heading.textContent = title;
        item.appendChild(heading);
      }

      if (description) {
        const text = document.createElement("span");
        text.textContent = description;
        item.appendChild(text);
      }

      fragment.appendChild(item);
      count++;
    }

    // [Customer 7.3.2.3] El total permite al coordinador decidir si muestra u oculta la sección.
    this.root.appendChild(fragment);
    return count;
  }
}
