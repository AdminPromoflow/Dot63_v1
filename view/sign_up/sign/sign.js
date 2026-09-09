class ClassSignUp {
  constructor() {
    signupEnter.addEventListener("click", () => this.handleSignupEnterClick());
  }

  // --- UI helpers ---

  resetBorders() {
    [nameSignUp, emailSignUp, passwordSignUp].forEach(i => i.style.border = "");
  }

  addRedBorder(input) {
    input.style.border = "1px solid red";
  }

  // --- Email / Password rules ---

  validEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  isMinLength(pw) {
    return pw && pw.length >= 8;
  }

  hasUpperCase(pw) {
    return /[A-Z]/.test(pw);
  }

  hasLowerCase(pw) {
    return /[a-z]/.test(pw);
  }

  hasNumber(pw) {
    return /[0-9]/.test(pw);
  }

  hasSpecial(pw) {
    return /[!@#$%^&*(),.?":{}|<>_\-\\\/[\]=+;`~]/.test(pw);
  }

  validatePassword(pw) {
    if (!this.isMinLength(pw)) {
      this.addRedBorder(passwordSignUp);
      alert("Password must be at least 8 characters long.");
      return false;
    }
    if (!this.hasUpperCase(pw)) {
      this.addRedBorder(passwordSignUp);
      alert("Password must contain at least one uppercase letter.");
      return false;
    }
    if (!this.hasLowerCase(pw)) {
      this.addRedBorder(passwordSignUp);
      alert("Password must contain at least one lowercase letter.");
      return false;
    }
    if (!this.hasNumber(pw)) {
      this.addRedBorder(passwordSignUp);
      alert("Password must contain at least one number.");
      return false;
    }
    if (!this.hasSpecial(pw)) {
      this.addRedBorder(passwordSignUp);
      alert("Password must contain at least one special character (!@#$%^&* etc.).");
      return false;
    }
    return true;
  }

  // --- Main validation ---

  validateFormData() {
    this.resetBorders();
    const data = {
      name: nameSignUp.value.trim(),
      email: emailSignUp.value.trim(),
      password: passwordSignUp.value
    };
    if (!data.name) {
      this.addRedBorder(nameSignUp);
      alert("Please enter your name.");
      return false;
    }
    if (!data.email || !this.validEmail(data.email)) {
      this.addRedBorder(emailSignUp);
      alert("Please enter a valid email address.");
      return false;
    }
    if (!data.password) {
      this.addRedBorder(passwordSignUp);
      alert("Please enter a password.");
      return false;
    }
    if (!this.validatePassword(data.password)) return false;
    return true;
  }

  // --- Ajax ---

  async registerCustomer() {
    const url = "../../controller/customers/sing_up.php";
    const payload = {
      action: "requestSignUp",
      name: nameSignUp.value.trim(),
      email: emailSignUp.value.trim(),
      password: passwordSignUp.value
    };
    try {
      const response = await this.makeRequest(url, payload);
      if (response.response === true) {
        alert(response.message || (response.notification_sent === false ? "Your account was created, but the welcome email could not be sent." : "User registered successfully. A welcome email has been sent."));
        window.location.href = "../../view/product/index.php";
      } else {
        alert(response.error || "Could not complete the registration.");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  }

  handleSignupEnterClick() {
    if (this.validateFormData()) this.registerCustomer();
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

// DOM refs
const nameSignUp = document.getElementById("name_sign_up");
const emailSignUp = document.getElementById("email_sign_up");
const passwordSignUp = document.getElementById("password_sign_up");
const signupEnter = document.getElementById("signup_enter");
const classSignUp = new ClassSignUp();
