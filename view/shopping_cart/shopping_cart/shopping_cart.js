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
    this.apiUrl = "../../controller/order/cart.php";
    this.discountType = null;
    this.discountValue = 0;
    this.promoCode = "";
    this.deliveryPrice = 0;
    this.toastTimer = null;
    this.isProcessing = false;
    this.currencyFormatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    {
      const page = document.querySelector(".shopping-cart-page");
      this.apiUrl = page?.dataset.apiUrl || this.apiUrl;
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
      if (this.itemsContainer) {
        {
          if (!(this.itemsContainer.dataset.bound === "1")) {
            this.itemsContainer.dataset.bound = "1";
            this.itemsContainer.addEventListener("click", event => this.handleItemsContainerClick(event));
            this.itemsContainer.addEventListener("input", event => this.handleItemsContainerInput(event));
            this.itemsContainer.addEventListener("change", event => this.handleItemsContainerChange(event));
            this.clearCartButton?.addEventListener("click", () => this.clearCart());
            this.promoButton?.addEventListener("click", () => this.applyPromoCode());
            this.promoInput?.addEventListener("keydown", event => this.handlePromoInputKeydown(event));
            this.checkoutButton?.addEventListener("click", () => this.checkout());
          }
        }
        this.validateAllQuantities();
        this.calculateTotals();
        this.updateCartState();
      }
    }
  }

  async changeQuantity(button, change) {
    const item = button.closest(".cart-item");
    const input = item?.querySelector(".quantity-input");
    if (!item || !input || item.dataset.pending === "1") return false;
    const currentQuantity = this.getValidNumber(input.value, 1);
    const minimum = this.getValidNumber(input.min, 1);
    const maximum = this.getValidNumber(input.max, 999999);
    const nextQuantity = Math.min(maximum, Math.max(minimum, currentQuantity + change));
    if (nextQuantity === currentQuantity) return false;
    input.value = String(nextQuantity);
    this.updateQuantityButtons(item);
    this.updateItemTotal(item);
    this.calculateTotals();
    return this.persistQuantity(item);
  }

  validateQuantity(input) {
    const minimum = this.getValidNumber(input.min, 1);
    const maximum = this.getValidNumber(input.max, 999999);
    let quantity = Number(input.value);
    if (!Number.isFinite(quantity)) quantity = minimum;
    quantity = Math.min(maximum, Math.max(minimum, Math.floor(quantity)));
    input.value = String(quantity);
    this.updateQuantityButtons(input.closest(".cart-item"));
    return quantity;
  }

  validateAllQuantities() {
    this.itemsContainer.querySelectorAll(".quantity-input").forEach(input => {
      const quantity = this.validateQuantity(input);
      input.dataset.savedQuantity = String(quantity);
      this.updateItemTotal(input.closest(".cart-item"));
    });
  }

  updateQuantityButtons(item) {
    if (!item) return false;
    const input = item.querySelector(".quantity-input");
    if (!input) return false;
    const pending = item.dataset.pending === "1";
    const quantity = this.getValidNumber(input.value, 1);
    const minimum = this.getValidNumber(input.min, 1);
    const maximum = this.getValidNumber(input.max, 999999);
    const decreaseButton = item.querySelector(".quantity-decrease");
    const increaseButton = item.querySelector(".quantity-increase");
    if (decreaseButton) decreaseButton.disabled = pending || quantity <= minimum;
    if (increaseButton) increaseButton.disabled = pending || quantity >= maximum;
    input.disabled = pending;
    return true;
  }

  setItemPending(item, pending) {
    if (!item) return;
    item.dataset.pending = pending ? "1" : "0";
    item.classList.toggle("is-processing", pending);
    this.updateQuantityButtons(item);
  }

  async persistQuantity(item) {
    const input = item?.querySelector(".quantity-input");
    if (!item || !input || item.dataset.pending === "1") return false;
    const quantity = this.validateQuantity(input);
    const savedQuantity = this.getValidNumber(input.dataset.savedQuantity, quantity);
    if (quantity === savedQuantity) return true;
    this.setItemPending(item, true);
    try {
      const data = await this.makeRequest(this.apiUrl, {
        action: "update_cart_item",
        cart_id: this.getValidNumber(item.dataset.cartId, 0),
        quantity
      }, {
        requireSuccess: true
      });
      input.value = String(data.quantity);
      input.dataset.savedQuantity = String(data.quantity);
      input.max = String(data.max_quantity || input.max || 999999);
      item.dataset.unitPrice = String(data.price_per_unit);
      const unitPrice = item.querySelector(".cart-unit-price");
      if (unitPrice) unitPrice.textContent = `${this.formatCurrency(data.price_per_unit)} each`;
      this.updateItemTotal(item);
      this.calculateTotals();
      return true;
    } catch (error) {
      input.value = String(savedQuantity);
      this.updateItemTotal(item);
      this.calculateTotals();
      this.showToast(error.message || "The quantity could not be updated.", true);
      return false;
    } finally {
      this.setItemPending(item, false);
    }
  }

  updateItemTotal(item) {
    if (!item) return false;
    const input = item.querySelector(".quantity-input");
    const lineTotalElement = item.querySelector(".cart-line-total");
    if (!input || !lineTotalElement) return false;
    const lineTotal = this.getValidNumber(item.dataset.unitPrice, 0) * this.getValidNumber(input.value, 1);
    lineTotalElement.textContent = this.formatCurrency(lineTotal);
    return true;
  }

  calculateTotals() {
    let subtotal = 0;
    this.getCartItems().forEach(item => {
      const quantity = this.getValidNumber(item.querySelector(".quantity-input")?.value, 1);
      subtotal += this.getValidNumber(item.dataset.unitPrice, 0) * quantity;
    });
    this.deliveryPrice = this.calculateDelivery(subtotal);
    let discount = 0;
    if (this.discountType === "percentage") {
      discount = subtotal * (this.discountValue / 100);
    } else if (this.discountType === "fixed") {
      discount = this.discountValue;
    }
    discount = Math.min(subtotal, Math.max(0, discount));
    const total = Math.max(0, subtotal - discount + this.deliveryPrice);
    if (this.subtotalElement) this.subtotalElement.textContent = this.formatCurrency(subtotal);
    if (this.discountElement) this.discountElement.textContent = `−${this.formatCurrency(discount)}`;
    if (this.deliveryElement) {
      this.deliveryElement.textContent = subtotal > 0 && this.deliveryPrice === 0 ? "Calculated at checkout" : this.formatCurrency(this.deliveryPrice);
    }
    if (this.totalElement) this.totalElement.textContent = this.formatCurrency(total);
    this.discountLine?.classList.toggle("is-hidden", discount <= 0 || subtotal <= 0);
    return {
      subtotal,
      discount,
      delivery: this.deliveryPrice,
      total
    };
  }

  calculateDelivery(subtotal) {
    return 0;
  }

  async applyPromoCode() {
    if (!this.promoInput || !this.promoMessage || this.promoButton?.disabled) return false;
    const code = this.promoInput.value.trim().toUpperCase();
    this.promoMessage.classList.remove("is-success", "is-error");
    if (!code) {
      this.resetPromo();
      this.promoMessage.textContent = "Enter a promotional code.";
      this.promoMessage.classList.add("is-error");
      return false;
    }
    this.promoButton.disabled = true;
    try {
      const data = await this.makeRequest(this.apiUrl, {
        action: "validate_promo",
        code
      }, {
        requireSuccess: true
      });
      this.discountType = data.discount_type;
      this.discountValue = this.getValidNumber(data.discount_value, 0);
      this.promoCode = data.code || code;
      this.promoInput.value = this.promoCode;
      this.promoMessage.textContent = data.message || "Promotional code applied successfully.";
      this.promoMessage.classList.add("is-success");
      this.calculateTotals();
      this.showToast("Promotional code applied.");
      return true;
    } catch (error) {
      this.resetPromo(false);
      this.promoMessage.textContent = error.message || "This promotional code is not valid.";
      this.promoMessage.classList.add("is-error");
      return false;
    } finally {
      this.promoButton.disabled = this.getCartItems().length === 0;
    }
  }

  resetPromo(clearInput = true) {
    this.discountType = null;
    this.discountValue = 0;
    this.promoCode = "";
    if (clearInput && this.promoInput) this.promoInput.value = "";
    if (this.promoMessage) {
      this.promoMessage.textContent = "";
      this.promoMessage.classList.remove("is-success", "is-error");
    }
    this.calculateTotals();
  }

  async removeItem(button) {
    const item = button.closest(".cart-item");
    if (!item || this.isProcessing || item.dataset.pending === "1") return false;
    const productName = item.querySelector(".cart-item-name")?.textContent?.trim() || "this product";
    if (!window.confirm(`Are you sure you want to remove "${productName}" from your shopping cart?`)) return false;
    this.setItemPending(item, true);
    button.disabled = true;
    try {
      await this.makeRequest(this.apiUrl, {
        action: "remove_cart_item",
        cart_id: this.getValidNumber(item.dataset.cartId, 0)
      }, {
        requireSuccess: true
      });
      item.classList.add("is-removing");
      await new Promise(resolve => window.setTimeout(resolve, 220));
      item.remove();
      this.calculateTotals();
      this.updateCartState();
      this.showToast("Product removed from your shopping cart.");
      return true;
    } catch (error) {
      this.showToast(error.message || "The product could not be removed.", true);
      return false;
    } finally {
      if (item.isConnected) {
        button.disabled = false;
        this.setItemPending(item, false);
      }
    }
  }

  async clearCart() {
    const items = this.getCartItems();
    if (items.length === 0 || this.isProcessing) return false;
    if (!window.confirm("Are you sure you want to remove all products from your shopping cart?")) return false;
    this.isProcessing = true;
    this.setGlobalProcessing(true);
    try {
      await this.makeRequest(this.apiUrl, {
        action: "clear_cart"
      }, {
        requireSuccess: true
      });
      items.forEach(item => item.classList.add("is-removing"));
      await new Promise(resolve => window.setTimeout(resolve, 220));
      this.itemsContainer.replaceChildren();
      this.resetPromo();
      this.updateCartState();
      this.showToast("Your shopping cart has been cleared.");
      return true;
    } catch (error) {
      this.showToast(error.message || "Your shopping cart could not be cleared.", true);
      return false;
    } finally {
      this.isProcessing = false;
      this.setGlobalProcessing(false);
    }
  }

  updateCartState() {
    const totalItems = this.getCartItems().length;
    const isEmpty = totalItems === 0;
    if (this.itemCount) this.itemCount.textContent = String(totalItems);
    if (this.itemWord) this.itemWord.textContent = totalItems === 1 ? "product" : "products";
    this.emptyState?.classList.toggle("is-hidden", !isEmpty);
    this.itemsContainer?.classList.toggle("is-hidden", isEmpty);
    this.clearCartButton?.classList.toggle("is-hidden", isEmpty);
    if (this.checkoutButton) this.checkoutButton.disabled = isEmpty || this.isProcessing;
    if (this.promoButton) this.promoButton.disabled = isEmpty || this.isProcessing;
    if (isEmpty) this.resetPromo();
    window.dispatchEvent(new CustomEvent("promoflow:cart-updated", {
      detail: {
        count: totalItems
      }
    }));
    return true;
  }

  setGlobalProcessing(processing) {
    if (this.clearCartButton) this.clearCartButton.disabled = processing;
    if (this.checkoutButton) this.checkoutButton.disabled = processing || this.getCartItems().length === 0;
    if (this.promoButton) this.promoButton.disabled = processing || this.getCartItems().length === 0;
  }

  checkout() {
    if (this.getCartItems().length === 0 || this.isProcessing) {
      if (this.getCartItems().length === 0) this.showToast("Your shopping cart is empty.", true);
      return false;
    }
    try {
      window.sessionStorage.setItem("promoflow_checkout_promo", this.promoCode);
    } catch {
      // Session storage is optional; checkout can continue without it.
    }
    window.location.assign(new URL("../checkout/index.php", window.location.href));
    return true;
  }

  showToast(message, isError = false) {
    if (!this.toast) return false;
    window.clearTimeout(this.toastTimer);
    this.toast.textContent = String(message || "");
    this.toast.classList.toggle("is-error", isError);
    this.toast.classList.add("is-visible");
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove("is-visible"), 3800);
    return true;
  }

  getCartItems() {
    return this.itemsContainer ? Array.from(this.itemsContainer.querySelectorAll(".cart-item")) : [];
  }

  getValidNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  formatCurrency(value) {
    return this.currencyFormatter.format(this.getValidNumber(value, 0));
  }

  handleItemsContainerClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const decreaseButton = target.closest(".quantity-decrease");
    const increaseButton = target.closest(".quantity-increase");
    const removeButton = target.closest(".remove-cart-item");
    if (decreaseButton) {
      event.preventDefault();
      this.changeQuantity(decreaseButton, -1);
    } else if (increaseButton) {
      event.preventDefault();
      this.changeQuantity(increaseButton, 1);
    } else if (removeButton) {
      event.preventDefault();
      this.removeItem(removeButton);
    }
  }

  handleItemsContainerInput(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.classList.contains("quantity-input")) return;
    this.validateQuantity(input);
    this.updateItemTotal(input.closest(".cart-item"));
    this.calculateTotals();
  }

  handleItemsContainerChange(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.classList.contains("quantity-input")) return;
    this.persistQuantity(input.closest(".cart-item"));
  }

  handlePromoInputKeydown(event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    this.applyPromoCode();
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
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.shoppingCart = new ShoppingCart();
  }, {
    once: true
  });
} else {
  window.shoppingCart = new ShoppingCart();
}
