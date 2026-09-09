class ClassLogin {
  constructor() {
    loginEnter.addEventListener("click", () => {
      this.submitLogin();
    });
  }

  async submitLogin() {
    // alert(email.value + password.value);
    // alert(email.value + password.value);
    const url = "../../controller/users/login.php";
    const data = {
      action: "requestLogin",
      email: email.value,
      password: password.value
    };
    try {
      const response = await this.makeRequest(url, data, {
        responseType: "text"
      });
      alert(response);
    } catch (error) {
      console.error("Error:", error);
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
