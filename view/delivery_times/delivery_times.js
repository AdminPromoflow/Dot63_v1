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
  document.getElementById('delivery-back').addEventListener('click', () => window.headerAddProduct?.goNext('../../view/prices/index.php'));
  document.getElementById('delivery-next').addEventListener('click', () => window.headerAddProduct?.goNext('../../view/preview_porduct/index.php'));
})();
