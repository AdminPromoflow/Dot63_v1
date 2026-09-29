/* [Customer 7.3.3] Crea la tarjeta del PDF de producción asociado a una variación. */
export class ArtworkRenderer {
  constructor(rootId = "wrap-artworks-group") {
    this.root = document.getElementById(rootId);
  }

  clear() {
    // [Customer 7.3.3.1] Los archivos siempre se reconstruyen según la ruta seleccionada.
    if (this.root) this.root.innerHTML = "";
  }

  render(row = {}, context = {}) {
    // [Customer 7.3.3.2] Sin nombre ni archivo no existe una tarjeta útil que mostrar.
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
      // [Customer 7.3.3.3] noopener impide que el PDF abierto controle esta página.
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
    // [Customer 7.3.3.4] Se aceptan URLs completas y se normalizan rutas internas del controller.
    const path = String(rawPath ?? "").trim().replace(/^\/+/, "");
    if (!path) return "";

    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    if (path.startsWith("controller/")) return `../../${path}`;
    return `../../controller/${path}`;
  }
}

export class ArtworkUpload {
  constructor() {
    this.input = document.getElementById("artwork_pdf");
    this.status = document.getElementById("artwork_upload_status");
    this.remove = document.getElementById("artwork_remove");
    this.input?.addEventListener("change", () => this.validateSelection());
    this.remove?.addEventListener("click", () => {
      this.input.value = "";
      this.validateSelection();
    });
  }

  getFile() {
    return this.input?.files?.[0] || null;
  }

  validateSelection() {
    const file = this.getFile();
    let error = "";
    if (file && !/\.pdf$/i.test(file.name)) error = "Please choose a PDF file.";
    else if (file && (file.size === 0 || file.size > 8 * 1024 * 1024)) error = "Choose a non-empty PDF up to 8 MB.";
    this.input?.setCustomValidity(error);
    this.input?.setAttribute("aria-invalid", String(Boolean(error)));
    if (this.remove) this.remove.hidden = !file;
    this.setStatus(error || (file ? `${file.name} · Ready to upload with this product.` : "No artwork selected."), error ? "error" : "info");
    return !error;
  }

  setStatus(message, tone = "info") {
    if (!this.status) return;
    this.status.textContent = message;
    this.status.dataset.tone = tone;
  }

  setPending(pending) {
    if (this.input) this.input.disabled = pending;
    if (this.remove) this.remove.disabled = pending;
  }

  markSaved(file) {
    if (file && this.getFile() === file) this.setStatus(`${file.name} · Saved with the product in your cart.`);
  }
}
