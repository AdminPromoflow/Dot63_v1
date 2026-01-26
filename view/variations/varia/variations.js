// Variations page controller (no globals, no "create new group" logic).
// The <select id="group"> is treated as "Type variation" select (type_id).
class Variations {
  constructor() {
    // --- Cache DOM references (single source of truth) ---
    this.form         = document.getElementById('variationForm');

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
    this.nextBtn      = document.getElementById('next_variations');

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
    this.bindFileInputs();
    this.bindMenu();
    this.bindButtons();

    // Initial load from backend
    this.getVariationDetails();
  }

  bindButtons() {
    // Save & Next
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        // Basic validation: name required
        const name = (this.nameInput?.value || '').trim();
        if (!name) {
          alert('Please add a name to the variation.');
          return;
        }
        this.saveVariationDetails();
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

        // Validate type
        if (file.type !== 'application/pdf') {
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
      if (this.typeSelect)   this.typeSelect.disabled  = true;
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

  renderTypeVariationsSelect(typeVariationsRaw, typeIdSelected) {
    if (!this.typeSelect) return;

    // If backend returns null/invalid, we still keep placeholder
    const list = Array.isArray(typeVariationsRaw) ? typeVariationsRaw : [];

    // Remove previously injected options (keep placeholder at index 0)
    this.typeSelect
      .querySelectorAll('option[data-source="type_list"]')
      .forEach(opt => opt.remove());

    const frag = document.createDocumentFragment();

    // Create <option> per type variation
    for (let i = 0; i < list.length; i++) {
      const typeId   = String(list[i]?.type_id ?? '').trim();
      const typeName = String(list[i]?.type_name ?? '').trim();
      if (!typeId || !typeName) continue;

      const opt = document.createElement('option');

      // value is the type_id (best for saving to backend)
      opt.value = typeId;

      // Requested: each item has an id derived from type_id
      // NOTE: using a prefix avoids CSS/querySelector issues with numeric IDs.
      opt.id = `type_${typeId}`;

      // Optional dataset (handy for debugging)
      opt.dataset.typeId = typeId;
      opt.dataset.source = 'type_list';

      opt.textContent = typeName;
      frag.appendChild(opt);
    }

    this.typeSelect.appendChild(frag);

    // Selection rule:
    // - If typeIdSelected is null/empty => keep no selection (placeholder)
    // - Else select by matching option.value === typeIdSelected
    const selected = (typeIdSelected === null || typeIdSelected === undefined)
      ? ''
      : String(typeIdSelected).trim();

    this.typeSelect.value = selected || '';

    // If the selected value does not exist in the options, fallback to placeholder
    if (selected && this.typeSelect.value !== selected) {
      this.typeSelect.value = '';
    }
  }

  renderServerPreviews(current) {
    // Server image preview
    if (this.imgPreview) {
      const serverImage = String(current?.image ?? '').trim();

      const src = serverImage
        ? (
            serverImage.startsWith('http') || serverImage.startsWith('data:') || serverImage.startsWith('blob:')
              ? serverImage
              : '../../' + serverImage.replace(/^\/+/, '')
          )
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
        const href = serverPdf.startsWith('/') ? serverPdf : '/' + serverPdf.replace(/^\/+/, '');
        this.pdfPreview.innerHTML = `<a href="../..${href}" download="artwork.pdf">artwork.pdf</a>`;
      }
    }
  }

  /* =========================
     Save + create variation
     ========================= */

  saveVariationDetails() {
    // Read URL context
    const { skuProduct, skuVariation } = this.readSkuParamsFromUrl();

    // Read selected parent sku (if any)
    let skuParentVariation = '';
    if (this.parentSelect?.selectedOptions?.[0]) {
      const opt = this.parentSelect.selectedOptions[0];
      skuParentVariation = String(opt.dataset?.sku || opt.value || '').trim();
    }

    // Read selected type_id (from "typeSelect")
    const typeId = String(this.typeSelect?.value || '').trim();

    // Read files
    const imageFile = this.imgInput?.files?.[0] || null;
    const pdfFile   = this.pdfInput?.files?.[0] || null;

    // Validate only if present
    if (imageFile && !imageFile.type.startsWith('image/')) {
      alert('The selected image file is not valid.');
      return;
    }
    if (pdfFile && pdfFile.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    // Build FormData
    const fd = new FormData();
    fd.append('action',        'save_variation_details');
    fd.append('sku_product',   skuProduct);
    fd.append('sku_variation', skuVariation);

    // Attach flags for backend (keep existing files if user did not attach new ones)
    fd.append('isAttachAnImage', this.attachImage ? '1' : '0');
    fd.append('isAttachAPDF',    this.attachPDF   ? '1' : '0');

    // Core fields
    fd.append('name', (this.nameInput?.value || '').trim());

    // Optional PDF label
    fd.append('name_pdf_artwork', (this.namePdfInput?.value || '').trim());

    // Save type_id (recommended)
    fd.append('type_id', typeId);

    // OPTIONAL: If your backend still expects "group" name, remove this line.
    // Keeping it here avoids breaking existing controllers while you migrate.
    fd.append('group', typeId);

    // Parent sku (optional)
    if (skuParentVariation) fd.append('sku_parent_variation', skuParentVariation);

    // Files (optional)
    if (imageFile) fd.append('imageFile', imageFile);
    if (pdfFile)   fd.append('pdfFile',   pdfFile);

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
        if (window.headerAddProduct?.goNext) {
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
