<?php
// Delivery estimate options: update the labels and percentages here when rates change.
$deliveryOptions = [
  ['id' => 'normal', 'label' => 'Normal', 'surcharge' => 0],
  ['id' => '10wd', 'label' => '10 working days (wd)', 'surcharge' => 25],
  ['id' => '8wd', 'label' => '8 working days (wd)', 'surcharge' => 50],
];

?>
          <fieldset class="delivery-options" id="delivery_options" aria-describedby="delivery_help">
            <legend>Delivery</legend>
            <p id="delivery_help">Choose a delivery option. The surcharge applies to the base subtotal and extras.</p>
            <div class="delivery-options-list">
              <?php foreach ($deliveryOptions as $deliveryOption): ?>
                <label class="delivery-option">
                  <input type="radio" name="delivery_option"
                    value="<?= htmlspecialchars($deliveryOption['id']) ?>"
                    data-surcharge="<?= (int)$deliveryOption['surcharge'] ?>"
                    <?= $deliveryOption['id'] === 'normal' ? 'checked' : '' ?>>
                  <span class="delivery-option-copy">
                    <strong><?= htmlspecialchars($deliveryOption['label']) ?></strong>
                    <small><?= 100 + (int)$deliveryOption['surcharge'] ?>% of job value</small>
                  </span>
                  <span class="delivery-option-rate">+<?= (int)$deliveryOption['surcharge'] ?>%</span>
                </label>
              <?php endforeach; ?>
            </div>
          </fieldset>
