class ClassAddProductDetails {
  constructor() {
    /*
     * Capture the page buttons.
     */
    const resetButton = document.getElementById("reset");
    const saveButton = document.getElementById("save");

    /*
     * Capture the new Delete product button.
     */
    const deleteProductButton =
      document.getElementById("delete_product");

    /*
     * Configure the page after the HTML has loaded.
     */
    document.addEventListener("DOMContentLoaded", () => {
      headerAddProduct.setCurrentHeader("product details");

      /*
       * Capture the Back button.
       */
      const backButton =
        document.getElementById("btn_back_product_details");

      /*
       * Return to the Groups page.
       */
      if (backButton) {
        backButton.addEventListener("click", () => {
          headerAddProduct.goNext(
            "../../view/group/index.php"
          );
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
    pd_name.addEventListener("input", () => {
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
        alert(
          "Name must be 150 characters or fewer."
        );

        pdNameAlertShown = true;
      }

      /*
       * Allow the warning to be displayed again
       * when the user reduces the text length.
       */
      if (length <= 149) {
        pdNameAlertShown = false;
      }
    });

    /*
     * Reset all product fields.
     */
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        pd_name.value = "";
        pd_status.value = "";
        pd_desc.value = "";
        pd_tagline.value = "";

        this.saveProductDetails(false);

        alert(
          "The product fields have been reset."
        );
      });
    }

    /*
     * Save the product details without changing page.
     */
    if (saveButton) {
      saveButton.addEventListener("click", () => {
        this.saveProductDetails(false);

        alert(
          "The product details have been saved."
        );
      });
    }

    /*
     * Save the product details and continue
     * to the Variations page.
     */
    if (next_product_details) {
      next_product_details.addEventListener(
        "click",
        () => {
          this.saveProductDetails(true);
        }
      );
    }

    /*
     * Delete product button event.
     */
    if (deleteProductButton) {
      deleteProductButton.addEventListener(
        "click",
        () => {
          this.deleteProduct();
        }
      );
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
  getProductDetails() {
    const params =
      new URLSearchParams(window.location.search);

    const sku = params.get("sku");

    const url =
      "../../controller/products/product.php";

    const data = {
      action: "get_product_details",
      sku: sku,
    };

    fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) {
          return response.text();
        }

        throw new Error("Network error.");
      })
      .then((responseText) => {
        const responseData =
          JSON.parse(responseText);

        if (responseData.success) {
          pd_name.value =
            responseData.data.name ?? "";

          pd_desc.value =
            responseData.data.description ?? "";

          pd_status.value =
            responseData.data.status ?? "";

          pd_tagline.value =
            responseData.data.descriptive_tagline ?? "";
        }

        const isApproved =
          responseData.data?.is_approved != 0;

        this.toggleProductActiveStatus(
          isApproved
        );
      })
      .catch((error) => {
        console.error(
          "Error loading product details:",
          error
        );
      });
  }

  /*
   * Enable or disable the Active status option.
   */
  toggleProductActiveStatus(active) {
    const activeProductOption =
      document.getElementById("active_product");

    if (!activeProductOption) {
      return;
    }

    activeProductOption.disabled = !active;
  }

  /*
   * Save the current product details.
   */
  saveProductDetails(goNext = false) {
    const params =
      new URLSearchParams(window.location.search);

    const sku = params.get("sku");

    const url =
      "../../controller/products/product.php";

    const data = {
      action: "save_product_details",
      name: pd_name.value,
      status: pd_status.value,
      description: pd_desc.value,
      pd_tagline: pd_tagline.value,
      sku: sku,
    };

    fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) {
          return response.text();
        }

        throw new Error("Network error.");
      })
      .then((responseText) => {
        const responseData =
          JSON.parse(responseText);

        if (responseData.success && goNext) {
          headerAddProduct.goNext(
            "../../view/variations/index.php"
          );
        }
      })
      .catch((error) => {
        console.error(
          "Error saving product details:",
          error
        );
      });
  }

  /*
   * Delete the current product.
   *
   * For now, this method only displays an alert.
   * Later, the request to the PHP controller
   * can be added here.
   */
   deleteProduct() {
     /*
      * Ask the user to confirm the deletion
      * before sending the request.
      */
     const isConfirmed = window.confirm(
       "Are you sure you want to delete this product? This action cannot be undone."
     );

     /*
      * Stop the function if the user clicks Cancel.
      */
     if (!isConfirmed) {
       return;
     }

     /*
      * Get the SKU from the page URL.
      */
     const params =
       new URLSearchParams(window.location.search);

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
     const url =
       "../../controller/products/product.php";

     /*
      * Data sent to the controller.
      */
     const data = {
       action: "delete_product",
       sku: sku,
     };

     /*
      * Send the deletion request.
      */
     fetch(url, {
       method: "POST",

       headers: {
         "Content-Type": "application/json",
       },

       body: JSON.stringify(data),
     })
       .then((response) => {
         if (response.ok) {
           return response.text();
         }

         throw new Error("Network error.");
       })
       .then((responseText) => {
         /*
          * Display the raw response temporarily
          * while testing the controller.
          */
        // alert(responseText);

         /*
          * Convert the JSON response into an object.
          */
         const responseData =
           JSON.parse(responseText);

         /*
          * Product deleted successfully.
          */
         if (responseData.success) {
           alert(
             responseData.message ||
             "The product has been deleted successfully."
           );

           /*
            * Redirect the user to the products page.
            *
            * Change this path if your products list
            * is located somewhere else.
            */
           window.location.href =
             "../../view/dashboard_supplier/index.php";

           return;
         }

         /*
          * The controller returned an error.
          */
         alert(
           responseData.error ||
           "The product could not be deleted."
         );
       })
       .catch((error) => {
         console.error(
           "Error deleting product:",
           error
         );

         alert(
           "An error occurred while deleting the product."
         );
       });
   }
}

/*
 * Capture the product form elements.
 */
const pd_name =
  document.getElementById("pd_name");

const pd_status =
  document.getElementById("pd_status");

const pd_desc =
  document.getElementById("pd_desc");

const pd_tagline =
  document.getElementById("pd_tagline");

const next_product_details =
  document.getElementById("next_product_details");

/*
 * Create the Product Details class instance.
 */
const classAddProductDetails =
  new ClassAddProductDetails();
