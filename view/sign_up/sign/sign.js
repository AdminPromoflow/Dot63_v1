class CustomerSignUp {
  constructor() {
    this.form = document.getElementById('signupForm');
    this.fields = new CustomerRegistrationFields(this.form);
    this.submit = document.getElementById('signup_enter');
    this.status = document.getElementById('signup-status');
    this.form.addEventListener('submit', event => {
      event.preventDefault();
      this.register();
    });
  }

  async register() {
    if (this.submit.disabled) return;
    this.status.textContent = '';
    if (!this.fields.validate()) return;
    this.submit.disabled = true;
    this.submit.textContent = 'Creating account…';
    this.form.setAttribute('aria-busy', 'true');
    this.status.dataset.state = 'loading';
    this.status.textContent = 'Saving your account and delivery address…';
    try {
      const response = await this.makeRequest('../../controller/customers/sing_up.php', this.fields.payload(), { requireSuccess: true });
      this.status.dataset.state = 'success';
      this.status.textContent = response.message || 'Your account and delivery address are ready. Opening the catalog…';
      window.setTimeout(() => window.location.assign('../product/index.php'), 900);
    } catch (error) {
      this.status.dataset.state = 'error';
      this.status.textContent = error instanceof TypeError ? 'Unable to connect. Check your connection and try again.' : error.message || 'Unable to create your account. Please try again.';
      this.submit.disabled = false;
      this.submit.textContent = 'Create account';
      this.form.setAttribute('aria-busy', 'false');
      if (error.code === 'EMAIL_EXISTS') {
        this.form.elements.email.setAttribute('aria-invalid', 'true');
        this.form.elements.email.focus();
      }
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
new CustomerSignUp();
