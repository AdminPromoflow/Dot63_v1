class CustomerLogin {
  constructor() {
    this.email = document.getElementById("email");
    this.password = document.getElementById("password");
    this.submit = document.getElementById("login_enter");
    this.emailHelp = document.getElementById("email-help");
    this.passwordHelp = document.getElementById("pass-help");

    this.submit?.addEventListener("click", () => this.login());
    [this.email, this.password].forEach((input) => {
      input?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") this.login();
      });
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
      const response = await fetch("../../controller/customers/login.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "requestLogin", email, password })
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to sign in.");
      }

      window.location.assign("../../view/product/index.php");
    } catch (error) {
      this.showError(error.message || "Unable to sign in. Please try again.");
      this.submit.disabled = false;
      this.submit.textContent = "Login";
    }
  }
}

new CustomerLogin();
