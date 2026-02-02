// preview.js

class PreviewPage {
  constructor() {
    this.main = document.getElementById("wrap-images-group");

    this.currentImages = [];
    this.currentImageIndex = 0;

    this.init();
  }

  init() {
    if (!this.main) return;

    this.initGalleryFromDom();
    this.bindZoomEvents();

    this.setupScrollAnimations();
    this.setupParallaxScroll();
    this.setupVariationSelection();
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

  initGalleryFromDom() {
    const mediaEls = document.querySelectorAll(".preview-media");
    this.currentImages = Array.from(mediaEls).map((el) => {
      if (el.tagName === "IMG") {
        const src = el.getAttribute("src") || "";
        return src ? { type: "img", src } : null;
      } else if (el.tagName === "VIDEO") {
        const source = el.querySelector("source");
        const src = source?.getAttribute("src") || "";
        return src ? { type: "video", src } : null;
      }
      return null;
    }).filter(Boolean);

    this.currentImageIndex = 0;

    if (this.currentImages.length) {
      const mediaObj = this.currentImages[0];
      this.changeMainMedia(mediaObj);
    }
  }

  getImageSrc(imgObj) {
    const link = imgObj?.link || "";
    if (!link) return "";
    if (/^(https?:)?\/\//i.test(link) || link.startsWith("data:")) return link;
    if (link.startsWith("/")) return link;
    return "../../" + link;
  }

  nextImage() {
    const items = this.currentImages || [];
    if (!Array.isArray(items) || items.length === 0) return;

    this.currentImageIndex = (this.currentImageIndex + 1) % items.length;

    const mediaObj = items[this.currentImageIndex];
    this.changeMainMedia(mediaObj);
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

  bindZoomEvents() {
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

  setupVariationSelection() {
    const groups = document.querySelectorAll(".wrap-variations");
    if (!groups.length) return;

    groups.forEach((group) => {
      const options = group.querySelectorAll(".var-option");
      if (!options.length) return;

      options.forEach((option) => {
        option.addEventListener("click", () => {
          options.forEach((o) => o.classList.remove("is-selected"));
          option.classList.add("is-selected");

          const labelStrong = group.querySelector(".var-label strong");
          const mainSpan = option.querySelector(".opt-main");
          if (labelStrong && mainSpan) {
            labelStrong.textContent = mainSpan.textContent;
          }

          this.updatePrice();
        });
      });
    });
  }

  updatePrice() {
    const unitEl = document.getElementById("bb_unit");
    const totalEl = document.getElementById("bb_total");
    if (!unitEl || !totalEl) return;

    let width = "20mm";
    const widthGroup = document.getElementById("wrap-variations-group");
    if (widthGroup) {
      const selected = widthGroup.querySelector(".var-option.is-selected") || widthGroup.querySelector(".var-option");
      if (selected) {
        const span = selected.querySelector(".opt-main");
        if (span) width = span.textContent.trim();
      }
    }

    let packQty = 500;
    const packGroup = document.getElementById("wrap-prices-group");
    if (packGroup) {
      const selected = packGroup.querySelector(".var-option.is-selected") || packGroup.querySelector(".var-option");
      if (selected) {
        const span = selected.querySelector(".opt-main");
        if (span) {
          const txt = span.textContent.replace(/,/g, "").trim();
          const n = parseInt(txt, 10);
          if (!Number.isNaN(n) && n > 0) packQty = n;
        }
      }
    }

    let printName = "Double sided";
    const printGroup = Array.from(document.querySelectorAll(".wrap-variations")).find((g) => {
      const nameEl = g.querySelector(".var-name");
      return nameEl && nameEl.textContent.trim().toLowerCase() === "print side";
    });
    if (printGroup) {
      const selected = printGroup.querySelector(".var-option.is-selected") || printGroup.querySelector(".var-option");
      if (selected) {
        const span = selected.querySelector(".opt-main");
        if (span) printName = span.textContent.trim();
      }
    }

    let clipName = "Swivel hook";
    const clipGroup = Array.from(document.querySelectorAll(".wrap-variations")).find((g) => {
      const nameEl = g.querySelector(".var-name");
      return nameEl && nameEl.textContent.trim().toLowerCase() === "clip type";
    });
    if (clipGroup) {
      const selected = clipGroup.querySelector(".var-option.is-selected") || clipGroup.querySelector(".var-option");
      if (selected) {
        const span = selected.querySelector(".opt-main");
        if (span) clipName = span.textContent.trim();
      }
    }

    const BASE_PER_100 = {
      "10mm": 7.0,
      "15mm": 7.5,
      "20mm": 8.0,
      "25mm": 8.8,
      "30mm": 9.4,
      "35mm": 10.2,
    };

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

    const basePer100 = BASE_PER_100[width] || 8.0;
    const adjust = PACK_ADJUST[packQty] ?? 0;
    const packFactor = 1 + adjust;

    let baseTotal = basePer100 * (packQty / 100) * packFactor;

    let printFactor = 1;
    if (/single/i.test(printName)) {
      printFactor = 0.8;
    }

    let clipFactor = 1;
    if (/trigger/i.test(clipName)) {
      clipFactor = 1.05;
    } else if (/split/i.test(clipName)) {
      clipFactor = 1.02;
    }

    let subtotal = baseTotal * printFactor * clipFactor;

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

    unitEl.textContent = `£${unitPrice.toFixed(2)}`;
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
    const backBtn = document.getElementById('btn_back_edit');
    const publishBtn = document.getElementById('btn_publish');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const url = '../../view/product_details/index.php';

        const current = new URL(window.location.href);
        const dest    = new URL(url, current);

        const sku  = current.searchParams.get('sku');
        const skuv = current.searchParams.get('sku_variation');

        if (sku)  dest.searchParams.set('sku', sku);
        if (skuv) dest.searchParams.set('sku_variation', skuv);

        window.location.assign(dest);
      });
    }

    if (publishBtn) {
      publishBtn.addEventListener('click', () => {
        alert(
          'Your configuration will now be reviewed and then approved. ' +
          'This page is currently under construction.'
        );
      });
    }
  }
}

/**
 * Divide dinámicamente los .var-group entre:
 * - .sp-variations (arriba, limitado por altura imagen grande + thumbs)
 * - .sp-variations-bottom (banda inferior, columnas 1 y 2)
 */
document.addEventListener("DOMContentLoaded", () => {
  const page = new PreviewPage();
  window.previewGallery = page;
});
