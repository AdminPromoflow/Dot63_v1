// Variations page controller (no globals, no "create new group" logic).
// The <select id="group"> is treated as "Type variation" select (type_id).
class Variations {
  constructor() {
    // --- Cache DOM references (single source of truth) ---
    this.form         = document.getElementById('variationForm');

    this.variationsNoRadio  = document.getElementById('variations_no');
    this.variationsYesRadio = document.getElementById('variations_yes');
    this.noVariationsTip    = document.getElementById('no_variations_tip');

    this.parentSelect = document.getElementById('parent_variations');
    this.nameInput    = document.getElementById('variation_name');

    this.imgInput     = document.getElementById('variation_image');
    this.imgPreview   = document.getElementById('img_preview');
    this.clearImgBtn  = document.getElementById('clear_image');

    this.pdfInput     = document.getElementById('variation_pdf');
    this.pdfPreview   = document.getElementById('pdf_preview');
    this.clearPdfBtn  = document.getElementById('clear_pdf');

    this.menuBtn      = document.getElementById('menu_btn');
    this.menuList     = document.getElementById('menu_list');

    this.addBtn       = document.getElementById('add_variation');
    this.saveBtn      = document.getElementById('save_variation');
    this.nextBtn      = document.getElementById('next_variations');
    this.resetBtn     = document.getElementById('reset_form');

    // IMPORTANT: This select now renders "type_variations" (type_id/type_name).
    // Keep the HTML id as "group" if you want, but conceptually this is "type".
    this.typeSelect   = document.getElementById('group');

    // Optional input used by your PHP for naming the PDF artwork
    this.namePdfInput = document.getElementById('name_pdf_artwork');

    // --- State flags sent to backend ---
    // They indicate whether the user attached NEW files in this session.
    this.attachImage = false;
    this.attachPDF   = false;

    // Used to revoke ObjectURL (avoid memory leaks)
    this.currentImageObjectUrl = null;

    // --- Boot ---
    this.init();
  }

  /* =========================
     Init + bindings
     ========================= */

  init() {
    // Tell the wizard header where we are
    document.addEventListener('DOMContentLoaded', () => {
      if (window.headerAddProduct?.setCurrentHeader) {
        window.headerAddProduct.setCurrentHeader('variations');
      }
    });

    // Initialize the "Type" select with ONLY a placeholder (no create-group option)
    if (this.typeSelect) {
      this.typeSelect.innerHTML = `<option value="" disabled selected>Select a variation type</option>`;
      this.typeSelect.value = '';
    }

    // Bind UI events (kept minimal and focused)
    this.bindDecisionUi();
    this.bindFileInputs();
    this.bindMenu();
    this.bindButtons();

    // Initial load from backend
    this.getVariationDetails();
  }

  bindDecisionUi() {
    const noChoice = this.variationsNoRadio?.closest('.cp-choice');
    const yesChoice = this.variationsYesRadio?.closest('.cp-choice');

    const updateUi = () => {
      const isNo = !!this.variationsNoRadio?.checked;

      if (this.noVariationsTip) {
        this.noVariationsTip.hidden = !isNo;
      }

      if (noChoice) noChoice.classList.toggle('is-selected', isNo);
      if (yesChoice) yesChoice.classList.toggle('is-selected', !isNo);

      if (this.form) {
        this.form.classList.toggle('is-hidden', isNo);
      }
    };

    if (this.variationsNoRadio) this.variationsNoRadio.addEventListener('change', updateUi);
    if (this.variationsYesRadio) this.variationsYesRadio.addEventListener('change', updateUi);

    updateUi();
  }

