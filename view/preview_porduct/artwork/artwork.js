class Artwork {
  constructor() {}

  deleteArtwork(typeId) {
    const wrapper = document.getElementById(`wrap-artworks-${typeId}`);
    if (!wrapper) return false;

    wrapper.remove();
    return true;
  }

  renderArtwork(artworksOnlyOfType = [], typeVariation) {
    const selectedVariation = window.previewLogic?.getSelectVariation?.() ?? "";
    const variationId = Number(String(selectedVariation).replace("variation_id_", ""));
    const parent = document.getElementById("wrap-artworks-group");

    if (!parent) return false;

    const typeId = String(typeVariation?.type_id ?? "null");
    const wrapId = `wrap-artworks-${typeId}`;

    this.deleteArtwork(typeId);

    const wrapper = document.createElement("div");
    wrapper.className = "wrap-artworks";
    wrapper.id = wrapId;
    wrapper.dataset.typeId = typeId;

    let renderedArtwork = 0;

    for (let i = 0; i < artworksOnlyOfType.length; i++) {
      const artworkData = artworksOnlyOfType[i];

      if (Number(artworkData?.variation_id) !== variationId) continue;

      const name = String(artworkData?.name_pdf_artwork ?? "").trim();
      const rawPdf = String(artworkData?.pdf_artwork ?? "").trim().replace(/^\/+/, "");
      const pdfSrc = this.resolvePdfPath(rawPdf);

      if (!name && !pdfSrc) continue;

      const artworkItem = document.createElement("div");
      artworkItem.className = "sp-artwork";

      artworkItem.innerHTML = `
        ${name ? `<strong class="sp-artwork-name">${this.escapeHtml(name)}</strong>` : ""}
        ${pdfSrc ? `<a class="sp-artwork-link" href="${this.escapeHtml(pdfSrc)}" target="_blank" rel="noopener">Open PDF</a>` : ""}
      `;

      wrapper.appendChild(artworkItem);
      renderedArtwork++;
    }

    if (renderedArtwork > 0) parent.appendChild(wrapper);

    return renderedArtwork > 0;
  }

  resolvePdfPath(rawPdf = "") {
    const pdf = String(rawPdf).trim().replace(/^\/+/, "");

    if (!pdf) return "";

    if (
      pdf.startsWith("http") ||
      pdf.startsWith("data:") ||
      pdf.startsWith("blob:")
    ) {
      return pdf;
    }

    if (pdf.startsWith("controller/")) {
      return "../../" + pdf;
    }

    return "../../controller/" + pdf;
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

const artwork = new Artwork();
window.artwork = artwork;
