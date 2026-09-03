<?php
function checkoutEscape($value): string
{
  return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function checkoutValue($value): string
{
  $value = trim((string)$value);
  return $value !== '' ? $value : 'Not provided';
}

function checkoutCurrency($value): string
{
  return '£' . number_format((float)$value, 2, '.', ',');
}

function checkoutImageUrl($value): string
{
  $value = trim((string)$value);
  if ($value === '') {
    return '../preview_product_customers/img/icon_product.png';
  }

  if (preg_match('#^https?://#i', $value) === 1 || strpos($value, 'data:image/') === 0) {
    return $value;
  }

  return '../../' . ltrim($value, '/');
}

$checkoutItems = is_array($checkoutItems ?? null) ? $checkoutItems : [];
$checkoutSuppliers = is_array($checkoutSuppliers ?? null) ? $checkoutSuppliers : [];
$checkoutAddresses = is_array($checkoutAddresses ?? null) ? $checkoutAddresses : [];
$checkoutLoadError = trim((string)($checkoutLoadError ?? ''));
$checkoutCustomerName = trim((string)($checkoutCustomerName ?? ''));
$checkoutEmail = trim((string)($checkoutEmail ?? ''));
$hasCheckoutItems = count($checkoutItems) > 0;
$hasCheckoutAddresses = count($checkoutAddresses) > 0;
$nameParts = preg_split('/\s+/', $checkoutCustomerName, 2) ?: [];
$defaultFirstName = (string)($nameParts[0] ?? '');
$defaultLastName = (string)($nameParts[1] ?? '');
?>

<main
  class="checkout-page"
  id="checkout-main"
  data-has-items="<?= $hasCheckoutItems ? 'true' : 'false' ?>"
  data-has-addresses="<?= $hasCheckoutAddresses ? 'true' : 'false' ?>"
>
  <div class="checkout-shell">
    <nav class="checkout-breadcrumbs" aria-label="Breadcrumb">
      <a href="../shopping_cart/index.php">Shopping cart</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Checkout</span>
    </nav>

    <header class="checkout-header">
      <div>
        <span class="checkout-eyebrow">Secure checkout</span>
        <h1>Complete your order</h1>
        <p>Confirm the supplier and delivery details before continuing to secure payment.</p>
      </div>

      <ol class="checkout-steps" aria-label="Checkout progress">
        <li class="is-complete">
          <span aria-hidden="true">✓</span>
          <small>Cart</small>
        </li>
        <li class="is-active">
          <span>2</span>
          <small>Details</small>
        </li>
        <li>
          <span>3</span>
          <small>Payment</small>
        </li>
      </ol>
    </header>

    <?php if ($checkoutLoadError !== ''): ?>
      <div class="checkout-alert" role="status">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5m0 3.5v.1M10.3 4.4 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0Z"/></svg>
        <span><?= checkoutEscape($checkoutLoadError) ?></span>
      </div>
    <?php endif; ?>

    <div class="checkout-layout">
      <div class="checkout-content">
        <section class="checkout-section" aria-labelledby="supplier-section-title">
          <header class="checkout-section-header">
            <div class="section-number" aria-hidden="true">1</div>
            <div>
              <span class="section-kicker">Fulfilment</span>
              <h2 id="supplier-section-title">Supplier details</h2>
              <p>Contact and dispatch information for the supplier<?= count($checkoutSuppliers) === 1 ? '' : 's' ?> in this order.</p>
            </div>
            <span class="section-count"><?= count($checkoutSuppliers) ?> <?= count($checkoutSuppliers) === 1 ? 'supplier' : 'suppliers' ?></span>
          </header>

          <?php if (count($checkoutSuppliers) > 0): ?>
            <div class="supplier-list">
              <?php foreach ($checkoutSuppliers as $supplier): ?>
                <?php
                $supplierCompany = checkoutValue($supplier['company_name'] ?? '');
                $supplierInitial = function_exists('mb_substr')
                  ? mb_substr($supplierCompany, 0, 1, 'UTF-8')
                  : substr($supplierCompany, 0, 1);
                ?>
                <article class="supplier-card">
                  <div class="supplier-card-heading">
                    <span class="supplier-avatar" aria-hidden="true"><?= checkoutEscape(strtoupper($supplierInitial)) ?></span>
                    <div>
                      <span>Supplier #<?= (int)($supplier['supplier_id'] ?? 0) ?></span>
                      <h3><?= checkoutEscape($supplierCompany) ?></h3>
                    </div>
                    <span class="verified-badge">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 12 2.2 2.2 4.8-5"/><circle cx="12" cy="12" r="9"/></svg>
                      Order supplier
                    </span>
                  </div>

                  <dl class="supplier-details">
                    <div>
                      <dt>Contact name</dt>
                      <dd><?= checkoutEscape(checkoutValue($supplier['contact_name'] ?? '')) ?></dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd><?= checkoutEscape(checkoutValue($supplier['email'] ?? '')) ?></dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd><?= checkoutEscape(checkoutValue($supplier['phone'] ?? '')) ?></dd>
                    </div>
                    <div>
                      <dt>Country</dt>
                      <dd><?= checkoutEscape(checkoutValue($supplier['country'] ?? '')) ?></dd>
                    </div>
                    <div>
                      <dt>City</dt>
                      <dd><?= checkoutEscape(checkoutValue($supplier['city'] ?? '')) ?></dd>
                    </div>
                    <div>
                      <dt>Postal code</dt>
                      <dd><?= checkoutEscape(checkoutValue($supplier['postal_code'] ?? '')) ?></dd>
                    </div>
                    <div class="supplier-detail-wide">
                      <dt>Address line 1</dt>
                      <dd><?= checkoutEscape(checkoutValue($supplier['address_line1'] ?? '')) ?></dd>
                    </div>
                    <div class="supplier-detail-wide">
                      <dt>Address line 2</dt>
                      <dd><?= checkoutEscape(checkoutValue($supplier['address_line2'] ?? '')) ?></dd>
                    </div>
                  </dl>
                </article>
              <?php endforeach; ?>
            </div>
          <?php else: ?>
            <div class="checkout-empty-inline">
              <span class="empty-inline-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M4 20V8l8-4 8 4v12M8 20v-6h8v6M8 10h.01M12 10h.01M16 10h.01"/></svg>
              </span>
              <div>
                <strong>No supplier details to display</strong>
                <p>Supplier information will appear here when the cart contains products.</p>
              </div>
            </div>
          <?php endif; ?>
        </section>

        <section class="checkout-section" id="delivery-address-section" aria-labelledby="address-section-title">
          <header class="checkout-section-header">
            <div class="section-number" aria-hidden="true">2</div>
            <div>
              <span class="section-kicker">Delivery</span>
              <h2 id="address-section-title">Delivery address</h2>
              <p>Select a saved address or add a different destination for this order.</p>
            </div>
            <button class="add-address-button" id="add-address-button" type="button" aria-expanded="<?= $hasCheckoutAddresses ? 'false' : 'true' ?>" aria-controls="new-address-panel">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              <span>Add address</span>
            </button>
          </header>

          <div class="address-list<?= $hasCheckoutAddresses ? '' : ' is-empty' ?>" id="address-list">
            <?php foreach ($checkoutAddresses as $index => $address): ?>
              <?php
              $addressId = (int)($address['address_id'] ?? 0);
              $addressName = trim((string)($address['first_name'] ?? '') . ' ' . (string)($address['last_name'] ?? ''));
              ?>
              <label class="address-card<?= $index === 0 ? ' is-selected' : '' ?>">
                <input type="radio" name="delivery_address" value="<?= $addressId ?>" <?= $index === 0 ? 'checked' : '' ?>>
                <span class="address-radio" aria-hidden="true"></span>
                <span class="address-card-content">
                  <span class="address-card-top">
                    <span>
                      <small>Address #<?= $addressId ?></small>
                      <strong><?= checkoutEscape(checkoutValue($addressName)) ?></strong>
                    </span>
                    <?php if ($index === 0): ?><em>Default</em><?php endif; ?>
                  </span>
                  <?php if (trim((string)($address['company_name'] ?? '')) !== ''): ?>
                    <span class="address-company"><?= checkoutEscape((string)$address['company_name']) ?></span>
                  <?php endif; ?>
                  <span><?= checkoutEscape(checkoutValue($address['street_address_1'] ?? '')) ?></span>
                  <?php if (trim((string)($address['street_address_2'] ?? '')) !== ''): ?>
                    <span><?= checkoutEscape((string)$address['street_address_2']) ?></span>
                  <?php endif; ?>
                  <span><?= checkoutEscape(trim((string)($address['town_city'] ?? '') . ' ' . (string)($address['postcode'] ?? ''))) ?></span>
                  <span><?= checkoutEscape(checkoutValue($address['country'] ?? '')) ?></span>
                  <span class="address-contact">
                    <span><?= checkoutEscape(checkoutValue($address['email'] ?? '')) ?></span>
                    <span><?= checkoutEscape(checkoutValue($address['phone'] ?? '')) ?></span>
                  </span>
                </span>
              </label>
            <?php endforeach; ?>

            <div class="address-empty-state<?= $hasCheckoutAddresses ? ' is-hidden' : '' ?>" id="address-empty-state">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
              </span>
              <div>
                <strong>No saved addresses yet</strong>
                <p>Add a delivery address below to continue with this checkout.</p>
              </div>
            </div>
          </div>

          <div class="new-address-panel<?= $hasCheckoutAddresses ? '' : ' is-open' ?>" id="new-address-panel" <?= $hasCheckoutAddresses ? 'hidden' : '' ?>>
            <div class="new-address-heading">
              <div>
                <span class="section-kicker">New destination</span>
                <h3>Add another address</h3>
                <p>This prototype keeps the new address only on this page. It is not saved to the database yet.</p>
              </div>
              <button class="close-address-button" id="close-address-button" type="button" aria-label="Close new address form" <?= $hasCheckoutAddresses ? '' : 'hidden' ?>>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
              </button>
            </div>

            <form class="address-form" id="address-form" novalidate>
              <div class="form-field">
                <label for="address-first-name">First name <span>*</span></label>
                <input id="address-first-name" name="first_name" type="text" maxlength="50" autocomplete="given-name" value="<?= checkoutEscape($defaultFirstName) ?>" required>
                <small class="field-error"></small>
              </div>
              <div class="form-field">
                <label for="address-last-name">Last name <span>*</span></label>
                <input id="address-last-name" name="last_name" type="text" maxlength="50" autocomplete="family-name" value="<?= checkoutEscape($defaultLastName) ?>" required>
                <small class="field-error"></small>
              </div>
              <div class="form-field">
                <label for="address-company">Company name</label>
                <input id="address-company" name="company_name" type="text" maxlength="50" autocomplete="organization">
                <small class="field-error"></small>
              </div>
              <div class="form-field">
                <label for="address-phone">Phone <span>*</span></label>
                <input id="address-phone" name="phone" type="tel" maxlength="50" autocomplete="tel" required>
                <small class="field-error"></small>
              </div>
              <div class="form-field form-field-wide">
                <label for="address-email">Email <span>*</span></label>
                <input id="address-email" name="email" type="email" maxlength="50" autocomplete="email" value="<?= checkoutEscape($checkoutEmail) ?>" required>
                <small class="field-error"></small>
              </div>
              <div class="form-field form-field-wide">
                <label for="address-line-1">Street address <span>*</span></label>
                <input id="address-line-1" name="street_address_1" type="text" maxlength="50" autocomplete="address-line1" placeholder="House number and street name" required>
                <small class="field-error"></small>
              </div>
              <div class="form-field form-field-wide">
                <label for="address-line-2">Address line 2</label>
                <input id="address-line-2" name="street_address_2" type="text" maxlength="50" autocomplete="address-line2" placeholder="Apartment, suite, unit, etc. (optional)">
                <small class="field-error"></small>
              </div>
              <div class="form-field">
                <label for="address-town">Town / City <span>*</span></label>
                <input id="address-town" name="town_city" type="text" maxlength="50" autocomplete="address-level2" required>
                <small class="field-error"></small>
              </div>
              <div class="form-field">
                <label for="address-postcode">Postcode <span>*</span></label>
                <input id="address-postcode" name="postcode" type="text" maxlength="50" autocomplete="postal-code" required>
                <small class="field-error"></small>
              </div>
              <div class="form-field form-field-wide">
                <label for="address-country">Country <span>*</span></label>
                <input id="address-country" name="country" type="text" maxlength="50" autocomplete="country-name" required>
                <small class="field-error"></small>
              </div>

              <div class="address-form-actions">
                <button class="secondary-button" id="cancel-address-button" type="button" <?= $hasCheckoutAddresses ? '' : 'hidden' ?>>Cancel</button>
                <button class="save-address-button" type="submit">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>
                  Use this address
                </button>
              </div>
            </form>
          </div>
        </section>

        <section class="checkout-section payment-section" aria-labelledby="payment-section-title">
          <header class="checkout-section-header">
            <div class="section-number" aria-hidden="true">3</div>
            <div>
              <span class="section-kicker">Payment</span>
              <h2 id="payment-section-title">Secure card payment</h2>
              <p>Card information will be collected and protected directly by Stripe.</p>
            </div>
            <span class="stripe-status"><span></span>Ready for Stripe</span>
          </header>

          <div class="stripe-placeholder" aria-label="Reserved area for the Stripe payment element">
            <div class="stripe-placeholder-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg>
            </div>
            <div>
              <strong>Stripe Payment Element</strong>
              <p>The secure Stripe card form will load in this area once the payment integration is connected.</p>
            </div>
            <span class="stripe-wordmark">stripe</span>
          </div>

          <div class="payment-security-note">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6V10Zm6 4v2"/></svg>
            <span>Your checkout will not store or process raw card details on PromoFlow servers.</span>
          </div>
        </section>
      </div>

      <aside class="checkout-summary" aria-labelledby="checkout-summary-title">
        <div class="checkout-summary-card">
          <header class="summary-heading">
            <div>
              <span class="section-kicker">Your order</span>
              <h2 id="checkout-summary-title">Order summary</h2>
            </div>
            <a href="../shopping_cart/index.php">Edit cart</a>
          </header>

          <?php if ($hasCheckoutItems): ?>
            <div class="summary-products">
              <?php foreach ($checkoutItems as $item): ?>
                <?php
                $itemName = trim((string)($item['name'] ?? 'Product'));
                $itemQuantity = max(1, (int)($item['quantity'] ?? 1));
                $itemTotal = $itemQuantity * max(0, (float)($item['unit_price'] ?? 0));
                ?>
                <article class="summary-product">
                  <div class="summary-product-image">
                    <img src="<?= checkoutEscape(checkoutImageUrl($item['image'] ?? '')) ?>" alt="" loading="lazy" onerror="this.onerror=null;this.src='../preview_product_customers/img/icon_product.png'">
                    <span><?= $itemQuantity ?></span>
                  </div>
                  <div class="summary-product-copy">
                    <strong><?= checkoutEscape($itemName) ?></strong>
                    <span><?= checkoutEscape(checkoutValue($item['company'] ?? '')) ?></span>
                    <small>Qty <?= $itemQuantity ?></small>
                  </div>
                  <strong class="summary-product-price"><?= checkoutCurrency($itemTotal) ?></strong>
                </article>
              <?php endforeach; ?>
            </div>
          <?php else: ?>
            <div class="summary-empty">
              <strong>Your cart is empty</strong>
              <p>Add a product before continuing to checkout.</p>
              <a href="../product/index.php">Browse products</a>
            </div>
          <?php endif; ?>

          <div class="summary-totals">
            <div>
              <span>Subtotal</span>
              <strong><?= checkoutCurrency($checkoutSubtotal ?? 0) ?></strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong><?= (float)($checkoutDelivery ?? 0) === 0.0 ? 'Free' : checkoutCurrency($checkoutDelivery) ?></strong>
            </div>
            <div class="summary-grand-total">
              <span>
                <strong>Total</strong>
                <small>GBP · Taxes included where applicable</small>
              </span>
              <strong><?= checkoutCurrency($checkoutTotal ?? 0) ?></strong>
            </div>
          </div>

          <button class="pay-button" id="pay-button" type="button" <?= $hasCheckoutItems ? '' : 'disabled' ?>>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6V10Z"/></svg>
            <span>Continue to secure payment</span>
          </button>

          <p class="summary-disclaimer">Payment is not active yet. This button will start Stripe Checkout once the integration is connected.</p>

          <div class="summary-assurance">
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-8"/></svg>
              Supplier verified
            </span>
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z"/></svg>
              Secure payment
            </span>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <div class="checkout-toast" id="checkout-toast" role="status" aria-live="polite"></div>
</main>
