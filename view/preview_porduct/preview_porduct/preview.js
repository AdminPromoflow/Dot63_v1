// preview.js

class PreviewPage {
  constructor() {
    // Main container where the current image/video is shown
    this.main = document.getElementById("wrap-images-group");

    // Array that stores the gallery media currently available
    this.currentImages = [];

    // Index of the media currently being displayed
    this.currentImageIndex = 0;

    // Auto-rotate control
    this.rotateTimer = null;
    this.rotateDelay = 5000;

    // Starts the whole page behaviour
    this.init();
  }

  init() {
    // If the main gallery container does not exist, stop everything
    if (!this.main) return;

    // Reads the initial media from the DOM
    //this.initGalleryFromDom();

    // Enables zoom effect on the main image
    //this.bindZoomEvents();

    // Enables the previous arrow button
    //this.bindPrevButton();

    // Allows only one pack size to be selected globally
    //this.setupPackSizeSelection();

    // Activates scroll reveal animations
    this.setupScrollAnimations();

    // Activates parallax movement on specific elements
    this.setupParallaxScroll();

    // Handles variation button selection, including dynamically injected buttons
    this.setupVariationSelection();

    // Handles delivery option changes
    //this.setupDeliveryOptions();

    // Calculates the initial price
    //this.updatePrice();

    // On full page load, splits variation groups between top and bottom containers
    window.addEventListener("load", () => {
    //  this.setupVariationsSplit();
    });

    // Recalculates the split on resize
    window.addEventListener("resize", () => {
      //this.setupVariationsSplit();
    });

    // Activates Back and Publish buttons
  //  this.setupBackPublishButtons();
  }

  /* ============================================================================
     Previous button
  ============================================================================ */
  // bindPrevButton() {
  //   const prevBtn = document.querySelector(".sp-nav-prev");
  //   if (!prevBtn) return;
  //
  //   // Prevents binding the same event more than once
  //   if (prevBtn.dataset.bound === "1") return;
  //   prevBtn.dataset.bound = "1";
  //
  //   prevBtn.addEventListener("click", () => {
  //     this.prevImage(false);
  //   });
  // }

  /* ============================================================================
     Pack size selection (global)
  ============================================================================ */
  setupPackSizeSelection() {
    const parent = document.getElementById("wrap-prices-group");
    if (!parent) return;

    // Prevents duplicate binding
    if (parent.dataset.bound === "1") return;
    parent.dataset.bound = "1";

    parent.addEventListener("click", (e) => {
      const btn = e.target.closest(".var-option");
      if (!btn || !parent.contains(btn)) return;

      // Removes selection from all options globally
      parent.querySelectorAll(".var-option.is-selected").forEach((x) => {
        x.classList.remove("is-selected");
      });

      // Marks the clicked option as selected
      btn.classList.add("is-selected");

      // Updates the visible pack size label
      const labelStrong = document.getElementById("var_label_items");
      const span = btn.querySelector(".opt-main");
      if (labelStrong && span) {
        labelStrong.textContent = span.textContent.trim();
      }

      // Recalculates price after selection change
      //this.updatePrice();
    });
  }

  // Selects the first pack size option by default
  selectFirstPackSize() {
    const parent = document.getElementById("wrap-prices-group");
    if (!parent) return;

    const all = Array.from(parent.querySelectorAll(".var-option"));
    if (!all.length) return;

    // Clears previous selections
    parent.querySelectorAll(".var-option.is-selected").forEach((x) => {
      x.classList.remove("is-selected");
    });

    // Selects the first option
    all[0].classList.add("is-selected");

    // Updates visible label
    const labelStrong = document.getElementById("var_label_items");
    const span = all[0].querySelector(".opt-main");
    if (labelStrong && span) {
      labelStrong.textContent = span.textContent.trim();
    }

    // Recalculates price
    //this.updatePrice();
  }

  /* ============================================================================
     Gallery
  ============================================================================ */

  // initGalleryFromDom() {
  //   // Reads media already present in the HTML at first load
  //   this.rebuildGalleryFromDom(0, true);
  // }

