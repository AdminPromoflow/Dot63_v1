export class CustomerAuthModal {
  constructor({
    api,
    onAuthenticated,
    onDismissed
  }) {
    // [Customer 10.4.1] Se reciben callbacks para que el modal no tenga que conocer la lógica del carrito.
    this.api = api;
    this.onAuthenticated = onAuthenticated;
    this.onDismissed = onDismissed;
    this.modal = document.getElementById("customer_auth_modal");
    this.dialog = this.modal?.querySelector(".customer-auth-dialog") || null;
    this.feedback = document.getElementById("customer_auth_feedback");
    this.loginPanel = document.getElementById("customer_auth_login_panel");
    this.registerPanel = document.getElementById("customer_auth_register_panel");
    this.loginForm = document.getElementById("customer_login_form");
    this.registerForm = document.getElementById("customer_register_form");
    this.currentView = "login";
    this.busy = false;
    this.previousFocus = null;
    {
      // [Customer 10.4.2] Se conectan cierre, cambio de pestaña, formularios y navegación por teclado.
      this.modal?.querySelectorAll("[data-auth-close]").forEach(button => {
        button.addEventListener("click", () => this.close({
          dismissed: true
        }));
      });
      this.modal?.querySelectorAll("[data-auth-view]").forEach(button => {
        button.addEventListener("click", () => this.setView(button.dataset.authView));
      });
      this.loginForm?.addEventListener("submit", event => this.submitLogin(event));
      this.registerForm?.addEventListener("submit", event => this.submitRegistration(event));
      document.addEventListener("keydown", event => this.handleKeydown(event));
    }
  }

  open(view = "login", message = "") {
    // [Customer 10.4.3] Se recuerda el foco anterior, se abre el modal y se enfoca el primer campo.
    if (!this.modal) return;
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.modal.hidden = false;
    document.body.classList.add("customer-auth-open");
    this.setView(view, {
      focus: false
    });
    this.showFeedback(message, message ? "info" : "");
    window.requestAnimationFrame(() => {
      this.modal?.classList.add("is-open");
      this.focusFirstField();
    });
  }

  close({
    dismissed = false,
    restoreFocus = true
  } = {}) {
    // [Customer 10.4.4] Al cerrar se limpian contraseñas y se devuelve el foco por accesibilidad.
    if (!this.modal || this.modal.hidden || this.busy) return;
    this.modal.classList.remove("is-open");
    this.modal.hidden = true;
    document.body.classList.remove("customer-auth-open");
    this.clearPasswords();
    this.showFeedback("");
    if (restoreFocus) this.previousFocus?.focus?.();
    if (dismissed) this.onDismissed?.();
  }

  setView(view, {
    focus = true
  } = {}) {
    // [Customer 10.4.5] Solo un panel y una pestaña pueden estar activos al mismo tiempo.
    if (this.busy) return;
    this.currentView = view === "register" ? "register" : "login";
    const showingLogin = this.currentView === "login";
    if (this.loginPanel) this.loginPanel.hidden = !showingLogin;
    if (this.registerPanel) this.registerPanel.hidden = showingLogin;
    this.modal?.querySelectorAll('[role="tab"][data-auth-view]').forEach(tab => {
      const active = tab.dataset.authView === this.currentView;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    this.showFeedback("");
    if (focus && !this.modal?.hidden) this.focusFirstField();
  }

  async submitLogin(event) {
    try {
      // [Customer 10.4.6] El navegador valida los campos antes de enviar email y contraseña a PreviewApi.
      event.preventDefault();
      if (this.busy || !this.loginForm) return;
      if (!this.loginForm.checkValidity()) {
        this.loginForm.reportValidity();
        return;
      }
      const formData = new FormData(this.loginForm);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      this.setBusy(true);
      this.showFeedback("");
      const response = await this.makeRequest(this.api.loginUrl, {
        action: "requestLogin",
        email: email,
        password: password
      }, {
        requireSuccess: true
      });
      await this.completeAuthentication(response);
    } catch (error) {
      this.showFeedback(error.message || "Authentication could not be completed.", "error");
      this.setBusy(false);
    }
  }

  async submitRegistration(event) {
    try {
      // [Customer 10.4.7] Además de la validación HTML, comprobamos fortaleza y coincidencia de contraseñas.
      event.preventDefault();
      if (this.busy || !this.registerForm) return;
      const password = document.getElementById("customer_register_password");
      const confirmation = document.getElementById("customer_register_password_confirm");
      const passwordValue = String(password?.value || "");
      const passwordIsStrong = passwordValue.length >= 8 && /[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue) && /[0-9]/.test(passwordValue) && /[^A-Za-z0-9]/.test(passwordValue);
      password?.setCustomValidity(passwordIsStrong ? "" : "Use at least 8 characters with uppercase, lowercase, a number and a symbol.");
      confirmation?.setCustomValidity(passwordValue === String(confirmation?.value || "") ? "" : "Passwords do not match.");
      if (!this.registerForm.checkValidity()) {
        this.registerForm.reportValidity();
        return;
      }
      const formData = new FormData(this.registerForm);
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      this.setBusy(true);
      this.showFeedback("");
      const response = await this.makeRequest(this.api.registerUrl, {
        action: "requestSignUp",
        name: name,
        email: email,
        password: passwordValue
      }, {
        requireSuccess: true
      });
      await this.completeAuthentication(response);
    } catch (error) {
      this.showFeedback(error.message || "Authentication could not be completed.", "error");
      this.setBusy(false);
    }
  }

  setBusy(busy) {
    // [Customer 10.4.9] Mientras hay una solicitud se evita el doble submit y se muestra un spinner.
    this.busy = busy;
    [this.loginForm, this.registerForm].forEach(form => {
      if (!form) return;
      form.setAttribute("aria-busy", String(busy));
      form.querySelectorAll("button[type='submit']").forEach(button => {
        button.disabled = busy;
        button.classList.toggle("is-loading", busy && !form.hidden && !form.closest("[hidden]"));
      });
    });
  }

  showFeedback(message, tone = "info") {
    if (!this.feedback) return;
    this.feedback.textContent = message;
    this.feedback.dataset.tone = tone || "info";
    this.feedback.setAttribute("role", tone === "error" ? "alert" : "status");
    this.feedback.hidden = !message;
  }

  focusFirstField() {
    const panel = this.currentView === "register" ? this.registerPanel : this.loginPanel;
    panel?.querySelector("input:not([disabled])")?.focus();
  }

  clearPasswords() {
    this.modal?.querySelectorAll('input[type="password"]').forEach(input => {
      input.value = "";
      input.setCustomValidity("");
    });
  }

  handleKeydown(event) {
    // [Customer 10.4.10] Escape cierra; Tab y Shift+Tab permanecen dentro del diálogo abierto.
    if (!this.modal || this.modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.close({
        dismissed: true
      });
      return;
    }
    if (event.key !== "Tab" || !this.dialog) return;
    const focusable = [...this.dialog.querySelectorAll('button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([type="hidden"]), a[href]')].filter(element => !element.closest("[hidden]"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async completeAuthentication(result) {
    this.showFeedback(result.message || "Authentication successful. Continuing your order…", "success");
    this.setBusy(false);
    this.close({
      dismissed: false,
      restoreFocus: false
    });
    await this.onAuthenticated?.(result);
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
