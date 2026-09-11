export class QuantitySelector {
  constructor(controller) {
    this.controller = controller;
    this.root = document.getElementById('quantity_selector');
    this.slider = document.getElementById('quantity_slider');
    this.input = document.getElementById('quantity_input');
    this.slider?.addEventListener('input', () => this.choose(this.slider.value));
    this.input?.addEventListener('input', () => {
      const quantity = this.input.valueAsNumber;
      if (Number.isSafeInteger(quantity) && quantity > 0) this.choose(quantity);
    });
    this.input?.addEventListener('change', () => this.choose(this.input.valueAsNumber));
    this.input?.addEventListener('blur', () => this.choose(this.input.valueAsNumber));
    this.input?.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.choose(this.input.valueAsNumber);
      }
    });
  }

  tiers() {
    return Array.from(this.controller.root?.querySelectorAll('.price-tier') || []);
  }

  maximum(button) {
    const max = Number(button.dataset.maxQuantity);
    return max > 0 ? max : Number.MAX_SAFE_INTEGER;
  }

  find(quantity) {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return null;
    return this.tiers().reverse().find(button => quantity >= Number(button.dataset.minQuantity)
      && quantity <= this.maximum(button));
  }

  choose(value) {
    const tiers = this.tiers();
    if (!tiers.length) return;
    let quantity = Number(value);
    if (!Number.isFinite(quantity)) quantity = this.controller.store.selectedQuantity;
    quantity = Math.max(1, Math.round(quantity));
    if (!Number.isSafeInteger(quantity)) return;
    const tier = this.find(quantity);
    this.controller.select(tier, quantity);
  }

  sync(quantity) {
    const tiers = this.tiers();
    if (!this.root || !this.slider || !this.input) return;
    this.root.hidden = !tiers.length;
    if (!tiers.length) return;
    const min = 1;
    const max = 20000;
    this.slider.min = String(min);
    this.slider.max = String(max);
    this.slider.value = String(Math.min(max, Math.max(min, quantity)));
    this.slider.disabled = false;
    this.input.min = String(min);
    this.input.removeAttribute('max');
    this.input.value = String(quantity);
    this.input.disabled = false;
    this.slider.setAttribute('aria-valuetext', `${Number(this.slider.value).toLocaleString('en-GB')} units`);
    document.getElementById('quantity_min').textContent = min.toLocaleString('en-GB');
    document.getElementById('quantity_max').textContent = max.toLocaleString('en-GB');
  }
}
