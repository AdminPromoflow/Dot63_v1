/* [Supplier 7.3.3] Crea la tarjeta del PDF de producción asociado a una variación. */
export class ArtworkRenderer {
  constructor(rootId = "wrap-artworks-group") {
    this.root = document.getElementById(rootId);
  }

  clear() {
    // [Supplier 7.3.3.1] Los archivos siempre se reconstruyen según la ruta seleccionada.
    if (this.root) this.root.innerHTML = "";
  }

  render(row = {}, context = {}) {
    // [Supplier 7.3.3.2] Sin nombre ni archivo no existe una tarjeta útil que mostrar.
    if (!this.root) return false;

    const name = String(row?.name_pdf_artwork ?? "").trim();
    const href = this.resolveAssetPath(row?.pdf_artwork);
    if (!name && !href) return false;

    const card = document.createElement("article");
    card.className = "sp-artwork-card";

    const icon = document.createElement("span");
    icon.className = "sp-artwork-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "PDF";

    const copy = document.createElement("div");
    copy.className = "sp-artwork-copy";

    const title = document.createElement("strong");
    title.textContent = name || `${context.variationName || "Variation"} artwork template`;
    copy.appendChild(title);

    if (context.variationName) {
      const meta = document.createElement("span");
      meta.textContent = context.variationName;
      copy.appendChild(meta);
    }

    card.append(icon, copy);

    if (href) {
      // [Supplier 7.3.3.3] noopener impide que el PDF abierto controle esta página.
      const link = document.createElement("a");
      link.className = "btn btn-secondary btn-compact";
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Open template";
      card.appendChild(link);
    }

    this.root.appendChild(card);
    return true;
  }

  resolveAssetPath(rawPath = "") {
    // [Supplier 7.3.3.4] Se aceptan URLs completas y se normalizan rutas internas del controller.
    const path = String(rawPath ?? "").trim().replace(/^\/+/, "");
    if (!path) return "";

    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    if (path.startsWith("controller/")) return `../../${path}`;
    return `../../controller/${path}`;
  }
}
