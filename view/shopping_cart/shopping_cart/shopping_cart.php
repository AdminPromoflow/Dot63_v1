<?php
function shoppingCartEscape($value): string
{
  return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function shoppingCartCurrency($value): string
{
  return '£' . number_format((float)$value, 2, '.', ',');
}

function shoppingCartImageUrl($value): string
{
  $value = trim((string)$value);
  $fallback = '../preview_product_customers/img/icon_product.png';

  if ($value === '') {
    return $fallback;
  }

  if (preg_match('#^https?://#i', $value) === 1 || strpos($value, 'data:image/') === 0) {
    return $value;
  }

  return '../../' . ltrim($value, '/');
}

$cartItems = is_array($cartItems ?? null) ? $cartItems : [];
$cartLoadError = trim((string)($cartLoadError ?? ''));
$isCartAuthenticated = !empty($isCartAuthenticated);
$emptyTitle = $cartLoadError !== ''
  ? ($isCartAuthenticated ? 'We could not load your shopping cart' : 'Sign in to view your shopping cart')
  : 'No products have been added yet';
$emptyDescription = $cartLoadError !== ''
  ? $cartLoadError
  : 'Browse the available products and select the variations you would like to order.';
$emptyLink = $isCartAuthenticated ? '../product/index.php' : '../log_in/index.php';
$emptyLinkLabel = $isCartAuthenticated ? 'Browse products' : 'Log in';
?>

<main class="shopping-cart-page" aria-labelledby="shopping-cart-title" data-api-url="../../controller/order/cart.php">
  <div class="shopping-cart-shell">

    <header class="shopping-cart-header">
      <div class="shopping-cart-heading">
        <span class="shopping-cart-eyebrow">Your order</span>

        <h1 id="shopping-cart-title">Shopping cart</h1>

        <p>Review your selected products, variations and quantities before proceeding to checkout.</p>
      </div>

      <a href="../product/index.php" class="continue-shopping-link">
        <span aria-hidden="true">←</span>
        <span>Continue shopping</span>
      </a>
    </header>

    <div class="shopping-cart-layout">

      <section class="shopping-cart-products" aria-labelledby="cart-products-title">
        <header class="shopping-cart-products-header">
          <div>
            <span class="section-label">Cart products</span>

            <h2 id="cart-products-title">
              <span id="cart-item-count"><?= count($cartItems) ?></span>
              <span id="cart-item-word"><?= count($cartItems) === 1 ? 'product' : 'products' ?></span>
            </h2>
          </div>

          <button type="button" class="clear-cart-button<?= count($cartItems) === 0 ? ' is-hidden' : '' ?>" id="clear-cart-button">
            Clear cart
          </button>
        </header>

        <div class="cart-items-list<?= count($cartItems) === 0 ? ' is-hidden' : '' ?>" id="cart-items-list">

          <?php foreach ($cartItems as $item): ?>
            <?php
            $cartId = (int)($item['cart_id'] ?? 0);
            $sku = trim((string)($item['sku'] ?? ''));
            $name = trim((string)($item['name'] ?? 'Product'));
            $company = trim((string)($item['company'] ?? ''));
            $image = shoppingCartImageUrl($item['image'] ?? '');
            $quantity = max(1, (int)($item['quantity'] ?? 1));
            $maxQuantity = max(1, (int)($item['max_quantity'] ?? 999));
            $unitPrice = max(0, (float)($item['unit_price'] ?? 0));
            $variations = isset($item['variations']) && is_array($item['variations']) ? $item['variations'] : [];
            $lineTotal = $quantity * $unitPrice;
            ?>

            <article class="cart-item" data-cart-id="<?= $cartId ?>" data-sku="<?= shoppingCartEscape($sku) ?>" data-unit-price="<?= shoppingCartEscape($unitPrice) ?>">

              <div class="cart-item-image-wrapper">
                <img class="cart-item-image" src="<?= shoppingCartEscape($image) ?>" alt="<?= shoppingCartEscape($name) ?>" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='../preview_product_customers/img/icon_product.png'">
              </div>

              <div class="cart-item-content">

                <div class="cart-item-top">
                  <div class="cart-item-information">
                    <?php if ($company !== ''): ?>
                      <span class="cart-item-company"><?= shoppingCartEscape($company) ?></span>
                    <?php endif; ?>

                    <h3 class="cart-item-name"><?= shoppingCartEscape($name) ?></h3>

                    <?php if ($sku !== ''): ?>
                      <span class="cart-item-sku">SKU: <?= shoppingCartEscape($sku) ?></span>
                    <?php endif; ?>
                  </div>

                  <button type="button" class="remove-cart-item" aria-label="Remove <?= shoppingCartEscape($name) ?> from cart" title="Remove product">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 3h6l1 2h4v2h-1l-1 13H6L5 7H4V5h4l1-2Zm-1.92 4 .85 11h8.14l.85-11H7.08ZM10 9h2v7h-2V9Zm4 0h2v7h-2V9Z"/>
                    </svg>
                  </button>
                </div>

                <?php if (count($variations) > 0): ?>
                  <div class="cart-item-variations">
                    <?php foreach ($variations as $variationName => $variationValue): ?>
                      <?php
                      if (is_array($variationValue)) {
                        $variationName = (string)($variationValue['name'] ?? 'Option');
                        $variationValue = (string)($variationValue['value'] ?? '');
                      }
                      ?>
                      <div class="cart-variation">
                        <span class="cart-variation-name"><?= shoppingCartEscape($variationName) ?></span>
                        <strong class="cart-variation-value"><?= shoppingCartEscape($variationValue) ?></strong>
                      </div>
                    <?php endforeach; ?>
                  </div>
                <?php endif; ?>

                <div class="cart-item-bottom">

                  <div class="cart-quantity-wrapper">
                    <span class="cart-control-label">Quantity</span>

                    <div class="cart-quantity-control">
                      <button type="button" class="quantity-button quantity-decrease" aria-label="Decrease quantity">−</button>

                      <input type="number" class="quantity-input" value="<?= $quantity ?>" min="1" max="<?= $maxQuantity ?>" inputmode="numeric" aria-label="Quantity for <?= shoppingCartEscape($name) ?>" data-saved-quantity="<?= $quantity ?>">

                      <button type="button" class="quantity-button quantity-increase" aria-label="Increase quantity">+</button>
                    </div>

                    <?php if ($maxQuantity < 999999): ?>
                      <small class="quantity-limit">Maximum <?= $maxQuantity ?></small>
                    <?php endif; ?>
                  </div>

                  <div class="cart-item-price-information">
                    <span class="cart-unit-price"><?= shoppingCartCurrency($unitPrice) ?> each</span>
                    <strong class="cart-line-total"><?= shoppingCartCurrency($lineTotal) ?></strong>
                  </div>

                </div>

              </div>
            </article>
          <?php endforeach; ?>

        </div>

        <div class="empty-cart-state<?= count($cartItems) > 0 ? ' is-hidden' : '' ?>" id="empty-cart-state">
          <div class="empty-cart-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M7 4H3V2h5.5l1.1 3H21l-2 8H10l-.7-2H18l1-4H10.3l2.3 7H19v2h-7.8L7 4Zm4 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/>
            </svg>
          </div>

          <span class="section-label">Your cart is empty</span>

          <h2><?= shoppingCartEscape($emptyTitle) ?></h2>

          <p><?= shoppingCartEscape($emptyDescription) ?></p>

          <a href="<?= shoppingCartEscape($emptyLink) ?>" class="primary-cart-button"><?= shoppingCartEscape($emptyLinkLabel) ?></a>
        </div>
      </section>

      <aside class="shopping-cart-summary" aria-labelledby="order-summary-title">
        <div class="shopping-cart-summary-card">

          <header class="summary-header">
            <span class="section-label">Order details</span>
            <h2 id="order-summary-title">Order summary</h2>
          </header>

          <div class="summary-lines">
            <div class="summary-line">
              <span>Subtotal</span>
              <strong id="cart-subtotal">£0.00</strong>
            </div>

            <div class="summary-line discount-line is-hidden" id="discount-line">
              <span>Discount</span>
              <strong id="cart-discount">−£0.00</strong>
            </div>

            <div class="summary-line">
              <span>Delivery</span>
              <strong id="cart-delivery">£0.00</strong>
            </div>
          </div>

          <div class="promo-code-section">
            <label for="promo-code-input">Promotional code</label>

            <div class="promo-code-control">
              <input type="text" id="promo-code-input" placeholder="Enter code" autocomplete="off" maxlength="30">
              <button type="button" id="apply-promo-button" <?= count($cartItems) === 0 ? 'disabled' : '' ?>>Apply</button>
            </div>

            <p class="promo-code-message" id="promo-code-message" aria-live="polite"></p>
          </div>

          <div class="summary-total">
            <div>
              <span>Total</span>
              <small>Taxes included where applicable</small>
            </div>

            <strong id="cart-total">£0.00</strong>
          </div>

          <button type="button" class="checkout-button" id="checkout-button" <?= count($cartItems) === 0 ? 'disabled' : '' ?>>
            <span>Proceed to checkout</span>
            <span aria-hidden="true">→</span>
          </button>

          <div class="secure-checkout-note">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2 4 5v6c0 5.1 3.4 9.8 8 11 4.6-1.2 8-5.9 8-11V5l-8-3Zm0 2.2L18 6.5V11c0 4-2.5 7.8-6 9-3.5-1.2-6-5-6-9V6.5l6-2.3Zm-1 4.3h2v3h3v2h-5v-5Z"/>
            </svg>

            <span>Secure checkout and protected order information.</span>
          </div>

        </div>
      </aside>

    </div>
  </div>

  <div class="cart-toast" id="cart-toast" role="status" aria-live="polite"></div>
</main>
