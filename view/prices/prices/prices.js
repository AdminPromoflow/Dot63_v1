/**
 * ======================================================
 * Class: Prices
 * - Full-width rows
 * - Fields per row: min_qty, max_qty, price
 * - Global option per variation: price_display_mode => prices | variation
 * - IDs: if they come from DB => real ID; otherwise => random
 * Endpoints:
 *   - ../../controller/products/variations.php  (get_variation_details)
 *   - ../../controller/products/price.php       (get_prices_details, create_prices, delete_price)
 * ======================================================
 */
class Prices {
  constructor() {
    document.addEventListener('DOMContentLoaded', () => {
      // Event listener para botón Back
      const btnBackPrices = document.getElementById("btn_back_prices");
      if (btnBackPrices) {
        btnBackPrices.addEventListener("click", () => {
          window.headerAddProduct.goNext('../../view/items/items/items.php');
        });
      }

      this.setupVariationMenu();
      this.init();
    });
  }

  // ========= Variations menu =========
  setupVariationMenu() {
    const menuBtn = document.getElementById('menu_btn');
    const menuList = document.getElementById('menu_list');

    this.menuBtn = menuBtn;
    this.menuList = menuList;

    if (!(menuBtn && menuList)) return;

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = menuList.hidden;
      menuList.hidden = !isHidden;
      menuBtn.setAttribute('aria-expanded', String(!isHidden));
    });

    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !menuList.contains(e.target)) {
        if (!menuList.hidden) {
          menuList.hidden = true;
          menuBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menuList.hidden) {
        menuList.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });

    menuList.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li || !menuList.contains(li)) return;

      menuList.querySelectorAll('.is-selected').forEach((el) => {
        el.classList.remove('is-selected');
        el.setAttribute('aria-selected', 'false');
        this._clearSelectedInline(el);
      });

      li.classList.add('is-selected');
      li.setAttribute('aria-selected', 'true');
      this._applySelectedInline(li);

      const sku = String(li.dataset.sku || '').trim();
      if (!sku) return;

      menuList.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');

      const params = new URLSearchParams(window.location.search);
      const skuProduct = params.get('sku');

      window.location.href =
        `../../view/prices/index.php?sku=${encodeURIComponent(skuProduct)}&sku_variation=${encodeURIComponent(sku)}`;
    });
  }

  // ========= Init =========
  init() {
    this.form = document.getElementById('variationPricesForm');
    this.addBtn = document.getElementById('add_price');
    this.list = document.getElementById('prices_list');
    this.saveBtn = document.getElementById('save_prices');
    this.nextBtn = document.getElementById('next_prices');
    this.resetBtn = document.getElementById('reset_form');

    this.displayInputs = Array.from(document.querySelectorAll('input[name="display_in"]'));
    this.displayIn = 'prices';

    // State: each row => { id, min_qty, max_qty, price, order }
    this.rows = [];

    if (window.headerAddProduct) {
      headerAddProduct.setCurrentHeader('prices');
    }

    this.bindEvents();
    this.setDisplayIn('prices');
    this.getPricesDetails();
    this.getVariationDetails();
  }

  // ========= Display mode =========
  setDisplayIn(value = 'prices') {
    const normalised = String(value || '').trim().toLowerCase() === 'variation'
      ? 'variation'
      : 'prices';

    this.displayIn = normalised;

    this.displayInputs.forEach((input) => {
      input.checked = input.value === normalised;
    });
  }

  getSelectedDisplayIn() {
    const checked = this.displayInputs.find((input) => input.checked);
    return checked ? checked.value : 'prices';
  }

  // ========= Fetch variations =========
  getVariationDetails() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');
    const sku_variation = params.get('sku_variation');

    const url = '../../controller/products/variations.php';
    const data = { action: 'get_variation_details', sku, sku_variation };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Network error.'))))
      .then((data) => {
        if (data?.success) {
          this.renderMenuTop(data.variations);
          this.selectMenuCurrentItemBySku();
        }
      })
      .catch((err) => console.error('Error:', err));
  }

  // ========= Fetch prices =========
  getPricesDetails() {
    const params = new URLSearchParams(window.location.search);
    const sku_variation = params.get('sku_variation');

    const url = '../../controller/products/price.php';
    const data = { action: 'get_prices_details', sku_variation };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Network error.'))))
      .then((data) => {
        const savedDisplayIn = data?.price_display_mode ?? 'prices';

        this.setDisplayIn(savedDisplayIn);

        if (data?.success && Array.isArray(data.prices) && data.prices.length) {
          this.drawRows(data.prices);
        } else {
          this.rows = [];
          this.renderRows();
        }
      })
      .catch(() => {
        this.setDisplayIn('prices');
        this.rows = [];
        this.renderRows();
      });
  }

  // ========= Utilities =========
  makeId() {
    return Math.random().toString(36).slice(2, 10);
  }

  addRow(min_qty = '', max_qty = '', price = '') {
    this.rows.push({
      id: this.makeId(),
      min_qty: String(min_qty ?? ''),
      max_qty: String(max_qty ?? ''),
      price: String(price ?? ''),
      order: this.rows.length
    });

    this.renderRows();
  }

  _extractColorFromBorderLeft(li) {
    const raw = String(li?.style?.borderLeft || '');
    const parts = raw.split(' ').map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '#0f2140';
  }

  _applySelectedInline(li) {
    if (!li) return;

    const color = this._extractColorFromBorderLeft(li);

    li.style.background = 'rgba(255,255,255,0.10)';
    li.style.outline = '2px solid rgba(255,255,255,0.28)';
    li.style.boxShadow = '0 10px 22px rgba(0,0,0,0.18)';
    li.style.borderLeft = `6px solid ${color}`;

    if (!li.querySelector('.sel-check')) {
      li.insertAdjacentHTML(
        'beforeend',
        `<span class="sel-check" aria-hidden="true" style="
          position:absolute;
          right:10px;
          top:50%;
          transform:translateY(-50%);
          width:18px;
          height:18px;
          border-radius:999px;
          border:2px solid ${color};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:12px;
          line-height:1;
          color:${color};
          background:rgba(255,255,255,0.06);
        ">✓</span>`
      );
    }
  }

  _clearSelectedInline(li) {
    if (!li) return;

    li.style.outline = '';
    li.style.boxShadow = '';
    li.style.background = 'rgba(255,255,255,0.03)';

    const color = this._extractColorFromBorderLeft(li);
    li.style.borderLeft = `4px solid ${color}`;

    const check = li.querySelector('.sel-check');
    if (check) check.remove();
  }

  // ========= Menu render =========
  renderMenuTop(items) {
    const ul = document.getElementById('menu_list');
    if (!ul) return;

    const list = Array.isArray(items)
      ? items
      : (items && Array.isArray(items.variations) ? items.variations : []);

    ul.innerHTML = '';
    ul.setAttribute('role', 'menu');

    if (!list || list.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No items to show';
      li.setAttribute('role', 'menuitem');
      li.setAttribute('tabindex', '-1');
      ul.appendChild(li);
      return;
    }

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
    ));

    const levelColors = ['#0f2140', '#0b6b6b', '#7a4d0f', '#5a2d82', '#1d6b2a'];

    const params = new URLSearchParams(window.location.search);
    const wanted = String(params.get('sku_variation') || '').trim().toUpperCase();

    const frag = document.createDocumentFragment();

    list.forEach((it) => {
      const name = String((it?.name ?? '(unnamed)')).trim() || '(unnamed)';
      const sku = String((it?.SKU ?? it?.sku ?? '')).trim();
      const level = Number(it?.level ?? 0) || 0;

      const color = levelColors[level] || levelColors[levelColors.length - 1];
      const indent = 28 + (level * 18);

      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      li.setAttribute('tabindex', '-1');
      li.setAttribute('aria-selected', 'false');

      li.dataset.name = name;
      li.dataset.sku = sku;
      li.dataset.level = String(level);

      li.style.position = 'relative';
      li.style.padding = '8px 10px';
      li.style.paddingLeft = `${indent}px`;
      li.style.borderRadius = '10px';
      li.style.cursor = 'default';
      li.style.marginBottom = '6px';
      li.style.borderLeft = `4px solid ${color}`;
      li.style.background = 'rgba(255,255,255,0.03)';

      li.insertAdjacentHTML(
        'afterbegin',
        `<span class="lvl-dot" aria-hidden="true" style="
          position:absolute;
          left:${Math.max(8, indent - 14)}px;
          top:50%;
          transform:translateY(-50%);
          width:8px;
          height:8px;
          border-radius:999px;
          background:${color};
          opacity:.85;
        "></span>`
      );

      const skuHidden = sku
        ? `<span class="sku-hidden" style="position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden;">${esc(sku)}</span>`
        : '';

      li.innerHTML += `<strong>${esc(name)}</strong>${skuHidden}`;

      const candidate = String(sku || '').trim().toUpperCase();
      if (candidate && wanted && candidate === wanted) {
        li.classList.add('is-selected');
        li.setAttribute('aria-selected', 'true');
        this._applySelectedInline(li);
      }

      frag.appendChild(li);
    });

    ul.appendChild(frag);
  }

  selectMenuCurrentItemBySku() {
    const skuv = new URL(window.location.href).searchParams.get('sku_variation');
    if (!skuv) return false;

    const ul = this.menuList || document.getElementById('menu_list');
    const btn = this.menuBtn || document.getElementById('menu_btn');
    if (!ul) return false;

    const norm = (s) => String(s || '').trim().toUpperCase();
    const wanted = norm(skuv);

    ul.querySelectorAll('.is-selected').forEach((el) => {
      el.classList.remove('is-selected');
      el.setAttribute('aria-selected', 'false');
      this._clearSelectedInline(el);
    });

    for (const li of ul.querySelectorAll('li')) {
      const candidate = norm(li.dataset?.sku);
      if (candidate && candidate === wanted) {
        li.classList.add('is-selected');
        li.setAttribute('aria-selected', 'true');
        this._applySelectedInline(li);
        ul.hidden = true;
        if (btn) btn.setAttribute('aria-expanded', 'false');
        return true;
      }
    }

    return false;
  }

  // ========= Rows =========
  drawRows(rowsFromDB) {
    this.rows = (rowsFromDB || []).map((r) => ({
      id: String(r.price_id ?? r.id ?? ''),
      min_qty: String(r.min_quantity ?? r.min_qty ?? r.min ?? ''),
      max_qty: String(r.max_quantity ?? r.max_qty ?? r.max ?? ''),
      price: String(r.price ?? r.amount ?? ''),
      order: Number(r.order ?? 0)
    }));

    this.renderRows();
  }

  renderRows() {
    if (!this.list) return;
    this.list.innerHTML = '';

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

    this.rows.forEach((row, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'price-row';

      wrap.innerHTML = `
        <div class="meta">Row #${idx + 1}</div>

        <input
          type="number"
          class="min-input"
          data-id="${esc(row.id)}"
          placeholder="Min qty"
          min="0"
          step="1"
          value="${esc(row.min_qty)}"
          aria-label="Min quantity"
        >

        <input
          type="number"
          class="max-input"
          data-id="${esc(row.id)}"
          placeholder="Max qty"
          min="0"
          step="1"
          value="${esc(row.max_qty)}"
          aria-label="Max quantity"
        >

        <input
          type="number"
          class="price-input"
          data-id="${esc(row.id)}"
          placeholder="Price"
          min="0"
          step="0.01"
          value="${esc(row.price)}"
          aria-label="Price"
        >

        <button
          type="button"
          class="btn btn-danger btn-icon remove"
          data-id="${esc(row.id)}"
          title="Remove"
          aria-label="Remove"
        >✕</button>
      `;

      this.list.appendChild(wrap);
    });
  }

  removeRow(id_price) {
    if (Number.isInteger(parseInt(id_price, 10))) {
      const url = '../../controller/products/price.php';
      const data = { action: 'delete_price', id_price };

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Network error.'))))
        .then(() => {})
        .catch((err) => console.error('Error:', err));
    }

    alert('The price row has been successfully removed.');
    location.reload();
  }

  // ========= Save =========
  async save(e, goNext = false) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const all = (sel) => Array.from(this.list.querySelectorAll(sel));
    const ids = all('.remove').map((b) => b.dataset.id || '');
    const mins = all('.min-input').map((el) => el.value);
    const maxs = all('.max-input').map((el) => el.value);
    const prices = all('.price-input').map((el) => el.value);

    if (ids.length > 0) {
      for (let i = 0; i < ids.length; i++) {
        const hasMin = mins[i] !== '';
        const hasMax = maxs[i] !== '';
        const prc = Number(prices[i]);

        if (!(Number.isFinite(prc)) || prc < 0) {
          alert('Price must be a non-negative number.');
          return;
        }

        if (hasMin) {
          const minQ = parseInt(mins[i], 10);
          if (!Number.isInteger(minQ) || minQ < 0) {
            alert('Min qty must be an integer ≥ 0.');
            return;
          }
        }

        if (hasMax) {
          const maxQ = parseInt(maxs[i], 10);
          if (!Number.isInteger(maxQ) || maxQ < 0) {
            alert('Max qty must be an integer ≥ 0.');
            return;
          }
        }

        if (hasMin && hasMax) {
          const minQ = parseInt(mins[i], 10);
          const maxQ = parseInt(maxs[i], 10);

          if (maxQ < minQ) {
            alert('Max qty cannot be less than min qty.');
            return;
          }
        }
      }
    }

    const params = new URLSearchParams(window.location.search);
    const sku_variation = params.get('sku_variation');

    const price_display_mode = this.getSelectedDisplayIn();

    const url = '../../controller/products/price.php';
    const payload = {
      action: 'create_prices',
      sku_variation,
      price_display_mode,
      ids,
      min_qty: mins,
      max_qty: maxs,
      prices
    };

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('Network error.'))))
      .then((txt) => {
        let data;
        try {
          data = JSON.parse(txt);
        } catch {
          data = { success: false };
        }

        if (data.success) {
          alert('The prices have been saved successfully.');

          if (goNext && window.headerAddProduct) {
            headerAddProduct.goNext('../../view/preview_porduct/index.php');
            return true;
          }

          location.reload();
          return true;
        }

        alert(data.error || 'There was a problem saving price rows.');
        return false;
      })
      .catch((err) => {
        console.error('Error:', err);
        return false;
      });
  }

  // ========= Events =========
  bindEvents() {
    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => this.addRow('', '', ''));
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();

        this.rows = [];
        this.renderRows();
        this.setDisplayIn('prices');
      });
    }

    if (this.displayInputs.length) {
      this.displayInputs.forEach((input) => {
        input.addEventListener('change', () => {
          this.displayIn = this.getSelectedDisplayIn();
        });
      });
    }

    if (this.list) {
      this.list.addEventListener('click', (e) => {
        const btnRem = e.target.closest('.remove');
        if (btnRem) this.removeRow(btnRem.dataset.id);
      });

      this.list.addEventListener('input', (e) => {
        const maps = [
          ['min-input', 'min_qty'],
          ['max-input', 'max_qty'],
          ['price-input', 'price']
        ];

        for (const [cls, key] of maps) {
          const el = e.target.closest(`.${cls}`);
          if (el) {
            const id = el.dataset.id;
            const row = this.rows.find((x) => x.id === id);
            if (row) row[key] = el.value;
            break;
          }
        }
      });
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.save(e, false);
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        this.save(e, true);
      });
    }
  }
}

// Global instance
const prices = new Prices();