  // Rebuilds the gallery array by reading the DOM
  // rebuildGalleryFromDom(startIndex = 0, force = false) {
  //   const root = document.getElementById("wrap-images-group");
  //   if (!root) return;
  //
  //   const mediaEls = root.querySelectorAll(".preview-media");
  //
  //   // If force is false and only one media item is visible in the DOM,
  //   // but memory already has more than one item, do not overwrite memory
  //   if (!force && mediaEls.length <= 1 && this.currentImages.length > 1) {
  //     return;
  //   }
  //
  //   // Stops auto-rotation before rebuilding
  //   this.stopAutoRotate();
  //
  //   // Reads images and videos into currentImages
  //   this.currentImages = Array.from(mediaEls)
  //     .map((el) => {
  //       if (el.tagName === "IMG") {
  //         const src = el.getAttribute("src") || "";
  //         return src ? { type: "img", src } : null;
  //       }
  //
  //       if (el.tagName === "VIDEO") {
  //         const source = el.querySelector("source");
  //         const src = source?.getAttribute("src") || "";
  //         return src ? { type: "video", src } : null;
  //       }
  //
  //       return null;
  //     })
  //     .filter(Boolean);
  //
  //   // If no media exists, show empty message
  //   if (!this.currentImages.length) {
  //     root.innerHTML = '<div class="cp-empty">No media</div>';
  //     this.currentImageIndex = 0;
  //     return;
  //   }
  //
  //   // Ensures the index is valid
  //   const safeIndex = Math.max(0, Math.min(startIndex, this.currentImages.length - 1));
  //   this.currentImageIndex = safeIndex;
  //
  //   // Shows the selected media
  //   this.changeMainMedia(this.currentImages[this.currentImageIndex]);
  //
  //   // Starts automatic gallery rotation
  //   this.startAutoRotate();
  // }

  // Starts auto-rotation every 5 seconds
  startAutoRotate() {
    this.stopAutoRotate();

    // No rotation if there is only one media item
    if (!Array.isArray(this.currentImages) || this.currentImages.length <= 1) return;

    // Respects reduced motion preference
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) return;

