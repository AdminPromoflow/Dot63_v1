// preview.js

class PreviewPage {
  constructor() {
    this.main = document.getElementById("wrap-images-group");

    this.currentImages = [];
    this.currentImageIndex = 0;

    // ✅ Auto-rotate
    this.rotateTimer = null;
    this.rotateDelay = 5000;

    this.init();
  }

  init() {
    if (!this.main) return;

    this.initGalleryFromDom();
    this.bindZoomEvents();

    // ✅ Prev button (la flecha izquierda no tenía click)
    this.bindPrevButton();

    // ✅ Pack size: selección global (solo 1 en total)
    this.setupPackSizeSelection();

    this.setupScrollAnimations();
    this.setupParallaxScroll();
    this.setupVariationSelection(); // ✅ delegación (sirve para botones inyectados)
    this.setupDeliveryOptions();
    this.updatePrice();

    window.addEventListener("load", () => {
      this.setupVariationsSplit();
    });

    window.addEventListener("resize", () => {
      this.setupVariationsSplit();
    });

    this.setupBackPublishButtons();
  }

  /* ============================================================================
     ✅ Prev button
  ============================================================================ */
  bindPrevButton() {
    const prevBtn = document.querySelector(".sp-nav-prev");
    if (!prevBtn) return;

    if (prevBtn.dataset.bound === "1") return;
    prevBtn.dataset.bound = "1";

    prevBtn.addEventListener("click", () => {
      this.prevImage(false);
    });
  }

  /* ============================================================================
     ✅ Pack size selection (GLOBAL) — solo 1 seleccionado en total
  ============================================================================ */
  setupPackSizeSelection() {
    const parent = document.getElementById("wrap-prices-group");
    if (!parent) return;

    if (parent.dataset.bound === "1") return;
    parent.dataset.bound = "1";

    parent.addEventListener("click", (e) => {
      const btn = e.target.closest(".var-option");
      if (!btn || !parent.contains(btn)) return;

      // quitar selección a TODOS (no por wrap)
      parent.querySelectorAll(".var-option.is-selected").forEach((x) => {
        x.classList.remove("is-selected");
      });

      btn.classList.add("is-selected");

      // actualizar label de Pack size
      const labelStrong = document.getElementById("var_label_items");
      const span = btn.querySelector(".opt-main");
      if (labelStrong && span) {
        labelStrong.textContent = span.textContent.trim();
      }

      this.updatePrice();
    });
  }

  // ✅ NEW: seleccionar el primero en general (un solo seleccionado total)
  selectFirstPackSize() {
    const parent = document.getElementById("wrap-prices-group");
    if (!parent) return;

    const all = Array.from(parent.querySelectorAll(".var-option"));
    if (!all.length) return;

    parent.querySelectorAll(".var-option.is-selected").forEach((x) => {
      x.classList.remove("is-selected");
    });

    all[0].classList.add("is-selected");

    const labelStrong = document.getElementById("var_label_items");
    const span = all[0].querySelector(".opt-main");
    if (labelStrong && span) {
      labelStrong.textContent = span.textContent.trim();
    }

    this.updatePrice();
  }

  /* ============================================================================
     Gallery
  ============================================================================ */

  initGalleryFromDom() {
    // primera lectura del DOM (si hay media hardcode)
    this.rebuildGalleryFromDom(0, true);
  }

