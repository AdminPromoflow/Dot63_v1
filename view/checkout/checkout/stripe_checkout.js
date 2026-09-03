class StripeCheckoutInterface {
  constructor() {
    this.config = window.dot63CheckoutConfig || {};
    this.page = document.getElementById("checkout-main");
    this.addAddressButton = document.getElementById("add-address-button");
    this.closeAddressButton = document.getElementById("close-address-button");
    this.cancelAddressButton = document.getElementById("cancel-address-button");
    this.addressPanel = document.getElementById("new-address-panel");
    this.addressForm = document.getElementById("address-form");
    this.addressList = document.getElementById("address-list");
    this.addressEmptyState = document.getElementById("address-empty-state");
    this.payButton = document.getElementById("pay-button");
    this.toast = document.getElementById("checkout-toast");
    this.stripe = null;
    this.elements = null;
    this.paymentElement = null;
    this.paymentElementContainer = null;
    this.paymentLoading = null;
    this.paymentMessage = null;
    this.clientSecret = "";
    this.orderId = 0;
    this.paymentReady = false;
    this.cardComplete = false;
    this.isPreparing = false;
    this.isPaying = false;
    this.toastTimer = null;

    if (this.page) this.init();
  }

  init() {
    this.preparePaymentSurface();
    this.bindEvents();
    this.syncSelectedAddress();

    const selectedAddress = this.selectedAddressId();
    if (selectedAddress > 0 && this.canUseStripe()) {
      this.setupPayment(selectedAddress);
    } else {
      this.updatePaymentAvailability();
    }
  }

  bindEvents() {
    this.addAddressButton?.addEventListener("click", () => this.openAddressPanel());
    this.closeAddressButton?.addEventListener("click", () => this.closeAddressPanel());
    this.cancelAddressButton?.addEventListener("click", () => this.closeAddressPanel());
    this.addressForm?.addEventListener("submit", (event) => this.saveAddress(event));
    this.addressForm?.addEventListener("input", (event) => this.clearFieldError(event.target));
    this.addressList?.addEventListener("change", (event) => {
      if (!(event.target instanceof HTMLInputElement) || event.target.name !== "delivery_address") return;
      this.syncSelectedAddress();
      const addressId = this.selectedAddressId();
      if (addressId > 0 && this.canUseStripe()) this.setupPayment(addressId);
    });
    this.payButton?.addEventListener("click", () => this.confirmPayment());
  }

  preparePaymentSurface() {
    const placeholder = document.querySelector(".stripe-placeholder");
    const status = document.querySelector(".stripe-status");
    const disclaimer = document.querySelector(".summary-disclaimer");
    if (!placeholder) return;

    placeholder.classList.add("is-live");
    placeholder.replaceChildren();

    this.paymentLoading = document.createElement("div");
    this.paymentLoading.className = "stripe-loading-state";
    this.paymentLoading.innerHTML = '<span aria-hidden="true"></span><div><strong>Preparing secure payment</strong><p>Stripe will collect your card details in this protected form.</p></div>';

    this.paymentElementContainer = document.createElement("div");
    this.paymentElementContainer.id = "payment-element";
    this.paymentElementContainer.className = "stripe-element-container";
    this.paymentElementContainer.hidden = true;

    this.paymentMessage = document.createElement("p");
    this.paymentMessage.id = "payment-message";
    this.paymentMessage.className = "stripe-payment-message";
    this.paymentMessage.setAttribute("role", "alert");
    this.paymentMessage.setAttribute("aria-live", "polite");

    placeholder.append(this.paymentLoading, this.paymentElementContainer, this.paymentMessage);

    if (status) {
      status.replaceChildren();
      const dot = document.createElement("span");
      status.append(dot, document.createTextNode(this.canUseStripe() ? "Stripe connected" : "Stripe setup required"));
      status.classList.toggle("is-unavailable", !this.canUseStripe());
    }
    if (disclaimer) {
      disclaimer.textContent = this.canUseStripe()
        ? "Payment is processed securely by Stripe. PromoFlow never receives or stores your card number."
        : "Add the Stripe environment keys to enable secure card payment.";
    }
  }

  canUseStripe() {
    return this.config.authenticated === true
      && this.config.stripeConfigured === true
      && typeof window.Stripe === "function"
      && Boolean(this.config.publishableKey)
      && this.page?.dataset.hasItems === "true";
  }

  updatePaymentAvailability() {
    this.paymentReady = false;
    if (this.payButton) this.payButton.disabled = true;

    if (this.config.authenticated !== true) {
      this.setPaymentState("Sign in to continue", "Checkout payment is available to signed-in customers.", "error");
    } else if (this.page?.dataset.hasItems !== "true") {
      this.setPaymentState("Your cart is empty", "Add a product before starting payment.", "muted");
    } else if (this.config.stripeConfigured !== true) {
      this.setPaymentState("Stripe configuration required", "Set the Stripe publishable, secret and webhook keys on the server.", "error");
    } else if (typeof window.Stripe !== "function") {
      this.setPaymentState("Stripe could not load", "Check the network connection and refresh this page.", "error");
    } else if (this.selectedAddressId() <= 0) {
      this.setPaymentState("Add a delivery address", "The secure payment form will appear after an address is selected.", "muted");
    }
  }

  async setupPayment(addressId) {
    if (!this.canUseStripe() || addressId <= 0 || this.isPreparing || this.isPaying) {
      this.updatePaymentAvailability();
      return false;
    }

    this.isPreparing = true;
    this.paymentReady = false;
    this.cardComplete = false;
    this.setPaymentState("Preparing secure payment", "Stripe is creating a protected payment session.", "loading");
    this.setPayButtonState(true, "Preparing payment…");

    try {
      const promotionCode = this.readPromotionCode();
      const data = await this.request("create_payment_intent", {
        address_id: addressId,
        promotion_code: promotionCode
      });

      this.orderId = Number(data.order_id) || 0;
      this.updateTotals(data);
      if (data.already_paid) {
        window.location.assign(`complete.php?order_id=${encodeURIComponent(this.orderId)}`);
        return true;
      }

      if (!data.client_secret) throw new Error("Stripe did not return a payment session.");
      if (!this.stripe) this.stripe = window.Stripe(this.config.publishableKey);

      if (data.client_secret !== this.clientSecret) {
        this.paymentElement?.unmount();
        this.clientSecret = data.client_secret;
        this.elements = this.stripe.elements({
          clientSecret: this.clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#172b45",
              colorText: "#111827",
              colorDanger: "#b42318",
              fontFamily: "Poppins, system-ui, sans-serif",
              borderRadius: "11px",
              spacingUnit: "4px"
            },
            rules: {
              ".Input": { border: "1px solid #d1d5db", boxShadow: "none" },
              ".Input:focus": { borderColor: "#b86f42", boxShadow: "0 0 0 3px rgba(184,111,66,.10)" },
              ".Label": { color: "#374151", fontWeight: "600" }
            }
          }
        });
        this.paymentElement = this.elements.create("payment", {
          layout: "tabs",
          defaultValues: {
            billingDetails: { email: this.config.customerEmail || undefined }
          }
        });
        this.paymentElement.on("ready", () => {
          this.paymentReady = true;
          this.paymentLoading.hidden = true;
          this.paymentElementContainer.hidden = false;
          this.setPayButtonState(!this.cardComplete, this.payButtonLabel(data.total, data.currency));
        });
        this.paymentElement.on("change", (event) => {
          this.cardComplete = Boolean(event.complete);
          this.showPaymentMessage(event.error?.message || "", Boolean(event.error));
          this.setPayButtonState(!this.paymentReady || !this.cardComplete, this.payButtonLabel(data.total, data.currency));
        });
        this.paymentElement.mount(this.paymentElementContainer);
      } else {
        this.paymentReady = true;
        this.paymentLoading.hidden = true;
        this.paymentElementContainer.hidden = false;
      }

      this.showPaymentMessage("");
      return true;
    } catch (error) {
      this.paymentReady = false;
      this.setPaymentState("Payment form unavailable", error.message || "Stripe could not prepare the payment.", "error");
      this.setPayButtonState(true, "Secure payment unavailable");
      return false;
    } finally {
      this.isPreparing = false;
    }
  }

  async confirmPayment() {
    if (this.isPaying || !this.paymentReady || !this.elements || !this.stripe || this.orderId <= 0) return false;
    if (!this.cardComplete) {
      this.showPaymentMessage("Complete the card details before paying.", true);
      return false;
    }

    this.isPaying = true;
    this.setPayButtonState(true, "Processing securely…", true);
    this.showPaymentMessage("");

    try {
      const { error: submitError } = await this.elements.submit();
      if (submitError) throw submitError;

      const returnUrl = new URL("complete.php", window.location.href);
      returnUrl.searchParams.set("order_id", String(this.orderId));
      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: { return_url: returnUrl.toString() },
        redirect: "if_required"
      });

      if (error) throw error;
      if (paymentIntent && ["succeeded", "processing", "requires_action"].includes(paymentIntent.status)) {
        window.location.assign(returnUrl.toString());
        return true;
      }

      throw new Error("The payment was not completed. Please check the card details and try again.");
    } catch (error) {
      this.showPaymentMessage(error.message || "Stripe could not confirm the payment.", true);
      this.setPayButtonState(false, "Try secure payment again");
      return false;
    } finally {
      this.isPaying = false;
    }
  }

  async saveAddress(event) {
    event.preventDefault();
    if (!this.addressForm || !this.addressList || !this.validateForm()) return false;

    const submitButton = this.addressForm.querySelector('button[type="submit"]');
    const values = Object.fromEntries(new FormData(this.addressForm).entries());
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add("is-loading");
    }

    try {
      const data = await this.request("save_address", { address: values });
      const card = this.buildAddressCard(data.address);
      this.addressEmptyState?.classList.add("is-hidden");
      this.addressList.classList.remove("is-empty");
      this.addressList.insertBefore(card, this.addressEmptyState || null);
      this.page.dataset.hasAddresses = "true";
      this.syncSelectedAddress();
      this.addressForm.reset();
      this.closeAddressPanel();
      this.showToast("Delivery address saved.");
      await this.setupPayment(Number(data.address.address_id));
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    } catch (error) {
      this.showToast(error.message || "The address could not be saved.", true);
      return false;
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove("is-loading");
      }
    }
  }

  async request(action, payload = {}) {
    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": this.config.csrfToken || ""
      },
      credentials: "same-origin",
      body: JSON.stringify({ action, ...payload })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      const error = new Error(data?.error || "The checkout request could not be completed.");
      error.code = data?.code || "CHECKOUT_ERROR";
      throw error;
    }
    return data;
  }

  readPromotionCode() {
    try {
      return window.sessionStorage.getItem("promoflow_checkout_promo") || "";
    } catch {
      return "";
    }
  }

  selectedAddressId() {
    const selected = this.addressList?.querySelector('input[name="delivery_address"]:checked');
    const value = Number(selected?.value || 0);
    return Number.isInteger(value) && value > 0 ? value : 0;
  }

  updateTotals(data) {
    const totals = document.querySelector(".summary-totals");
    if (!totals) return;
    const rows = totals.querySelectorAll(":scope > div");
    const subtotalValue = rows[0]?.querySelector(":scope > strong");
    const deliveryValue = Array.from(rows).find((row) => row.firstElementChild?.textContent?.trim() === "Delivery")?.querySelector(":scope > strong");
    const totalValue = totals.querySelector(".summary-grand-total > strong");
    if (subtotalValue) subtotalValue.textContent = this.formatCurrency(data.subtotal, data.currency);
    if (deliveryValue) deliveryValue.textContent = Number(data.delivery) === 0 ? "Free" : this.formatCurrency(data.delivery, data.currency);
    if (totalValue) totalValue.textContent = this.formatCurrency(data.total, data.currency);

    let discountRow = totals.querySelector(".summary-line-discount");
    if (Number(data.discount) > 0) {
      if (!discountRow) {
        discountRow = document.createElement("div");
        discountRow.className = "summary-line-discount";
        const label = document.createElement("span");
        label.textContent = data.promotion_code ? `Discount (${data.promotion_code})` : "Discount";
        const value = document.createElement("strong");
        discountRow.append(label, value);
        totals.insertBefore(discountRow, totals.querySelector(".summary-grand-total"));
      }
      discountRow.querySelector("strong").textContent = `−${this.formatCurrency(data.discount, data.currency)}`;
    } else {
      discountRow?.remove();
    }
  }

  payButtonLabel(total, currency) {
    return `Pay ${this.formatCurrency(total, currency)} securely`;
  }

  formatCurrency(value, currency = "GBP") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: String(currency || "GBP").toUpperCase(),
      minimumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  setPaymentState(title, description, type) {
    if (!this.paymentLoading) return;
    this.paymentLoading.hidden = false;
    this.paymentLoading.className = `stripe-loading-state is-${type}`;
    const heading = this.paymentLoading.querySelector("strong");
    const copy = this.paymentLoading.querySelector("p");
    if (heading) heading.textContent = title;
    if (copy) copy.textContent = description;
    if (this.paymentElementContainer) this.paymentElementContainer.hidden = true;
  }

  showPaymentMessage(message, isError = false) {
    if (!this.paymentMessage) return;
    this.paymentMessage.textContent = String(message || "");
    this.paymentMessage.classList.toggle("is-error", Boolean(message) && isError);
  }

  setPayButtonState(disabled, label, loading = false) {
    if (!this.payButton) return;
    this.payButton.disabled = disabled;
    this.payButton.classList.toggle("is-loading", loading);
    const text = this.payButton.querySelector("span");
    if (text) text.textContent = label;
  }

  openAddressPanel() {
    if (!this.addressPanel) return false;
    this.addressPanel.hidden = false;
    window.requestAnimationFrame(() => this.addressPanel?.classList.add("is-open"));
    this.addAddressButton?.setAttribute("aria-expanded", "true");
    this.closeAddressButton?.removeAttribute("hidden");
    this.cancelAddressButton?.removeAttribute("hidden");
    window.setTimeout(() => {
      this.addressPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
      this.addressForm?.querySelector("input")?.focus({ preventScroll: true });
    }, 120);
    return true;
  }

  closeAddressPanel() {
    if (!this.addressPanel || this.page?.dataset.hasAddresses !== "true") return false;
    this.addressPanel.classList.remove("is-open");
    this.addAddressButton?.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      if (!this.addressPanel?.classList.contains("is-open")) this.addressPanel.hidden = true;
    }, 220);
    return true;
  }

  validateForm() {
    if (!this.addressForm) return false;
    let valid = true;
    let firstInvalid = null;
    this.addressForm.querySelectorAll("input[required]").forEach((field) => {
      const value = field.value.trim();
      const message = !value
        ? "This field is required."
        : (field.type === "email" && !field.validity.valid ? "Enter a valid email address." : "");
      this.setFieldError(field, message);
      if (message) {
        valid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });
    firstInvalid?.focus();
    return valid;
  }

  setFieldError(field, message) {
    const wrapper = field.closest(".form-field");
    const error = wrapper?.querySelector(".field-error");
    wrapper?.classList.toggle("has-error", Boolean(message));
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
  }

  clearFieldError(target) {
    if (target instanceof HTMLInputElement) this.setFieldError(target, "");
  }

  buildAddressCard(address) {
    const card = document.createElement("label");
    card.className = "address-card is-selected";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "delivery_address";
    radio.value = String(address.address_id);
    radio.checked = true;
    const indicator = document.createElement("span");
    indicator.className = "address-radio";
    indicator.setAttribute("aria-hidden", "true");
    const content = document.createElement("span");
    content.className = "address-card-content";
    const top = document.createElement("span");
    top.className = "address-card-top";
    const heading = document.createElement("span");
    const eyebrow = document.createElement("small");
    eyebrow.textContent = `Address #${address.address_id}`;
    const name = document.createElement("strong");
    name.textContent = `${address.first_name || ""} ${address.last_name || ""}`.trim();
    const badge = document.createElement("em");
    badge.textContent = "Selected";
    heading.append(eyebrow, name);
    top.append(heading, badge);
    content.append(top);
    if (address.company_name) content.append(this.textLine(address.company_name, "address-company"));
    content.append(this.textLine(address.street_address_1));
    if (address.street_address_2) content.append(this.textLine(address.street_address_2));
    content.append(this.textLine(`${address.town_city || ""} ${address.postcode || ""}`.trim()));
    content.append(this.textLine(address.country));
    const contact = document.createElement("span");
    contact.className = "address-contact";
    contact.append(this.textLine(address.email), this.textLine(address.phone));
    content.append(contact);
    card.append(radio, indicator, content);
    return card;
  }

  textLine(value, className = "") {
    const line = document.createElement("span");
    if (className) line.className = className;
    line.textContent = String(value || "Not provided");
    return line;
  }

  syncSelectedAddress() {
    this.addressList?.querySelectorAll(".address-card").forEach((card) => {
      const radio = card.querySelector('input[name="delivery_address"]');
      card.classList.toggle("is-selected", Boolean(radio?.checked));
      const badge = card.querySelector(".address-card-top em");
      if (badge && badge.textContent !== "Default") badge.textContent = radio?.checked ? "Selected" : "Saved";
    });
  }

  showToast(message, isError = false) {
    if (!this.toast) return;
    window.clearTimeout(this.toastTimer);
    this.toast.textContent = String(message || "");
    this.toast.classList.toggle("is-error", isError);
    this.toast.classList.add("is-visible");
    this.toastTimer = window.setTimeout(() => this.toast?.classList.remove("is-visible"), 4200);
  }
}

document.addEventListener("DOMContentLoaded", () => new StripeCheckoutInterface(), { once: true });

