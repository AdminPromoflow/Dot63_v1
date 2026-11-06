class ClassDashboardSupplier {
  constructor() {
    document.getElementById("button_new_product")?.addEventListener("click", () => this.createNewProduct());
  }

  async createNewProduct() {
    const url = "../../controller/products/product.php";
    const data = {
      action: "create_new_product"
    };
    try {
      const response = await this.makeRequest(url, data);
      const sku = response["sku"];
      const sku_variation = response["all_variation"]["variation"]["SKU"];
      if (response["success"]) {
        window.location.href = `../../view/category/index.php?sku=${encodeURIComponent(sku)}&sku_variation=${encodeURIComponent(sku_variation)}`;
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
const classDashboardSupplier = new ClassDashboardSupplier();
