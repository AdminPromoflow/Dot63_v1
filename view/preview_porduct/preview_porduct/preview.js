class PreviewGallery {
  constructor(options = {}) {
    this.rootId = options.rootId || "wrap-images-group";
    this.thumbsId = options.thumbsId || "sp_thumbs";
    this.intervalMs = Number(options.intervalMs || 5000);
    this.zoomScale = Number(options.zoomScale || 2);

    this.currentIndex = 0;
    this.autoTimer = null;
    this.observer = null;
    this.refreshTimer = null;

    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.start());
      return;
    }

    this.start();
  }

  start() {
    this.setupObserver();
    this.setupGalleryEvents();
    this.setupPageVisibility();
    this.refreshGallery();
  }

  setupObserver() {
    const root = this.getRoot();

    if (!root) {
      return;
    }

    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver(() => {
      window.clearTimeout(this.refreshTimer);

      this.refreshTimer = window.setTimeout(() => {
        this.refreshGallery(true);
      }, 40);
    });

    this.observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "poster"]
    });
  }

  setupGalleryEvents() {
    const root = this.getRoot();

    if (!root || root.dataset.galleryBound === "1") {
      return;
    }

    root.dataset.galleryBound = "1";

    root.addEventListener("mousemove", (event) => {
      this.handleZoomMove(event);
    });

    root.addEventListener("mouseleave", () => {
      this.handleZoomLeave();
    });

    root.addEventListener("touchstart", () => {
      this.stopAutoplay();
    }, { passive: true });

    root.addEventListener("touchend", () => {
      this.startAutoplay();
    }, { passive: true });
  }

  setupPageVisibility() {
    if (document.documentElement.dataset.previewVisibilityBound === "1") {
      return;
    }

    document.documentElement.dataset.previewVisibilityBound = "1";

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stopAutoplay();
        this.pauseAllVideos();
        return;
      }

      this.startAutoplay();
    });
  }

  getRoot() {
    return document.getElementById(this.rootId);
  }

  getThumbsRoot() {
    return document.getElementById(this.thumbsId);
  }

  getPreviousButton() {
    return document.querySelector(".sp-nav-prev");
  }

  getNextButton() {
    return document.querySelector(".sp-nav-next");
  }

  getMediaItems() {
    const root = this.getRoot();

    if (!root) {
      return [];
    }

    return Array.from(root.querySelectorAll(".preview-media"));
  }

  getCurrentMedia() {
    const items = this.getMediaItems();

    if (!items.length) {
      return null;
    }

    return items[this.currentIndex] || null;
  }

  normaliseIndex(index, total) {
    if (total <= 0) {
      return 0;
    }

    if (index < 0) {
      return total - 1;
    }

    if (index >= total) {
      return 0;
    }

    return index;
  }

  stopAutoplay() {
    if (!this.autoTimer) {
      return;
    }

    window.clearInterval(this.autoTimer);
    this.autoTimer = null;
  }

  startAutoplay() {
    this.stopAutoplay();

    if (document.hidden) {
      return;
    }

    if (this.getMediaItems().length <= 1) {
      return;
    }

    this.autoTimer = window.setInterval(() => {
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

    this.updateNavigationVisibility();
  }

  pauseAllVideos() {
    this.getMediaItems().forEach((media) => {
      if (media.tagName === "VIDEO") {
        media.pause();
      }
    });
  }

  resetZoom(media = null) {
    const items = media ? [media] : this.getMediaItems();

    items.forEach((item) => {
      if (!(item instanceof HTMLElement)) {
        return;
      }

      item.classList.remove("is-zooming");
      item.style.transformOrigin = "50% 50%";
      item.style.transform = "scale(1)";
    });
  }

  handleZoomMove(event) {
    const activeMedia = event.target.closest(".preview-media.is-active");

    if (!activeMedia || activeMedia.tagName !== "IMG") {
      return;
    }

    const rect = activeMedia.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (offsetY / rect.height) * 100));

    activeMedia.classList.add("is-zooming");
    activeMedia.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    activeMedia.style.transform = `scale(${this.zoomScale})`;

    this.stopAutoplay();
  }

  handleZoomLeave() {
    const currentMedia = this.getCurrentMedia();

    if (currentMedia?.tagName === "IMG") {
      this.resetZoom(currentMedia);
    }

    this.startAutoplay();
  }

  refreshGallery(keepIndex = false) {
    const items = this.getMediaItems();

    if (!items.length) {
      this.clearGallery();
      return;
    }

    this.currentIndex = keepIndex
      ? this.normaliseIndex(this.currentIndex, items.length)
      : 0;

    this.prepareMediaItems(items);
    this.renderThumbs();
    this.showCurrentMedia();
    this.startAutoplay();
  }

  prepareMediaItems(items) {
    items.forEach((media, index) => {
      media.dataset.previewIndex = String(index);

      if (media.tagName === "IMG") {
        media.draggable = false;
      }

      if (media.tagName === "VIDEO") {
        media.playsInline = true;
        media.preload = media.preload || "metadata";
      }
    });
  }

  showCurrentMedia() {
    const items = this.getMediaItems();

    if (!items.length) {
      return;
    }

    this.currentIndex = this.normaliseIndex(this.currentIndex, items.length);

    items.forEach((media, index) => {
      const isActive = index === this.currentIndex;

      this.resetZoom(media);

      media.classList.toggle("is-active", isActive);
      media.hidden = !isActive;
      media.style.display = isActive ? "block" : "none";
      media.setAttribute("aria-hidden", isActive ? "false" : "true");

      if (media.tagName === "VIDEO") {
        if (!isActive) {
          media.pause();
          media.currentTime = 0;
        }
      }
    });

    this.updateThumbStates();
    this.updateNavigationVisibility();
  }

  nextImage() {
    const items = this.getMediaItems();

    if (items.length <= 1) {
      return;
    }

    this.currentIndex = this.normaliseIndex(this.currentIndex + 1, items.length);
    this.showCurrentMedia();
    this.startAutoplay();
  }

  prevImage() {
    const items = this.getMediaItems();

    if (items.length <= 1) {
      return;
    }

    this.currentIndex = this.normaliseIndex(this.currentIndex - 1, items.length);
    this.showCurrentMedia();
    this.startAutoplay();
  }

  goToImage(index) {
    const items = this.getMediaItems();

    if (!items.length) {
      return;
    }

    this.currentIndex = this.normaliseIndex(Number(index), items.length);
    this.showCurrentMedia();
    this.startAutoplay();
  }

  renderThumbs() {
    const thumbsRoot = this.getThumbsRoot();
    const items = this.getMediaItems();

    if (!thumbsRoot) {
      return;
    }

    thumbsRoot.innerHTML = "";

    items.forEach((media, index) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "sp-thumb";
      button.setAttribute("role", "listitem");
      button.setAttribute("aria-label", `Show media ${index + 1}`);
      button.setAttribute("aria-pressed", "false");

      if (media.tagName === "IMG") {
        const thumbnail = document.createElement("img");

        thumbnail.src = media.currentSrc || media.src;
        thumbnail.alt = media.alt || `Preview image ${index + 1}`;
        thumbnail.loading = "lazy";
        thumbnail.decoding = "async";
        thumbnail.draggable = false;

        button.appendChild(thumbnail);
      } else if (media.tagName === "VIDEO") {
        const videoLabel = document.createElement("span");

        videoLabel.className = "sp-thumb-video";
        videoLabel.textContent = `Video ${index + 1}`;

        button.appendChild(videoLabel);
      } else {
        button.textContent = `Media ${index + 1}`;
      }

      button.addEventListener("click", () => {
        this.goToImage(index);
      });

      thumbsRoot.appendChild(button);
    });

    this.updateThumbStates();
  }

  updateThumbStates() {
    const thumbsRoot = this.getThumbsRoot();

    if (!thumbsRoot) {
      return;
    }

    const thumbnails = Array.from(
      thumbsRoot.querySelectorAll(".sp-thumb")
    );

    thumbnails.forEach((thumbnail, index) => {
      const isActive = index === this.currentIndex;

      thumbnail.classList.toggle("is-active", isActive);
      thumbnail.setAttribute("aria-pressed", String(isActive));
    });
  }

  updateNavigationVisibility() {
    const shouldShow = this.getMediaItems().length > 1;
    const previousButton = this.getPreviousButton();
    const nextButton = this.getNextButton();

    if (previousButton) {
      previousButton.hidden = !shouldShow;
      previousButton.disabled = !shouldShow;
    }

    if (nextButton) {
      nextButton.hidden = !shouldShow;
      nextButton.disabled = !shouldShow;
    }
  }

  updatePrice(preferredButton = null) {
    const selectedButton =
      preferredButton ||
      document.querySelector(
        "#wrap-prices-group .js-price-option.is-selected"
      ) ||
      document.querySelector(
        "#wrap-prices-group .js-price-option"
      );

    return Boolean(selectedButton);
  }
}

const previewGallery = new PreviewGallery({
  rootId: "wrap-images-group",
  thumbsId: "sp_thumbs",
  intervalMs: 5000,
  zoomScale: 2
});

window.previewGallery = previewGallery;

document.addEventListener("click", (event) => {
  const button = event.target.closest(
    "#wrap-prices-group .js-price-option"
  );

  if (!button) {
    return;
  }

  window.previewGallery?.updatePrice?.(button);
});
