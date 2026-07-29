// shopping_cart.js

class ShoppingCart {
  constructor() {
    this.itemsContainer = null;
    this.emptyState = null;
    this.itemCount = null;
    this.itemWord = null;
    this.clearCartButton = null;
    this.checkoutButton = null;
    this.subtotalElement = null;
    this.discountElement = null;
    this.discountLine = null;
    this.deliveryElement = null;
    this.totalElement = null;
    this.promoInput = null;
    this.promoButton = null;
    this.promoMessage = null;
    this.toast = null;

    this.discountPercentage = 0;
    this.deliveryPrice = 0;
    this.toastTimer = null;
    this.isProcessing = false;

    this.currencyFormatter = new Intl.NumberFormat("en-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init(), { once: true });
    } else {
      this.init();
    }
  }

  /* ============================================================================
    INITIALISE
  ============================================================================ */

  init() {
    this.itemsContainer = document.getElementById("cart-items-list");
    this.emptyState = document.getElementById("empty-cart-state");
    this.itemCount = document.getElementById("cart-item-count");
    this.itemWord = document.getElementById("cart-item-word");
    this.clearCartButton = document.getElementById("clear-cart-button");
    this.checkoutButton = document.getElementById("checkout-button");
    this.subtotalElement = document.getElementById("cart-subtotal");
    this.discountElement = document.getElementById("cart-discount");
    this.discountLine = document.getElementById("discount-line");
    this.deliveryElement = document.getElementById("cart-delivery");
    this.totalElement = document.getElementById("cart-total");
    this.promoInput = document.getElementById("promo-code-input");
    this.promoButton = document.getElementById("apply-promo-button");
    this.promoMessage = document.getElementById("promo-code-message");
    this.toast = document.getElementById("cart-toast");

    if (!this.itemsContainer) {
      console.warn("Shopping cart container not found.");
      return false;
    }

    this.bindEvents();
    this.validateAllQuantities();
    this.calculateTotals();
    this.updateCartState();

    return true;
  }

  /* ============================================================================
    EVENTS
  ============================================================================ */

  bindEvents() {
    if (this.itemsContainer.dataset.bound === "1") return false;

    this.itemsContainer.dataset.bound = "1";

    this.itemsContainer.addEventListener("click", (event) => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const decreaseButton = target.closest(".quantity-decrease");
      const increaseButton = target.closest(".quantity-increase");
      const removeButton = target.closest(".remove-cart-item");

      if (decreaseButton) {
        event.preventDefault();
        this.changeQuantity(decreaseButton, -1);
        return;
      }

      if (increaseButton) {
        event.preventDefault();
        this.changeQuantity(increaseButton, 1);
        return;
      }

      if (removeButton) {
        event.preventDefault();
        this.removeItem(removeButton);
      }
    });

    this.itemsContainer.addEventListener("input", (event) => {
      const input = event.target;

      if (!(input instanceof HTMLInputElement)) return;
      if (!input.classList.contains("quantity-input")) return;

      this.validateQuantity(input);
      this.updateItemTotal(input.closest(".cart-item"));
      this.calculateTotals();
    });

    this.itemsContainer.addEventListener("change", (event) => {
      const input = event.target;

      if (!(input instanceof HTMLInputElement)) return;
      if (!input.classList.contains("quantity-input")) return;

      this.validateQuantity(input);
      this.updateItemTotal(input.closest(".cart-item"));
      this.calculateTotals();
      this.updateCartItem(input.closest(".cart-item"));
    });

    this.clearCartButton?.addEventListener("click", () => {
      this.clearCart();
    });

    this.promoButton?.addEventListener("click", () => {
      this.applyPromoCode();
    });

    this.promoInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;

