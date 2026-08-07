(() => {
  "use strict";

  const dialog = document.getElementById("auth-dialog");
  if (!dialog) return;

  const tabs = [...dialog.querySelectorAll("[data-auth-tab]")];
  const panels = [...dialog.querySelectorAll("[data-auth-panel]")];
  const loginForm = document.getElementById("main-login-form");
  const registerForm = document.getElementById("main-register-form");
  let lastFocusedElement = null;

  const statusFor = (mode) => dialog.querySelector(`[data-auth-status="${mode}"]`);

  function setStatus(mode, message = "", state = "") {
    const status = statusFor(mode);
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  }

  function setMode(mode, moveFocus = false) {
    const nextMode = mode === "register" ? "register" : "login";

    tabs.forEach((tab) => {
      const active = tab.dataset.authTab === nextMode;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.authPanel !== nextMode;
    });

    dialog.dataset.mode = nextMode;
    setStatus("login");
    setStatus("register");

    if (moveFocus) {
      panels.find((panel) => panel.dataset.authPanel === nextMode)
        ?.querySelector("input")
        ?.focus({ preventScroll: true });
    }
  }

  function openDialog(mode) {
    lastFocusedElement = document.activeElement;
    setMode(mode);

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    document.body.classList.add("is-modal-open");
    window.setTimeout(() => setMode(mode, true), 40);
  }

  function closeDialog() {
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      handleClose();
    }
  }

  function handleClose() {
    document.body.classList.remove("is-modal-open");
    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus({ preventScroll: true });
    }
  }

  document.querySelectorAll("[data-auth-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => openDialog(trigger.dataset.authOpen));
  });

  [
    [".general-menu__login", "login"],
    [".general-menu__signup", "register"],
    ['.site-header a[href*="/log_in/"]', "login"],
    ['.site-header a[href*="/sign_up/"]', "register"]
  ].forEach(([selector, mode]) => {
    document.querySelectorAll(selector).forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        openDialog(mode);
      });
    });
  });

  dialog.querySelectorAll("[data-auth-close]").forEach((button) => {
    button.addEventListener("click", closeDialog);
  });

  dialog.querySelectorAll("[data-auth-switch]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.authSwitch, true));
  });

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setMode(tab.dataset.authTab, true));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextTab = tabs[(index + direction + tabs.length) % tabs.length];
      setMode(nextTab.dataset.authTab);
      nextTab.focus();
    });
  });

  dialog.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.parentElement?.querySelector("input");
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener("close", handleClose);
  dialog.addEventListener("cancel", () => document.body.classList.remove("is-modal-open"));

  function validateRegistration(form) {
    const password = form.elements.password.value;
    if (password.length < 8
      || !/[A-Z]/.test(password)
      || !/[a-z]/.test(password)
      || !/[0-9]/.test(password)
      || !/[^A-Za-z0-9]/.test(password)) {
      setStatus("register", "Use 8+ characters with uppercase, lowercase, a number and a symbol.", "error");
      form.elements.password.focus();
      return false;
    }
    return true;
  }

  async function sendAuthRequest({ form, mode, url, payload }) {
    if (form.dataset.loading === "true") return;

    const button = form.querySelector("button[type=submit]");
    const originalLabel = button.innerHTML;
    form.dataset.loading = "true";
    button.disabled = true;
    button.innerHTML = mode === "login" ? "Logging in…" : "Creating account…";
    setStatus(mode, mode === "login" ? "Checking your details…" : "Setting up your account…", "loading");

    try {
      const response = await fetch(new URL(url, window.location.href), {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || "We couldn't complete that request. Please try again.");
      }

      setStatus(mode, mode === "login" ? "Welcome back! Taking you to the catalog…" : "Account created! Taking you to the catalog…", "success");
      window.setTimeout(() => {
        window.location.assign(new URL(dialog.dataset.successUrl, window.location.href));
      }, 650);
    } catch (error) {
      setStatus(mode, error.message || "Connection error. Please try again.", "error");
      button.disabled = false;
      button.innerHTML = originalLabel;
      form.dataset.loading = "false";
    }
  }

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus("login");
    if (!loginForm.reportValidity()) return;

    sendAuthRequest({
      form: loginForm,
      mode: "login",
      url: dialog.dataset.loginUrl,
      payload: {
        action: "requestLogin",
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value
      }
    });
  });

  registerForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus("register");
    if (!registerForm.reportValidity() || !validateRegistration(registerForm)) return;

    sendAuthRequest({
      form: registerForm,
      mode: "register",
      url: dialog.dataset.registerUrl,
      payload: {
        action: "requestSignUp",
        name: registerForm.elements.name.value.trim(),
        email: registerForm.elements.email.value.trim(),
        password: registerForm.elements.password.value
      }
    });
  });

  const requestedMode = window.location.hash.replace("#", "").toLowerCase();
  if (requestedMode === "login" || requestedMode === "register" || requestedMode === "signup") {
    openDialog(requestedMode === "login" ? "login" : "register");
  }
})();
