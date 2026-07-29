class Images {
  constructor() {}

  deleteImages(typeId) {
    const wrapper = document.getElementById(`wrap-images-${typeId}`);
    if (!wrapper) return false;

    wrapper.remove();
    window.previewGallery?.refreshGallery?.(true);

    return true;
  }

  renderImages(imagesOnlyOfType = [], typeVariation) {
    const selectedVariation = window.previewLogic?.getSelectVariation?.() ?? "";
    const variationId = Number(String(selectedVariation).replace("variation_id_", ""));
    const parent = document.getElementById("wrap-images-group");

    if (!parent) return false;

    const typeId = String(typeVariation?.type_id ?? "null");
    const wrapId = `wrap-images-${typeId}`;

    this.deleteImages(typeId);

    const wrapper = document.createElement("div");
    wrapper.className = "wrap-images";
    wrapper.id = wrapId;
    wrapper.dataset.typeId = typeId;

    let renderedImages = 0;

    for (let i = 0; i < imagesOnlyOfType.length; i++) {
      const imageData = imagesOnlyOfType[i];

      if (Number(imageData?.variation_id) !== variationId) continue;

      const rawLink = String(imageData?.link ?? "").trim().replace(/^\/+/, "");
      const src = this.resolveImagePath(rawLink);

      if (!src) continue;

      const image = document.createElement("img");
      image.className = "preview-media";
      image.src = src;
      image.alt = `Preview image ${renderedImages + 1}`;
      image.loading = "lazy";
      image.decoding = "async";
      image.draggable = false;

      wrapper.appendChild(image);
      renderedImages++;
    }

    if (renderedImages > 0) parent.appendChild(wrapper);

    window.previewGallery?.refreshGallery?.(true);

    return renderedImages > 0;
  }

  resolveImagePath(rawLink = "") {
    const link = String(rawLink).trim().replace(/^\/+/, "");

    if (!link) return "";

    if (
      link.startsWith("http") ||
      link.startsWith("data:") ||
      link.startsWith("blob:")
    ) {
      return link;
    }

    if (link.startsWith("controller/")) {
      return "../../" + link;
    }

    return "../../controller/" + link;
  }
}

const images = new Images();
window.images = images;