    this.rotateTimer = window.setInterval(() => {
      this.nextImage(true);
    }, this.rotateDelay);
  }

  // Stops the auto-rotation timer
  stopAutoRotate() {
    if (this.rotateTimer) {
      window.clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }
  }

  // Moves to the next image/video
  nextImage(fromTimer = false) {
    const items = this.currentImages || [];
    if (!Array.isArray(items) || items.length === 0) return;

    this.currentImageIndex = (this.currentImageIndex + 1) % items.length;
    const mediaObj = items[this.currentImageIndex];
    this.changeMainMedia(mediaObj);

    // If the change was manual, restart the timer
    if (!fromTimer) {
      this.startAutoRotate();
    }
  }

  // Moves to the previous image/video
  prevImage(fromTimer = false) {
    const items = this.currentImages || [];
    if (!Array.isArray(items) || items.length === 0) return;

    this.currentImageIndex = (this.currentImageIndex - 1 + items.length) % items.length;
    const mediaObj = items[this.currentImageIndex];
    this.changeMainMedia(mediaObj);

    // If the change was manual, restart the timer
    if (!fromTimer) {
      this.startAutoRotate();
    }
  }

  // Replaces the main displayed media
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

  // Clears the gallery from both memory and DOM
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

  // bindZoomEvents() {
  //   if (!this.main) return;
  //
  //   // Resets image transform on mouse enter
  //   this.main.addEventListener("mouseenter", () => {
  //     const img = this.main.querySelector("img");
  //     if (img instanceof HTMLImageElement) {
  //       img.style.transformOrigin = "center center";
  //       img.style.transform = "scale(1)";
  //     }
  //   });
  //
  //   // Resets image transform on mouse leave
  //   this.main.addEventListener("mouseleave", () => {
  //     const img = this.main.querySelector("img");
  //     if (img instanceof HTMLImageElement) {
  //       img.style.transformOrigin = "center center";
  //       img.style.transform = "scale(1)";
  //     }
  //   });
  //
  //   // Zooms towards the mouse position
  //   this.main.addEventListener("mousemove", (event) => {
  //     if (window.innerWidth <= 760) return;
  //
  //     const img = this.main.querySelector("img");
  //     if (!(img instanceof HTMLImageElement)) return;
  //
  //     const rect = this.main.getBoundingClientRect();
  //     const x = ((event.clientX - rect.left) / rect.width) * 100;
  //     const y = ((event.clientY - rect.top) / rect.height) * 100;
  //
  //     img.style.transformOrigin = `${x}% ${y}%`;
  //     img.style.transform = "scale(2.1)";
  //   });
  // }

  /* ============================================================================
     Variations split
  ============================================================================ */

  setupVariationsSplit() {
    const main = document.querySelector(".sp-main");
    const topContainer = document.querySelector(".sp-variations");
    const bottomContainer = document.querySelector(".sp-variations-bottom");
    if (!main || !topContainer || !bottomContainer) return;

    // First move all groups back to the top container
    const allGroups = [
      ...topContainer.querySelectorAll(".wrap-variations"),
      ...bottomContainer.querySelectorAll(".wrap-variations"),
    ];
    allGroups.forEach((group) => topContainer.appendChild(group));

    // On mobile, do not use bottom container
    if (window.innerWidth <= 760) {
      bottomContainer.style.display = "none";
      return;
    } else {
      bottomContainer.style.display = "grid";
    }

    // Calculates available vertical space
    const mainRect = main.getBoundingClientRect();
    const thumbsEl = document.querySelector(".sp-thumbs");
    const thumbsRect = thumbsEl ? thumbsEl.getBoundingClientRect() : { height: 0 };
    const maxHeight = mainRect.height + thumbsRect.height;

    const styles = window.getComputedStyle(topContainer);
    const gap = parseFloat(styles.rowGap || styles.gap || "0") || 0;

    let accumulated = 0;
    let splitIndex = allGroups.length;

    // Finds where to split the variation groups
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

    // Moves overflow groups to the bottom container
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
     Variation selection
  ============================================================================ */

  setupVariationSelection() {
    const parent = document.getElementById("wrap-variations-group");
    if (!parent) return;

    // Prevents duplicate binding
    if (parent.dataset.bound === "1") return;
    parent.dataset.bound = "1";

    parent.addEventListener("click", (e) => {
      const option = e.target.closest(".var-option");
      if (!option || !parent.contains(option)) return;

      const group = option.closest(".wrap-variations");
      if (!group) return;

      // Removes selected class only within the same variation group
      group.querySelectorAll(".var-option.is-selected").forEach((btn) => {
        btn.classList.remove("is-selected");
      });

      // Selects the clicked option
      option.classList.add("is-selected");

      // Updates the visible selected label
      const labelStrong = group.querySelector(".var-label strong");
      const mainSpan = option.querySelector(".opt-main");
      if (labelStrong && mainSpan) {
        labelStrong.textContent = mainSpan.textContent.trim();
      }

      // Recalculates price after change
    //  this.updatePrice();
    });
  }

  /* ============================================================================
     Price
  ============================================================================ */

  // updatePrice() {
  //   const unitEl  = document.getElementById("bb_unit");
  //   const totalEl = document.getElementById("bb_total");
  //   if (!unitEl || !totalEl) return;
  //
  //   // Base price per 100 units, taken from the DOM
  //   let basePer100 = 8.0;
  //   const spPriceEl = document.getElementById("sp_price");
  //   if (spPriceEl) {
  //     const raw = spPriceEl.textContent || "";
  //     const num = parseFloat(raw.replace(/[^\d.]/g, ""));
  //     if (!Number.isNaN(num) && num > 0) basePer100 = num;
  //   }
  //
  //   // Selected pack quantity or first available option
  //   let packQty = 500;
  //   const packGroup = document.getElementById("wrap-prices-group");
  //   if (packGroup) {
  //     const selected =
  //       packGroup.querySelector(".var-option.is-selected") ||
  //       packGroup.querySelector(".var-option");
  //
  //     if (selected) {
  //       const span = selected.querySelector(".opt-main");
  //       if (span) {
  //         const txt = span.textContent.replace(/,/g, "").trim();
  //         const n = parseInt(txt, 10);
  //         if (!Number.isNaN(n) && n > 0) packQty = n;
  //       }
  //     }
  //   }
  //
  //   // Quantity discount or increase table
  //   const PACK_ADJUST = {
  //     50: 0.05,
  //     100: 0.0,
  //     200: -0.03,
  //     500: -0.08,
  //     1000: -0.12,
  //     2000: -0.16,
  //     3000: -0.18,
  //     5000: -0.22,
  //   };
  //
  //   const adjust = PACK_ADJUST[packQty] ?? 0;
  //   const packFactor = 1 + adjust;
  //
  //   // Base subtotal calculation
  //   let subtotal = basePer100 * (packQty / 100) * packFactor;
  //
  //   // Adds delivery adjustment if selected
  //   const deliveryRadio = document.querySelector('input[name="delivery_speed"]:checked');
  //   if (deliveryRadio) {
  //     const mode = deliveryRadio.dataset.mode;
  //     const val = parseFloat(deliveryRadio.dataset.value || "0") || 0;
  //
  //     if (mode === "percent") {
  //       subtotal = subtotal * (1 + val);
  //     } else if (mode === "absolute") {
  //       subtotal = subtotal + val;
  //     }
  //   }
  //
  //   // VAT estimation
  //   const VAT_RATE = 0.2;
  //   const taxEl = document.getElementById("bb_tax");
  //   const taxAmount = subtotal * VAT_RATE;
  //   if (taxEl) {
  //     taxEl.textContent = `Estimated £${taxAmount.toFixed(2)}`;
  //   }
  //
  //   // Final total and unit price
  //   const total = subtotal;
  //   const packQtySafe = packQty || 1;
  //   const unitPrice = total / packQtySafe;
  //
  //   unitEl.textContent  = `£${unitPrice.toFixed(2)}`;
  //   totalEl.textContent = `£${total.toFixed(2)}`;
  // }

  // setupDeliveryOptions() {
  //   const radios = document.querySelectorAll('input[name="delivery_speed"]');
  //   if (!radios.length) return;
  //
  //   radios.forEach((radio) => {
  //     radio.addEventListener("change", () => {
  //       //this.updatePrice();
  //     });
  //   });
  // }

  /* ============================================================================
     Back and Publish buttons
  ============================================================================ */

  // setupBackPublishButtons() {
  //   const backBtn = document.getElementById("btn_back_edit");
  //   const publishBtn = document.getElementById("btn_publish");
  //
  //   if (backBtn) {
  //     backBtn.addEventListener("click", () => {
  //       const url = "../../view/product_details/index.php";
  //
  //       const current = new URL(window.location.href);
  //       const dest = new URL(url, current);
  //
  //       const sku = current.searchParams.get("sku");
  //       const skuv = current.searchParams.get("sku_variation");
  //
  //       // Preserves sku and sku_variation in the destination URL
  //       if (sku) dest.searchParams.set("sku", sku);
  //       if (skuv) dest.searchParams.set("sku_variation", skuv);
  //
  //       window.location.assign(dest);
  //     });
  //   }
  //
  //   if (publishBtn) {
  //     publishBtn.addEventListener("click", () => {
  //       alert(
  //         "Your configuration will now be reviewed and then approved. " +
  //         "This page is currently under construction."
  //       );
  //     });
  //   }
  // }
}

/* Boot */
function bootPreviewPage() {
  const page = new PreviewPage();

  // Exposes the instance globally for debugging from the browser console
  window.previewGallery = page;
}

// If the DOM is still loading, wait for it
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootPreviewPage);
} else {
  bootPreviewPage();
}
