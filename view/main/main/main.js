class MainAuth {
  constructor() {
    "use strict";

    this.dialog = document.getElementById("auth-dialog");
    if (!this.dialog) return;
    this.tabs = [...this.dialog.querySelectorAll("[data-auth-tab]")];
    this.panels = [...this.dialog.querySelectorAll("[data-auth-panel]")];
    this.loginForm = document.getElementById("main-login-form");
    this.registerForm = document.getElementById("main-register-form");
    this.registrationFields = new CustomerRegistrationFields(this.registerForm);
    this.lastFocusedElement = null;
    document.querySelectorAll("[data-auth-open]").forEach(trigger => {
      trigger.addEventListener("click", () => this.openDialog(trigger.dataset.authOpen));
    });
    [[".general-menu__login", "login"], [".general-menu__signup", "register"], ['.site-header a[href*="/log_in/"]', "login"], ['.site-header a[href*="/sign_up/"]', "register"]].forEach(([selector, mode]) => {
      document.querySelectorAll(selector).forEach(trigger => {
        trigger.addEventListener("click", event => this.handleTriggerClick(event, mode));
      });
    });
    this.dialog.querySelectorAll("[data-auth-close]").forEach(button => {
      button.addEventListener("click", () => this.closeDialog());
    });
    this.dialog.querySelectorAll("[data-auth-switch]").forEach(button => {
      button.addEventListener("click", () => this.setMode(button.dataset.authSwitch, true));
    });
    this.tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => this.setMode(tab.dataset.authTab, true));
      tab.addEventListener("keydown", event => this.handleTabKeydown(event, index));
    });
    this.dialog.querySelectorAll("[data-password-toggle]").forEach(button => {
      button.addEventListener("click", () => this.handleButtonClick(button));
    });
    this.dialog.addEventListener("click", event => this.handleDialogClick(event));
    this.dialog.addEventListener("close", () => this.handleClose());
    this.dialog.addEventListener("cancel", event => {
      if (this.isBusy()) event.preventDefault();
      else document.body.classList.remove("is-modal-open");
    });
    this.loginForm?.addEventListener("submit", event => this.handleLoginFormSubmit(event));
    this.registerForm?.addEventListener("submit", event => this.handleRegisterFormSubmit(event));
    const requestedMode = window.location.hash.replace("#", "").toLowerCase();
    if (requestedMode === "login" || requestedMode === "register" || requestedMode === "signup") {
      this.openDialog(requestedMode === "login" ? "login" : "register");
    }
  }

  statusFor(mode) {
    return this.dialog.querySelector(`[data-auth-status="${mode}"]`);
  }

  setStatus(mode, message = "", state = "") {
    const status = this.statusFor(mode);
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  }

  isBusy() {
    return [this.loginForm, this.registerForm].some(form => form?.dataset.loading === 'true');
  }

  setMode(mode, moveFocus = false) {
    if (this.isBusy()) return;
    const nextMode = mode === "register" ? "register" : "login";
    this.tabs.forEach(tab => {
      const active = tab.dataset.authTab === nextMode;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    this.panels.forEach(panel => {
      panel.hidden = panel.dataset.authPanel !== nextMode;
    });
    this.dialog.dataset.mode = nextMode;
    this.setStatus("login");
    this.setStatus("register");
    if (moveFocus) {
      this.panels.find(panel => panel.dataset.authPanel === nextMode)?.querySelector("input")?.focus({
        preventScroll: true
      });
    }
  }

  openDialog(mode) {
    this.lastFocusedElement = document.activeElement;
    this.setMode(mode);
    if (typeof this.dialog.showModal === "function") {
      if (!this.dialog.open) this.dialog.showModal();
    } else {
      this.dialog.setAttribute("open", "");
    }
    document.body.classList.add("is-modal-open");
    window.setTimeout(() => this.setMode(mode, true), 40);
  }

  closeDialog() {
    if (this.isBusy()) return;
    if (typeof this.dialog.close === "function" && this.dialog.open) {
      this.dialog.close();
    } else {
      this.dialog.removeAttribute("open");
      this.handleClose();
    }
  }

  handleClose() {
    document.body.classList.remove("is-modal-open");
    this.dialog.querySelectorAll('input[autocomplete="current-password"], input[autocomplete="new-password"]').forEach(input => {
      input.value = '';
      input.type = 'password';
    });
    this.dialog.querySelectorAll('[data-password-toggle], [data-registration-toggle]').forEach(button => {
      button.textContent = 'Show';
      button.setAttribute('aria-pressed', 'false');
      const input = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-label', input?.name === 'password_confirmation' ? 'Show confirm password' : 'Show password');
    });
    if (this.lastFocusedElement instanceof HTMLElement) {
      this.lastFocusedElement.focus({
        preventScroll: true
      });
    }
  }


  async sendAuthRequest({
    form,
    mode,
    url,
    payload
  }) {
    if (this.isBusy()) return;
    const button = form.querySelector("button[type=submit]");
    const originalLabel = button.innerHTML;
    form.dataset.loading = "true";
    form.setAttribute("aria-busy", "true");
    button.disabled = true;
    button.innerHTML = mode === "login" ? "Logging in…" : "Creating account…";
    this.setStatus(mode, mode === "login" ? "Checking your details…" : "Setting up your account…", "loading");
    try {
      const response = await this.makeRequest(new URL(url, window.location.href), payload);
      if (!response.success) {
        throw new Error(response.error || "We couldn't complete that request. Please try again.");
      }
      this.setStatus(mode, mode === "login" ? "Welcome back! Taking you to the catalog…" : response.message || "Account created! A welcome email has been sent.", "success");
      window.setTimeout(() => {
        window.location.assign(new URL(this.dialog.dataset.successUrl, window.location.href));
      }, 650);
    } catch (error) {
      this.setStatus(mode, error instanceof TypeError ? "Unable to connect. Check your connection and try again." : error.message || "Connection error. Please try again.", "error");
      button.disabled = false;
      button.innerHTML = originalLabel;
      form.dataset.loading = "false";
      form.setAttribute("aria-busy", "false");
    }
  }

  handleTriggerClick(event, mode) {
    event.preventDefault();
    this.openDialog(mode);
  }

  handleTabKeydown(event, index) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextTab = this.tabs[(index + direction + this.tabs.length) % this.tabs.length];
    this.setMode(nextTab.dataset.authTab);
    nextTab.focus();
  }

  handleButtonClick(button) {
    const input = button.parentElement?.querySelector("input");
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.textContent = show ? "Hide" : "Show";
    button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    button.setAttribute("aria-pressed", String(show));
  }

  handleDialogClick(event) {
    if (event.target === this.dialog) this.closeDialog();
  }

  handleLoginFormSubmit(event) {
    event.preventDefault();
    this.setStatus("login");
    if (!this.loginForm.reportValidity()) return;
    this.sendAuthRequest({
      form: this.loginForm,
      mode: "login",
      url: this.dialog.dataset.loginUrl,
      payload: {
        action: "requestLogin",
        email: this.loginForm.elements.email.value.trim(),
        password: this.loginForm.elements.password.value
      }
    });
  }

  handleRegisterFormSubmit(event) {
    event.preventDefault();
    this.setStatus("register");
    if (!this.registrationFields.validate()) return;
    this.sendAuthRequest({
      form: this.registerForm,
      mode: "register",
      url: this.dialog.dataset.registerUrl,
      payload: this.registrationFields.payload()
    });
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
const mainAuth = new MainAuth();
