class Variations {
  constructor() {
    // --- Cache all DOM references inside the class (no globals) ---
    this.form          = document.getElementById('variationForm');

    this.parentSelect  = document.getElementById('parent_variations');
    this.parentChips   = document.getElementById('parent_chips'); // not used yet, kept for future UI
    this.nameInput     = document.getElementById('variation_name');

    this.imgInput      = document.getElementById('variation_image');
    this.imgPreview    = document.getElementById('img_preview');
    this.clearImageBtn = document.getElementById('clear_image');

    this.pdfInput      = document.getElementById('variation_pdf');
    this.pdfPreview    = document.getElementById('pdf_preview');
    this.clearPdfBtn   = document.getElementById('clear_pdf');

    this.addBtn        = document.getElementById('add_variation');
    this.menuBtn       = document.getElementById('menu_btn');
    this.menuList      = document.getElementById('menu_list');
    this.nextBtn       = document.getElementById('next_variations');

    // NOTE: In your current flow this <select id="group"> is being used to render "type_variations".
    // Later you can split it into a dedicated <select id="type_variations"> if you want.
    this.groupSelect   = document.getElementById('group');

    // Modal "Create group"
    this.groupModal     = document.getElementById('group_modal');
    this.groupNameInput = document.getElementById('group_name_input');
    this.groupCancelBtn = document.getElementById('group_cancel_btn');
    this.groupCreateBtn = document.getElementById('group_create_btn');

    // --- State flags sent to the backend ---
    // They indicate whether the user is attaching a NEW file in this session.
    this.attachImage = false;
    this.attachPDF   = false;

    // Used to restore the previous select value when user picks "__create_group__"
    this.lastGroupValue = this.groupSelect ? (this.groupSelect.value || '') : '';

    // If we create an ObjectURL for image preview, we should revoke it to avoid memory leaks.
    this.currentImageObjectUrl = null;

    // --- Init everything ---
    this.init();
  }

  // Small helper kept inside the class (used for fallback parsing only)
  static extractSkuFromText(txt) {
    if (!txt) return null;
    const m =
      txt.match(/sku[:\s-]*([A-Z0-9._-]+)/i) ||
      txt.match(/\[([A-Z0-9._-]+)\]/i);
    return m ? m[1] : null;
  }

  init() {
    // 1) Tell the global header wizard that we are on "variations"
    document.addEventListener('DOMContentLoaded', () => {
      if (window.headerAddProduct && typeof window.headerAddProduct.setCurrentHeader === 'function') {
        window.headerAddProduct.setCurrentHeader('variations');
      }
    });

    // 2) Initialize the "group" select with a placeholder + create option
    //    (We keep "__create_group__" so the modal can be opened from the select)
    if (this.groupSelect) {
      this.groupSelect.innerHTML = `
        <option value="" disabled selected>Select a group</option>
        <option value="__create_group__">+ Create new group…</option>
      `;
      this.groupSelect.value = ''; // keep "no selection" for now
    }

    // 3) Bind image upload preview + clear
    if (this.imgInput && this.imgPreview) {
      this.imgInput.addEventListener('change', () => {
        // User selected a new file: mark as "attach image"
        this.attachImage = true;

        // Reset preview UI
        this.imgPreview.innerHTML = '';

        const file = this.imgInput.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('The selected image file is not valid.');
          this.imgInput.value = '';
          this.attachImage = false;
          return;
        }

        // Revoke previous ObjectURL if it exists (avoid memory leak)
        if (this.currentImageObjectUrl) {
          URL.revokeObjectURL(this.currentImageObjectUrl);
          this.currentImageObjectUrl = null;
        }

        // Create a temporary local URL for preview
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

    if (this.clearImageBtn && this.imgInput && this.imgPreview) {
      this.clearImageBtn.addEventListener('click', () => {
        // Clear the input and preview
        this.imgInput.value = '';
        this.imgPreview.innerHTML = '';

        // Reset attach flag (means: "I am not attaching a NEW image now")
        this.attachImage = false;

        // Revoke ObjectURL if we created one
        if (this.currentImageObjectUrl) {
          URL.revokeObjectURL(this.currentImageObjectUrl);
          this.currentImageObjectUrl = null;
        }
      });
    }

    // 4) Bind PDF upload preview + clear
    if (this.pdfInput && this.pdfPreview) {
      this.pdfInput.addEventListener('change', () => {
        this.attachPDF = true;
        this.pdfPreview.innerHTML = '';

        const file = this.pdfInput.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
          alert('Please select a valid PDF file.');
          this.pdfInput.value = '';
          this.attachPDF = false;
          return;
        }

        // Simple "pill" preview with name + size
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

    if (this.clearPdfBtn && this.pdfInput && this.pdfPreview) {
      this.clearPdfBtn.addEventListener('click', () => {
        this.pdfInput.value = '';
        this.pdfPreview.innerHTML = '';
        this.attachPDF = false;
      });
    }

    // 5) Bind Save & Next
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        // Basic validation: name is required
        const name = (this.nameInput?.value || '').trim();
        if (!name) {
          alert('Please add a name to the variation.');
          return;
        }
        this.saveVariationDetails();
      });
    }

    // 6) Bind "+ New variation"
    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => {
        this.addNewVariation();
      });
    }

