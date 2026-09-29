<p class="customer-auth-kicker">YOUR NEXT GREAT IDEA STARTS HERE</p>
<h1 id="customer-auth-title">Welcome back.</h1>
<p class="customer-auth-intro">Log in to continue your product journey.</p>
<form id="loginForm" class="customer-login-form" novalidate>
  <div class="customer-field">
    <label for="email">Email address</label>
    <div class="customer-input-wrap"><input id="email" name="email" type="email" autocomplete="email" required placeholder="you@company.com" aria-describedby="email-help"></div>
    <small id="email-help" class="customer-field-error" hidden></small>
  </div>
  <div class="customer-field">
    <label for="password">Password</label>
    <div class="customer-input-wrap">
      <input id="password" name="password" type="password" autocomplete="current-password" required placeholder="Enter your password" aria-describedby="pass-help">
      <button type="button" class="customer-password-toggle toggle-pass" aria-label="Show password" aria-controls="password" aria-pressed="false">Show</button>
    </div>
    <small id="pass-help" class="customer-field-error" hidden></small>
  </div>
  <p id="login-status" class="customer-auth-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <button id="login_enter" class="customer-auth-submit" type="submit">Log in <span aria-hidden="true">→</span></button>
  <noscript><p>Please enable JavaScript to log in.</p></noscript>
</form>
<p class="customer-auth-switch">New to PromoFlow? <a href="../sign_up/index.php">Create an account</a></p>
<script src="../../view/log_in/log_in/login.js?v=<?= filemtime(__DIR__ . '/login.js') ?>"></script>
