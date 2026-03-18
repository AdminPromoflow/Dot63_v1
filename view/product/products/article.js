class ArticleFilterParallax {
  constructor() {
    this.filter = document.querySelector(".filter_products");
    this.wrapper = document.querySelector(".products");

    this.desktopQuery = window.matchMedia("(min-width: 900px)");
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.lastScrollY = window.scrollY;
    this.ticking = false;

    if (!this.filter || !this.wrapper) return;

    this.bindEvents();
    this.update();
  }

  bindEvents() {
    window.addEventListener("scroll", () => this.onScroll(), { passive: true });
    window.addEventListener("resize", () => this.update());
    this.desktopQuery.addEventListener?.("change", () => this.update());
    this.motionQuery.addEventListener?.("change", () => this.update());
  }

  onScroll() {
    if (this.ticking) return;

    this.ticking = true;
    requestAnimationFrame(() => {
      this.update();
      this.ticking = false;
    });
  }

  update() {
    if (!this.filter) return;

    if (!this.desktopQuery.matches || this.motionQuery.matches) {
      this.filter.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    const wrapperRect = this.wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // si el contenedor no está visible, resetea
    if (wrapperRect.bottom < 0 || wrapperRect.top > viewportHeight) {
      this.filter.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    // movimiento suave hacia abajo mientras haces scroll
    const scrollProgress = Math.max(0, -wrapperRect.top);
    const offset = Math.min(scrollProgress * 0.12, 42);

    this.filter.style.transform = `translate3d(0, ${offset}px, 0)`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ArticleFilterParallax();
});class ArticleFilterParallax {
  constructor() {
    this.filter = document.querySelector(".filter_products");
    this.wrapper = document.querySelector(".products");

    this.desktopQuery = window.matchMedia("(min-width: 900px)");
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.lastScrollY = window.scrollY;
    this.ticking = false;

    if (!this.filter || !this.wrapper) return;

    this.bindEvents();
    this.update();
  }

  bindEvents() {
    window.addEventListener("scroll", () => this.onScroll(), { passive: true });
    window.addEventListener("resize", () => this.update());
    this.desktopQuery.addEventListener?.("change", () => this.update());
    this.motionQuery.addEventListener?.("change", () => this.update());
  }

  onScroll() {
    if (this.ticking) return;

    this.ticking = true;
    requestAnimationFrame(() => {
      this.update();
      this.ticking = false;
    });
  }

  update() {
    if (!this.filter) return;

    if (!this.desktopQuery.matches || this.motionQuery.matches) {
      this.filter.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    const wrapperRect = this.wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // si el contenedor no está visible, resetea
    if (wrapperRect.bottom < 0 || wrapperRect.top > viewportHeight) {
      this.filter.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    // movimiento suave hacia abajo mientras haces scroll
    const scrollProgress = Math.max(0, -wrapperRect.top);
    const offset = Math.min(scrollProgress * 0.12, 42);

    this.filter.style.transform = `translate3d(0, ${offset}px, 0)`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ArticleFilterParallax();
});