      event.preventDefault();
      this.applyPromoCode();
    });

    this.checkoutButton?.addEventListener("click", () => {
      this.checkout();
    });

    return true;
  }

  /* ============================================================================
    QUANTITY
  ============================================================================ */

  changeQuantity(button, change) {
    const item = button.closest(".cart-item");
    const input = item?.querySelector(".quantity-input");

    if (!item || !input) return false;

    const currentQuantity = this.getValidNumber(input.value, 1);
    const minimum = this.getValidNumber(input.min, 1);
    const maximum = this.getValidNumber(input.max, 999999);

    const nextQuantity = Math.min(
      maximum,
      Math.max(minimum, currentQuantity + change)
    );

    if (nextQuantity === currentQuantity) return false;

    input.value = nextQuantity;

    this.updateQuantityButtons(item);
    this.updateItemTotal(item);
    this.calculateTotals();
    this.updateCartItem(item);

    return true;
  }

  validateQuantity(input) {
    const minimum = this.getValidNumber(input.min, 1);
    const maximum = this.getValidNumber(input.max, 999999);
    let quantity = Number(input.value);

    if (!Number.isFinite(quantity)) {
      quantity = minimum;
    }

    quantity = Math.floor(quantity);
    quantity = Math.min(maximum, Math.max(minimum, quantity));

    input.value = quantity;

    this.updateQuantityButtons(input.closest(".cart-item"));

    return quantity;
  }

  validateAllQuantities() {
    const inputs = this.itemsContainer.querySelectorAll(".quantity-input");

    inputs.forEach((input) => {
      this.validateQuantity(input);
      this.updateItemTotal(input.closest(".cart-item"));
    });

    return true;
  }

  updateQuantityButtons(item) {
    if (!item) return false;

    const input = item.querySelector(".quantity-input");
    const decreaseButton = item.querySelector(".quantity-decrease");
    const increaseButton = item.querySelector(".quantity-increase");

    if (!input) return false;

    const quantity = this.getValidNumber(input.value, 1);
    const minimum = this.getValidNumber(input.min, 1);
    const maximum = this.getValidNumber(input.max, 999999);

    if (decreaseButton) {
      decreaseButton.disabled = quantity <= minimum;
    }

    if (increaseButton) {
      increaseButton.disabled = quantity >= maximum;
    }

    return true;
  }

  /* ============================================================================
    ITEM TOTAL
  ============================================================================ */

  updateItemTotal(item) {
    if (!item) return false;

    const input = item.querySelector(".quantity-input");
    const lineTotalElement = item.querySelector(".cart-line-total");

    if (!input || !lineTotalElement) return false;

    const unitPrice = this.getValidNumber(item.dataset.unitPrice, 0);
    const quantity = this.getValidNumber(input.value, 1);
    const lineTotal = unitPrice * quantity;

    lineTotalElement.textContent = this.formatCurrency(lineTotal);

    return true;
  }

  /* ============================================================================
    TOTALS
  ============================================================================ */

  calculateTotals() {
    const items = this.getCartItems();
    let subtotal = 0;

    items.forEach((item) => {
      const quantityInput = item.querySelector(".quantity-input");
      const unitPrice = this.getValidNumber(item.dataset.unitPrice, 0);
      const quantity = this.getValidNumber(quantityInput?.value, 1);

      subtotal += unitPrice * quantity;
    });

    this.deliveryPrice = this.calculateDelivery(subtotal);

    const discount = subtotal * (this.discountPercentage / 100);
    const total = Math.max(0, subtotal - discount + this.deliveryPrice);

    if (this.subtotalElement) {
      this.subtotalElement.textContent = this.formatCurrency(subtotal);
    }

    if (this.discountElement) {
      this.discountElement.textContent = `−${this.formatCurrency(discount)}`;
    }

    if (this.deliveryElement) {
      this.deliveryElement.textContent =
        subtotal > 0 && this.deliveryPrice === 0
          ? "Free"
          : this.formatCurrency(this.deliveryPrice);
    }

    if (this.totalElement) {
      this.totalElement.textContent = this.formatCurrency(total);
    }

    this.discountLine?.classList.toggle(
      "is-hidden",
      this.discountPercentage <= 0 || subtotal <= 0
    );

    return {
      subtotal: subtotal,
      discount: discount,
      delivery: this.deliveryPrice,
      total: total
    };
  }

  calculateDelivery(subtotal) {
    if (subtotal <= 0) return 0;
    if (subtotal >= 200000) return 0;

    return 15000;
  }

  /* ============================================================================
    PROMOTIONAL CODE
  ============================================================================ */

  applyPromoCode() {
    if (!this.promoInput || !this.promoMessage) return false;

    const code = this.promoInput.value.trim().toUpperCase();

    this.promoMessage.classList.remove("is-success", "is-error");

    if (!code) {
      this.discountPercentage = 0;
      this.promoMessage.textContent = "Enter a promotional code.";
      this.promoMessage.classList.add("is-error");
      this.calculateTotals();
      return false;
    }

    const promotionalCodes = {
      PROMO10: 10,
      DOC63: 5,
      WELCOME15: 15
    };

    if (!Object.prototype.hasOwnProperty.call(promotionalCodes, code)) {
      this.discountPercentage = 0;
      this.promoMessage.textContent = "This promotional code is not valid.";
      this.promoMessage.classList.add("is-error");
      this.calculateTotals();
      return false;
    }

    this.discountPercentage = promotionalCodes[code];
    this.promoInput.value = code;
    this.promoMessage.textContent = `${this.discountPercentage}% discount applied successfully.`;
    this.promoMessage.classList.add("is-success");

    this.calculateTotals();
    this.showToast("Promotional code applied.");

    return true;
  }

  /* ============================================================================
    UPDATE PRODUCT
  ============================================================================ */

  updateCartItem(item) {
    if (!item) return false;

    const quantityInput = item.querySelector(".quantity-input");

    const data = {
      action: "update_cart_item",
      cart_id: this.getValidNumber(item.dataset.cartId, 0),
      sku: item.dataset.sku || "",
      quantity: this.getValidNumber(quantityInput?.value, 1)
    };

    console.log("Cart item updated:", data);

    /*
     * Use this fetch when your backend controller is ready:
     *
     * fetch("../../controller/order/cart.php", {
     *   method: "POST",
     *   headers: {
     *     "Content-Type": "application/json"
     *   },
     *   body: JSON.stringify(data)
     * })
     *   .then((response) => {
     *     if (!response.ok) {
     *       throw new Error(`Network error: ${response.status}`);
     *     }
     *
     *     return response.json();
     *   })
     *   .then((responseData) => {
     *     if (!responseData.success) {
     *       throw new Error(responseData.message || "Unable to update cart.");
     *     }
     *   })
     *   .catch((error) => {
     *     console.error("Error updating cart item:", error);
     *   });
     */

    return true;
  }

  /* ============================================================================
    REMOVE PRODUCT
  ============================================================================ */

  removeItem(button) {
    const item = button.closest(".cart-item");

    if (!item || this.isProcessing) return false;

    const productName =
      item.querySelector(".cart-item-name")?.textContent?.trim() ||
      "this product";

    const confirmed = window.confirm(
      `Are you sure you want to remove "${productName}" from your shopping cart?`
    );

    if (!confirmed) return false;

    this.isProcessing = true;
    item.classList.add("is-removing");

    const data = {
      action: "remove_cart_item",
      cart_id: this.getValidNumber(item.dataset.cartId, 0),
      sku: item.dataset.sku || ""
    };

    console.log("Cart item removed:", data);

    window.setTimeout(() => {
      item.remove();

      this.isProcessing = false;
      this.calculateTotals();
      this.updateCartState();
      this.showToast("Product removed from your shopping cart.");
    }, 220);

    return true;
  }

  /* ============================================================================
    CLEAR CART
  ============================================================================ */

  clearCart() {
    const items = this.getCartItems();

    if (items.length === 0 || this.isProcessing) return false;

    const confirmed = window.confirm(
      "Are you sure you want to remove all products from your shopping cart?"
    );

    if (!confirmed) return false;

    this.isProcessing = true;

    items.forEach((item) => {
      item.classList.add("is-removing");
    });

    const data = {
      action: "clear_cart"
    };

    console.log("Shopping cart cleared:", data);

    window.setTimeout(() => {
      this.itemsContainer.replaceChildren();

      this.discountPercentage = 0;
      this.isProcessing = false;

      if (this.promoInput) {
        this.promoInput.value = "";
      }

      if (this.promoMessage) {
        this.promoMessage.textContent = "";
        this.promoMessage.classList.remove("is-success", "is-error");
      }

      this.calculateTotals();
      this.updateCartState();
      this.showToast("Your shopping cart has been cleared.");
    }, 220);

    return true;
  }

  /* ============================================================================
    CART STATE
  ============================================================================ */

  updateCartState() {
    const items = this.getCartItems();
    const totalItems = items.length;
    const isEmpty = totalItems === 0;

    if (this.itemCount) {
      this.itemCount.textContent = totalItems;
    }

    if (this.itemWord) {
      this.itemWord.textContent = totalItems === 1 ? "product" : "products";
    }

    this.emptyState?.classList.toggle("is-hidden", !isEmpty);
    this.itemsContainer?.classList.toggle("is-hidden", isEmpty);
    this.clearCartButton?.classList.toggle("is-hidden", isEmpty);

    if (this.checkoutButton) {
      this.checkoutButton.disabled = isEmpty;
    }

    return true;
  }

  /* ============================================================================
    CHECKOUT
  ============================================================================ */

  checkout() {
    const items = this.getCartItems();

    if (items.length === 0) {
      this.showToast("Your shopping cart is empty.");
      return false;
    }

    if (this.isProcessing) return false;

    this.isProcessing = true;
    this.setCheckoutLoading(true);

    const products = items.map((item) => {
      const quantityInput = item.querySelector(".quantity-input");

      return {
        cart_id: this.getValidNumber(item.dataset.cartId, 0),
        sku: item.dataset.sku || "",
        quantity: this.getValidNumber(quantityInput?.value, 1),
        unit_price: this.getValidNumber(item.dataset.unitPrice, 0)
      };
    });

    const totals = this.calculateTotals();

    const checkoutData = {
      action: "checkout",
      products: products,
      discount_percentage: this.discountPercentage,
      subtotal: totals.subtotal,
      discount: totals.discount,
      delivery: totals.delivery,
      total: totals.total
    };

    console.log("Checkout data:", checkoutData);

    /*
     * Replace this timeout with your fetch request:
     *
     * fetch("../../controller/order/cart.php", {
     *   method: "POST",
     *   headers: {
     *     "Content-Type": "application/json"
     *   },
     *   body: JSON.stringify(checkoutData)
     * })
     *   .then((response) => {
     *     if (!response.ok) {
     *       throw new Error(`Network error: ${response.status}`);
     *     }
     *
     *     return response.json();
     *   })
     *   .then((responseData) => {
     *     if (!responseData.success) {
     *       throw new Error(
     *         responseData.message ||
     *         "Unable to proceed to checkout."
     *       );
     *     }
     *
     *     window.location.assign(responseData.checkout_url);
     *   })
     *   .catch((error) => {
     *     console.error("Checkout error:", error);
     *     this.showToast(error.message || "Unable to proceed to checkout.");
     *   })
     *   .finally(() => {
     *     this.isProcessing = false;
     *     this.setCheckoutLoading(false);
     *   });
     */

    window.setTimeout(() => {
      this.isProcessing = false;
      this.setCheckoutLoading(false);
      this.showToast("Your order is ready to proceed to checkout.");
    }, 700);

    return true;
  }

  setCheckoutLoading(isLoading) {
    if (!this.checkoutButton) return false;

    this.checkoutButton.disabled = isLoading || this.getCartItems().length === 0;

    const textElement = this.checkoutButton.querySelector("span:first-child");

    if (textElement) {
      textElement.textContent = isLoading
        ? "Processing..."
        : "Proceed to checkout";
    }

    return true;
  }

  /* ============================================================================
    TOAST
  ============================================================================ */

  showToast(message) {
    if (!this.toast) return false;

    window.clearTimeout(this.toastTimer);

    this.toast.textContent = String(message ?? "");
    this.toast.classList.add("is-visible");

    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.remove("is-visible");
    }, 2800);

    return true;
  }

  /* ============================================================================
    HELPERS
  ============================================================================ */

  getCartItems() {
    if (!this.itemsContainer) return [];

    return Array.from(
      this.itemsContainer.querySelectorAll(".cart-item")
    );
  }

  getValidNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  }

  formatCurrency(value) {
    return this.currencyFormatter.format(
      this.getValidNumber(value, 0)
    );
  }
}

/* ============================================================================
   GLOBAL INSTANCE
============================================================================ */

window.shoppingCart = new ShoppingCart();
