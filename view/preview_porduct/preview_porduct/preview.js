// // preview.js
//
// class PreviewPage {
//   constructor() {
//     this.main = document.getElementById("wrap-images-group");
//
//     this.currentImages = [];
//     this.currentImageIndex = 0;
//
//     this.rotateTimer = null;
//     this.rotateDelay = 5000;
//     this.galleryObserver = null;
//     this.isSyncingGallery = false;
//
//     this.init();
//   }
//
//   init() {
//     if (!this.main) return;
//
//     this.initGalleryFromDom();
//     this.observeGalleryChanges();
//
//     this.bindPrevButton();
//     this.setupPackSizeSelection();
//     this.setupVariationSelection();
//     this.updatePrice();
//     this.setupBackPublishButtons();
//   }
//
//   observeGalleryChanges() {
//     if (!this.main || this.galleryObserver) return;
//
//     this.galleryObserver = new MutationObserver(() => {
//       if (this.isSyncingGallery) return;
//
//       const mediaEls = this.getGalleryMediaElements(this.main);
//
//       if (!mediaEls.length) {
//         this.stopAutoRotate();
//         this.currentImages = [];
//         this.currentImageIndex = 0;
//         return;
//       }
//
//       this.rebuildGalleryFromDom(0, false);
//     });
//
//     this.galleryObserver.observe(this.main, {
//       childList: true,
//       subtree: true,
//     });
//   }
//
//   getGalleryMediaElements(root) {
//     if (!root) return [];
//
//     const groupedMedia = root.querySelectorAll(".wrap-images .preview-media");
//     if (groupedMedia.length) {
//       return Array.from(groupedMedia);
//     }
//
//     return Array.from(root.querySelectorAll(".preview-media"));
//   }
//
//   setGalleryHtml(root, html) {
//     this.isSyncingGallery = true;
//     root.innerHTML = html;
//
//     window.setTimeout(() => {
//       this.isSyncingGallery = false;
//     }, 0);
//   }
//
//   /* ============================================================================
//      ✅ Prev button
//   ============================================================================ */
//   bindPrevButton() {
//     const prevBtn = document.querySelector(".sp-nav-prev");
//     if (!prevBtn) return;
//
//     if (prevBtn.dataset.bound === "1") return;
//     prevBtn.dataset.bound = "1";
//
//     prevBtn.addEventListener("click", () => {
//       this.prevImage(false);
//     });
//   }
//
//   /* ============================================================================
//      ✅ Pack size selection (GLOBAL) — solo 1 seleccionado en total
//   ============================================================================ */
//   setupPackSizeSelection() {
//     const parent = document.getElementById("wrap-prices-group");
//     if (!parent) return;
//
//     if (parent.dataset.bound === "1") return;
//     parent.dataset.bound = "1";
//
//     parent.addEventListener("click", (e) => {
//       const btn = e.target.closest(".var-option");
//       if (!btn || !parent.contains(btn)) return;
//
//       // quitar selección a TODOS (no por wrap)
//       parent.querySelectorAll(".var-option.is-selected").forEach((x) => {
//         x.classList.remove("is-selected");
//       });
//
//       btn.classList.add("is-selected");
//
//       // actualizar label de Pack size
//       const labelStrong = document.getElementById("var_label_items");
//       const span = btn.querySelector(".opt-main");
//       if (labelStrong && span) {
//         labelStrong.textContent = span.textContent.trim();
//       }
//
//       this.updatePrice();
//     });
//   }
//
//   /* ============================================================================
//      Gallery
//   ============================================================================ */
//
//   initGalleryFromDom() {
//     // primera lectura del DOM (si hay media hardcode)
//     this.rebuildGalleryFromDom(0, true);
//   }
//
//   // ✅ NEW: reconstruye currentImages leyendo el DOM
//   // force=true => reconstruye aunque ahora el DOM tenga solo 1 item (por changeMainMedia)
//   rebuildGalleryFromDom(startIndex = 0, force = false) {
//     const root = document.getElementById("wrap-images-group");
//     if (!root) return;
//
//     const mediaEls = this.getGalleryMediaElements(root);
//
//     // Si NO force y el DOM tiene 1 (porque ya está mostrando una sola),
//     // pero la memoria tiene más, NO dañamos la galería en memoria.
//     if (!force && mediaEls.length <= 1 && this.currentImages.length > 1) {
//       return;
//     }
//
//     // parar auto-rotate antes de reconstruir
//     this.stopAutoRotate();
//
//     this.currentImages = Array.from(mediaEls)
//       .map((el) => {
//         if (el.tagName === "IMG") {
//           const src = el.getAttribute("src") || "";
//           return src ? { type: "img", src } : null;
//         }
//
//         if (el.tagName === "VIDEO") {
//           const source = el.querySelector("source");
//           const src = source?.getAttribute("src") || "";
//           return src ? { type: "video", src } : null;
//         }
//
//         return null;
//       })
//       .filter(Boolean);
//
//     if (!this.currentImages.length) {
//       this.setGalleryHtml(root, '<div class="cp-empty">No media</div>');
//       this.currentImageIndex = 0;
//       return;
//     }
//
//     const safeIndex = Math.max(0, Math.min(startIndex, this.currentImages.length - 1));
//     this.currentImageIndex = safeIndex;
//     this.changeMainMedia(this.currentImages[this.currentImageIndex]);
//
//     // ✅ auto-rotate cada 5s
//     this.startAutoRotate();
//   }
//
//   // ✅ Auto rotate control
//   startAutoRotate() {
//     this.stopAutoRotate();
//
//     if (!Array.isArray(this.currentImages) || this.currentImages.length <= 1) return;
//
//     // opcional: respeta reduce motion
//     const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
//     if (reduceMotion) return;
//
//     this.rotateTimer = window.setInterval(() => {
//       this.nextImage(true); // fromTimer=true
//     }, this.rotateDelay);
//   }
//
//   stopAutoRotate() {
//     if (this.rotateTimer) {
//       window.clearInterval(this.rotateTimer);
//       this.rotateTimer = null;
//     }
//   }
//
//   nextImage(fromTimer = false) {
//     const items = this.currentImages || [];
//     if (!Array.isArray(items) || items.length === 0) return;
//
//     this.currentImageIndex = (this.currentImageIndex + 1) % items.length;
//     const mediaObj = items[this.currentImageIndex];
//     this.changeMainMedia(mediaObj);
//
//     // si fue manual, reinicia el timer
//     if (!fromTimer) {
//       this.startAutoRotate();
//     }
//   }
//
//   prevImage(fromTimer = false) {
//     const items = this.currentImages || [];
//     if (!Array.isArray(items) || items.length === 0) return;
//
//     this.currentImageIndex = (this.currentImageIndex - 1 + items.length) % items.length;
//     const mediaObj = items[this.currentImageIndex];
//     this.changeMainMedia(mediaObj);
//
//     if (!fromTimer) {
//       this.startAutoRotate();
//     }
//   }
//
//   changeMainMedia(mediaObj) {
//     const sp_main = document.getElementById("wrap-images-group");
//     if (!sp_main) return;
//
//     if (!mediaObj || !mediaObj.src) {
//       this.setGalleryHtml(sp_main, '<div class="cp-empty">No media</div>');
//       return;
//     }
//
//     if (mediaObj.type === "video") {
//       this.setGalleryHtml(sp_main, `
//         <video class="preview-media" controls preload="metadata">
//           <source src="${mediaObj.src}" type="video/mp4">
//           Your browser does not support the video tag.
//         </video>
//       `);
//     } else {
//       this.setGalleryHtml(sp_main, `
//         <img class="preview-media" src="${mediaObj.src}" alt="Product image">
//       `);
//     }
//   }
//
//   // ✅ Limpia DOM + memoria de la galería
//   clearGallery() {
//     this.stopAutoRotate();
//
//     this.currentImages = [];
//     this.currentImageIndex = 0;
//
//     const main = document.getElementById("wrap-images-group");
//     if (main) this.setGalleryHtml(main, "");
//
//     const thumbs = document.getElementById("sp_thumbs");
//     if (thumbs) thumbs.innerHTML = "";
//   }
//
//   /* ============================================================================
//      ✅ Selection (variations)
//   ============================================================================ */
//
//   setupVariationSelection() {
//     const parent = document.getElementById("wrap-variations-group");
//     if (!parent) return;
//
//     if (parent.dataset.bound === "1") return;
//     parent.dataset.bound = "1";
//
//     parent.addEventListener("click", (e) => {
//       const option = e.target.closest(".var-option");
//       if (!option || !parent.contains(option)) return;
//
//       const group = option.closest(".wrap-variations");
//       if (!group) return;
//
//       group.querySelectorAll(".var-option.is-selected").forEach((btn) => {
//         btn.classList.remove("is-selected");
//       });
//
//       option.classList.add("is-selected");
//
//       const labelStrong = group.querySelector(".var-label strong");
//       const mainSpan = option.querySelector(".opt-main");
//       if (labelStrong && mainSpan) {
//         labelStrong.textContent = mainSpan.textContent.trim();
//       }
//
//       this.updatePrice();
//     });
//   }
//
//   /* ============================================================================
//      ✅ Price
//   ============================================================================ */
//
//   updatePrice() {
//     const unitEl  = document.getElementById("bb_unit");
//     const totalEl = document.getElementById("bb_total");
//     if (!unitEl || !totalEl) return;
//
//     // Base per 100 desde el DOM
//     let basePer100 = 8.0;
//     const spPriceEl = document.getElementById("sp_price");
//     if (spPriceEl) {
//       const raw = spPriceEl.textContent || "";
//       const num = parseFloat(raw.replace(/[^\d.]/g, ""));
//       if (!Number.isNaN(num) && num > 0) basePer100 = num;
//     }
//
//     // Pack qty: seleccionado global o el primero
//     let packQty = 500;
//     const packGroup = document.getElementById("wrap-prices-group");
//     if (packGroup) {
//       const selected =
//         packGroup.querySelector(".var-option.is-selected") ||
//         packGroup.querySelector(".var-option");
//
//       if (selected) {
//         const span = selected.querySelector(".opt-main");
//         if (span) {
//           const txt = span.textContent.replace(/,/g, "").trim();
//           const n = parseInt(txt, 10);
//           if (!Number.isNaN(n) && n > 0) packQty = n;
//         }
//       }
//     }
//
//     const PACK_ADJUST = {
//       50: 0.05,
//       100: 0.0,
//       200: -0.03,
//       500: -0.08,
//       1000: -0.12,
//       2000: -0.16,
//       3000: -0.18,
//       5000: -0.22,
//     };
//
//     const adjust = PACK_ADJUST[packQty] ?? 0;
//     const packFactor = 1 + adjust;
//
//     let subtotal = basePer100 * (packQty / 100) * packFactor;
//
//     const deliveryRadio = document.querySelector('input[name="delivery_speed"]:checked');
//     if (deliveryRadio) {
//       const mode = deliveryRadio.dataset.mode;
//       const val = parseFloat(deliveryRadio.dataset.value || "0") || 0;
//
//       if (mode === "percent") {
//         subtotal = subtotal * (1 + val);
//       } else if (mode === "absolute") {
//         subtotal = subtotal + val;
//       }
//     }
//
//     const VAT_RATE = 0.2;
//     const taxEl = document.getElementById("bb_tax");
//     const taxAmount = subtotal * VAT_RATE;
//     if (taxEl) {
//       taxEl.textContent = `Estimated £${taxAmount.toFixed(2)}`;
//     }
//
//     const total = subtotal;
//     const packQtySafe = packQty || 1;
//     const unitPrice = total / packQtySafe;
//
//     unitEl.textContent  = `£${unitPrice.toFixed(2)}`;
//     totalEl.textContent = `£${total.toFixed(2)}`;
//   }
//
//   setupBackPublishButtons() {
//     const backBtn = document.getElementById("btn_back_edit");
//     const publishBtn = document.getElementById("btn_publish");
//
//     if (backBtn) {
//       backBtn.addEventListener("click", () => {
//         const url = "../../view/product_details/index.php";
//
//         const current = new URL(window.location.href);
//         const dest = new URL(url, current);
//
//         const sku = current.searchParams.get("sku");
//         const skuv = current.searchParams.get("sku_variation");
//
//         if (sku) dest.searchParams.set("sku", sku);
//         if (skuv) dest.searchParams.set("sku_variation", skuv);
//
//         window.location.assign(dest);
//       });
//     }
//
//     if (publishBtn) {
//       publishBtn.addEventListener("click", () => {
//         alert(
//           "Your configuration will now be reviewed and then approved. " +
//           "This page is currently under construction."
//         );
//       });
//     }
//   }
// }
//
// /* ✅ Boot */
// function bootPreviewPage() {
//   const page = new PreviewPage();
//   window.previewGallery = page;
// }
//
// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", bootPreviewPage);
// } else {
//   bootPreviewPage();
// }
