class CustomerRegistrationFields {
  constructor(form) {
    this.form = form;
    if (!form) return;
    this.emailEdited = false;
    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => this.handleInput(input));
      input.addEventListener('blur', () => {
        if (input.value || input.getAttribute('aria-invalid') === 'true') this.validateField(input);
      });
    });
    form.querySelectorAll('[data-registration-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        const input = document.getElementById(button.getAttribute('aria-controls'));
        const visible = input.type === 'password';
        input.type = visible ? 'text' : 'password';
        button.textContent = visible ? 'Hide' : 'Show';
        button.setAttribute('aria-pressed', String(visible));
        button.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} ${input.name === 'password_confirmation' ? 'confirm password' : 'password'}`);
      });
    });
  }

  handleInput(input) {
    if (input.name === 'address_email') this.emailEdited = true;
    if (input.name === 'email' && !this.emailEdited) {
      this.form.elements.address_email.value = input.value;
    }
    if (input.getAttribute('aria-invalid') === 'true') this.validateField(input);
    if (input.name === 'password' && this.form.elements.password_confirmation.value) {
      this.validateField(this.form.elements.password_confirmation);
    }
  }

  validateField(input) {
    const value = input.value;
    let message = '';
    if (input.required && !value.trim()) message = 'Please complete this field.';
    else if (!input.name.startsWith('password') && [...value].length > 50) message = 'Use no more than 50 characters.';
    else if (input.type === 'email' && value && input.validity.typeMismatch) message = 'Enter a valid email address.';
    else if (input.name === 'password' && ([...value].length < 8 || !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value))) {
      message = 'Use 8+ characters with uppercase, lowercase, a number and a symbol.';
    } else if (input.name === 'password' && new TextEncoder().encode(value).length > 72) {
      message = 'This password is too long. Please choose a shorter one.';
    } else if (input.name === 'password_confirmation' && value !== this.form.elements.password.value) {
      message = 'Passwords do not match.';
    }
    input.setAttribute('aria-invalid', String(Boolean(message)));
    const error = document.getElementById(`${input.id}-error`);
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
    return !message;
  }

  validate() {
    if (!this.emailEdited && !this.form.elements.address_email.value) {
      this.form.elements.address_email.value = this.form.elements.email.value.trim();
    }
    let firstInvalid = null;
    this.form.querySelectorAll('input').forEach(input => {
      if (!input.name.startsWith('password')) input.value = input.value.trim();
      if (!this.validateField(input) && !firstInvalid) firstInvalid = input;
    });
    firstInvalid?.focus();
    return !firstInvalid;
  }

  payload() {
    const values = Object.fromEntries(new FormData(this.form));
    const address = {};
    ['first_name', 'last_name', 'company_name', 'phone', 'street_address_1', 'street_address_2', 'town_city', 'country', 'postcode'].forEach(field => {
      address[field] = String(values[field] || '').trim();
    });
    address.email = String(values.address_email || '').trim();
    return {
      action: 'requestSignUp',
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      password_confirmation: values.password_confirmation,
      address
    };
  }
}
