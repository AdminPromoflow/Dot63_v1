(() => {
  window.headerAddProduct?.setCurrentHeader('Delivery Times');
  const tabs = Array.from(document.querySelectorAll('.delivery-tabs [role="tab"]'));
  function activate(selected) {
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') target = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs[tabs.length - 1];
      if (!target) return;
      event.preventDefault();
      activate(target);
      target.focus();
    });
  });
  document.querySelectorAll('.delivery-tree').forEach(tree => {
    const rows = Array.from(tree.querySelectorAll('[data-tree-level]'));
    const branches = new Map();
    rows.forEach((row, index) => {
      const next = rows[index + 1];
      const slot = row.querySelector('.delivery-tree-toggle-slot');
      if (!slot || !next || next.dataset.treeProduct !== row.dataset.treeProduct || Number(next.dataset.treeLevel) <= Number(row.dataset.treeLevel)) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'delivery-tree-toggle';
      button.setAttribute('aria-expanded', 'true');
      const name = row.querySelector('strong')?.textContent || 'variation';
      branches.set(row, {button, expanded: true, name});
      slot.appendChild(button);
      button.addEventListener('click', () => {
        const branch = branches.get(row);
        branch.expanded = !branch.expanded;
        refresh();
      });
    });
    function refresh() {
      const ancestors = [];
      rows.forEach(row => {
        const level = Number(row.dataset.treeLevel);
        while (ancestors.length && (ancestors[ancestors.length - 1].product !== row.dataset.treeProduct || ancestors[ancestors.length - 1].level >= level)) ancestors.pop();
        row.hidden = ancestors.some(parent => !parent.expanded);
        const branch = branches.get(row);
        if (branch) {
          branch.button.textContent = branch.expanded ? '▾' : '▸';
          branch.button.setAttribute('aria-expanded', String(branch.expanded));
          branch.button.setAttribute('aria-label', `${branch.expanded ? 'Collapse' : 'Expand'} ${branch.name}`);
          ancestors.push({level, product: row.dataset.treeProduct, expanded: branch.expanded});
        }
      });
    }
    tree.querySelectorAll('[data-tree-action]').forEach(button => {
      button.addEventListener('click', () => {
        branches.forEach(branch => { branch.expanded = button.dataset.treeAction === 'expand'; });
        refresh();
      });
    });
    refresh();
  });
  const dirtyForms = new Set();
  document.querySelectorAll('.delivery-edit-form').forEach(form => {
    const row = form.closest('.delivery-edit-row');
    const status = row.querySelector('.delivery-save-status');
    const controls = Array.from(form.elements);
    row.addEventListener('input', () => {
      dirtyForms.add(form);
      status.textContent = 'Unsaved changes';
    });
    row.addEventListener('change', () => {
      row.querySelector('.delivery-unit').textContent = form.elements.delivery_price_type.value === 'amount' ? '£ (GBP)' : '%';
      dirtyForms.add(form);
      status.textContent = 'Unsaved changes';
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form));
      data.action = form.dataset.kind === 'price' ? 'save_price' : 'save_variation';
      controls.forEach(control => { control.disabled = true; });
      status.textContent = 'Saving…';
      try {
        const response = await fetch('../../controller/products/delivery.php', {
          method: 'POST', credentials: 'same-origin',
          headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Could not save delivery settings.');
        dirtyForms.delete(form);
        status.textContent = 'Saved';
      } catch (error) {
        status.textContent = error.message || 'Could not save delivery settings. Please try again.';
      } finally {
        controls.forEach(control => { control.disabled = false; });
      }
    });
  });
  window.addEventListener('beforeunload', event => {
    if (!dirtyForms.size) return;
    event.preventDefault();
    event.returnValue = '';
  });
  document.getElementById('delivery-back').addEventListener('click', () => window.headerAddProduct?.goNext('../../view/prices/index.php'));
  document.getElementById('delivery-next').addEventListener('click', () => window.headerAddProduct?.goNext('../../view/preview_porduct/index.php'));
})();
