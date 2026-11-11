<?php if ($loadError): ?>
  <p class="delivery-message" role="alert">Delivery settings could not be loaded. Refresh the page to try again.</p>
<?php elseif (!$listRows): ?>
  <p class="delivery-message"><?= $kind === 'price' ? 'No variations with configured prices found.' : 'No variations found.' ?></p>
<?php else: ?>
  <div class="delivery-tree">
    <div class="delivery-tree-actions">
      <button type="button" data-tree-action="expand">Expand all</button>
      <button type="button" data-tree-action="collapse">Collapse all</button>
    </div>
  <div class="delivery-table-wrap">
    <table class="delivery-table">
      <thead><tr><th scope="col">Variation<?= $kind === 'price' ? ' / Quantity range' : '' ?></th><th scope="col" colspan="2">Delivery options — days and surcharge</th><th scope="col">Save</th></tr></thead>
      <tbody>
      <?php $previousVariation = null; foreach ($listRows as $row):
          $formId = 'delivery-' . $kind . '-' . (int)($kind === 'price' ? $row['price_id'] : $row['variation_id']);
          $type = $row['delivery_price_type'] ?? 'percentage';
      ?>
        <?php if ($kind === 'price' && $previousVariation !== $row['variation_id']): ?>
          <tr class="delivery-price-group" data-tree-level="<?= (int)($row['level'] ?? 0) ?>" data-tree-product="<?= (int)$row['product_id'] ?>">
            <th colspan="4" scope="rowgroup">
              <div style="padding-left: <?= (int)($row['level'] ?? 0) * 20 ?>px">
                <span class="delivery-tree-toggle-slot"></span>
                <strong><?= $escape($row['name'] ?: 'Unnamed variation') ?></strong>
                <small><?= $escape($row['product_name']) ?> · <?= $escape($row['SKU']) ?></small>
              </div>
            </th>
          </tr>
        <?php endif; $previousVariation = $row['variation_id']; ?>
        <tr class="delivery-edit-row" data-tree-level="<?= (int)($row['level'] ?? 0) + ($kind === 'price' ? 1 : 0) ?>" data-tree-product="<?= (int)$row['product_id'] ?>">
          <th scope="row">
            <div class="delivery-variation" style="padding-left: <?= (int)($row['level'] ?? 0) * 20 ?>px">
              <?php if ($kind === 'variation'): ?><span class="delivery-tree-toggle-slot"></span><?php endif; ?>
              <strong title="<?= $escape($row['parent_path'] ?? '') ?>"><?= !empty($row['level']) ? '<span aria-hidden="true">↳ </span>' : '' ?><?= $escape($row['name'] ?: 'Unnamed variation') ?></strong>
              <small><?= $escape($row['product_name']) ?> · <?= $escape($row['SKU']) ?></small>
              <?php if ($kind === 'price'): ?>
                <small class="delivery-quantity">Qty: <?= $escape($row['min_quantity'] ?? '0') ?>–<?= $escape($row['max_quantity'] ?? 'No limit') ?> · Unit price: £<?= $escape(number_format((float)$row['price'], 2)) ?></small>
                <?php if (!empty($row['parent_path'])): ?><small><?= $escape($row['parent_path']) ?></small><?php endif; ?>
              <?php endif; ?>
            </div>
          </th>
          <td colspan="2">
            <div class="delivery-option-editor" data-form-id="<?= $formId ?>" data-options="<?= $escape(json_encode(DeliveryOptions::fromRow($row))) ?>"></div>
            <button type="button" class="delivery-add-option">+ Add delivery option</button>
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
  </div>
<?php endif; ?>
