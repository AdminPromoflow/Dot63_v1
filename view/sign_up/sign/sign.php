<p class="customer-auth-kicker">LET’S MAKE SOMETHING GREAT</p>
<h1 id="customer-auth-title">Create your account.</h1>
<p class="customer-auth-intro">A few details now. A smoother journey from here.</p>
<form id="signupForm" method="post" action="../../controller/customers/sing_up.php" class="customer-registration-form" novalidate>
  <?php $registrationPrefix = 'signup'; require __DIR__ . '/../../global/customer_auth/registration_fields.php'; ?>
  <p id="signup-status" class="customer-auth-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <button id="signup_enter" class="customer-auth-submit" type="submit">Create account <span aria-hidden="true">→</span></button>
  <noscript><p>Please enable JavaScript to create your account.</p></noscript>
</form>
<p class="customer-auth-switch">Already have an account? <a href="../log_in/index.php">Log in</a></p>
<script src="../../view/sign_up/sign/sign.js?v=<?= filemtime(__DIR__ . '/sign.js') ?>"></script>
