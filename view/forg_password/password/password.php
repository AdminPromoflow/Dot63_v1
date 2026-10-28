<main class="recovery-layout" id="password-recovery" data-account-type="<?= $accountType ?>" aria-labelledby="recovery-title">
  <aside class="recovery-story">
    <p class="recovery-eyebrow">YOUR .63 ACCOUNT</p>
    <h2>Let’s get you <br>back on track.</h2>
    <p>A fresh password and you’re ready to pick up where you left off.</p>
    <div class="recovery-note"><span aria-hidden="true">↗</span> Your next great idea is waiting.</div>
  </aside>
  <section class="recovery-panel">
    <nav class="recovery-tabs" id="recovery-tabs" aria-label="Account type">
      <a href="?account=customer" <?= $accountType === 'customer' ? 'aria-current="page"' : '' ?>>Customer</a>
      <a href="?account=supplier" <?= $accountType === 'supplier' ? 'aria-current="page"' : '' ?>>Supplier</a>
    </nav>
    <p class="recovery-kicker"><?= $accountLabel ?> account recovery</p>
    <h1 id="recovery-title">Forgot your password?</h1>
    <p class="recovery-intro" id="recovery-intro">Enter the email address for your <?= $accountType ?> account and we’ll send you a link to reset your password.</p>

    <form id="recovery-request-form" method="post" action="../../controller/users/password_recovery.php" novalidate>
      <div class="recovery-field">
        <label for="recovery-email">Email address</label>
        <input id="recovery-email" name="email" type="email" autocomplete="email" maxlength="50" required placeholder="you@company.com">
      </div>
      <button class="recovery-submit" type="submit">Send reset link <span aria-hidden="true">→</span></button>
    </form>

    <form id="recovery-reset-form" method="post" action="../../controller/users/password_recovery.php" novalidate hidden>
      <div class="recovery-field">
        <label for="recovery-password">New password</label>
        <div class="recovery-input-wrap">
          <input id="recovery-password" name="password" type="password" autocomplete="new-password" minlength="8" maxlength="72" required aria-describedby="password-requirements">
          <button class="recovery-toggle" type="button" data-toggle="recovery-password" aria-label="Show new password" aria-controls="recovery-password" aria-pressed="false">Show</button>
        </div>
        <small id="password-requirements">Use at least 8 characters with uppercase, lowercase, a number and a symbol. Maximum 72 bytes.</small>
      </div>
      <div class="recovery-field">
        <label for="recovery-confirmation">Confirm new password</label>
        <div class="recovery-input-wrap">
          <input id="recovery-confirmation" name="password_confirmation" type="password" autocomplete="new-password" minlength="8" maxlength="72" required>
          <button class="recovery-toggle" type="button" data-toggle="recovery-confirmation" aria-label="Show password confirmation" aria-controls="recovery-confirmation" aria-pressed="false">Show</button>
        </div>
      </div>
      <button class="recovery-submit" type="submit">Save new password <span aria-hidden="true">→</span></button>
    </form>

    <p id="recovery-status" class="recovery-status" role="status" aria-live="polite" aria-atomic="true" tabindex="-1"></p>
    <a id="recovery-new-link" class="recovery-link" href="?account=<?= $accountType ?>" hidden>Request a new reset link</a>
    <p class="recovery-back"><a href="<?= $loginUrl ?>" id="recovery-login-link">← Back to <?= $accountType ?> login</a></p>
    <noscript><p>Please enable JavaScript to reset your password.</p></noscript>
  </section>
</main>
