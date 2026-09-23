// header_add_product.js
class HeaderAddProduct {
  constructor(root = '.cp-tabs') {
    this.selectionRoot = document.getElementById('editor_selection');
    this.selectionRequest = null;
    this.refreshSelection();
    const cp_tab = document.querySelectorAll(".cp-tab");
    for (var i = 0; i < cp_tab.length; i++) {
      cp_tab[i].addEventListener("click", e => this.handleIClick(e));
    }
  }

  async refreshSelection() {
    if (!this.selectionRoot) return;
    this.selectionRequest?.abort();
    const request = new AbortController();
    this.selectionRequest = request;
    const params = new URLSearchParams(window.location.search);
    const sku = String(params.get('sku') || '').trim();
    const section = this.selectionRoot.closest('.editor-selection');
    const notice = document.getElementById('editor_selection_notice');
    if (notice) notice.hidden = true;
    section?.setAttribute('aria-busy', 'true');
    if (!sku) {
      this.renderSelection({});
      section?.setAttribute('aria-busy', 'false');
      return;
    }
    try {
      const response = await fetch('../../controller/products/product.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        signal: request.signal,
        body: JSON.stringify({action: 'get_editor_selection', sku, sku_variation: params.get('sku_variation') || ''})
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error('Selection unavailable');
      if (this.selectionRequest === request) this.renderSelection(payload.selection);
    } catch (error) {
      if (error.name === 'AbortError' || this.selectionRequest !== request) return;
      this.renderSelection({}, '—');
      if (notice) {
        notice.textContent = 'The current selection could not be loaded. Refresh the page to try again.';
        notice.hidden = false;
      }
    } finally {
      if (this.selectionRequest === request) section?.setAttribute('aria-busy', 'false');
    }
  }

  renderSelection(selection = {}, emptyLabel = 'Not selected') {
    this.selectionRoot?.querySelectorAll('[data-selection-value]').forEach(element => {
      const value = String(selection[element.dataset.selectionValue] || '').trim();
      element.textContent = value || emptyLabel;
      element.classList.toggle('is-empty', !value);
    });
  }

  goNext(url) {
    if (!url) return;
    const current = new URL(window.location.href);
    const dest = new URL(url, current);
    const sku = (current.searchParams.get("sku") || "").trim();
    const skuv = (current.searchParams.get("sku_variation") || "").trim();
    const mode = (current.searchParams.get("mode") || "").trim();
    if (sku) dest.searchParams.set("sku", sku);
    if (skuv) dest.searchParams.set("sku_variation", skuv);
    if (mode) dest.searchParams.set("mode", mode);
    window.location.assign(dest);
  }

  setCurrentHeader(label) {
    // Asegura el root por si no quedó seteado
    this.root = this.root || document.querySelector('.cp-tabs');
    if (!this.root) return;
    const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const wanted = norm(label);
    const tabs = this.root.querySelectorAll('a.cp-tab');
    let target = null;
    tabs.forEach(a => {
      // limpiar estado
      a.classList.remove('active');
      a.removeAttribute('aria-current');

      // elegir objetivo (por data-tab si existe; si no, por texto)
      const key = a.dataset.tab ? norm(a.dataset.tab) : norm(a.textContent);
      if (!target && key === wanted) target = a;
    });
    if (target) {
      target.classList.add('active');
      target.setAttribute('aria-current', 'page');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }

  handleIClick(e) {
    e.preventDefault();
    const href = e.currentTarget ? e.currentTarget.dataset.href : null;
    window.headerAddProduct.goNext(href);
  }
}
window.headerAddProduct = new HeaderAddProduct();
