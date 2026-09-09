class ClassSupplierProfile {
  constructor() {
    this.requestProfileInfo();
    for (let i = 0; i < sp_cancel.length; i++) {
      sp_cancel[i].addEventListener("click", () => this.handleIClick());
    }
    for (let i = 0; i < sp_submit.length; i++) {
      sp_submit[i].addEventListener("click", () => {
        this.requestUpdateProfileInfo();
      });
    }
  }

  async requestUpdateProfileInfo() {
    const url = "../../controller/users/supplier_info.php";
    const data = {
      action: "request_update_profile_info",
      contact_name: contact_name.value,
      company_name: company_name.value,
      email: email.value,
      phone: phone.value,
      country: country.value,
      city: city.value,
      address_line1: address_line1.value,
      address_line2: address_line2.value,
      postal_code: postal_code.value
    };
    try {
      const response = await this.makeRequest(url, data);
      if (response["response"]) {
        alert("Data updated.");
        location.reload();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async requestProfileInfo() {
    const url = "../../controller/users/supplier_info.php";
    const data = {
      action: "request_profile_info"
    };
    try {
      const response = await this.makeRequest(url, data);
      //alert(data);
      this.assignValues(response["response"]);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  assignValues(data) {
    contact_name.value = data.contact_name;
    company_name.value = data.company_name;
    email.value = data.email;
    phone.value = data.phone;
    country.value = data.country;
    city.value = data.city;
    address_line1.value = data.address_line1;
    address_line2.value = data.address_line2;
    postal_code.value = data.postal_code;
  }

  handleIClick() {
    alert("Data update cancelled");
    window.location.reload();
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
const contact_name = document.getElementById("contact_name");
const company_name = document.getElementById("company_name");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const country = document.getElementById("country");
const city = document.getElementById("city");
const address_line1 = document.getElementById("address_line1");
const address_line2 = document.getElementById("address_line2");
const postal_code = document.getElementById("postal_code");
const sp_cancel = document.querySelectorAll(".sp-cancel");
const sp_submit = document.querySelectorAll(".sp-submit");
const classSupplierProfile = new ClassSupplierProfile();
