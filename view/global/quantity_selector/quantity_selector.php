<link rel="stylesheet" href="../../view/global/quantity_selector/quantity_selector.css?v=<?= filemtime(__DIR__ . '/quantity_selector.css') ?>">
<div id="quantity_selector" class="quantity-selector" hidden>
  <div class="quantity-selector__heading">
    <label for="quantity_input">Quantity</label>
    <div class="quantity-selector__number">
      <input id="quantity_input" type="number" min="1" step="1" inputmode="numeric" aria-describedby="quantity_help">
      <span>units</span>
    </div>
  </div>
  <input id="quantity_slider" class="quantity-selector__slider" type="range" min="1" step="1" aria-label="Quantity" aria-describedby="quantity_help">
  <div class="quantity-selector__limits" aria-hidden="true"><span id="quantity_min"></span><span id="quantity_max"></span></div>
  <p id="quantity_help">Slide or enter a quantity. Pricing updates automatically within the available ranges.</p>
</div>
