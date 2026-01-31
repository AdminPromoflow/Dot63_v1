/**
 * ======================================================
 * Class: Items
 * Manages variation menu (top dropdown) and the item editor
 * All comments use British English.
 * ======================================================
 */
class Items {
  constructor() {
    if (window.ItemsLogic) {
      this.logic = new window.ItemsLogic(this);
    }

    // Wait for the DOM to be ready before wiring anything up
    document.addEventListener('DOMContentLoaded', () => {

      this.logic?.setupVariationMenu(); // dropdown: open/close, select, navigate
      this.init();                      // form refs, state, events, initial data load
    });
  }

  // ==========================================================
  // == INITIALISATION (FORM, STATE, EVENTS, DATA)
  // ==========================================================
  init() {
    // --- References ---
    this.form     = document.getElementById('variationItemsForm');
    this.addBtn   = document.getElementById('add_item');
    this.list     = document.getElementById('items_list');
    this.resetBtn = document.getElementById('reset_form');
    this.saveBtn  = document.getElementById('save_items');
    this.nextBtn  = document.getElementById('next_items');

    // --- State (each item: { id, label, text, highlight, order }) ---
    this.itemsState = [];

    // Highlight the current header step, if available
    this.logic?.setCurrentHeader();

    // Wire events, then fetch variations to populate the menu
    this.bindEvents();
    this.logic?.getItemsDetails();
    this.logic?.getVariationDetails();
  }

