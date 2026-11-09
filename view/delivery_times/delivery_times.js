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
