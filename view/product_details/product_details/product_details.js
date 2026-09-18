class ClassAddProductDetails {
  constructor() {
    /*
     * Capture the page buttons.
     */
    this.statusRequestVersion = null;
    this.saving = false;
    const resetButton = document.getElementById("reset");
    const saveButton = document.getElementById("save");

    /*
     * Capture the new Delete product button.
     */
    const deleteProductButton = document.getElementById("delete_product");

    /*
     * Configure the page after the HTML has loaded.
     */
    document.addEventListener("DOMContentLoaded", () => {
      headerAddProduct.setCurrentHeader("product details");

      /*
       * Capture the Back button.
       */
      const backButton = document.getElementById("btn_back_product_details");

      /*
       * Return to the Groups page.
       */
      if (backButton) {
        backButton.addEventListener("click", () => {
          headerAddProduct.goNext("../../view/group/index.php");
        });
      }
    });

    /*
     * Controls whether the name length alert
     * has already been displayed.
     */
    let pdNameAlertShown = false;

    /*
     * Validate the product name length.
     */
    pd_name.addEventListener("input", () => this.handlePd_nameInput(pdNameAlertShown));

    /*
     * Reset all product fields.
     */
    if (resetButton) {
      resetButton.addEventListener("click", () => this.handleResetButtonClick());
    }

    /*
     * Save the product details without changing page.
     */
    if (saveButton) {
      saveButton.addEventListener("click", () => this.handleSaveButtonClick());
    }

    /*
     * Save the product details and continue
     * to the Variations page.
     */
    if (next_product_details) {
      next_product_details.addEventListener("click", () => {
        this.saveProductDetails(true);
      });
    }

    /*
     * Delete product button event.
     */
    if (deleteProductButton) {
      deleteProductButton.addEventListener("click", () => {
        this.deleteProduct();
      });
    }

    /*
     * Load the current product details.
     */
    this.getProductDetails();
  }

  /*
   * Get the current product information
   * using the SKU from the page URL.
   */

  async getProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");
    const url = "../../controller/products/product.php";
    const data = {
      action: "get_product_details",
      sku: sku
    };
    try {
      const response = await this.makeRequest(url, data, { requireSuccess: true });
      if (response.success) {
        pd_name.value = response.data.name ?? "";
        pd_desc.value = response.data.description ?? "";
        this.renderApprovalState(response.data);
        pd_tagline.value = response.data.descriptive_tagline ?? "";
      }

    } catch (error) {
      this.showFeedback(error.message, true);
    }
  }

  /*
   * Show the effective status and the request awaiting review.
   */

  renderApprovalState(product) {
    this.statusRequestVersion = product.status_request_version;
    pd_status.value = String(product.pending_status ?? product.status ?? 0);
    const state = document.getElementById("pd_approval_state");
    if (state) {
      state.textContent = product.pending_status !== null && product.pending_status !== undefined
        ? `Current status: ${product.status_label}. Awaiting approval: ${product.pending_status_label}.`
        : `Current status: ${product.status_label || "Draft"}.`;
    }
  }

  showFeedback(message, error = false) {
    const feedback = document.getElementById("pd_feedback");
    if (!feedback) return;
    feedback.textContent = message;
    feedback.setAttribute("role", error ? "alert" : "status");
    feedback.setAttribute("data-error", String(error));
    feedback.hidden = !message;
  }

  /*
   * Save the current product details.
   */

  async saveProductDetails(goNext = false) {
    if (this.saving || this.statusRequestVersion === null) return;
    this.saving = true;
    const buttons = ["save", "next_product_details", "reset"].map(id => document.getElementById(id)).filter(Boolean);
    buttons.forEach(button => button.disabled = true);
    this.showFeedback("Saving…");
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");
    const url = "../../controller/products/product.php";
    const data = {
      action: "save_product_details",
      name: pd_name.value,
      status: Number(pd_status.value),
      status_request_version: this.statusRequestVersion,
      description: pd_desc.value,
      pd_tagline: pd_tagline.value,
      sku: sku
    };
    try {
      const response = await this.makeRequest(url, data, { requireSuccess: true });
      this.renderApprovalState(response.data);
      this.showFeedback(response.message || "Product details saved.");
      if (response.success && goNext) {
        headerAddProduct.goNext("../../view/variations/index.php");
      }
    } catch (error) {
      this.showFeedback(error.message, true);
    } finally {
      this.saving = false;
      buttons.forEach(button => button.disabled = false);
    }
  }

  /*
   * Delete the current product.
   *
   * For now, this method only displays an alert.
   * Later, the request to the PHP controller
   * can be added here.
   */

  async deleteProduct() {
    /*
     * Ask the user to confirm the deletion
     * before sending the request.
     */
    const isConfirmed = window.confirm("Are you sure you want to delete this product? This action cannot be undone.");

    /*
     * Stop the function if the user clicks Cancel.
     */
    if (!isConfirmed) {
      return;
    }

    /*
     * Get the SKU from the page URL.
     */
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    /*
     * Validate that the SKU exists.
     */
    if (!sku) {
      alert("The product SKU could not be found.");
      return;
    }

    /*
     * Controller URL.
     */
    const url = "../../controller/products/product.php";

    /*
     * Data sent to the controller.
     */
    const data = {
      action: "delete_product",
      sku: sku
    };

    /*
     * Send the deletion request.
     */
    try {
      const response = await this.makeRequest(url, data);

      /*
       * Display the raw response temporarily
       * while testing the controller.
       */
      // alert(responseText);

      /*
       * Product deleted successfully.
       */
      if (response.success) {
        alert(response.message || "The product has been deleted successfully.");

        /*
         * Redirect the user to the products page.
         *
         * Change this path if your products list
         * is located somewhere else.
         */
        window.location.href = "../../view/dashboard_supplier/index.php";
        return;
      }

      /*
       * The controller returned an error.
       */
      alert(response.error || "The product could not be deleted.");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("An error occurred while deleting the product.");
    }
  }

  handlePd_nameInput(pdNameAlertShown) {
    const length = pd_name.value.length;

    /*
     * Cut the text if it exceeds 150 characters.
     */
    if (length > 150) {
      pd_name.value = pd_name.value.slice(0, 150);
    }

    /*
     * Display the warning only once
     * when the user reaches the limit.
     */
    if (length > 149 && !pdNameAlertShown) {
      alert("Name must be 150 characters or fewer.");
      pdNameAlertShown = true;
    }

    /*
     * Allow the warning to be displayed again
     * when the user reduces the text length.
     */
    if (length <= 149) {
      pdNameAlertShown = false;
    }
  }

  handleResetButtonClick() {
    this.getProductDetails();
    this.showFeedback("Unsaved changes discarded.");
  }

  handleSaveButtonClick() {
    return this.saveProductDetails(false);
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

/*
 * Capture the product form elements.
 */
const pd_name = document.getElementById("pd_name");
const pd_status = document.getElementById("pd_status");
const pd_desc = document.getElementById("pd_desc");
const pd_tagline = document.getElementById("pd_tagline");
const next_product_details = document.getElementById("next_product_details");

/*
 * Create the Product Details class instance.
 */
const classAddProductDetails = new ClassAddProductDetails();
