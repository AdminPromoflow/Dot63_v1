class Images {
  constructor() {
    if (window.ImageLogic) {
      this.logic = new window.ImageLogic(this);
    }
    document.addEventListener('DOMContentLoaded', () => {
      // ===== Toggle menú "Variations" =====
      const menuBtn  = document.getElementById('menu_btn');
      const menuList = document.getElementById('menu_list');
      this.menuBtn = menuBtn;
      this.menuList = menuList;

      if (menuBtn && menuList) {
        // Abrir/cerrar con clic
        menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = menuList.hidden;
          menuList.hidden = !isHidden;
          menuBtn.setAttribute('aria-expanded', String(!isHidden));
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
          if (!menuBtn.contains(e.target) && !menuList.contains(e.target)) {
            if (!menuList.hidden) {
              menuList.hidden = true;
              menuBtn.setAttribute('aria-expanded', 'false');
            }
          }
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && !menuList.hidden) {
            menuList.hidden = true;
            menuBtn.setAttribute('aria-expanded', 'false');
            menuBtn.focus();
          }
        });

      }

      // Inicia el resto (DOM ya listo)
      this.init();
    });
  }

  // ====== Estado y utilidades ======
  items = []; // {id, url, name, size, origin: 'server'|'local', file?}

  uid() { return Math.random().toString(36).slice(2,10); }

  humanSize(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n)) return '';
    const u = ['B','KB','MB','GB','TB'];
    let i = 0, v = n;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
  }

  // ====== Inicialización de UI ======
  init() {
    const $ = s => document.querySelector(s);
    const form      = $('#variationImagesForm');
    if (!form) return;

    const dropzone  = $('#dropzone');
    const pickBtn   = $('#pick_files');
    const fileInput = $('#images_input');
    const gallery   = $('#gallery');
    this.gallery = gallery;

    // Config
    this.MAX_SIZE = 10 * 1024 * 1024; // 10MB
    this.ACCEPTED = ['image/jpeg','image/png','image/webp'];

    // Eventos (append-only)
    pickBtn?.addEventListener('click', () => fileInput.click());
    fileInput?.addEventListener('change', e => this.addLocalFiles(e.target.files));

    const block = e => { e.preventDefault(); e.stopPropagation(); };
    ['dragenter','dragover','dragleave','drop'].forEach(ev => dropzone?.addEventListener(ev, block));
    ['dragenter','dragover'].forEach(ev => dropzone?.addEventListener(ev, () => dropzone.classList.add('is-dragover')));
    ['dragleave','drop'].forEach(ev => dropzone?.addEventListener(ev, () => dropzone.classList.remove('is-dragover')));
    dropzone?.addEventListener('drop', e => this.addLocalFiles(e.dataTransfer.files));

    // Delegación para quitar
    this.gallery?.addEventListener('click', e => {
      const btn = e.target.closest('.rm');
      if (btn) this.removeById(btn.dataset.id);
    });
  }

  // ====== Pinta una miniatura al final (sin limpiar) ======
  appendThumb(it) {
    const fig = document.createElement('figure');
    fig.className = 'cp-thumb';
    fig.dataset.id = it.id;

    const sizeTxt = Number.isFinite(Number(it.size)) ? ` • ${this.humanSize(it.size)}` : '';
    const displayName = it.name || it.url.split('/').pop()?.split('?')[0] || 'Imagen';

    fig.innerHTML = `
      <img class="thumb-img" src="${it.url}" alt="${displayName}" loading="lazy" decoding="async" width="80" height="80">
      <button class="rm" type="button" data-id="${it.id}" aria-label="Quitar imagen">×</button>
      <figcaption class="meta" title="${displayName}">${displayName}${sizeTxt}</figcaption>
    `;

    fig.querySelector('.thumb-img').addEventListener('error', () => fig.classList.add('broken'));
    this.gallery.appendChild(fig);
    return fig;
  }

  // ====== Agrega archivos locales (input/drag) → apéndice ======
  addLocalFiles(fileList) {
    Array.from(fileList || []).forEach(f => {
      if (!this.ACCEPTED.includes(f.type)) { alert(`Unsupported type: ${f.type}`); return; }
      if (f.size > this.MAX_SIZE)           { alert(`${f.name} is too large (${this.humanSize(f.size)}).`); return; }

      const it = {
        id: this.uid(),
        url: URL.createObjectURL(f),
        name: f.name,
        size: f.size,
        origin: 'local',
        file: f
      };
      this.items.push(it);
      this.appendThumb(it); // 👈 apéndice (no limpia)
    });
  }

  // ====== Quitar por id (DOM + estado) ======
  removeById(id) {
    const btn = document.querySelector(`button[data-id="${CSS.escape(id)}"]`);
      if (!btn) return -1;

      // 2) Toma la primera clase del botón
      const cls = btn.classList[0];
      if (!cls) return -1;

      // 3) Busca todos los botones con esa misma clase
      const list = Array.from(document.querySelectorAll(`button.${CSS.escape(cls)}`));

      // 4) Devuelve el índice del botón dentro de esa lista (0, 1, 2, ...)
      var index = list.indexOf(btn);

      // Usar el mismo índice para obtener la imagen correspondiente
      const img = document.querySelectorAll(".thumb-img")[index];

      let src =
        img?.getAttribute('src') ||
        img?.getAttribute('data-src') ||
        img?.getAttribute('data-original') ||
        img?.currentSrc ||
        '';

        src = src.replace(/^(\.\.\/){2}/, "");

      // 'src' es string: obtener pathname con URL para extraer el nombre
      const filename = new URL(src, window.location.href).pathname.split('/').pop();
      const name = decodeURIComponent(filename);

      const allowed = ['jpg','jpeg','png','gif','webp'];

      // obtener extensión (sin el punto)
      const ext = name.split('.').pop().toLowerCase();

      // verificar si NO tiene extensión o NO está permitida
      const validExt = name.includes('.') && allowed.includes(ext);

      if (validExt) {
        this.logic?.deleteImage(src);
      }



    const idx = this.items.findIndex(x => x.id === id);
    if (idx === -1) return;
    const it = this.items[idx];
    if (it.origin === 'local') URL.revokeObjectURL(it.url);
    this.items.splice(idx, 1);
    this.gallery.querySelector(`[data-id="${id}"]`)?.remove();
  }

  // (Opcional) Re-render total si alguna vez lo necesitas
  renderAll() {
    this.gallery.innerHTML = '';
    this.items.forEach(it => this.appendThumb(it));
  }

  renderedIds = new Set();

  basename(p) {
    return String(p || '').split('/').pop()?.split('?')[0] || '';
  }

  normalizeUrl(link) {
    // Tu link viene como "controller/uploads/..." y tu vista está en "view/images/"
    // Por eso anteponemos "../../" para llegar a /controller/...
    if (!link) return '';
    return link.startsWith('http') ? link : `../../${String(link).replace(/^\/+/, '')}`;
  }

  // ====== (Opcional) wrapper para agregar una imagen del servidor manualmente ======
  renderImage(size, name, url) {
    if (!url || !this.gallery) return null;
    const it = {
      id: this.uid(),
      url,
      name,
      size,
      origin: 'server'
    };
    this.items.push(it);
    const el = this.appendThumb(it);
    return { id: it.id, el };
  }

  // ====== Helpers del menú (sin cambios de lógica) ======
  parseNameSkuFromText(text) {
    const raw = (text ?? '').toString().trim();
    if (raw === '') return { name: '', sku: '' };

    const skuPattern = /[A-Z]{3,}-\d{8}-\d{6}-\d{6}-[A-F0-9]{10}/i;

    const anyMatch = raw.match(skuPattern);
    if (anyMatch) {
      const sku  = anyMatch[0].trim();
      const name = raw.replace(skuPattern, '').replace(/[—–\-:()\s]+$/,'').trim();
      return { name: name.replace(/[—–\-:]\s*$/,'').trim(), sku };
    }

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

    const mParen = raw.match(/\(([^)]+)\)\s*$/);
    if (mParen && skuPattern.test(mParen[1])) {
      const sku  = mParen[1].trim();
      const name = raw.slice(0, mParen.index).trim();
      return { name, sku };
    }

    return { name: raw, sku: '' };
  }
}

const imagesClass = new Images();
