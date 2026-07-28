// preview.js

class PreviewGallery {
  constructor(options = {}) {
    this.rootId = options.rootId || "wrap-images-group";
    this.thumbsId = options.thumbsId || "sp_thumbs";
    this.intervalMs = Number(options.intervalMs || 5000);
    this.zoomScale = Number(options.zoomScale || 2);

    this.currentIndex = 0;
    this.autoTimer = null;
    this.observer = null;

    this.init();




  }

  /* ============================================================================
    INITIALISE
  ============================================================================ */

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.setupObserver();
        this.setupZoomEvents();
        this.refreshGallery();
      });
    } else {
      this.setupObserver();
      this.setupZoomEvents();
      this.refreshGallery();
    }

    this.setupVariationSelection();
  }

  setupVariationSelection() {
    const parent = document.getElementById("wrap-variations-group");
    if (!parent) return;

    // Prevents duplicate binding.
    if (parent.dataset.bound === "1") return;
    parent.dataset.bound = "1";

    parent.addEventListener("click", (e) => {
      const option = e.target.closest(".var-option");
      if (!option || !parent.contains(option)) return;

      const group = option.closest(".wrap-variations");
      if (!group) return;

      // Removes the selected class only within the same variation group.
      group.querySelectorAll(".var-option.is-selected").forEach((btn) => {
        btn.classList.remove("is-selected");
      });

      // Selects the clicked option.
      option.classList.add("is-selected");

      // Updates the visible selected label.
      const labelStrong = group.querySelector(".var-label strong");
      const mainSpan = option.querySelector(".opt-main");
      if (labelStrong && mainSpan) {
        labelStrong.textContent = mainSpan.textContent.trim();
      }
    });
  }



  setupObserver() {
    const root = this.getRoot();
    if (!root) return;

    if (this.observer) {
      this.observer.disconnect();
    }

    // Watches for media inserted later by preview_logic.js.
    this.observer = new MutationObserver(() => {
      this.refreshGallery(true);
    });

    this.observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "poster"]
    });
  }

  setupZoomEvents() {
    const root = this.getRoot();
    if (!root) return;

    // Prevents duplicate binding.
    if (root.dataset.zoomBound === "1") return;
    root.dataset.zoomBound = "1";

    root.addEventListener("mousemove", (event) => {
      this.handleZoomMove(event);
    });

    root.addEventListener("mouseleave", () => {
      this.handleZoomLeave();
    });
  }

  /* ============================================================================
    HELPERS
  ============================================================================ */

  getRoot() {
    return document.getElementById(this.rootId);
  }

  getThumbsRoot() {
    return document.getElementById(this.thumbsId);
  }

  getMediaItems() {
    const root = this.getRoot();
    if (!root) return [];

    return Array.from(root.querySelectorAll(".preview-media"));
  }

  getCurrentMedia() {
    const items = this.getMediaItems();
    if (!items.length) return null;
    return items[this.currentIndex] || null;
  }

  hasMedia() {
    return this.getMediaItems().length > 0;
  }

  normaliseIndex(index, total) {
    if (total <= 0) return 0;
    if (index < 0) return total - 1;
    if (index >= total) return 0;
    return index;
  }

  stopAutoplay() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

  startAutoplay() {
    this.stopAutoplay();

    const items = this.getMediaItems();
    if (items.length <= 1) return;

    this.autoTimer = setInterval(() => {
      this.nextImage();
    }, this.intervalMs);
  }

  clearGallery() {
    this.stopAutoplay();
    this.currentIndex = 0;

    const thumbsRoot = this.getThumbsRoot();
    if (thumbsRoot) {
      thumbsRoot.innerHTML = "";
    }
  }

  resetZoom(media = null) {
    const items = media ? [media] : this.getMediaItems();

    for (const item of items) {
      if (!(item instanceof HTMLElement)) continue;

      item.classList.remove("is-zooming");
      item.style.transformOrigin = "50% 50%";
      item.style.transform = "scale(1)";
    }
  }

  handleZoomMove(event) {
    const activeMedia = event.target.closest(".preview-media.is-active");
    if (!activeMedia) return;
    if (activeMedia.tagName !== "IMG") return;

    const rect = activeMedia.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    const xPercent = (offsetX / rect.width) * 100;
    const yPercent = (offsetY / rect.height) * 100;

    activeMedia.classList.add("is-zooming");
    activeMedia.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    activeMedia.style.transform = `scale(${this.zoomScale})`;

    this.stopAutoplay();
  }

  handleZoomLeave() {
    const current = this.getCurrentMedia();
    if (current && current.tagName === "IMG") {
      this.resetZoom(current);
    }

    this.startAutoplay();
  }

  /* ============================================================================
    MAIN GALLERY REFRESH
  ============================================================================ */

  refreshGallery(keepIndex = false) {
    const items = this.getMediaItems();

    if (!items.length) {
      this.clearGallery();
      return;
    }

    if (!keepIndex) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = this.normaliseIndex(this.currentIndex, items.length);
    }

    this.renderThumbs();
    this.showCurrentMedia();
    this.startAutoplay();
  }

  showCurrentMedia() {
    const items = this.getMediaItems();
    if (!items.length) return;

    this.currentIndex = this.normaliseIndex(this.currentIndex, items.length);

    for (let i = 0; i < items.length; i++) {
      const media = items[i];
      const isActive = i === this.currentIndex;

      this.resetZoom(media);

      media.classList.toggle("is-active", isActive);
      media.hidden = !isActive;
      media.style.display = isActive ? "block" : "none";

      if (media.tagName === "VIDEO" && !isActive) {
        media.pause();
      }
    }

    this.updateThumbStates();
  }

  /* ============================================================================
    NAVIGATION
  ============================================================================ */

  nextImage() {
    const items = this.getMediaItems();
    if (items.length <= 1) return;

    this.currentIndex = this.normaliseIndex(this.currentIndex + 1, items.length);
    this.showCurrentMedia();
    this.startAutoplay();
  }

  prevImage() {
    const items = this.getMediaItems();
    if (items.length <= 1) return;

    this.currentIndex = this.normaliseIndex(this.currentIndex - 1, items.length);
    this.showCurrentMedia();
    this.startAutoplay();
  }

  goToImage(index) {
    const items = this.getMediaItems();
    if (!items.length) return;

    this.currentIndex = this.normaliseIndex(index, items.length);
    this.showCurrentMedia();
    this.startAutoplay();
  }

  /* ============================================================================
    THUMBNAILS
  ============================================================================ */

  renderThumbs() {
    const thumbsRoot = this.getThumbsRoot();
    const items = this.getMediaItems();

    if (!thumbsRoot) return;

    thumbsRoot.innerHTML = "";

    for (let i = 0; i < items.length; i++) {
      const media = items[i];
      const button = document.createElement("button");

      button.type = "button";
      button.className = "sp-thumb";
      button.setAttribute("role", "listitem");
      button.setAttribute("aria-label", `Show media ${i + 1}`);

      if (media.tagName === "IMG") {
        const thumbImg = document.createElement("img");
        thumbImg.src = media.currentSrc || media.src;
        thumbImg.alt = media.alt || `Preview image ${i + 1}`;
        thumbImg.loading = "lazy";
        thumbImg.decoding = "async";
        button.appendChild(thumbImg);
      } else if (media.tagName === "VIDEO") {
        const thumbLabel = document.createElement("span");
        thumbLabel.className = "sp-thumb-video";
        thumbLabel.textContent = `Video ${i + 1}`;
        button.appendChild(thumbLabel);
      } else {
        button.textContent = `Media ${i + 1}`;
      }

      button.addEventListener("click", () => {
        this.goToImage(i);
      });

      thumbsRoot.appendChild(button);
    }

    this.updateThumbStates();
  }

  updateThumbStates() {
    const thumbsRoot = this.getThumbsRoot();
    if (!thumbsRoot) return;

    const thumbs = Array.from(thumbsRoot.querySelectorAll(".sp-thumb"));

    for (let i = 0; i < thumbs.length; i++) {
      const isActive = i === this.currentIndex;
      thumbs[i].classList.toggle("is-active", isActive);
      thumbs[i].setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  }

  /* ============================================================================
    PRICE HELPERS
    - Kept because preview_logic.js already calls window.previewGallery?.updatePrice?.()
  ============================================================================ */

  updatePrice(preferredButton = null) {
    const selectedButton =
      preferredButton ||
      document.querySelector("#wrap-prices-group .js-price-option.is-selected") ||
      document.querySelector("#wrap-prices-group .js-price-option");

    if (!selectedButton) return false;

   // this.paintSelectedPrice(selectedButton);
   // this.syncPriceDisplay(selectedButton);

    return true;
  }

  paintSelectedPrice(activeButton) {
    const buttons = Array.from(
      document.querySelectorAll("#wrap-prices-group .js-price-option")
    );

    for (const btn of buttons) {
      btn.classList.remove("is-selected");
      btn.setAttribute("aria-pressed", "false");
    }

    activeButton.classList.add("is-selected");
    activeButton.setAttribute("aria-pressed", "true");
  }

  syncPriceDisplay(button) {
    const rawPrice = String(button?.dataset?.price ?? button?.value ?? "").trim();
    const maxQuantity = String(button?.dataset?.maxQuantity ?? "").trim();

    if (!rawPrice) return;

    const numericPrice = Number(rawPrice);
    const safePrice = Number.isFinite(numericPrice) ? numericPrice : 0;

    const fixed = safePrice.toFixed(2);
    const [major, minor] = fixed.split(".");

    const spPrice = document.getElementById("sp_price");
    const spUnitHint = document.getElementById("sp_unit_hint");
    const bbTotal = document.getElementById("bb_total");
    // const bbUnit = document.getElementById("bb_unit");
    const symbolEl = document.getElementById("sp_currency_symbol");

    const symbol = symbolEl ? symbolEl.textContent.trim() || "£" : "£";

    if (spPrice) {
      spPrice.innerHTML = `${major}<span class="sp-price-minor">.${minor}</span>`;
    }

    // if (spUnitHint) {
    //   spUnitHint.textContent = maxQuantity ? `per ${maxQuantity} units` : "";
    // }

    // if (bbTotal) {
    //   bbTotal.textContent = `${symbol}${fixed}`;
    // }

    // if (bbUnit) {
    //   const qty = Number(maxQuantity.replace(/,/g, ""));
    //   if (Number.isFinite(qty) && qty > 0) {
    //     const unit = (safePrice / qty).toFixed(2);
    //     bbUnit.textContent = `${symbol}${unit}`;
    //   } else {
    //     bbUnit.textContent = "";
    //   }
    // }
  }
}

/* ============================================================================
  GLOBAL INSTANCE
============================================================================ */

const previewGallery = new PreviewGallery({
  rootId: "wrap-images-group",
  thumbsId: "sp_thumbs",
  intervalMs: 5000,
  zoomScale: 2
});

window.previewGallery = previewGallery;

/* ============================================================================
  OPTIONAL: PRICE BUTTON DELEGATION
  - Useful because price buttons are also rendered later.
============================================================================ */

document.addEventListener("click", (event) => {
  const button = event.target.closest("#wrap-prices-group .js-price-option");
  if (!button) return;

  window.previewGallery?.updatePrice?.(button);
});
