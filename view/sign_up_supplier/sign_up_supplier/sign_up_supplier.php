<?php
$cssTime = filemtime('../../view/sign_up_supplier/sign_up_supplier/sign_up_supplier.css');
$jsTime = filemtime('../../view/sign_up_supplier/sign_up_supplier/sign_up_supplier.js');
?>
<link rel="stylesheet" href="../../view/sign_up_supplier/sign_up_supplier/sign_up_supplier.css?v=<?= $cssTime ?>">

<main class="supplier-auth supplier-auth--signup" aria-labelledby="supplier-signup-title">
  <section class="supplier-auth__story" aria-labelledby="supplier-signup-story-title">
    <p class="supplier-auth__eyebrow">Join PromoFlow</p>
    <h1 id="supplier-signup-story-title">Bring great products to brands that want to be remembered.</h1>
    <p class="supplier-auth__story-lead">Create your supplier profile and start building a catalogue customers can explore with confidence.</p>

    <ul class="supplier-auth__benefits" aria-label="Supplier registration benefits">
      <li>Showcase products professionally</li>
      <li>Keep pricing and options organised</li>
      <li>Manage opportunities from one workspace</li>
    </ul>
  </section>

  <section class="supplier-auth__panel" aria-labelledby="supplier-signup-title">
    <header class="supplier-auth__panel-header">
      <p class="supplier-auth__kicker">Supplier application</p>
      <h2 id="supplier-signup-title">Create your account</h2>
      <p class="supplier-auth__panel-lead">Tell us about you and your company. All fields are required unless marked optional.</p>
    </header>

    <section class="supplier-auth__fields supplier-auth__fields--signup">
      <div class="field">
        <label for="name_sign_up">Name</label>
        <input id="name_sign_up" name="name" type="text" autocomplete="name" required placeholder="Full name">
        <div id="name-help" class="help" aria-live="polite"></div>
      </div>

      <div class="field">
        <label for="email_sign_up">Email</label>
        <input id="email_sign_up" name="email" type="email" autocomplete="email" required placeholder="you@example.com">
        <div id="email-help" class="help" aria-live="polite"></div>
      </div>

      <div class="field">
        <label for="phone_sign_up">Phone</label>
        <input id="phone_sign_up" name="phone" type="tel" autocomplete="tel" required placeholder="+57 300 000 0000">
        <div id="phone-help" class="help" aria-live="polite"></div>
      </div>

      <div class="field">
        <label for="company_sign_up">Company name</label>
        <input id="company_sign_up" name="company_name" type="text" autocomplete="organization" required placeholder="Your company">
        <div id="company-help" class="help" aria-live="polite"></div>
      </div>

      <div class="field">
        <label for="country_sign_up">Country</label>
        <input id="country_sign_up" name="country" type="text" autocomplete="country-name" required placeholder="Country">
        <div id="country-help" class="help" aria-live="polite"></div>
      </div>

      <div class="field">
        <label for="city_sign_up">City</label>
        <input id="city_sign_up" name="city" type="text" autocomplete="address-level2" required placeholder="City">
        <div id="city-help" class="help" aria-live="polite"></div>
      </div>

      <div class="field">
        <label for="address1_sign_up">Address line 1</label>
        <input id="address1_sign_up" name="address_line1" type="text" autocomplete="address-line1" required placeholder="Street, number">
        <div id="address1-help" class="help" aria-live="polite"></div>
      </div>

      <div class="field">
        <label for="address2_sign_up">Address line 2 <span aria-hidden="true">· Optional</span></label>
        <input id="address2_sign_up" name="address_line2" type="text" autocomplete="address-line2" placeholder="Apartment, suite, etc.">
        <div id="address2-help" class="help" aria-live="polite"></div>
      </div>

      <div class="field">
        <label for="postcode_sign_up">Post code</label>
        <input id="postcode_sign_up" name="postcode" type="text" autocomplete="postal-code" required placeholder="ZIP / Postal code">
        <div id="postcode-help" class="help" aria-live="polite"></div>
      </div>

      <div class="field">
        <label for="password_sign_up">Password</label>
        <div class="password-wrap">
          <input id="password_sign_up" name="password" type="password" autocomplete="new-password" required
                 minlength="8" placeholder="••••••••" aria-describedby="password-note pass-help">
          <button type="button" class="toggle-pass" aria-label="Show password" aria-pressed="false" data-show="false">Show</button>
        </div>
        <p id="password-note" class="password-note">Use 8+ characters with uppercase, lowercase, a number and a symbol.</p>
        <div id="pass-help" class="help" aria-live="polite"></div>
      </div>

      <div class="actions">
        <button id="signup_enter" class="btn" type="button">Create supplier account</button>
      </div>

      <p class="footer">
        Already have an account?
        <a class="link" href="../../view/log_inSupplier/index.php">Log in</a>
      </p>
    </section>
  </section>
</main>

<script src="../../view/sign_up_supplier/sign_up_supplier/sign_up_supplier.js?v=<?= $jsTime ?>"></script>
