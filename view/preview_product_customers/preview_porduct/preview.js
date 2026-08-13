/*
 * [Customer 7.4 / 9.1]
 * Este archivo controla únicamente la galería. ImagesRenderer crea las imágenes;
 * PreviewGallery decide cuál se ve, crea miniaturas, aplica zoom y maneja autoplay.
 */
export class PreviewGallery {
  constructor(options = {}) {
    // [Customer 7.4.1] Las opciones permiten reutilizar la galería con otros IDs o velocidades.
    this.root = document.getElementById(options.rootId || "wrap-images-group");
    this.thumbs = document.getElementById(options.thumbsId || "sp_thumbs");
    this.previousButton = document.getElementById(options.previousButtonId || "gallery_previous");
    this.nextButton = document.getElementById(options.nextButtonId || "gallery_next");
    this.intervalMs = Number(options.intervalMs || 6500);
    this.zoomScale = Number(options.zoomScale || 1.8);
    this.currentIndex = 0;
    this.timer = null;

    this.bindEvents();
  }

  bindEvents() {
    // [Customer 9.1.1] Flechas, mouse y visibilidad de pestaña controlan la navegación y el temporizador.
    this.previousButton?.addEventListener("click", () => this.previous());
    this.nextButton?.addEventListener("click", () => this.next());

    this.root?.addEventListener("mousemove", (event) => this.handleZoom(event));
    this.root?.addEventListener("mouseleave", () => {
      this.resetZoom();
      this.startAutoplay();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stopAutoplay();
      else this.startAutoplay();
    });
  }

  getItems() {
    // [Customer 7.4.2] La galería consulta el DOM otra vez porque las variaciones cambian sus imágenes.
    return this.root
      ? Array.from(this.root.querySelectorAll(".preview-media"))
      : [];
  }

  refresh(options = {}) {
    // [Customer 7.4.3] Tras un render se reconstruyen miniaturas, estado activo y controles.
    const items = this.getItems();
    this.stopAutoplay();
    this.currentIndex = options.keepIndex
      ? this.normaliseIndex(this.currentIndex, items.length)
      : 0;

    this.renderThumbs(items);
    this.showCurrent(items);
    this.updateControls(items.length);
    this.startAutoplay();
  }

  clear() {
    // [Customer 7.4.4] Antes de cambiar de ruta se detiene el autoplay y se eliminan miniaturas antiguas.
    this.stopAutoplay();
    this.currentIndex = 0;
    if (this.thumbs) this.thumbs.innerHTML = "";
    this.updateControls(0);
  }

  normaliseIndex(index, total) {
    // [Customer 9.1.2] Esta fórmula permite pasar del final al inicio y viceversa.
    if (total <= 0) return 0;
    return ((index % total) + total) % total;
  }

  showCurrent(items = this.getItems()) {
    // [Customer 9.1.3] Solo un medio permanece visible; un video oculto se pausa.
    if (items.length === 0) {
      this.updateControls(0);
      return;
    }

    this.currentIndex = this.normaliseIndex(this.currentIndex, items.length);
    items.forEach((media, index) => {
      const active = index === this.currentIndex;
      media.classList.toggle("is-active", active);
      media.hidden = !active;
      if (!active && media.tagName === "VIDEO") media.pause();
    });

    this.resetZoom();
    this.updateThumbStates();
  }

  next() {
    const items = this.getItems();
    if (items.length <= 1) return;
    this.currentIndex++;
    this.showCurrent(items);
    this.startAutoplay();
  }

  previous() {
    const items = this.getItems();
    if (items.length <= 1) return;
    this.currentIndex--;
    this.showCurrent(items);
    this.startAutoplay();
  }

  goTo(index) {
    this.currentIndex = Number(index) || 0;
    this.showCurrent();
    this.startAutoplay();
  }

  startAutoplay() {
    // [Customer 9.1.4] Se respeta la pestaña oculta y la preferencia de movimiento reducido.
    this.stopAutoplay();
    if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (this.getItems().length <= 1) return;
    this.timer = window.setInterval(() => this.next(), this.intervalMs);
  }

  stopAutoplay() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  renderThumbs(items) {
    // [Customer 7.4.5] Cada miniatura conoce su índice y llama goTo al hacer clic.
    if (!this.thumbs) return;
    this.thumbs.innerHTML = "";

    items.forEach((media, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sp-thumb";
      button.setAttribute("aria-label", `Show image ${index + 1}`);
      button.addEventListener("click", () => this.goTo(index));

      if (media.tagName === "IMG") {
        const image = document.createElement("img");
        image.src = media.currentSrc || media.src;
        image.alt = "";
        image.loading = "lazy";
        button.appendChild(image);
      } else {
        button.textContent = `Media ${index + 1}`;
      }

      this.thumbs.appendChild(button);
    });
  }

  updateThumbStates() {
    if (!this.thumbs) return;
    this.thumbs.querySelectorAll(".sp-thumb").forEach((button, index) => {
      const active = index === this.currentIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  updateControls(total) {
    const disabled = total <= 1;
    if (this.previousButton) this.previousButton.disabled = disabled;
    if (this.nextButton) this.nextButton.disabled = disabled;
  }

  handleZoom(event) {
    // [Customer 9.1.5] El origen del zoom sigue la posición del cursor dentro de la imagen activa.
    const image = event.target.closest(".preview-media.is-active");
    if (!image || image.tagName !== "IMG") return;

    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    image.style.transformOrigin = `${x}% ${y}%`;
    image.style.transform = `scale(${this.zoomScale})`;
    image.classList.add("is-zooming");
    this.stopAutoplay();
  }

  resetZoom() {
    // [Customer 9.1.6] Al salir de la galería se retiran estilos inline de todos los medios.
    this.getItems().forEach((media) => {
      media.classList.remove("is-zooming");
      media.style.transform = "";
      media.style.transformOrigin = "";
    });
  }
}
