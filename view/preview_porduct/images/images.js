/* [Supplier 7.3.1] Convierte las filas de imágenes de la API en elementos <img> seguros. */
export class ImagesRenderer {
  constructor(rootId = "wrap-images-group") {
    this.root = document.getElementById(rootId);
  }

  clear() {
    // [Supplier 7.3.1.1] Cada nueva ruta reemplaza por completo las imágenes anteriores.
    if (this.root) this.root.innerHTML = "";
  }

  render(rows = [], context = {}) {
    // [Supplier 7.3.1.2] Un fragmento agrupa las inserciones y evita repintar por cada imagen.
    if (!this.root || !Array.isArray(rows) || rows.length === 0) return 0;

    let count = 0;
    const fragment = document.createDocumentFragment();

    for (const row of rows) {
      const src = this.resolveAssetPath(row?.link);
      if (!src) continue;

      const image = document.createElement("img");
      image.className = "preview-media";
      image.src = src;
      image.alt = [context.productName, context.variationName]
        .filter(Boolean)
        .join(" — ") || `Product preview image ${count + 1}`;
      image.loading = count === 0 ? "eager" : "lazy";
      image.decoding = "async";
      image.draggable = false;
      fragment.appendChild(image);
      count++;
    }

    this.root.appendChild(fragment);
    return count;
  }

  renderEmpty() {
    // [Supplier 7.3.1.3] El mensaje vacío solo se crea si ningún nivel aportó imágenes.
    if (!this.root || this.root.children.length > 0) return;

    const empty = document.createElement("div");
    empty.className = "preview-empty preview-empty--media";
    empty.innerHTML = `
      <span class="preview-empty-icon" aria-hidden="true">◇</span>
      <strong>No images configured</strong>
      <span>Add at least one product image before submitting.</span>
    `;
    this.root.appendChild(empty);
  }

  resolveAssetPath(rawPath = "") {
    // [Supplier 7.3.1.4] Se aceptan URLs completas y se normalizan rutas internas del controller.
    const path = String(rawPath ?? "").trim().replace(/^\/+/, "");
    if (!path) return "";

    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    if (path.startsWith("controller/")) return `../../${path}`;
    return `../../controller/${path}`;
  }
}
