<?php
$cssTime = filemtime('../../view/log_inSupplier/log_inSupplier/loginSupplier.css');
$jsTime = filemtime('../../view/log_inSupplier/log_inSupplier/loginSupplier.js');
?>
<link rel="stylesheet" href="../../view/log_inSupplier/log_inSupplier/loginSupplier.css?v=<?= $cssTime ?>">

<main class="supplier-auth supplier-auth--login" aria-labelledby="supplier-login-title">
  <section class="supplier-auth__story" aria-labelledby="supplier-login-story-title">
    <p class="supplier-auth__eyebrow">PromoFlow supplier portal</p>
    <h1 id="supplier-login-story-title">Your catalogue, orders and customers in one place.</h1>
    <p class="supplier-auth__story-lead">Sign in to keep products current, respond faster and move every order forward with confidence.</p>

    <ul class="supplier-auth__benefits" aria-label="Supplier portal benefits">
      <li>Manage your product catalogue</li>
      <li>Track orders and production</li>
      <li>Keep customer conversations together</li>
    </ul>
  </section>

  <section class="supplier-auth__panel" aria-labelledby="supplier-login-title">
    <header class="supplier-auth__panel-header">
      <p class="supplier-auth__kicker">Welcome back</p>
      <h2 id="supplier-login-title">Log in to your account</h2>
      <p class="supplier-auth__panel-lead">Use the email address connected to your supplier profile.</p>
    </header>

    <section id="loginForm" class="supplier-auth__form">
      <input type="hidden" name="action" value="login">

      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required
               placeholder="you@example.com" aria-describedby="email-help">
        <div id="email-help" class="help" aria-live="polite"></div>
      </div>

      <div class="field">
        <label for="password">Password</label>
        <div class="password-wrap">
          <input id="password" name="password" type="password" autocomplete="current-password" required
                 minlength="6" placeholder="••••••••" aria-describedby="pass-help">
          <button type="button" class="toggle-pass" aria-label="Show password" aria-pressed="false" data-show="false">Show</button>
        </div>
        <div id="pass-help" class="help" aria-live="polite"></div>
      </div>

      <div class="actions">
        <button id="login_enter" class="btn" type="button">Log in</button>
      </div>

      <p class="footer">
        Don’t have a supplier account?
        <a class="link" href="../../view/sign_up_supplier/index.php">Create one</a>
      </p>
    </section>
  </section>
</main>

<script src="../../view/log_inSupplier/log_inSupplier/loginSupplier.js?v=<?= $jsTime ?>"></script>
