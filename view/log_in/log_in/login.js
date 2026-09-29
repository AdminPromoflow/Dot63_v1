class CustomerLogin {
  constructor() {
    this.form = document.getElementById('loginForm');
    this.email = document.getElementById('email');
    this.password = document.getElementById('password');
    this.submit = document.getElementById('login_enter');
    this.status = document.getElementById('login-status');
    this.form.addEventListener('submit', event => {
      event.preventDefault();
      this.login();
    });
    [this.email, this.password].forEach(input => input.addEventListener('input', () => this.fieldError(input, '')));
    document.querySelector('.toggle-pass').addEventListener('click', event => {
      const show = this.password.type === 'password';
      this.password.type = show ? 'text' : 'password';
      event.currentTarget.textContent = show ? 'Hide' : 'Show';
      event.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      event.currentTarget.setAttribute('aria-pressed', String(show));
    });
  }

  fieldError(input, message) {
    input.setAttribute('aria-invalid', String(Boolean(message)));
    const help = document.getElementById(input === this.email ? 'email-help' : 'pass-help');
    help.textContent = message;
    help.hidden = !message;
  }

  async login() {
    if (this.submit.disabled) return;
    this.email.value = this.email.value.trim();
    this.status.textContent = '';
    const emailError = !this.email.value || !this.email.validity.valid ? 'Enter a valid email address.' : '';
    const passwordError = !this.password.value ? 'Enter your password.' : '';
    this.fieldError(this.email, emailError);
    this.fieldError(this.password, passwordError);
    if (emailError || passwordError) {
      (emailError ? this.email : this.password).focus();
      return;
    }
    this.submit.disabled = true;
    this.form.setAttribute('aria-busy', 'true');
    this.submit.textContent = 'Logging in…';
    try {
      const response = await this.makeRequest('../../controller/customers/login.php', {
        action: 'requestLogin', email: this.email.value, password: this.password.value
      }, { requireSuccess: true });
      this.status.dataset.state = 'success';
      this.status.textContent = 'Welcome back! Opening the catalog…';
      window.location.assign('../product/index.php');
    } catch (error) {
      this.status.dataset.state = 'error';
      this.status.textContent = error instanceof TypeError ? 'Unable to connect. Check your connection and try again.' : error.message || 'Unable to log in. Please try again.';
      this.submit.disabled = false;
      this.form.setAttribute('aria-busy', 'false');
      this.submit.textContent = 'Log in';
    }
  }

  async makeRequest(url, data, options = {}) {
    const {
      requireSuccess = false,
      responseType = "json",
      ...requestOptions
    } = options;
    const isFormData = data instanceof FormData;
    const headers = new Headers(requestOptions.headers || {});
    if (!isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      ...requestOptions,
      headers,
      body: isFormData ? data : JSON.stringify(data)
    });
    const text = await response.text();
    let result;
    try {
      result = responseType === "text" ? text : JSON.parse(text);
    } catch {
      const error = new Error("The server returned an invalid response.");
      error.status = response.status;
      throw error;
    }
    if (!response.ok || requireSuccess && !result?.success) {
      const error = new Error(result?.error || result?.message || "The request could not be completed.");
      error.status = response.status;
      error.code = result?.code || null;
      error.details = result;
      throw error;
    }
    return result;
  }
}
new CustomerLogin();
