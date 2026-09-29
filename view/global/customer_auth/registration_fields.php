<?php
// Shared by the account page, home dialog and product dialog.
$registrationPrefix = $registrationPrefix ?? 'signup';
$registrationEscape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
$registrationField = static function (string $name, string $label, string $autocomplete, string $type = 'text', bool $optional = false, bool $wide = false) use ($registrationPrefix, $registrationEscape): void {
    $id = $registrationPrefix . '-' . str_replace('_', '-', $name);
    $isPassword = $type === 'password';
    ?>
    <div class="customer-field<?= $wide ? ' customer-field--wide' : '' ?>">
      <label for="<?= $registrationEscape($id) ?>"><?= $registrationEscape($label) ?><?= $optional ? ' <span>(optional)</span>' : '' ?></label>
      <div class="customer-input-wrap">
        <input id="<?= $registrationEscape($id) ?>" name="<?= $registrationEscape($name) ?>" type="<?= $type ?>" autocomplete="<?= $autocomplete ?>"
          <?= $optional ? '' : 'required' ?> maxlength="<?= $isPassword ? 72 : 50 ?>" <?= $isPassword ? 'minlength="8"' : '' ?>
          aria-describedby="<?= $registrationEscape($id) ?>-error<?= $name === 'password' ? ' ' . $registrationEscape($registrationPrefix) . '-requirements' : '' ?>">
        <?php if ($isPassword): ?>
          <button class="customer-password-toggle" type="button" data-registration-toggle aria-label="Show <?= $name === 'password_confirmation' ? 'confirm password' : 'password' ?>" aria-pressed="false" aria-controls="<?= $registrationEscape($id) ?>">Show</button>
        <?php endif; ?>
      </div>
      <small class="customer-field-error" id="<?= $registrationEscape($id) ?>-error" hidden></small>
    </div>
    <?php
};
?>
<fieldset class="customer-fields">
  <legend><span>01</span> Your account</legend>
  <p class="customer-fields__intro">Your details for signing in to PromoFlow.</p>
  <div class="customer-fields__grid">
    <?php
    $registrationField('name', 'Full name', 'name');
    $registrationField('email', 'Email address', 'email', 'email');
    $registrationField('password', 'Password', 'new-password', 'password');
    $registrationField('password_confirmation', 'Confirm password', 'new-password', 'password');
    ?>
  </div>
  <p class="customer-requirements" id="<?= $registrationEscape($registrationPrefix) ?>-requirements">Use at least 8 characters with uppercase, lowercase, a number and a symbol.</p>
</fieldset>
<fieldset class="customer-fields">
  <legend><span>02</span> Your delivery address</legend>
  <p class="customer-fields__intro">Saved to your account for a quicker checkout. Fields marked optional can be left blank.</p>
  <div class="customer-fields__grid">
    <?php
    $registrationField('first_name', 'First name', 'shipping given-name');
    $registrationField('last_name', 'Last name', 'shipping family-name');
    $registrationField('company_name', 'Company name', 'shipping organization', 'text', true, true);
    $registrationField('phone', 'Phone number', 'shipping tel', 'tel');
    $registrationField('address_email', 'Delivery email', 'shipping email', 'email');
    $registrationField('street_address_1', 'Address line 1', 'shipping address-line1', 'text', false, true);
    $registrationField('street_address_2', 'Address line 2', 'shipping address-line2', 'text', true, true);
    $registrationField('town_city', 'Town / city', 'shipping address-level2');
    $registrationField('postcode', 'Postal code', 'shipping postal-code');
    $registrationField('country', 'Country', 'shipping country-name', 'text', false, true);
    ?>
  </div>
</fieldset>