    // 7) Bind top menu toggle + close on outside click + close on ESC
    if (this.menuBtn && this.menuList) {
      this.menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        const willOpen = this.menuList.hidden === true;
        this.menuList.hidden = !willOpen;
        this.menuBtn.setAttribute('aria-expanded', String(willOpen));
      });

      document.addEventListener('click', (e) => {
        if (!this.menuBtn.contains(e.target) && !this.menuList.contains(e.target)) {
          if (!this.menuList.hidden) {
            this.menuList.hidden = true;
            this.menuBtn.setAttribute('aria-expanded', 'false');
          }
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.menuList.hidden) {
          this.menuList.hidden = true;
          this.menuBtn.setAttribute('aria-expanded', 'false');
          this.menuBtn.focus();
        }
      });
    }

    // 8) Bind menu click (navigate to selected sku_variation)
    if (this.menuList) {
      this.menuList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li || !this.menuList.contains(li)) return;

        // Clear previous selection UI
        this.menuList.querySelectorAll('.is-selected').forEach(el => el.classList.remove('is-selected'));
        li.classList.add('is-selected');

        // Prefer dataset.sku (we set it when rendering the menu)
        // Fallback to parsing the text if dataset is missing
        const skuVariation =
          (li.dataset?.sku && li.dataset.sku.trim()) ||
          Variations.extractSkuFromText(li.textContent || '');

        if (!skuVariation) return;

        // Close menu UI
        this.menuList.hidden = true;
        if (this.menuBtn) this.menuBtn.setAttribute('aria-expanded', 'false');

        // Keep sku_product from URL, replace sku_variation
        const skuProduct = new URLSearchParams(window.location.search).get('sku') || '';

        window.location.href =
          `../../view/variations/index.php?sku=${encodeURIComponent(skuProduct)}&sku_variation=${encodeURIComponent(skuVariation)}`;
      });
    }

    // 9) Bind "Create group" modal logic from the select
    if (this.groupSelect) {
      this.groupSelect.addEventListener('focus', () => {
        // Save current value so we can restore it if user picks "__create_group__"
        this.lastGroupValue = this.groupSelect.value || '';
      });

      this.groupSelect.addEventListener('change', (e) => {
        if (e.target.value === '__create_group__') {
          // Open modal
          if (this.groupModal) this.groupModal.hidden = false;
          if (this.groupNameInput) {
            this.groupNameInput.value = '';
            this.groupNameInput.focus();
          }

          // Restore previous value (do not keep "__create_group__" selected)
          this.groupSelect.value = this.lastGroupValue || '';
        }
      });
    }

    // 10) Bind modal buttons + overlay click + ESC close
    if (this.groupCancelBtn) {
      this.groupCancelBtn.addEventListener('click', () => {
        if (this.groupModal) this.groupModal.hidden = true;
      });
    }

    if (this.groupCreateBtn) {
      this.groupCreateBtn.addEventListener('click', () => {
      //  this.createGroup();
      });
    }

    if (this.groupModal) {
      this.groupModal.addEventListener('click', (e) => {
        // Close modal when clicking the dark overlay (not the dialog)
        if (e.target === this.groupModal) {
          this.groupModal.hidden = true;
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.groupModal && !this.groupModal.hidden) {
        this.groupModal.hidden = true;
      }
    });

    // 11) Load initial data from backend and render the page
    this.getVariationDetails();
  }

  // Split version of getVariationDetails() to keep it readable and maintainable.
  // All helpers are now class methods (no inner functions).
  // Each method does ONE thing: fetch, parse, render section, etc.

  getVariationDetails() {
    // 1) Read URL context
    const { skuProduct, skuVariation } = this.readSkuParamsFromUrl();

    // 2) Build request
    const url = "../../controller/products/variations.php";
    const payload = {
      action: "get_variation_details",
      sku: skuProduct,
      sku_variation: skuVariation
    };

    // 3) Fetch + parse JSON
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
        const json = this.safeJsonParse(text);
        if (!json?.success) return;

        // 4) Render each UI block with small focused functions
        this.renderTopMenu(json.variations, skuVariation);
        this.renderCurrentNameAndDefaultRules(json.current);
        this.renderParentSelect(json.variations, json.current, json.parent, json.product);
        this.renderTypeVariationsSelect(json.type_variations);
        this.renderServerPreviews(json.current);

        // 5) Reset attach flags after initial load
        this.attachImage = false;
        this.attachPDF   = false;
      })
      .catch(err => {
        console.error("Error:", err);
      });
  }

  /* =========================
     Helpers (small + reusable)
     ========================= */

  readSkuParamsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return {
      skuProduct: params.get('sku') || '',
      skuVariation: params.get('sku_variation') || ''
    };
  }

  isArray(v) {
    return Array.isArray(v);
  }

  safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Invalid JSON:", e);
      return null;
    }
  }

  /* =========================
     Render blocks (UI sections)
     ========================= */

  renderTopMenu(variationsRaw, skuVariation) {
    if (!this.menuList) return;

    // Clear menu list
    this.menuList.innerHTML = '';

    const variations = this.isArray(variationsRaw) ? variationsRaw : [];

    // Build <li> items
    for (let i = 0; i < variations.length; i++) {
      const name = String(variations[i]?.name ?? '(unnamed)');
      const sku  = String(variations[i]?.SKU ?? variations[i]?.sku ?? '');

      const li = document.createElement('li');
      li.dataset.sku = sku;
      li.style.padding = '8px 10px';
      li.style.borderRadius = '10px';
      li.style.cursor = 'default';
      li.innerHTML = `<strong>${name}</strong>${sku ? ` <small style="color:var(--muted)">— ${sku}</small>` : ''}`;

      this.menuList.appendChild(li);
    }

    // Highlight current SKU variation
    const wanted = String(skuVariation || '').trim().toUpperCase();
    this.menuList.querySelectorAll('li').forEach(li => {
      const candidate = String(li.dataset.sku || '').trim().toUpperCase();
      if (candidate && candidate === wanted) li.classList.add('is-selected');
    });

    // Close menu by default
    this.menuList.hidden = true;
    if (this.menuBtn) this.menuBtn.setAttribute('aria-expanded', 'false');
  }

  renderCurrentNameAndDefaultRules(current) {
    const currentName = String(current?.name ?? '');

    // Set name input
    if (this.nameInput) this.nameInput.value = currentName;

    // Apply "Default" restrictions
    if (currentName === 'Default') {
      alert(
        "1) If you won't add any variations, keep 'Default variation' selected. (Editing options for 'Default' are disabled.)\n" +
        "2) Click 'Save & Next'.\n" +
        "3) Add images, items, and prices.\n\n" +
        "— OR —\n" +
        "If you will use variations: click 'Add' and create your first-level variations with 'Parent variation' set to 'Default'."
      );

      if (this.parentSelect) this.parentSelect.disabled = true;
      if (this.nameInput)    this.nameInput.disabled   = true;
      if (this.imgInput)     this.imgInput.disabled    = true;
      if (this.pdfInput)     this.pdfInput.disabled    = true;
    }
  }

  renderParentSelect(variationsRaw, current, parent, product) {
    if (!this.parentSelect) return;

    const variations = this.isArray(variationsRaw) ? variationsRaw : [];

    // Current variation SKU (exclude it from parents)
    const currentSku = String(current?.sku ?? current?.SKU ?? '').trim();

    // Reset select with placeholder
    this.parentSelect.innerHTML = '<option value="" disabled selected>Select a parent</option>';

    // Append options
    for (let i = 0; i < variations.length; i++) {
      const sku = String(variations[i]?.SKU ?? variations[i]?.sku ?? '').trim();
      if (!sku || sku === currentSku) continue;

      const name = String(variations[i]?.name ?? '(unnamed variation)');

      const opt = document.createElement('option');
      opt.value = sku;
      opt.dataset.sku = sku;
      opt.textContent = `${name} — ${sku}`;
      this.parentSelect.appendChild(opt);
    }

    // Auto-select parent if backend provides it (otherwise stays on placeholder)
    this.trySelectParent(parent, product);
  }

  trySelectParent(parent, product) {
    if (!this.parentSelect) return;

    const targetParent =
      String(parent?.sku ?? parent?.SKU ?? '') ||
      String(product?.product_sku ?? '');

    const wanted = String(targetParent).trim().toUpperCase();
    if (!wanted) return;

    let matched = false;

    for (const opt of this.parentSelect.options) {
      const byValue = String(opt.value || '').trim().toUpperCase();
      const byData  = String(opt.getAttribute('data-sku') || '').trim().toUpperCase();

      if ((byValue && byValue === wanted) || (byData && byData === wanted)) {
        opt.selected = true;
        this.parentSelect.value = opt.value;
        matched = true;
        break;
      }
    }

    if (!matched) this.parentSelect.selectedIndex = 0;
  }

  renderTypeVariationsSelect(typeVariationsRaw) {
    if (!this.groupSelect) return;
    if (!this.isArray(typeVariationsRaw)) return;

    // We insert "type options" before the create-group option
    const createOpt = this.groupSelect.querySelector('option[value="__create_group__"]');
    if (!createOpt) return;

    // Remove old type options
    this.groupSelect
      .querySelectorAll('option[data-source="type_list"]')
      .forEach(opt => opt.remove());

    // Insert new type options
    for (let i = 0; i < typeVariationsRaw.length; i++) {
      const id   = String(typeVariationsRaw[i]?.type_id ?? '').trim();
      const name = String(typeVariationsRaw[i]?.type_name ?? '').trim();
      if (!id || !name) continue;

      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = name;
      opt.dataset.source = 'type_list';
      this.groupSelect.insertBefore(opt, createOpt);
    }

    // For now: do not select anything
    this.groupSelect.value = '';
  }

  renderServerPreviews(current) {
    this.renderServerImagePreview(current?.image);
    this.renderServerPdfPreview(current?.pdf_artwork, current?.name_pdf_artwork);
  }

  renderServerImagePreview(imagePath) {
    if (!this.imgPreview) return;

    const serverImage = String(imagePath ?? '').trim();

    if (serverImage) {
      const href =
        serverImage.startsWith('http') ||
        serverImage.startsWith('data:') ||
        serverImage.startsWith('blob:')
          ? serverImage
          : '../../' + serverImage.replace(/^\/+/, '');

      this.imgPreview.innerHTML =
        `<img alt="Selected variation image preview (icon)" loading="lazy" decoding="async" src="${href}">`;
      return;
    }

    // Placeholder if empty
    this.imgPreview.innerHTML =
      `<img alt="Selected variation image preview (icon)" loading="lazy" decoding="async" src="../../view/variations/images/add_image.png">`;
  }

  renderServerPdfPreview(pdfPath, pdfName) {
    if (!this.pdfPreview) return;

    const serverPdf = String(pdfPath ?? '').trim();
    const nameLabel = String(pdfName ?? '');

    // Fill the name input if it exists
    const namePdfInput = document.getElementById('name_pdf_artwork');
    if (namePdfInput) namePdfInput.value = nameLabel;

    if (!serverPdf) {
      this.pdfPreview.innerHTML = '';
      return;
    }

    const href = serverPdf.startsWith('/') ? serverPdf : '/' + serverPdf.replace(/^\/+/, '');
    this.pdfPreview.innerHTML = `<a href="../..${href}" download="artwork.pdf">artwork.pdf</a>`;
  }

  saveVariationDetails() {
    // Read current context from URL
    const params = new URLSearchParams(window.location.search);
    const skuProduct   = params.get('sku') || '';
    const skuVariation = params.get('sku_variation') || '';

    // Read the parent sku from the select (if selected)
    let skuParentVariation = '';
    if (this.parentSelect && this.parentSelect.tagName === 'SELECT') {
      const opt = this.parentSelect.selectedOptions?.[0];
      if (opt) {
        skuParentVariation =
          (opt.dataset?.sku && opt.dataset.sku.trim()) ||
          (opt.value && !/\s|\|/.test(opt.value) ? opt.value.trim() : '') ||
          (Variations.extractSkuFromText(opt.textContent || '') || '');
      }
    }

    // Files (if user selected any)
    const imageFile = this.imgInput?.files?.[0] || null;
    const pdfFile   = this.pdfInput?.files?.[0] || null;

    // Validate files only if they exist
    if (imageFile && !imageFile.type.startsWith('image/')) {
      alert('The selected image file is not valid.');
      return;
    }
    if (pdfFile && pdfFile.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    // Read extra fields from HTML (present in your PHP)
    const namePdfArtworkInput = document.getElementById('name_pdf_artwork');

    // Build FormData (text + files)
    const fd = new FormData();
    fd.append('action',        'save_variation_details');
    fd.append('sku_product',   skuProduct);
    fd.append('sku_variation', skuVariation);

    // Attach flags used by your backend
    fd.append('isAttachAnImage', this.attachImage ? '1' : '0');
    fd.append('isAttachAPDF',    this.attachPDF   ? '1' : '0');

    // Core fields
    fd.append('name', (this.nameInput?.value || '').trim());

    // Optional label for pdf artwork
    fd.append('name_pdf_artwork', (namePdfArtworkInput?.value || '').trim());

    // IMPORTANT: Use the select value as the "group/type" value for now.
    // If you later split "group" and "type_variations", this is where you change it.
    const groupValue = (this.groupSelect?.value || '').trim();
    if (groupValue && groupValue !== '__create_group__') {
      fd.append('group', groupValue);
    } else {
      fd.append('group', '');
    }

    // Parent variation (optional)
    if (skuParentVariation) {
      fd.append('sku_parent_variation', skuParentVariation);
    }

    // Files (optional)
    if (imageFile) fd.append('imageFile', imageFile);
    if (pdfFile)   fd.append('pdfFile', pdfFile);

    // Send request
    const url = "../../controller/products/variations.php";

    fetch(url, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      body: fd
    })
      .then(r => {
        if (!r.ok) throw new Error("Network error.");
        return r.json();
      })
      .then(data => {
        if (data?.success) {
          // Move the wizard to the next step
          if (window.headerAddProduct && typeof window.headerAddProduct.goNext === 'function') {
            window.headerAddProduct.goNext('../../view/images/index.php');
          }
        } else {
          console.error("Save failed:", data);
          alert(data?.message || "Could not save the variation.");
        }
      })
      .catch(err => {
        console.error("Error:", err);
        alert("Network/server error while saving.");
      });
  }

  addNewVariation() {
    // Create a new variation in backend and redirect to edit it
    const skuProduct = getQueryParam('sku');
    if (!skuProduct) return;

    const url = "../../controller/products/variations.php";
    const payload = {
      action: "create_new_variation",
      sku: skuProduct
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(r => {
        if (!r.ok) throw new Error("Network error.");
        return r.text();
      })
      .then(text => {
        const json = JSON.parse(text);
        if (!json?.success) return;

        const skuVariation = json.sku_variation;
        alert("The new variation has been successfully created. Please fill in the details and save once you’ve finished.");

        window.location.href =
          `../../view/variations/index.php?sku=${encodeURIComponent(skuProduct)}&sku_variation=${encodeURIComponent(skuVariation)}`;
      })
      .catch(err => {
        console.error("Error:", err);
      });

    // Local helper kept inside method to avoid extra class methods
    function getQueryParam(key) {
      const params = new URLSearchParams(window.location.search);
      return params.get(key);
    }
  }

  // createGroup() {
  //   // This creates a "group" name and sends it to backend via update_group_name.
  //   // Then it inserts the new option into the select and selects it.
  //
  //   const name = (this.groupNameInput?.value || '').trim();
  //   if (!name) {
  //     alert('Please enter a group name.');
  //     this.groupNameInput?.focus();
  //     return;
  //   }
  //
  //   const skuVariation = new URLSearchParams(window.location.search).get('sku_variation') || '';
  //
  //   const url = "../../controller/products/variations.php";
  //   const payload = {
  //     action: "update_group_name",
  //     sku_variation: skuVariation,
  //     group_name: name
  //   };
  //
  //   fetch(url, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(payload)
  //   })
  //     .then(r => {
  //       if (!r.ok) throw new Error("Network error.");
  //       return r.text();
  //     })
  //     .then(text => {
  //       const json = JSON.parse(text);
  //
  //       // Even if backend returns success, we still update UI in the select
  //       if (json?.success && this.groupSelect) {
  //         const createOpt = this.groupSelect.querySelector('option[value="__create_group__"]');
  //
  //         // Insert the newly created group option before the create option
  //         if (createOpt) {
  //           const opt = document.createElement('option');
  //           opt.value = name;
  //           opt.textContent = name;
  //           this.groupSelect.insertBefore(opt, createOpt);
  //           this.groupSelect.value = name;
  //         }
  //       }
  //
  //       alert(`The group "${name}" has been created.`);
  //
  //       // Close modal
  //       if (this.groupModal) this.groupModal.hidden = true;
  //     })
  //     .catch(err => {
  //       console.error("Error:", err);
  //     });
  // }
}

// Instantiate once (the only code outside the class)
new Variations();