  // ✅ NEW: reconstruye currentImages leyendo el DOM
  // force=true => reconstruye aunque ahora el DOM tenga solo 1 item (por changeMainMedia)
  rebuildGalleryFromDom(startIndex = 0, force = false) {
    const root = document.getElementById("wrap-images-group");
    if (!root) return;

    const mediaEls = root.querySelectorAll(".preview-media");

    // Si NO force y el DOM tiene 1 (porque ya está mostrando una sola),
    // pero la memoria tiene más, NO dañamos la galería en memoria.
    if (!force && mediaEls.length <= 1 && this.currentImages.length > 1) {
      return;
    }

    // parar auto-rotate antes de reconstruir
    this.stopAutoRotate();

    this.currentImages = Array.from(mediaEls)
      .map((el) => {
        if (el.tagName === "IMG") {
          const src = el.getAttribute("src") || "";
          return src ? { type: "img", src } : null;
        }

        if (el.tagName === "VIDEO") {
          const source = el.querySelector("source");
          const src = source?.getAttribute("src") || "";
          return src ? { type: "video", src } : null;
        }

        return null;
      })
      .filter(Boolean);

    if (!this.currentImages.length) {
      root.innerHTML = '<div class="cp-empty">No media</div>';
      this.currentImageIndex = 0;
      return;
    }

    const safeIndex = Math.max(0, Math.min(startIndex, this.currentImages.length - 1));
    this.currentImageIndex = safeIndex;
    this.changeMainMedia(this.currentImages[this.currentImageIndex]);

    // ✅ auto-rotate cada 5s
    this.startAutoRotate();
  }

  // ✅ Auto rotate control
  startAutoRotate() {
    this.stopAutoRotate();

    if (!Array.isArray(this.currentImages) || this.currentImages.length <= 1) return;

    // opcional: respeta reduce motion
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) return;

