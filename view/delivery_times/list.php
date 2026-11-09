<?php if ($loadError): ?>
  <p class="delivery-message" role="alert">Delivery settings could not be loaded. Refresh the page to try again.</p>
<?php elseif (!$rows): ?>
  <p class="delivery-message">No variations found.</p>
<?php else: ?>
  <div class="delivery-table-wrap">
    <table class="delivery-table">
      <thead><tr><th scope="col">Variation</th><th scope="col">Delivery Time (days)</th><th scope="col">Delivery Price</th></tr></thead>
      <tbody>
      <?php foreach ($rows as $row): ?>
        <tr>
          <th scope="row">
            <strong><?= $escape($row['name'] ?: 'Unnamed variation') ?></strong>
            <small><?= $escape($row['product_name']) ?> · <?= $escape($row['SKU']) ?></small>
          </th>
          <td><?= isset($row['delivery_time_days']) ? $escape($row['delivery_time_days']) : 'Not set' ?></td>
          <td><?= $escape(DeliverySettings::formatPrice($row)) ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
<?php endif; ?>
