class CustomerLogin {
  constructor() {
    this.email = document.getElementById("email");
    this.password = document.getElementById("password");
    this.submit = document.getElementById("login_enter");
    this.emailHelp = document.getElementById("email-help");
    this.passwordHelp = document.getElementById("pass-help");
    this.submit?.addEventListener("click", () => this.login());
    [this.email, this.password].forEach(input => {
      input?.addEventListener("keydown", event => this.handleInputKeydown(event));
    });
  }

  showError(message) {
    if (this.passwordHelp) this.passwordHelp.textContent = message;
  }

  async login() {
    if (!this.email || !this.password || !this.submit || this.submit.disabled) return;
    const email = this.email.value.trim();
    const password = this.password.value;
    if (!email || !this.email.validity.valid) {
      if (this.emailHelp) this.emailHelp.textContent = "Enter a valid email address.";
      this.email.focus();
      return;
    }
    if (!password) {
      this.showError("Enter your password.");
      this.password.focus();
      return;
    }
    if (this.emailHelp) this.emailHelp.textContent = "";
    this.showError("");
    this.submit.disabled = true;
    this.submit.textContent = "Signing in…";
    try {
      const response = await this.makeRequest("../../controller/customers/login.php", {
        action: "requestLogin",
        email,
        password
      });
      if (!response.success) {
        throw new Error(response.error || "Unable to sign in.");
      }
      window.location.assign("../../view/product/index.php");
    } catch (error) {
      this.showError(error.message || "Unable to sign in. Please try again.");
      this.submit.disabled = false;
      this.submit.textContent = "Login";
    }
  }

  handleInputKeydown(event) {
    if (event.key === "Enter") this.login();
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