  bindButtons() {
    // Reset (pending)
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        alert('(pending implementation).');
      });
    }

    // Save & Next
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        // Basic validation: name required
        const name = (this.nameInput?.value || '').trim();
        if (!name) {
          alert('Please add a name to the variation.');
          return;
        }
        this.saveVariationDetails(true);
      });
    }

    // Save (no next)
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => {
        const name = (this.nameInput?.value || '').trim();
        if (!name) {
          alert('Please add a name to the variation.');
          return;
        }
        this.saveVariationDetails(false);
        alert('The variation details have been saved successfully.');

      });
    }

    // Create new variation
    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => this.addNewVariation());
    }
  }

  bindMenu() {
    if (!this.menuBtn || !this.menuList) return;

    // Toggle menu open/close
    this.menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = this.menuList.hidden === true;
      this.menuList.hidden = !willOpen;
      this.menuBtn.setAttribute('aria-expanded', String(willOpen));
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (!this.menuBtn.contains(e.target) && !this.menuList.contains(e.target)) {
        this.menuList.hidden = true;
        this.menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close menu on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.menuList.hidden) {
        this.menuList.hidden = true;
        this.menuBtn.setAttribute('aria-expanded', 'false');
        this.menuBtn.focus();
      }
    });

    // Navigate when clicking an item
    this.menuList.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li || !this.menuList.contains(li)) return;

      // Update selection UI
      this.menuList.querySelectorAll('.is-selected').forEach(x => x.classList.remove('is-selected'));
      li.classList.add('is-selected');

      // SKU variation should always be stored in data-sku
      const skuVariation = String(li.dataset?.sku || '').trim();
      if (!skuVariation) return;

      // Close menu
      this.menuList.hidden = true;
      this.menuBtn.setAttribute('aria-expanded', 'false');

      // Keep sku product from URL and replace sku_variation
      const { skuProduct } = this.readSkuParamsFromUrl();
      window.location.href =
        `../../view/variations/index.php?sku=${encodeURIComponent(skuProduct)}&sku_variation=${encodeURIComponent(skuVariation)}`;
    });
  }

  bindFileInputs() {
    // ---- Image preview + attach flag ----
    if (this.imgInput && this.imgPreview) {
      this.imgInput.addEventListener('change', () => {
        const file = this.imgInput.files?.[0];
        this.imgPreview.innerHTML = '';

        // If user cleared the selection, treat as "not attaching a new file"
        if (!file) {
          this.attachImage = false;
          return;
        }

        // Validate type
        if (!file.type.startsWith('image/')) {
          alert('The selected image file is not valid.');
          this.imgInput.value = '';
          this.attachImage = false;
          return;
        }

        // Mark that user is attaching a NEW image
        this.attachImage = true;

        // Revoke old ObjectURL (avoid memory leaks)
        if (this.currentImageObjectUrl) {
          URL.revokeObjectURL(this.currentImageObjectUrl);
          this.currentImageObjectUrl = null;
        }

        // Create preview
        const url = URL.createObjectURL(file);
        this.currentImageObjectUrl = url;

        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Selected variation image preview (icon)';
        img.loading = 'lazy';
        img.decoding = 'async';
        this.imgPreview.appendChild(img);
      });
    }

    // Clear image
    if (this.clearImgBtn && this.imgInput && this.imgPreview) {
      this.clearImgBtn.addEventListener('click', () => {
        this.imgInput.value = '';
        this.imgPreview.innerHTML = '';
        this.attachImage = false;

        if (this.currentImageObjectUrl) {
          URL.revokeObjectURL(this.currentImageObjectUrl);
          this.currentImageObjectUrl = null;
        }
      });
    }

    // ---- PDF preview + attach flag ----
    if (this.pdfInput && this.pdfPreview) {
      this.pdfInput.addEventListener('change', () => {
        const file = this.pdfInput.files?.[0];
        this.pdfPreview.innerHTML = '';

        // If user cleared the selection, treat as "not attaching a new file"
        if (!file) {
          this.attachPDF = false;
          return;
        }

        // Validate type - more permissive for PDF MIME types
        const isPdf = file.type === 'application/pdf'
                   || file.type === 'application/x-pdf'
                   || file.type === 'application/acrobat'
                   || file.type === 'application/x-bzpdf'
                   || file.name.toLowerCase().endsWith('.pdf');

        if (!isPdf) {
          alert('Please select a valid PDF file.');
          this.pdfInput.value = '';
          this.attachPDF = false;
          return;
        }

        // Mark that user is attaching a NEW PDF
        this.attachPDF = true;

        // Simple "pill" preview
        const pill = document.createElement('div');
        pill.className = 'cp-file-pill';

        const name = document.createElement('span');
        name.textContent = file.name;

        const size = document.createElement('small');
        size.textContent = `(${Math.round(file.size / 1024)} KB)`;

        pill.appendChild(name);
        pill.appendChild(size);
        this.pdfPreview.appendChild(pill);
      });
    }

    // Clear PDF
    if (this.clearPdfBtn && this.pdfInput && this.pdfPreview) {
      this.clearPdfBtn.addEventListener('click', () => {
        this.pdfInput.value = '';
        this.pdfPreview.innerHTML = '';
        this.attachPDF = false;
      });
    }
  }

  /* =========================
     Data loading
     ========================= */

  getVariationDetails() {
    // Read current context from URL
    const { skuProduct, skuVariation } = this.readSkuParamsFromUrl();

    // Prepare backend request
    const url = "../../controller/products/variations.php";
    const payload = {
      action: "get_variation_details",
      sku: skuProduct,
      sku_variation: skuVariation
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(r => {
        if (!r.ok) throw new Error("Network error.");
        return r.text(); // backend returns text; we parse JSON manually
      })
      .then(text => {
      //  alert(text);
        const json = this.safeJsonParse(text);
        if (!json?.success) return;

        // Render page sections (each method does one job)
        this.renderTopMenu(json.variations, skuVariation);
        this.renderCurrentNameAndDefaultRules(json.current);
        this.renderParentSelect(json.variations, json.current, json.parent, json.product);
        this.renderTypeVariationsSelect(json.type_variations, json.current?.type_id);
        this.renderServerPreviews(json.current);

        // IMPORTANT: On initial load, user has not attached new files yet
        this.attachImage = false;
        this.attachPDF   = false;
      })
      .catch(err => console.error("Error:", err));
  }

  /* =========================
     Rendering
     ========================= */

  renderTopMenu(variationsRaw, skuVariation) {
    if (!this.menuList) return;

    // Clear menu list
    this.menuList.innerHTML = '';

    // Normalize array input
    const variations = Array.isArray(variationsRaw) ? variationsRaw : [];

    // Use a fragment to reduce reflows (faster)
    const frag = document.createDocumentFragment();

    for (let i = 0; i < variations.length; i++) {
      const name = String(variations[i]?.name ?? '(unnamed)');
      const sku  = String(variations[i]?.SKU ?? variations[i]?.sku ?? '');

      const li = document.createElement('li');
      li.dataset.sku = sku;
      li.style.padding = '8px 10px';
      li.style.borderRadius = '10px';
      li.style.cursor = 'default';
      li.innerHTML = `<strong>${name}</strong>${sku ? ` <small style="color:var(--muted)">— ${sku}</small>` : ''}`;

      frag.appendChild(li);
    }

    this.menuList.appendChild(frag);

    // Highlight current SKU variation
    const wanted = String(skuVariation || '').trim().toUpperCase();
    this.menuList.querySelectorAll('li').forEach(li => {
      const candidate = String(li.dataset.sku || '').trim().toUpperCase();
      if (candidate && candidate === wanted) li.classList.add('is-selected');
    });

    // Keep menu closed by default
    this.menuList.hidden = true;
    if (this.menuBtn) this.menuBtn.setAttribute('aria-expanded', 'false');
  }

  renderCurrentNameAndDefaultRules(current) {
    const currentName = String(current?.name ?? '');

    // Set name input
    if (this.nameInput) this.nameInput.value = currentName;

    // Apply "Default" restrictions
    if (currentName === 'Default') {
      if (this.form) this.form.style.display = 'none';
    } else {
      if (this.form) this.form.style.display = 'block';
    }
  }

  renderParentSelect(variationsRaw, current, parent, product) {
    if (!this.parentSelect) return;

    const variations = Array.isArray(variationsRaw) ? variationsRaw : [];
    const currentSku = String(current?.sku ?? current?.SKU ?? '').trim();

    // Reset select with placeholder
    this.parentSelect.innerHTML = '<option value="" disabled selected>Select a parent</option>';

    const frag = document.createDocumentFragment();

    // Add all variations except the current one
    for (let i = 0; i < variations.length; i++) {
      const sku = String(variations[i]?.SKU ?? variations[i]?.sku ?? '').trim();
      if (!sku || sku === currentSku) continue;

      const name = String(variations[i]?.name ?? '(unnamed variation)');

      const opt = document.createElement('option');
      opt.value = sku;
      opt.dataset.sku = sku;
      opt.textContent = `${name} — ${sku}`;
      frag.appendChild(opt);
    }

    this.parentSelect.appendChild(frag);

    // Try to select parent if provided; otherwise keep placeholder
    const targetParent =
      String(parent?.sku ?? parent?.SKU ?? '') ||
      String(product?.product_sku ?? '');

    const wanted = String(targetParent).trim().toUpperCase();
    if (!wanted) return;

    for (const opt of this.parentSelect.options) {
      const byValue = String(opt.value || '').trim().toUpperCase();
      const byData  = String(opt.getAttribute('data-sku') || '').trim().toUpperCase();
      if ((byValue && byValue === wanted) || (byData && byData === wanted)) {
        opt.selected = true;
        this.parentSelect.value = opt.value;
        break;
      }
    }
  }

  renderTypeVariationsSelect(typeVariationsRaw, type_id_selected) {
    if (!this.typeSelect) return;
    if (!Array.isArray(typeVariationsRaw)) return;

    // Reset select (placeholder only)
    this.typeSelect.innerHTML = '<option value="" disabled selected>Select type variation</option>';

    // Append options
    for (let i = 0; i < typeVariationsRaw.length; i++) {
      const typeId   = String(typeVariationsRaw[i]?.type_id ?? '').trim();
      const typeName = String(typeVariationsRaw[i]?.type_name ?? '').trim();
      if (!typeId || !typeName) continue;

      const opt = document.createElement('option');
      opt.value = typeId;         // IMPORTANT: sent to backend as type_id
      opt.id    = `type_${typeId}`; // DOM id requested (safe prefix)
      opt.textContent = typeName;

      this.typeSelect.appendChild(opt);
    }

    // Apply selection rules
    const selected = (type_id_selected === null || type_id_selected === undefined)
      ? ''
      : String(type_id_selected).trim();

    this.typeSelect.value = selected || '';

    // If selected doesn't exist => fallback to empty (placeholder)
    if (selected && this.typeSelect.value !== selected) {
      this.typeSelect.value = '';
    }
  }
  renderServerPreviews(current) {
    const toAssetUrl = (p) => {
      const raw = String(p ?? '').trim();
      if (!raw) return '';
      if (raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

      const rel = raw.replace(/^\/+/, '');
      // If backend already returns a controller-relative path, just go up to project root.
      if (rel.startsWith('controller/')) {
        return '../../' + rel;
      }
      // Our uploads currently live under /controller/..., so serve them via that base.
      return '../../controller/' + rel;
    };

    // Server image preview
    if (this.imgPreview) {
      const serverImage = String(current?.image ?? '').trim();

      const src = serverImage
        ? (toAssetUrl(serverImage) || '../../view/variations/images/add_image.png')
        : '../../view/variations/images/add_image.png';

      this.imgPreview.innerHTML =
        `<img alt="Selected variation image preview (icon)" loading="lazy" decoding="async" src="${src}">`;
    }

    // Server PDF preview + optional pdf name input
    if (this.namePdfInput) {
      this.namePdfInput.value = String(current?.name_pdf_artwork ?? '');
    }

    if (this.pdfPreview) {
      const serverPdf = String(current?.pdf_artwork ?? '').trim();
      if (!serverPdf) {
        this.pdfPreview.innerHTML = '';
      } else {
        // Usar name_pdf_artwork si existe, sino extraer del path o usar "artwork.pdf"
        const pdfName = String(current?.name_pdf_artwork ?? '').trim();
        const displayName = pdfName || serverPdf.split('/').pop() || 'artwork.pdf';
        const downloadName = displayName.endsWith('.pdf') ? displayName : displayName + '.pdf';

        const href = toAssetUrl(serverPdf);

        const pill = document.createElement('div');
        pill.className = 'cp-file-pill';

        pill.innerHTML = `
          <a href="${href}" target="_blank" class="cp-file-pill-main" style="color: var(--primary); text-decoration: none;">
            ${displayName}
          </a>
          <a href="${href}" download="${downloadName}" style="margin-left: 8px; font-size: 0.85em; color: var(--muted);">
            ↓ Download
          </a>
        `;
        this.pdfPreview.innerHTML = '';
        this.pdfPreview.appendChild(pill);
      }
    }
  }

  /* =========================
     Save + create variation
     ========================= */

     saveVariationDetails(goNext = true) {
       // Read URL context
       const { skuProduct, skuVariation } = this.readSkuParamsFromUrl();

       // Read selected parent sku (if any)
       let skuParentVariation = '';
       if (this.parentSelect?.selectedOptions?.[0]) {
         const opt = this.parentSelect.selectedOptions[0];
         skuParentVariation = String(opt.dataset?.sku || opt.value || '').trim();
       }

       // Read selected type_id
       const typeId = String(this.typeSelect?.value || '').trim();

       // Read files DIRECTLY from inputs (source of truth)
       const imageFile = this.imgInput?.files?.[0] || null;
       const pdfFile   = this.pdfInput?.files?.[0] || null;

       // Validate only if present
       if (imageFile && !imageFile.type.startsWith('image/')) {
         alert('The selected image file is not valid.');
         return;
       }

       // More permissive PDF validation
       if (pdfFile) {
         const isPdf = pdfFile.type === 'application/pdf'
                    || pdfFile.type === 'application/x-pdf'
                    || pdfFile.type === 'application/acrobat'
                    || pdfFile.type === 'application/x-bzpdf'
                    || pdfFile.name.toLowerCase().endsWith('.pdf');
         if (!isPdf) {
           alert('Please select a valid PDF file.');
           return;
         }
       }

       // Build FormData
       const fd = new FormData();
       fd.append('action',        'save_variation_details');
       fd.append('sku_product',   skuProduct);
       fd.append('sku_variation', skuVariation);

       // CRITICAL: Determine attach flags based on ACTUAL file presence at save time
       // This ensures flag is always in sync with actual file
       const hasImageFile = imageFile !== null;
       const hasPdfFile = pdfFile !== null;

       fd.append('isAttachAnImage', hasImageFile ? '1' : '0');
       fd.append('isAttachAPDF',    hasPdfFile ? '1' : '0');

       // Core fields
       fd.append('name', (this.nameInput?.value || '').trim());
       fd.append('name_pdf_artwork', (this.namePdfInput?.value || '').trim());

       // IMPORTANT: Save type_id (or empty string => backend converts to NULL)
       fd.append('type_id', typeId);

       // Parent sku (optional)
       if (skuParentVariation) fd.append('sku_parent_variation', skuParentVariation);

       // Files (only if actually present)
       if (hasImageFile) fd.append('imageFile', imageFile);
       if (hasPdfFile) fd.append('pdfFile', pdfFile);

       // Send request
       fetch("../../controller/products/variations.php", {
         method: "POST",
         headers: { "X-Requested-With": "XMLHttpRequest" },
         body: fd
       })
         .then(r => {
           if (!r.ok) throw new Error("Network error.");
           return r.json();
         })
         .then(data => {
           if (!data?.success) {
             console.error("Save failed:", data);
             alert(data?.message || "Could not save the variation.");
             return;
           }

           // Go next step in wizard
           if (goNext && window.headerAddProduct?.goNext) {
             window.headerAddProduct.goNext('../../view/images/index.php');
           }
         })
         .catch(err => {
           console.error("Error:", err);
           alert("Network/server error while saving.");
         });
     }

  addNewVariation() {
    // Create a new variation and redirect to it
    const { skuProduct } = this.readSkuParamsFromUrl();
    if (!skuProduct) return;

    fetch("../../controller/products/variations.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_new_variation", sku: skuProduct })
    })
      .then(r => {
        if (!r.ok) throw new Error("Network error.");
        return r.text();
      })
      .then(text => {
        const json = this.safeJsonParse(text);
        if (!json?.success) return;

        const skuVariation = String(json.sku_variation || '').trim();
        if (!skuVariation) return;

        alert("The new variation has been successfully created. Please fill in the details and save once you’ve finished.");
        window.location.href =
          `../../view/variations/index.php?sku=${encodeURIComponent(skuProduct)}&sku_variation=${encodeURIComponent(skuVariation)}`;
      })
      .catch(err => console.error("Error:", err));
  }

  /* =========================
     Tiny helpers
     ========================= */

  readSkuParamsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return {
      skuProduct: params.get('sku') || '',
      skuVariation: params.get('sku_variation') || ''
    };
  }

  safeJsonParse(text) {
    try { return JSON.parse(text); }
    catch (e) { console.error("Invalid JSON:", e); return null; }
  }
}

// Instantiate once (only code outside the class)
new Variations();
