export class QuantitySelector {
  constructor(controller) {
    this.controller = controller;
    this.root = document.getElementById('quantity_selector');
    this.slider = document.getElementById('quantity_slider');
    this.input = document.getElementById('quantity_input');
    this.slider?.addEventListener('input', () => this.choose(this.slider.value));
    this.input?.addEventListener('input', () => {
      const quantity = this.input.valueAsNumber;
      if (this.find(quantity)) this.choose(quantity);
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
    return max > 0 ? max : 999999;
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
    quantity = Math.round(quantity);
    let tier = this.find(quantity);
    if (!tier) {
      // Snap gaps and out-of-range entries to the nearest configured quantity.
      const candidates = tiers.flatMap(button => [Number(button.dataset.minQuantity), this.maximum(button)]);
      quantity = candidates.reduce((best, candidate) =>
        Math.abs(candidate - quantity) < Math.abs(best - quantity) ? candidate : best);
      tier = this.find(quantity);
    }
    this.controller.select(tier, quantity);
  }

  sync(quantity) {
    const tiers = this.tiers();
    if (!this.root || !this.slider || !this.input) return;
    this.root.hidden = !tiers.length;
    if (!tiers.length) return;
    const min = Math.min(...tiers.map(button => Number(button.dataset.minQuantity)));
    const max = Math.max(...tiers.map(button => this.maximum(button)));
    for (const input of [this.slider, this.input]) {
      input.min = String(min);
      input.max = String(max);
      input.value = String(quantity);
      input.disabled = min === max;
    }
    this.slider.setAttribute('aria-valuetext', `${quantity.toLocaleString('en-GB')} units`);
    document.getElementById('quantity_min').textContent = min.toLocaleString('en-GB');
    document.getElementById('quantity_max').textContent = max.toLocaleString('en-GB');
  }
}
