class Images {
  constructor() {

  }
  deleteImages(typeId) {
    const wrapper = document.getElementById(`wrap-images-${typeId}`);
    if (!wrapper) return false;

    wrapper.remove();
    window.previewGallery?.refreshGallery?.(true);

    return true;
  }
  renderImages(imagesOnlyOfType = [], typeVariation) {
    const id_variation = Number(String(previewLogic.getSelectVariation() ?? "").replace("variation_id_", ""));
    const parent = document.getElementById("wrap-images-group");

    if (!parent) return;

    const typeId = String(typeVariation?.type_id ?? "null");
    const wrapId = `wrap-images-${typeId}`;

    this.deleteImages(typeId);

    const wrapper = document.createElement("div");
    wrapper.className = "wrap-images";
    wrapper.id = wrapId;
    wrapper.dataset.typeId = typeId;

    let renderedImages = 0;

    for (let i = 0; i < imagesOnlyOfType.length; i++) {
      const imgObj = imagesOnlyOfType[i];

      if (Number(imgObj?.variation_id) !== id_variation) continue;

      const rawLink = String(imgObj?.link ?? "").trim().replace(/^\/+/, "");

      const src = rawLink
        ? rawLink.startsWith("http") || rawLink.startsWith("data:") || rawLink.startsWith("blob:")
          ? rawLink
          : rawLink.startsWith("controller/")
            ? "../../" + rawLink
            : "../../controller/" + rawLink
        : "";

      if (!src) continue;

      const img = document.createElement("img");
      img.className = "preview-media";
      img.src = src;
      img.alt = `Preview image ${renderedImages + 1}`;
      img.loading = "lazy";
      img.decoding = "async";
      img.draggable = false;

      wrapper.appendChild(img);
      renderedImages++;
    }

    if (renderedImages > 0) parent.appendChild(wrapper);

    window.previewGallery?.refreshGallery?.(true);
  }
}
const images = new Images();