  // Extract { name, sku } from a line of menu text (robust to a few formats)
  parseNameSkuFromText(text) {
    const raw = (text ?? '').toString().trim();
    if (raw === '') return { name: '', sku: '' };

    // Example SKU pattern: ABC-20250101-123456-654321-1A2B3C4D5E
    const skuPattern = /[A-Z]{3,}-\d{8}-\d{6}-\d{6}-[A-F0-9]{10}/i;

    // Case 1: explicit SKU match in the text
    const anyMatch = raw.match(skuPattern);
    if (anyMatch) {
      const sku  = anyMatch[0].trim();
      const name = raw.replace(skuPattern, '').replace(/[—–\-:()\s]+$/,'').trim();
      return { name: name.replace(/[—–\-:]\s*$/,'').trim(), sku };
    }

    // Case 2: split on dash-like separators and assume the last part is the SKU
    const sepPattern = /\s*[—–\-:]\s*/;
    const parts = raw.split(sepPattern).filter(Boolean);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1].trim();
      if (skuPattern.test(last)) {
        parts.pop();
        const sku  = last;
        const name = parts.join(' — ').trim();
        return { name, sku };
      }
    }

    // Case 3: SKU in parentheses at the end
    const mParen = raw.match(/\(([^)]+)\)\s*$/);
    if (mParen && skuPattern.test(mParen[1])) {
      const sku  = mParen[1].trim();
      const name = raw.slice(0, mParen.index).trim();
      return { name, sku };
    }

    // Fallback: no SKU detected, return the whole string as the name
    return { name: raw, sku: '' };
  }

  // ==========================================================
  // == ITEM LIST (FORM LOGIC)
  // ==========================================================
  makeId() {
    return Math.random().toString(36).slice(2, 10);
  }

  resequence() {
    this.itemsState.forEach((it, idx) => it.order = idx);
  }

  renderList() {
    this.list.innerHTML = '';
    this.itemsState.forEach((it, idx) => {
      const card = document.createElement('div');
      card.className = 'cp-card-item';
      card.innerHTML = `
        <div class="row">
          <span class="small">Item #${idx + 1}</span>
          <div class="cp-actions">
            <button type="button" class="btn btn-danger btn-icon remove" data-id="${it.id}">✕</button>
          </div>
        </div>
        <input type="text" class="label-input" data-id="${it.id}" placeholder="Label (optional), e.g., Includes" value="${it.label}">
        <textarea class="text-input" data-id="${it.id}" placeholder="Write the item text shown to customers…">${it.text}</textarea>
      `;
      this.list.appendChild(card);
    });
  }

  drawItems(items) {
    // Actualiza el estado con las claves del backend
    this.itemsState = (Array.isArray(items) ? items : []).map(it => ({
      id: String(it.item_id || ''),
      label: it.name || '',
      text: it.description || ''
    }));

    // Limpia el contenedor
    this.list.innerHTML = '';

    // Escape mínimo para evitar inyección
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));

    // Dibuja
    this.itemsState.forEach((it, i) => {
      const div = document.createElement('div');
      div.className = 'cp-card-item';
      div.innerHTML = `
        <div class="row">
          <span class="small">Item #${i + 1}</span>
          <div class="cp-actions">
            <button type="button" class="btn btn-danger btn-icon remove" data-id="${esc(it.id)}">✕</button>
          </div>
        </div>
        <input type="text" class="label-input" data-id="${esc(it.id)}" value="${esc(it.label)}" placeholder="Label (optional)">
        <textarea class="text-input" data-id="${esc(it.id)}" placeholder="Item text…">${esc(it.text)}</textarea>
      `;
      this.list.appendChild(div);
    });
  }


  addItem(label = '', text = '', highlight = false) {
    this.itemsState.push({
      id: this.makeId(),
      label,
      text,
      highlight,
      order: this.itemsState.length
    });
    this.renderList();
  }

  removeItem(id_item) {
    if (Number.isInteger(parseInt(id_item, 10))) {
      this.logic?.deleteItem(id_item)
        ?.then(() => {
          alert("The item has been successfully removed.");
          location.reload();
        })
        ?.catch((error) => {
          console.error("Error:", error);
        });
      return;
    }

    alert("The item has been successfully removed.");
    location.reload();
  }

  toggleHighlight(id) {
    this.itemsState.forEach(it => {
      if (it.id === id) it.highlight = !it.highlight;
    });
    this.renderList();
  }

  moveItem(id, dir) {
    const i = this.itemsState.findIndex(it => it.id === id);
    if (i < 0) return;
    const j = i + (dir === 'up' ? -1 : 1);
    if (j < 0 || j >= this.itemsState.length) return;
    [this.itemsState[i], this.itemsState[j]] = [this.itemsState[j], this.itemsState[i]];
    this.resequence();
    this.renderList();
  }

  resetForm() {
    this.form.reset();
    this.itemsState = [];
    this.list.innerHTML = '';
  }

  // Persist the current list of items to the server (delegated)
  async saveItems(e, goNext = false) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    return this.logic?.saveItems({ goNext });
  }

  // Wire all UI events for the item editor
  bindEvents() {
    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => this.addItem());
    }

    if (this.list) {
      // Delegate clicks for remove/highlight/move buttons
      this.list.addEventListener('click', (e) => {
        const btnUp   = e.target.closest('.move-up');
        const btnDown = e.target.closest('.move-down');
        const btnHi   = e.target.closest('.highlight');
        const btnRem  = e.target.closest('.remove');

        if (btnUp)   this.moveItem(btnUp.dataset.id, 'up');
        if (btnDown) this.moveItem(btnDown.dataset.id, 'down');
        if (btnHi)   this.toggleHighlight(btnHi.dataset.id);
        if (btnRem)  this.removeItem(btnRem.dataset.id);
      });

      // Keep state in sync with inputs
      this.list.addEventListener('input', (e) => {
        const labelEl = e.target.closest('.label-input');
        const textEl  = e.target.closest('.text-input');
        if (labelEl) {
          const it = this.itemsState.find(x => x.id === labelEl.dataset.id);
          if (it) it.label = labelEl.value.trim();
        } else if (textEl) {
          const it = this.itemsState.find(x => x.id === textEl.dataset.id);
          if (it) it.text = textEl.value;
        }
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', (e) => this.logic?.onReset(e));
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => this.logic?.onSubmit(e));
    }

    // Optional: proceed to the next step in the header wizard
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => this.logic?.onNext(e));
    }
  }
}

// Single global instance (used by menu event handlers and elsewhere)
const items = new Items();
