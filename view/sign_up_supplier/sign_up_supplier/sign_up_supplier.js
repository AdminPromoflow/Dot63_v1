class ClassSignUp {
  constructor() {
    const togglePassword = document.querySelector(".toggle-pass");
    togglePassword?.addEventListener("click", () => this.handleTogglePasswordClick(togglePassword));
    this.onPaused = false;
    signupEnter.addEventListener("click", () => this.handleSignupEnterClick());
    const fields = [nameSignUp, emailSignUp, phoneSignUp, companySignUp, countrySignUp, citySignUp, address1SignUp, address2SignUp, postcodeSignUp, passwordSignUp];
    fields.forEach((el, i) => {
      el?.addEventListener('keydown', e => this.handleElKeydown(e, fields, i));
    });
  }

  // Reset all borders

  resetBorders() {
    const inputs = [nameSignUp, emailSignUp, passwordSignUp, phoneSignUp, companySignUp, countrySignUp, citySignUp, address1SignUp, postcodeSignUp];
    inputs.forEach(input => input.style.border = "");
  }

  setOnPaused(boolPause) {
    this.onPaused = boolPause;
  }

  getOnPaused() {
    return this.onPaused;
  }

  setCursorPaused(value) {
    document.body.style.cursor = value;
  }
  // Add red border

  addRedBorder(input) {
    input.style.border = "1px solid red";
  }

  // Validate password length (only after required fields are present)
  // Validate password rules

  validatePassword(password) {
    // Reset border before check
    passwordSignUp.style.border = "";
    if (!this.isMinLength(password)) {
      this.addRedBorder(passwordSignUp);
      alert("Password must be at least 8 characters long.");
      return false;
    }
    if (!this.hasUpperCase(password)) {
      this.addRedBorder(passwordSignUp);
      alert("Password must contain at least one uppercase letter.");
      return false;
    }
    if (!this.hasLowerCase(password)) {
      this.addRedBorder(passwordSignUp);
      alert("Password must contain at least one lowercase letter.");
      return false;
    }
    if (!this.hasNumber(password)) {
      this.addRedBorder(passwordSignUp);
      alert("Password must contain at least one number.");
      return false;
    }
    if (!this.hasSpecialChar(password)) {
      this.addRedBorder(passwordSignUp);
      alert("Password must contain at least one special character (!@#$%^&* etc.).");
      return false;
    }
    return true; // ✅ all checks passed
  }

  // Individual rule functions

  isMinLength(password) {
    return password && password.length >= 8;
  }

  hasUpperCase(password) {
    return /[A-Z]/.test(password);
  }

  hasLowerCase(password) {
    return /[a-z]/.test(password);
  }

  hasNumber(password) {
    return /[0-9]/.test(password);
  }

  hasSpecialChar(password) {
    return /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  // Validate all required fields incl. password presence (excluding address_line2)

  validateRequiredFields(data) {
    let isValid = true;
    if (!data.name.trim()) {
      this.addRedBorder(nameSignUp);
      isValid = false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim() || !emailRegex.test(data.email)) {
      this.addRedBorder(emailSignUp);
      isValid = false;
    }

    // Password presence (length checked later)
    if (!data.password || !data.password.trim()) {
      this.addRedBorder(passwordSignUp);
      isValid = false;
    }
    if (!data.phone.trim()) {
      this.addRedBorder(phoneSignUp);
      isValid = false;
    }
    if (!data.company_name.trim()) {
      this.addRedBorder(companySignUp);
      isValid = false;
    }
    if (!data.country.trim()) {
      this.addRedBorder(countrySignUp);
      isValid = false;
    }
    if (!data.city.trim()) {
      this.addRedBorder(citySignUp);
      isValid = false;
    }
    if (!data.address_line1.trim()) {
      this.addRedBorder(address1SignUp);
      isValid = false;
    }
    if (!data.postcode.trim()) {
      this.addRedBorder(postcodeSignUp);
      isValid = false;
    }
    if (!isValid) {
      alert("Please fill in all required fields correctly.");
    }
    return isValid;
  }

  // Main validation flow

  validateFormData() {
    this.resetBorders();
    const data = {
      action: "requestSignUp",
      name: nameSignUp.value,
      email: emailSignUp.value,
      password: passwordSignUp.value,
      phone: phoneSignUp.value,
      company_name: companySignUp.value,
      country: countrySignUp.value,
      city: citySignUp.value,
      address_line1: address1SignUp.value,
      address_line2: address2SignUp.value,
      // optional
      postcode: postcodeSignUp.value
    };

    // Step 1: all required fields present (including password presence)
    if (!this.validateRequiredFields(data)) {
      return false;
    }

    // Step 2: password length check
    if (!this.validatePassword(data.password)) {
      return false;
    }
    return true; // all good
  }

  // Ajax

  async registerSupplier() {
    const url = "../../controller/users/sign_up.php";
    const data = {
      action: "requestSignUpSupplier",
      name: nameSignUp.value.trim(),
      email: emailSignUp.value.trim(),
      password: passwordSignUp.value,
      phone: phoneSignUp.value.trim(),
      company_name: companySignUp.value.trim(),
      country: countrySignUp.value.trim(),
      city: citySignUp.value.trim(),
      address_line1: address1SignUp.value.trim(),
      address_line2: address2SignUp.value.trim(),
      postcode: postcodeSignUp.value.trim()
    };
    try {
      const response = await this.makeRequest(url, data);
      //  alert(JSON.stringify(data));
      if (response.response === true) {
        alert(response.notification_sent === false ? response.notification_warning || 'Your supplier account was created, but the welcome email could not be sent.' : 'Supplier registered successfully. A welcome email has been sent.');
        window.location.href = "../../view/log_inSupplier/index.php";
      } else {
        // Error from server
        alert(response.error || "Could not complete the registration.");
      }
      loader.hide();
    } catch (error) {
      alert("Network error. Please try again.");
      loader.hide();
    }
  }

  handleTogglePasswordClick(togglePassword) {
    const showing = passwordSignUp.type === "text";
    passwordSignUp.type = showing ? "password" : "text";
    togglePassword.textContent = showing ? "Show" : "Hide";
    togglePassword.dataset.show = showing ? "false" : "true";
    togglePassword.setAttribute("aria-pressed", String(!showing));
    togglePassword.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  }

  handleSignupEnterClick() {
    if (this.validateFormData()) {
      loader.show();
      this.registerSupplier();
    }
  }

  handleElKeydown(e, fields, i) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = fields[i + 1];
      if (next && typeof next.focus === 'function') {
        next.focus();
      } else {
        if (this.validateFormData()) {
          loader.show();
          this.registerSupplier();
        }
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
const nameSignUp = document.getElementById("name_sign_up");
const emailSignUp = document.getElementById("email_sign_up");
const passwordSignUp = document.getElementById("password_sign_up");
const phoneSignUp = document.getElementById("phone_sign_up");
const companySignUp = document.getElementById("company_sign_up");
const countrySignUp = document.getElementById("country_sign_up");
const citySignUp = document.getElementById("city_sign_up");
const address1SignUp = document.getElementById("address1_sign_up");
const address2SignUp = document.getElementById("address2_sign_up");
const postcodeSignUp = document.getElementById("postcode_sign_up");
const signupEnter = document.getElementById("signup_enter");
const classSignUp = new ClassSignUp();
