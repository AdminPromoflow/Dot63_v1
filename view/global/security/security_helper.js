class ClassSecurityHelper {
  constructor() {
    this.checkParameters();
  }

  async checkParameters() {
    const params = new URLSearchParams(window.location.search);
    const sku = (params.get('sku') || '').trim();
    const sku_variation = (params.get('sku_variation') || '').trim();
    if (!(sku && sku_variation)) {
      window.location.replace("../../view/dashboard_supplier/index.php");
      return;
    }
    const url = "../../controller/security/security_helper.php";
    const data = {
      action: "check_parameters",
      sku: sku,
      sku_variation: sku_variation
    };
    try {
      const response = await this.makeRequest(url, data);
      if (!response["success"]) {
        alert("We couldn't verify this link.\n\n" + "You will be redirected to the dashboard. Please select the product again.");
        window.location.replace("../../view/dashboard_supplier/index.php");
        return;
      }
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
const classSecurityHelper = new ClassSecurityHelper();
