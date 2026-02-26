class ImageLogic {
  constructor(imagesInstance) {
    this.images = imagesInstance;
    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  init() {
    const menuList = document.getElementById('menu_list');
    if (menuList) {
      menuList.addEventListener('click', (e) => this.onMenuListClick(e));
    }

    if (window.headerAddProduct) {
      window.headerAddProduct.setCurrentHeader('images');
      const nextBtn = document.getElementById('next_images');
      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => this.onNext(e));
      }
    }

    const form = document.getElementById('variationImagesForm');
    if (form) {
      form.addEventListener('submit', (e) => this.onSubmit(e));
    }

    const resetBtn = document.getElementById('reset_form');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.onReset());
    }

    this.getImagesDetails();
  }

  async onNext(e) {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const sku_variation = params.get('sku_variation');
    const sku_product = params.get('sku');

    const locals = (this.images.items || []).filter(it => it.origin === 'local');
    if (locals.length) {
      const fd = new FormData();
      fd.append('action', 'create_update_images');
      fd.append('sku_variation', sku_variation ?? '');
      fd.append('sku_product', sku_product ?? '');
      fd.append('meta', JSON.stringify(locals.map((it, i) => ({ order: i, filename: it.name }))));

      locals.forEach(it => fd.append('images[]', it.file, it.name));

      try {
        loader.show();

        const data = await this.createUpdateImages(fd);
        if (data?.success) {
          loader.hide();
          window.headerAddProduct.goNext('../../view/items/index.php');
        }
      } catch (err) {
        console.error(err);
      }
      return;
    }

    window.headerAddProduct.goNext('../../view/items/index.php');
  }

  onMenuListClick(e) {
    const menuList = document.getElementById('menu_list');
    const menuBtn = document.getElementById('menu_btn');

    const li = e.target.closest('li');
    if (!li || !menuList || !menuList.contains(li)) return;

    menuList.querySelectorAll('.is-selected').forEach(el => {
      el.classList.remove('is-selected');
      el.setAttribute('aria-selected', 'false');
    });

    li.classList.add('is-selected');
    li.setAttribute('aria-selected', 'true');

    const { sku } = this.images.parseNameSkuFromText(li.textContent);

    menuList.hidden = true;
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');

    const params = new URLSearchParams(window.location.search);
    const sku_product = params.get('sku');

    window.location.href =
      `../../view/images/index.php?sku=${encodeURIComponent(sku_product)}&sku_variation=${encodeURIComponent(sku)}`;
  }

  onReset() {
    alert('(pending implementation).');
  }

  async onSubmit(e) {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const sku_variation = params.get('sku_variation');
    const sku_product = params.get('sku');

    const locals = (this.images.items || []).filter(it => it.origin === 'local');

    const fd = new FormData();
    fd.append('action', 'create_update_images');
    fd.append('sku_variation', sku_variation ?? '');
    fd.append('sku_product', sku_product ?? '');
    fd.append('meta', JSON.stringify(locals.map((it, i) => ({ order: i, filename: it.name }))));

    locals.forEach(it => fd.append('images[]', it.file, it.name));

    try {
      loader.show();
      const data = await this.createUpdateImages(fd);
      if (data?.success) {
        loader.hide();
      }
    } catch (err) {
      console.error(err);
    }
  }

  deleteImage(link_image) {
    const params = new URLSearchParams(window.location.search);
    const sku_variation = params.get('sku_variation');

    const url = "../../controller/products/image.php";
    const data = {
      action: "delete_image",
      sku_variation: sku_variation,
      link_image: link_image
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) return response.text();
        throw new Error("Network error.");
      })
      .then(txt => {
        let parsed;
        try { parsed = JSON.parse(txt); } catch { return; }
        if (parsed?.success) {
          alert("The image has been deleted successfully.");
        }
        else {
          alert("The image could not be deleted. Please refresh the page and try again.");
        }
      })
      .catch(error => {
        console.error("Error:", error);
      });
  }

  getImagesDetails() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');
    const sku_variation = params.get('sku_variation');

    const url = "../../controller/products/image.php";
    const payload = { action: "get_images_details", sku, sku_variation };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.ok ? res.text() : Promise.reject(new Error("Network error.")))
      .then(txt => {
        let data;
        try { data = JSON.parse(txt); }
        catch (err) { console.error("JSON parse error", err, txt); return; }

        if (!data?.success) return;

        const list = Array.isArray(data.images) ? data.images : [];
        list.forEach(({ image_id, link }) => {
          const sid = String(image_id ?? '');
          if (sid && this.images.renderedIds?.has(sid)) return;

          const url = this.images.normalizeUrl(link);
          const name = this.images.basename(url);
          this.images.renderImage(undefined, name, url);
          if (sid) this.images.renderedIds.add(sid);
        });

        if (data.variations) {
          this.renderMenuTop(data.variations);
          this.selectMenuCurrentItemBySku();
        }
      })
      .catch(err => {
        console.error("Error:", err);
      });
  }

  createUpdateImages(fd) {
    const url = "../../controller/products/image.php";
    return fetch(url, {
      method: "POST",
      body: fd,
      credentials: "same-origin"
    })
      .then(res => res.json())
      .then(data => {
      //  alert(JSON.stringify(data));
        if (data?.success) {
          alert(data.message);
        }
        return data;
      })
      .catch(err => {
        console.error("Error:", err);
        alert("There was a network or server error while uploading the images.");
        throw err;
      });
  }

  selectMenuCurrentItemBySku() {
    const currentUrl = new URL(window.location.href);
    const skuv = currentUrl.searchParams.get('sku_variation');
    if (!skuv) return false;

    const ul = this.images?.menuList || document.getElementById('menu_list');
    const btn = this.images?.menuBtn || document.getElementById('menu_btn');
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

    // 🎨 Colores por nivel
    const levelColors = [
      '#0f2140', // level 0
      '#0b6b6b', // level 1
      '#7a4d0f', // level 2
      '#5a2d82', // level 3
      '#1d6b2a', // level 4+
    ];

    // ✅ SKU seleccionado (si lo tienes en tu clase o en el UL)
    const wanted = String(
      (this && this.skuVariation) ? this.skuVariation : (ul.dataset.selectedSku || '')
    ).trim().toUpperCase();

    const frag = document.createDocumentFragment();

    list.forEach((it) => {
      const name  = String((it?.name ?? '(unnamed)')).trim() || '(unnamed)';
      const sku   = String((it?.SKU ?? it?.sku ?? '')).trim();
      const level = Number(it?.level ?? 0) || 0;

      const color = levelColors[level] || levelColors[levelColors.length - 1];

      // ✅ +1 sangría global para todos
      const indent = 28 + (level * 18);

      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      li.setAttribute('tabindex', '-1');
      li.dataset.name = name;
      li.dataset.sku = sku;

      // Base style
      li.style.position = 'relative';
      li.style.padding = '8px 10px';
      li.style.paddingLeft = `${indent}px`;
      li.style.borderRadius = '10px';
      li.style.marginBottom = '6px';
      li.style.cursor = 'default';

      // Jerarquía visual
      li.style.borderLeft = `4px solid ${color}`;
      li.style.background = 'rgba(255,255,255,0.03)';

      // Dot que se mueve con la sangría
      li.insertAdjacentHTML(
        'afterbegin',
        `<span aria-hidden="true" style="
          position:absolute;
          left: ${Math.max(8, indent - 14)}px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: ${color};
          opacity: .85;
        "></span>`
      );

      // Contenido (sin L0/L1...)
      li.innerHTML += `<strong>${escape(name)}</strong>${sku ? `` : ''}`;

      // ✅ Seleccionado visible
      const candidate = String(sku).trim().toUpperCase();
      const isSelected = wanted && candidate && candidate === wanted;

      if (isSelected) {
        li.classList.add('is-selected');
        li.style.background = 'rgba(255,255,255,0.10)';
        li.style.outline = '2px solid rgba(255,255,255,0.28)';
        li.style.boxShadow = '0 10px 22px rgba(0,0,0,0.18)';
        li.style.borderLeft = `6px solid ${color}`;

        li.insertAdjacentHTML(
          'beforeend',
          `<span aria-hidden="true" style="
            position:absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 18px;
            height: 18px;
            border-radius: 999px;
            border: 2px solid ${color};
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:12px;
            line-height:1;
            color:${color};
            background: rgba(255,255,255,0.06);
          ">✓</span>`
        );
      }

      frag.appendChild(li);
    });

    ul.appendChild(frag);
  }
}

window.ImageLogic = ImageLogic;