    this.rotateTimer = window.setInterval(() => {
      this.nextImage(true); // fromTimer=true
    }, this.rotateDelay);
  }

  stopAutoRotate() {
    if (this.rotateTimer) {
      window.clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }
  }

  nextImage(fromTimer = false) {
    const items = this.currentImages || [];
    if (!Array.isArray(items) || items.length === 0) return;

    this.currentImageIndex = (this.currentImageIndex + 1) % items.length;
    const mediaObj = items[this.currentImageIndex];
    this.changeMainMedia(mediaObj);

    // si fue manual, reinicia el timer
    if (!fromTimer) {
      this.startAutoRotate();
    }
  }

  prevImage(fromTimer = false) {
    const items = this.currentImages || [];
    if (!Array.isArray(items) || items.length === 0) return;

    this.currentImageIndex = (this.currentImageIndex - 1 + items.length) % items.length;
    const mediaObj = items[this.currentImageIndex];
    this.changeMainMedia(mediaObj);

    if (!fromTimer) {
      this.startAutoRotate();
    }
  }

  changeMainMedia(mediaObj) {
    const sp_main = document.getElementById("wrap-images-group");
    if (!sp_main) return;

    if (!mediaObj || !mediaObj.src) {
      sp_main.innerHTML = '<div class="cp-empty">No media</div>';
      return;
    }

    if (mediaObj.type === "video") {
      sp_main.innerHTML = `
        <video class="preview-media" controls preload="metadata">
          <source src="${mediaObj.src}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `;
    } else {
      sp_main.innerHTML = `
        <img class="preview-media" src="${mediaObj.src}" alt="Product image">
      `;
    }
  }

  // ✅ Limpia DOM + memoria de la galería
  clearGallery() {
    this.stopAutoRotate();

    this.currentImages = [];
    this.currentImageIndex = 0;

    const main = document.getElementById("wrap-images-group");
    if (main) main.innerHTML = "";

    const thumbs = document.getElementById("sp_thumbs");
    if (thumbs) thumbs.innerHTML = "";
  }

  /* ============================================================================
     Zoom
  ============================================================================ */

  bindZoomEvents() {
    if (!this.main) return;

    this.main.addEventListener("mouseenter", () => {
      const img = this.main.querySelector("img");
      if (img instanceof HTMLImageElement) {
        img.style.transformOrigin = "center center";
        img.style.transform = "scale(1)";
      }
    });

    this.main.addEventListener("mouseleave", () => {
      const img = this.main.querySelector("img");
      if (img instanceof HTMLImageElement) {
        img.style.transformOrigin = "center center";
        img.style.transform = "scale(1)";
      }
    });

    this.main.addEventListener("mousemove", (event) => {
      if (window.innerWidth <= 760) return;

      const img = this.main.querySelector("img");
      if (!(img instanceof HTMLImageElement)) return;

      const rect = this.main.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      img.style.transformOrigin = `${x}% ${y}%`;
      img.style.transform = "scale(2.1)";
    });
  }

  /* ============================================================================
     Variations split
  ============================================================================ */

  setupVariationsSplit() {
    const main = document.querySelector(".sp-main");
    const topContainer = document.querySelector(".sp-variations");
    const bottomContainer = document.querySelector(".sp-variations-bottom");
    if (!main || !topContainer || !bottomContainer) return;

    const allGroups = [
      ...topContainer.querySelectorAll(".wrap-variations"),
      ...bottomContainer.querySelectorAll(".wrap-variations"),
    ];
    allGroups.forEach((group) => topContainer.appendChild(group));

    if (window.innerWidth <= 760) {
      bottomContainer.style.display = "none";
      return;
    } else {
      bottomContainer.style.display = "grid";
    }

    const mainRect = main.getBoundingClientRect();
    const thumbsEl = document.querySelector(".sp-thumbs");
    const thumbsRect = thumbsEl ? thumbsEl.getBoundingClientRect() : { height: 0 };
    const maxHeight = mainRect.height + thumbsRect.height;

    const styles = window.getComputedStyle(topContainer);
    const gap = parseFloat(styles.rowGap || styles.gap || "0") || 0;

    let accumulated = 0;
    let splitIndex = allGroups.length;

    allGroups.forEach((group, index) => {
      const rect = group.getBoundingClientRect();
      const h = rect.height;
      const extraGap = accumulated === 0 ? 0 : gap;

      if (accumulated + extraGap + h <= maxHeight) {
        accumulated += extraGap + h;
      } else if (splitIndex === allGroups.length) {
        splitIndex = index;
      }
    });

    if (splitIndex < allGroups.length) {
      const toMove = allGroups.slice(splitIndex);
      toMove.forEach((group) => bottomContainer.appendChild(group));
    }
  }

  /* ============================================================================
     Scroll animations + Parallax
  ============================================================================ */

  setupScrollAnimations() {
    const fadeEls = document.querySelectorAll(".js-fade-up");
    const scaleEls = document.querySelectorAll(".js-scale-in");
    if (!fadeEls.length && !scaleEls.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    fadeEls.forEach((el) => observer.observe(el));
    scaleEls.forEach((el) => observer.observe(el));
  }

  setupParallaxScroll() {
    const parallaxEls = document.querySelectorAll(".js-parallax");
    if (!parallaxEls.length) return;

    const update = () => {
      const scrollY = window.scrollY || window.pageYOffset;

      parallaxEls.forEach((el) => {
        if (window.innerWidth > 1120) {
          const factor = el.closest(".sp-buybox") ? 0.02 : 0.03;
          const offset = scrollY * factor;
          el.style.transform = `translateY(${offset}px)`;
        } else {
          el.style.transform = "";
        }
      });
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ============================================================================
     ✅ Selection (variations)
  ============================================================================ */

  setupVariationSelection() {
    const parent = document.getElementById("wrap-variations-group");
    if (!parent) return;

    if (parent.dataset.bound === "1") return;
    parent.dataset.bound = "1";

    parent.addEventListener("click", (e) => {
      const option = e.target.closest(".var-option");
      if (!option || !parent.contains(option)) return;

      const group = option.closest(".wrap-variations");
      if (!group) return;

      group.querySelectorAll(".var-option.is-selected").forEach((btn) => {
        btn.classList.remove("is-selected");
      });

      option.classList.add("is-selected");

      const labelStrong = group.querySelector(".var-label strong");
      const mainSpan = option.querySelector(".opt-main");
      if (labelStrong && mainSpan) {
        labelStrong.textContent = mainSpan.textContent.trim();
      }

      this.updatePrice();
    });
  }

  /* ============================================================================
     ✅ Price
  ============================================================================ */

  updatePrice() {
    const unitEl  = document.getElementById("bb_unit");
    const totalEl = document.getElementById("bb_total");
    if (!unitEl || !totalEl) return;

    // Base per 100 desde el DOM
    let basePer100 = 8.0;
    const spPriceEl = document.getElementById("sp_price");
    if (spPriceEl) {
      const raw = spPriceEl.textContent || "";
      const num = parseFloat(raw.replace(/[^\d.]/g, ""));
      if (!Number.isNaN(num) && num > 0) basePer100 = num;
    }

    // Pack qty: seleccionado global o el primero
    let packQty = 500;
    const packGroup = document.getElementById("wrap-prices-group");
    if (packGroup) {
      const selected =
        packGroup.querySelector(".var-option.is-selected") ||
        packGroup.querySelector(".var-option");

      if (selected) {
        const span = selected.querySelector(".opt-main");
        if (span) {
          const txt = span.textContent.replace(/,/g, "").trim();
          const n = parseInt(txt, 10);
          if (!Number.isNaN(n) && n > 0) packQty = n;
        }
      }
    }

    const PACK_ADJUST = {
      50: 0.05,
      100: 0.0,
      200: -0.03,
      500: -0.08,
      1000: -0.12,
      2000: -0.16,
      3000: -0.18,
      5000: -0.22,
    };

    const adjust = PACK_ADJUST[packQty] ?? 0;
    const packFactor = 1 + adjust;

    let subtotal = basePer100 * (packQty / 100) * packFactor;

    const deliveryRadio = document.querySelector('input[name="delivery_speed"]:checked');
    if (deliveryRadio) {
      const mode = deliveryRadio.dataset.mode;
      const val = parseFloat(deliveryRadio.dataset.value || "0") || 0;

      if (mode === "percent") {
        subtotal = subtotal * (1 + val);
      } else if (mode === "absolute") {
        subtotal = subtotal + val;
      }
    }

    const VAT_RATE = 0.2;
    const taxEl = document.getElementById("bb_tax");
    const taxAmount = subtotal * VAT_RATE;
    if (taxEl) {
      taxEl.textContent = `Estimated £${taxAmount.toFixed(2)}`;
    }

    const total = subtotal;
    const packQtySafe = packQty || 1;
    const unitPrice = total / packQtySafe;

    unitEl.textContent  = `£${unitPrice.toFixed(2)}`;
    totalEl.textContent = `£${total.toFixed(2)}`;
  }

  setupDeliveryOptions() {
    const radios = document.querySelectorAll('input[name="delivery_speed"]');
    if (!radios.length) return;

    radios.forEach((radio) => {
      radio.addEventListener("change", () => {
        this.updatePrice();
      });
    });
  }

  setupBackPublishButtons() {
    const backBtn = document.getElementById("btn_back_edit");
    const publishBtn = document.getElementById("btn_publish");

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        const url = "../../view/product_details/index.php";

        const current = new URL(window.location.href);
        const dest = new URL(url, current);

        const sku = current.searchParams.get("sku");
        const skuv = current.searchParams.get("sku_variation");

        if (sku) dest.searchParams.set("sku", sku);
        if (skuv) dest.searchParams.set("sku_variation", skuv);

        window.location.assign(dest);
      });
    }

    if (publishBtn) {
      publishBtn.addEventListener("click", () => {
        alert(
          "Your configuration will now be reviewed and then approved. " +
          "This page is currently under construction."
        );
      });
    }
  }
}

/* ✅ Boot */
function bootPreviewPage() {
  const page = new PreviewPage();
  window.previewGallery = page;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootPreviewPage);
} else {
  bootPreviewPage();
}
