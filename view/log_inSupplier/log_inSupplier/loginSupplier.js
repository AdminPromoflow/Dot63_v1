class ClassLogin {
  constructor() {
    const togglePassword = document.querySelector(".toggle-pass");
    togglePassword?.addEventListener("click", () => this.handleTogglePasswordClick(togglePassword));
    loginEnter.addEventListener("click", () => {
      this.loginSupplier();
    });
    email.addEventListener('keydown', event => this.handleEmailKeydown(event));
    password.addEventListener('keydown', event => this.handlePasswordKeydown(event));
  }

  async loginSupplier() {
    const url = "../../controller/users/login.php";
    const data = {
      action: "requestLoginSupplier",
      email: email.value.trim(),
      password: password.value
    };
    try {
      const response = await this.makeRequest(url, data);
      if (response.response === true) {
        window.location.href = "../../view/dashboard_supplier/index.php";
      } else {
        alert(response.error || "Credenciales inválidas");
      }
    } catch (error) {
      alert("Error de red. Intenta nuevamente.");
    }
  }

  handleTogglePasswordClick(togglePassword) {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    togglePassword.textContent = showing ? "Show" : "Hide";
    togglePassword.dataset.show = showing ? "false" : "true";
    togglePassword.setAttribute("aria-pressed", String(!showing));
    togglePassword.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  }

  handleEmailKeydown(event) {
    if (event.key === 'Enter') {
      password.focus();
    }
  }

  handlePasswordKeydown(event) {
    if (event.key === 'Enter') {
      this.loginSupplier();
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
const email = document.getElementById("email");
const password = document.getElementById("password");
const loginEnter = document.getElementById("login_enter");
const classLogin = new ClassLogin();
