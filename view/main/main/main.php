<?php
declare(strict_types=1);

$mainCssFile = __DIR__ . '/main.css';
$mainJsFile = __DIR__ . '/main.js';
?>
<link rel="stylesheet" href="../../view/main/main/main.css?v=<?= is_file($mainCssFile) ? filemtime($mainCssFile) : time() ?>">

<main class="home" id="main-content">
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__glow hero__glow--one" aria-hidden="true"></div>
    <div class="hero__glow hero__glow--two" aria-hidden="true"></div>

    <div class="hero__content">
      <p class="eyebrow"><span></span> Custom products, minus the hassle</p>
      <h1 id="hero-title">Your brand deserves to be <em>remembered.</em></h1>
      <p class="hero__lead">From everyday essentials to event-ready merch, bring your ideas to life with quality products and a process that just flows.</p>

      <div class="hero__actions">
        <a class="button button--primary" href="../../view/product/index.php">
          Explore products
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </a>
        <?php if (!$isCustomerLoggedIn): ?>
          <button class="button button--ghost" type="button" data-auth-open="register">Create free account</button>
        <?php else: ?>
          <a class="button button--ghost" href="../../view/shopping_cart/index.php">View your cart</a>
        <?php endif; ?>
      </div>

      <ul class="hero__trust" aria-label="Service benefits">
        <li><span aria-hidden="true">✓</span> Curated quality</li>
        <li><span aria-hidden="true">✓</span> Friendly support</li>
        <li><span aria-hidden="true">✓</span> Clear pricing</li>
      </ul>
    </div>

    <div class="hero__visual" aria-label="A selection of customizable promotional products">
      <div class="hero__badge hero__badge--top">
        <span class="hero__badge-icon" aria-hidden="true">✦</span>
        <span><small>Made for your brand</small><strong>Stand out, naturally.</strong></span>
      </div>

      <div class="hero__stage">
        <span class="hero__stage-label">Most loved</span>
        <img class="hero__product hero__product--bag" src="../../view/main/main/img/bags.png" alt="Custom branded tote bag">
        <img class="hero__product hero__product--usb" src="../../view/main/main/img/USBs.png" alt="Custom branded USB drive">
        <span class="hero__scribble" aria-hidden="true"></span>
      </div>

      <div class="hero__badge hero__badge--bottom">
        <strong>500+</strong>
        <span>ways to make it yours</span>
      </div>
    </div>
  </section>

  <section class="categories" aria-labelledby="categories-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow eyebrow--dark"><span></span> Find your perfect fit</p>
        <h2 id="categories-title">Start with a category</h2>
      </div>
      <a class="text-link" href="../../view/product/index.php">Browse everything <span aria-hidden="true">↗</span></a>
    </div>

    <div class="category-grid">
      <a class="category-card category-card--peach" href="../../view/product/index.php" aria-label="Shop bags">
        <span class="category-card__number">01</span>
        <span class="category-card__copy"><strong>Bags</strong><small>Carry your brand everywhere</small></span>
        <img src="../../view/main/main/img/bags.png" alt="" loading="lazy">
        <span class="category-card__arrow" aria-hidden="true">↗</span>
      </a>

      <a class="category-card category-card--blue" href="../../view/product/index.php" aria-label="Shop technology and USB products">
        <span class="category-card__number">02</span>
        <span class="category-card__copy"><strong>Tech &amp; USBs</strong><small>Useful ideas that stay top of mind</small></span>
        <img src="../../view/main/main/img/USBs.png" alt="" loading="lazy">
        <span class="category-card__arrow" aria-hidden="true">↗</span>
      </a>

      <a class="category-card category-card--mint" href="../../view/product/index.php" aria-label="Shop badges and accessories">
        <span class="category-card__number">03</span>
        <span class="category-card__copy"><strong>Accessories</strong><small>Small details, big impressions</small></span>
        <img src="../../view/main/main/img/accesories.png" alt="" loading="lazy">
        <span class="category-card__arrow" aria-hidden="true">↗</span>
      </a>

      <a class="category-card category-card--lavender" href="../../view/product/index.php" aria-label="Shop gifts and seasonal products">
        <span class="category-card__number">04</span>
        <span class="category-card__copy"><strong>Gifts &amp; seasonal</strong><small>Thoughtful picks for every moment</small></span>
        <img src="../../view/main/main/img/gift.png" alt="" loading="lazy">
        <span class="category-card__arrow" aria-hidden="true">↗</span>
      </a>
    </div>
  </section>

  <section class="how-it-works" aria-labelledby="how-title">
    <div class="how-it-works__intro">
      <p class="eyebrow eyebrow--dark"><span></span> Simple by design</p>
      <h2 id="how-title">From idea to unboxing, without the guesswork.</h2>
      <p>We keep every step clear so you can spend less time chasing details and more time building your brand.</p>
    </div>

    <ol class="steps">
      <li>
        <span class="steps__icon" aria-hidden="true">01</span>
        <div><strong>Choose your product</strong><p>Explore essentials selected for quality and impact.</p></div>
      </li>
      <li>
        <span class="steps__icon" aria-hidden="true">02</span>
        <div><strong>Make it yours</strong><p>Share your artwork, colors, and quantity with us.</p></div>
      </li>
      <li>
        <span class="steps__icon" aria-hidden="true">03</span>
        <div><strong>We handle the rest</strong><p>Review your proof and get ready to make an impression.</p></div>
      </li>
    </ol>
  </section>

  <section class="closing-cta" aria-labelledby="closing-title">
    <div>
      <p class="eyebrow"><span></span> Ready when you are</p>
      <h2 id="closing-title">Let’s make something people keep.</h2>
    </div>
    <a class="button button--light" href="../../view/product/index.php">Start exploring <span aria-hidden="true">→</span></a>
  </section>
