<?php if ($loadError): ?>
  <p class="delivery-message" role="alert">Delivery settings could not be loaded. Refresh the page to try again.</p>
<?php elseif (!$listRows): ?>
  <p class="delivery-message"><?= $kind === 'price' ? 'No variations with configured prices found.' : 'No variations found.' ?></p>
<?php else: ?>
  <div class="delivery-table-wrap">
    <table class="delivery-table">
      <thead><tr><th scope="col">Variation<?= $kind === 'price' ? ' / Quantity range' : '' ?></th><th scope="col">Delivery Time (days)</th><th scope="col">Delivery Price</th><th scope="col">Save</th></tr></thead>
      <tbody>
      <?php foreach ($listRows as $row):
          $formId = 'delivery-' . $kind . '-' . (int)($kind === 'price' ? $row['price_id'] : $row['variation_id']);
          $type = $row['delivery_price_type'] ?? 'percentage';
      ?>
        <tr class="delivery-edit-row">
          <th scope="row">
            <div class="delivery-variation" style="padding-left: <?= (int)($row['level'] ?? 0) * 20 ?>px">
              <strong title="<?= $escape($row['parent_path'] ?? '') ?>"><?= !empty($row['level']) ? '<span aria-hidden="true">↳ </span>' : '' ?><?= $escape($row['name'] ?: 'Unnamed variation') ?></strong>
              <small><?= $escape($row['product_name']) ?> · <?= $escape($row['SKU']) ?></small>
              <?php if ($kind === 'price'): ?>
                <small class="delivery-quantity">Qty: <?= $escape($row['min_quantity'] ?? '0') ?>–<?= $escape($row['max_quantity'] ?? 'No limit') ?> · Unit price: £<?= $escape(number_format((float)$row['price'], 2)) ?></small>
                <?php if (!empty($row['parent_path'])): ?><small><?= $escape($row['parent_path']) ?></small><?php endif; ?>
              <?php endif; ?>
            </div>
          </th>
          <td><input form="<?= $formId ?>" name="delivery_time_days" type="number" min="0" max="65535" step="1" value="<?= $escape($row['delivery_time_days'] ?? '') ?>" placeholder="Not set" aria-label="Delivery Time (days)"></td>
          <td>
            <div class="delivery-amount"><input form="<?= $formId ?>" name="delivery_price" type="number" min="0" max="9999999999.99" step="0.01" value="<?= $escape($row['delivery_price'] ?? '') ?>" placeholder="No surcharge" aria-label="Delivery Price"><span class="delivery-unit"><?= $type === 'amount' ? '£ (GBP)' : '%' ?></span></div>
            <select form="<?= $formId ?>" name="delivery_price_type" aria-label="Delivery Price type">
              <option value="percentage" <?= $type === 'percentage' ? 'selected' : '' ?>>Percentage (%)</option>
              <option value="amount" <?= $type === 'amount' ? 'selected' : '' ?>>Monetary amount (£ GBP)</option>
            </select>
          </td>
          <td>
            <form id="<?= $formId ?>" class="delivery-edit-form" data-kind="<?= $kind ?>">
              <input type="hidden" name="sku" value="<?= $escape($row['product_sku']) ?>">
              <input type="hidden" name="sku_variation" value="<?= $escape($row['SKU']) ?>">
              <?php if ($kind === 'price'): ?><input type="hidden" name="id_price" value="<?= (int)$row['price_id'] ?>"><?php endif; ?>
              <button type="submit">Save</button>
              <span class="delivery-save-status" role="status" aria-live="polite"></span>
            </form>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
<?php endif; ?>
