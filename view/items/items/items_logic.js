class ItemsLogic {
  constructor(itemsInstance) {
    this.items = itemsInstance;
  }

  setCurrentHeader() {
    if (window.headerAddProduct) {
      window.headerAddProduct.setCurrentHeader('items');
    }
  }

  setupVariationMenu() {
    const menuBtn = document.getElementById('menu_btn');
    const menuList = document.getElementById('menu_list');

    this.items.menuBtn = menuBtn;
    this.items.menuList = menuList;

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

    // ✅ CLICK: usa dataset.sku (no parsea texto)
    menuList.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li || !menuList.contains(li)) return;

      menuList.querySelectorAll('.is-selected').forEach(el => {
        el.classList.remove('is-selected');
        el.setAttribute('aria-selected', 'false');
      });

      li.classList.add('is-selected');
      li.setAttribute('aria-selected', 'true');

      const sku = String(li.dataset.sku || '').trim();
      if (!sku) return;

      menuList.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');

      const params = new URLSearchParams(window.location.search);
      const sku_product = params.get('sku');

      window.location.href =
        `../../view/items/index.php?sku=${encodeURIComponent(sku_product)}&sku_variation=${encodeURIComponent(sku)}`;
    });
  }

  onReset(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    alert('(pending implementation).');
  }

  onSubmit(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    return this.saveItems({ goNext: false });
  }

  onNext(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    return this.saveItems({ goNext: true });
  }

  saveItems({ goNext = false } = {}) {
    const labelInput = document.querySelectorAll(".label-input");
    const textInput = document.querySelectorAll(".text-input");

    if (!labelInput.length || !textInput.length) {
      alert('Please add at least one item.');
      return Promise.resolve(false);
    }

    const labels = [];
    const texts = [];

    for (let i = 0; i < labelInput.length; i++) {
      const labelVal = String(labelInput[i].value ?? '').trim();
      const textVal  = String(textInput[i].value ?? '').trim();

      if (!textVal) {
        alert('Item text cannot be empty.');
        return Promise.resolve(false);
      }

      labels.push(labelVal);
      texts.push(textVal);
    }

    const params = new URLSearchParams(window.location.search);
    const sku_variation = params.get('sku_variation');

    return this.createItems({ sku_variation, labels, texts, goNext });
  }

  getVariationDetails() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');
    const sku_variation = params.get('sku_variation');

    const url = "../../controller/products/variations.php";
    const data = {
      action: "get_variation_details",
      sku: sku,
      sku_variation: sku_variation
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) return response.json();
        throw new Error("Network error.");
      })
      .then(data => {
        if (data?.success) {
          // ✅ data.variations viene plano con { level, parent_id }
          this.renderMenuTop(data.variations);
          this.selectMenuCurrentItemBySku();
        }
      })
      .catch(error => console.error("Error:", error));
  }

  getItemsDetails() {
    const params = new URLSearchParams(window.location.search);
    const sku_variation = params.get('sku_variation');

    const url = "../../controller/products/item.php";
    const data = {
      action: "get_items_details",
      sku_variation: sku_variation
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) return response.json();
        throw new Error("Network error.");
      })
      .then(data => {
        if (data?.success) {
          this.items.drawItems(data.items);
        }
      })
      .catch(error => console.error("Error:", error));
  }

  selectMenuCurrentItemBySku() {
    const currentUrl = new URL(window.location.href);
    const skuv = currentUrl.searchParams.get('sku_variation');
    if (!skuv) return false;

    const ul = this.items.menuList || document.getElementById('menu_list');
    const btn = this.items.menuBtn || document.getElementById('menu_btn');
    if (!ul) return false;

    ul.querySelectorAll('.is-selected').forEach(el => el.classList.remove('is-selected'));

    const norm = s => String(s || '').trim().toUpperCase();
    const wanted = norm(skuv);

    for (const li of ul.querySelectorAll('li')) {
      const candidate = norm(li.dataset?.sku);
      if (candidate && candidate === wanted) {
        li.classList.add('is-selected');
        li.setAttribute('aria-selected', 'true');
        ul.hidden = true;
        if (btn) btn.setAttribute('aria-expanded', 'false');
        return true;
      }
    }
    return false;
  }

  // ✅ MENU: sangría por level + color por nivel + seleccionado visible
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

    const escape = (s) => String(s ?? '').replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
    );

    const levelColors = ['#0f2140', '#0b6b6b', '#7a4d0f', '#5a2d82', '#1d6b2a'];

    const params = new URLSearchParams(window.location.search);
    const wanted = String(params.get('sku_variation') || '').trim().toUpperCase();

    const frag = document.createDocumentFragment();

    list.forEach((it) => {
      const name  = String((it?.name ?? '(unnamed)')).trim() || '(unnamed)';
      const sku   = String((it?.SKU ?? it?.sku ?? '')).trim(); // NO se muestra
      const level = Number(it?.level ?? 0) || 0;

      const color = levelColors[level] || levelColors[levelColors.length - 1];
      const indent = 28 + (level * 18); // ✅ sangría extra global

      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      li.setAttribute('tabindex', '-1');
      li.setAttribute('aria-selected', 'false');
      li.dataset.name = name;
      li.dataset.sku  = sku;

      li.style.position = 'relative';
      li.style.padding = '8px 10px';
      li.style.paddingLeft = `${indent}px`;
      li.style.borderRadius = '10px';
      li.style.marginBottom = '6px';
      li.style.cursor = 'default';
      li.style.borderLeft = `4px solid ${color}`;
      li.style.background = 'rgba(0,0,0,0.03)';

      // Dot alineado a la sangría
      li.insertAdjacentHTML(
        'afterbegin',
        `<span aria-hidden="true" style="
          position:absolute;
          left:${Math.max(8, indent - 14)}px;
          top:50%;
          transform:translateY(-50%);
          width:8px;height:8px;border-radius:999px;
          background:${color};opacity:.85;
        "></span>`
      );

      // ✅ Solo nombre
      li.innerHTML += `<strong>${escape(name)}</strong>`;

      const candidate = String(sku).trim().toUpperCase();
      if (wanted && candidate && candidate === wanted) {
        li.classList.add('is-selected');
        li.setAttribute('aria-selected', 'true');
        li.style.background = 'rgba(0,0,0,0.06)';
        li.style.outline = `2px solid ${color}33`;
        li.style.borderLeft = `6px solid ${color}`;

        li.insertAdjacentHTML(
          'beforeend',
          `<span aria-hidden="true" style="
            position:absolute;
            right:10px;top:50%;
            transform:translateY(-50%);
            width:18px;height:18px;border-radius:999px;
            border:2px solid ${color};
            display:flex;align-items:center;justify-content:center;
            font-size:12px;line-height:1;color:${color};
            background:rgba(255,255,255,0.4);
          ">✓</span>`
        );
      }

      frag.appendChild(li);
    });

    ul.appendChild(frag);
  }

  deleteItem(id_item) {
    const url = "../../controller/products/item.php";
    const data = { action: "delete_item", id_item };

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(response => {
      if (response.ok) return response.json();
      throw new Error("Network error.");
    });
  }

  createItems({ sku_variation, labels, texts, goNext = false } = {}) {
    const url = "../../controller/products/item.php";
    const data = {
      action: "create_items",
      sku_variation,
      labels,
      texts
    };

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) return response.text();
        throw new Error("Network error.");
      })
      .then(raw => {
        const parsed = JSON.parse(raw);

        if (parsed?.success) {
          alert("The items have been saved successfully.");
          if (goNext && window.headerAddProduct) {
            headerAddProduct.goNext('../../view/prices/index.php');
          }
          return true;
        }
        return false;
      })
      .catch(error => {
        console.error("Error:", error);
        return false;
      });
  }
}

window.ItemsLogic = ItemsLogic;
