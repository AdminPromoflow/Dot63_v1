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

    menuList.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li || !menuList.contains(li)) return;

      menuList.querySelectorAll('.is-selected').forEach(el => {
        el.classList.remove('is-selected');
        el.setAttribute('aria-selected', 'false');
      });

      li.classList.add('is-selected');
      li.setAttribute('aria-selected', 'true');

      const { sku } = this.items.parseNameSkuFromText(li.textContent);

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
    const state = Array.isArray(this.items.itemsState) ? this.items.itemsState : [];
    if (state.length === 0) {
      alert('Please add at least one item.');
      return Promise.resolve(false);
    }

    for (const it of state) {
      if (!String(it?.text ?? '').trim()) {
        alert('Item text cannot be empty.');
        return Promise.resolve(false);
      }
    }

    const labelInput = document.querySelectorAll(".label-input");
    const textInput = document.querySelectorAll(".text-input");

    const labels = [];
    const texts = [];

    for (let i = 0; i < labelInput.length; i++) {
      labels.push(labelInput[i].value);
      texts.push(textInput[i].value);
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
          this.renderMenuTop(data.variations);
          this.selectMenuCurrentItemBySku();
        }
      })
      .catch(error => {
        console.error("Error:", error);
      });
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
      .catch(error => {
        console.error("Error:", error);
      });
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
      const skuData = li.dataset?.sku;
      const skuText = li.querySelector('small')?.textContent?.replace(/^—\s*/, '');
      const candidate = norm(skuData || skuText);

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

  renderMenuTop(items) {
    const ul = document.getElementById('menu_list');
    if (!ul) return;

    const list = Array.isArray(items) ? items
      : (items && Array.isArray(items.variations) ? items.variations : []);

    ul.innerHTML = '';
    ul.setAttribute('role', 'menu');

    if (list.length === 0) {
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

    const frag = document.createDocumentFragment();

    list.forEach((it) => {
      const name = (it?.name ?? '(unnamed)').trim() || '(unnamed)';
      const sku = (it?.SKU ?? it?.sku ?? '').trim();

      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      li.setAttribute('tabindex', '-1');
      li.dataset.name = name;
      li.dataset.sku = sku;

      li.innerHTML = `<strong>${escape(name)}</strong>${sku ? ` <small style="color:var(--muted)">— ${escape(sku)}</small>` : ''}`;
      frag.appendChild(li);
    });

    ul.appendChild(frag);
  }

  deleteItem(id_item) {
    const url = "../../controller/products/item.php";
    const data = {
      action: "delete_item",
      id_item: id_item
    };

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) return response.json();
        throw new Error("Network error.");
      });
  }

  createItems({ sku_variation, labels, texts, goNext = false } = {}) {
    const url = "../../controller/products/item.php";
    const data = {
      action: "create_items",
      sku_variation: sku_variation,
      labels: labels,
      texts: texts
    };

    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) {
          return response.text();
        }
        throw new Error("Network error.");
      })
      .then(data => {
        alert(data);
        var parsed = JSON.parse(data);

        if (parsed["success"]) {
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
