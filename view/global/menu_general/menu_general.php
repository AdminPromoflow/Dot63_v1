<?php
if (session_status() !== PHP_SESSION_ACTIVE && !headers_sent()) {
    session_start();
}

$menuCssFile = __DIR__ . '/menu_general.css';
$menuJsFile = __DIR__ . '/menu_general.js';
$menuCssVersion = is_file($menuCssFile) ? filemtime($menuCssFile) : time();
$menuJsVersion = is_file($menuJsFile) ? filemtime($menuJsFile) : time();

$isCustomerLoggedIn = !empty($_SESSION['customer_login'])
    && (int)($_SESSION['customer_id'] ?? 0) > 0
    && trim((string)($_SESSION['customer_email'] ?? '')) !== '';
$isSupplierLoggedIn = !empty($_SESSION['login'])
    && trim((string)($_SESSION['email'] ?? '')) !== '';
$isLoggedIn = $isCustomerLoggedIn || $isSupplierLoggedIn;
$sessionType = $isCustomerLoggedIn ? 'customer' : ($isSupplierLoggedIn ? 'supplier' : 'guest');

$customerName = trim((string)($_SESSION['customer_name'] ?? ''));
$customerEmail = $isCustomerLoggedIn
    ? trim((string)($_SESSION['customer_email'] ?? ''))
    : trim((string)($_SESSION['email'] ?? ''));
$customerLabel = $customerName !== '' ? $customerName : $customerEmail;
$initialSource = $customerName !== '' ? $customerName : $customerEmail;
$customerInitial = $initialSource !== ''
    ? (function_exists('mb_substr') ? mb_substr($initialSource, 0, 1, 'UTF-8') : substr($initialSource, 0, 1))
    : 'U';
$customerInitial = function_exists('mb_strtoupper')
    ? mb_strtoupper($customerInitial, 'UTF-8')
    : strtoupper($customerInitial);

$cartCount = max(0, (int)($_SESSION['shopping_cart_count'] ?? 0));
if ($cartCount === 0 && !empty($_SESSION['shopping_cart_job_ids']) && is_array($_SESSION['shopping_cart_job_ids'])) {
    $cartCount = count(array_unique(array_map('intval', $_SESSION['shopping_cart_job_ids'])));
}
if ($cartCount === 0 && !empty($_SESSION['shopping_cart']) && is_array($_SESSION['shopping_cart'])) {
    $cartCount = count($_SESSION['shopping_cart']);
}

$currentPath = (string)(parse_url((string)($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?? '');
$isProductPage = strpos($currentPath, '/view/product/') !== false
    || strpos($currentPath, '/view/preview_product_customers/') !== false;
$isAboutPage = strpos($currentPath, '/view/about_us/') !== false;
$isCartPage = strpos($currentPath, '/view/shopping_cart/') !== false
    || strpos($currentPath, '/view/checkout/') !== false;
$escapeMenu = static fn($value): string => htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
$logoutUrl = $isCustomerLoggedIn
    ? '../../controller/customers/login.php'
    : '../../controller/users/login.php';
$logoutAction = $isCustomerLoggedIn ? 'logout_customer' : 'logout_supplier';
?>

<link rel="stylesheet" href="../../view/global/menu_general/menu_general.css?v=<?= $menuCssVersion ?>">

<header
  class="general-menu"
  id="general-menu"
  data-cart-count="<?= $cartCount ?>"
  data-session-type="<?= $sessionType ?>"
  data-cart-status-url="../../controller/order/cart.php"
  data-logout-url="<?= $logoutUrl ?>"
  data-logout-action="<?= $logoutAction ?>"
  data-logout-redirect="../../view/main/index.php"
>
  <a class="general-menu__brand" href="../../view/main/index.php" aria-label="PromoFlow, home">
    <span class="general-menu__brand-mark"><span aria-hidden="true">.</span>63</span>
    <span class="general-menu__brand-name">PromoFlow</span>
  </a>

  <button
    class="general-menu__toggle"
    type="button"
    aria-label="Open navigation"
    aria-controls="general-menu-navigation"
    aria-expanded="false"
  >
    <span></span>
    <span></span>
    <span></span>
  </button>

  <div class="general-menu__backdrop" aria-hidden="true"></div>

  <nav class="general-menu__nav" id="general-menu-navigation" aria-label="Main navigation">
    <ul class="general-menu__list">
      <li>
        <a class="general-menu__link<?= $isProductPage ? ' is-active' : '' ?>" href="../../view/product/index.php"<?= $isProductPage ? ' aria-current="page"' : '' ?>>
          Products
        </a>
      </li>
      <li>
        <a class="general-menu__link<?= $isAboutPage ? ' is-active' : '' ?>" href="../../view/about_us/index.php"<?= $isAboutPage ? ' aria-current="page"' : '' ?>>
          About us
        </a>
      </li>
      <li class="general-menu__cart-item">
        <a
          class="general-menu__cart<?= $isCartPage ? ' is-active' : '' ?>"
          id="general-menu-cart"
          href="../../view/shopping_cart/index.php"
          aria-label="Shopping cart<?= $cartCount > 0 ? ', contains products' : ', empty' ?>"
          <?= $isCartPage ? 'aria-current="page"' : '' ?>
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 4h2l1.9 9.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.5L20 7H6.1M9 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
          </svg>
          <span class="general-menu__cart-text">Cart</span>
          <span class="general-menu__cart-dot<?= $cartCount > 0 ? ' is-visible' : '' ?>" aria-hidden="true"></span>
        </a>
      </li>

      <?php if ($isLoggedIn): ?>
        <li class="general-menu__account">
          <span class="general-menu__avatar" aria-hidden="true"><?= $escapeMenu($customerInitial) ?></span>
          <span class="general-menu__account-copy">
            <small>Signed in as</small>
            <strong title="<?= $escapeMenu($customerLabel) ?>"><?= $escapeMenu($customerLabel) ?></strong>
          </span>
        </li>
        <li>
          <button class="general-menu__logout" id="customer-menu-logout" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4m4-4H9"/>
            </svg>
            <span>Log out</span>
          </button>
        </li>
      <?php else: ?>
        <li class="general-menu__login-item">
          <a class="general-menu__login" href="../../view/log_in/index.php">Log in</a>
        </li>
        <li>
          <a class="general-menu__signup" href="../../view/sign_up/index.php">Create account</a>
        </li>
      <?php endif; ?>
    </ul>
    <p class="general-menu__status" id="general-menu-status" aria-live="polite"></p>
  </nav>
</header>

<script src="../../view/global/menu_general/menu_general.js?v=<?= $menuJsVersion ?>" defer></script>