</main>

<footer class="home-footer">
  <a href="../../view/main/index.php" class="home-footer__brand"><span>.</span>63 <small>PromoFlow</small></a>
  <p>Promotional products, made refreshingly simple.</p>
  <p>&copy; <?= date('Y') ?> PromoFlow</p>
</footer>

<?php if (!$isCustomerLoggedIn): ?>
<dialog
  class="auth-dialog"
  id="auth-dialog"
  data-login-url="../../controller/customers/login.php"
  data-register-url="../../controller/customers/sing_up.php"
  data-success-url="../../view/product/index.php"
  aria-labelledby="auth-title"
>
  <div class="auth-dialog__shell">
    <aside class="auth-dialog__aside">
      <a class="auth-dialog__brand" href="../../view/main/index.php"><span>.</span>63</a>
      <div>
        <p class="eyebrow"><span></span> Welcome to PromoFlow</p>
        <h2>Great brands start with one good idea.</h2>
        <p>Sign in or create your account to keep your product journey moving.</p>
      </div>
      <blockquote>“Everything you need to turn useful products into lasting brand moments.”</blockquote>
    </aside>

    <section class="auth-dialog__content">
      <button class="auth-dialog__close" type="button" data-auth-close aria-label="Close account window">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
      </button>

      <div class="auth-tabs" role="tablist" aria-label="Account access">
        <button id="auth-login-tab" type="button" role="tab" aria-controls="auth-login-panel" aria-selected="true" data-auth-tab="login">Log in</button>
        <button id="auth-register-tab" type="button" role="tab" aria-controls="auth-register-panel" aria-selected="false" tabindex="-1" data-auth-tab="register">Register</button>
      </div>

      <div class="auth-panel" id="auth-login-panel" role="tabpanel" aria-labelledby="auth-login-tab" data-auth-panel="login">
        <p class="auth-panel__kicker">Welcome back</p>
        <h2 id="auth-title">Log in to your account</h2>
        <p class="auth-panel__intro">Continue where you left off.</p>

        <form id="main-login-form" novalidate>
          <label class="auth-field" for="main-login-email">
            <span>Email address</span>
            <input id="main-login-email" name="email" type="email" autocomplete="email" placeholder="you@company.com" required>
          </label>

          <label class="auth-field" for="main-login-password">
            <span>Password</span>
            <span class="auth-field__password">
              <input id="main-login-password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required>
              <button type="button" data-password-toggle aria-label="Show password">Show</button>
            </span>
          </label>

          <div class="auth-panel__meta">
            <label class="auth-check"><input type="checkbox" name="remember"> <span>Remember me</span></label>
            <a href="../../view/forg_password/index.php">Forgot password?</a>
          </div>

          <p class="auth-status" data-auth-status="login" aria-live="polite"></p>
          <button class="auth-submit" type="submit">Log in <span aria-hidden="true">→</span></button>
        </form>

        <p class="auth-panel__switch">New to PromoFlow? <button type="button" data-auth-switch="register">Create an account</button></p>
      </div>

      <div class="auth-panel" id="auth-register-panel" role="tabpanel" aria-labelledby="auth-register-tab" data-auth-panel="register" hidden>
        <p class="auth-panel__kicker">Let’s get started</p>
        <h2>Create your account</h2>
        <p class="auth-panel__intro">It only takes a minute.</p>

        <form id="main-register-form" novalidate>
          <label class="auth-field" for="main-register-name">
            <span>Full name</span>
            <input id="main-register-name" name="name" type="text" autocomplete="name" maxlength="50" placeholder="Your name" required>
          </label>

          <label class="auth-field" for="main-register-email">
            <span>Email address</span>
            <input id="main-register-email" name="email" type="email" autocomplete="email" maxlength="50" placeholder="you@company.com" required>
          </label>

          <label class="auth-field" for="main-register-password">
            <span>Password</span>
            <span class="auth-field__password">
              <input id="main-register-password" name="password" type="password" autocomplete="new-password" minlength="8" placeholder="Create a secure password" aria-describedby="password-requirements" required>
              <button type="button" data-password-toggle aria-label="Show password">Show</button>
            </span>
          </label>
          <p class="auth-requirements" id="password-requirements">8+ characters with uppercase, lowercase, a number and a symbol.</p>

          <p class="auth-status" data-auth-status="register" aria-live="polite"></p>
          <button class="auth-submit" type="submit">Create account <span aria-hidden="true">→</span></button>
        </form>

        <p class="auth-panel__switch">Already have an account? <button type="button" data-auth-switch="login">Log in</button></p>
      </div>
    </section>
  </div>
</dialog>
<?php endif; ?>

<script src="../../view/main/main/main.js?v=<?= is_file($mainJsFile) ? filemtime($mainJsFile) : time() ?>" defer></script>
