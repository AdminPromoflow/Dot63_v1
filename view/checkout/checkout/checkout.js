class CheckoutInterface {
  constructor() {
    this.page = null;
    this.addAddressButton = null;
    this.closeAddressButton = null;
    this.cancelAddressButton = null;
    this.addressPanel = null;
    this.addressForm = null;
    this.addressList = null;
    this.addressEmptyState = null;
    this.payButton = null;
    this.toast = null;
    this.toastTimer = null;
    this.temporaryAddressCount = 0;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init(), { once: true });
    } else {
      this.init();
    }
  }

  init() {
    this.page = document.getElementById("checkout-main");
    if (!this.page) return false;

    this.addAddressButton = document.getElementById("add-address-button");
    this.closeAddressButton = document.getElementById("close-address-button");
    this.cancelAddressButton = document.getElementById("cancel-address-button");
    this.addressPanel = document.getElementById("new-address-panel");
    this.addressForm = document.getElementById("address-form");
    this.addressList = document.getElementById("address-list");
    this.addressEmptyState = document.getElementById("address-empty-state");
    this.payButton = document.getElementById("pay-button");
    this.toast = document.getElementById("checkout-toast");

    this.bindEvents();
    this.syncSelectedAddress();
    return true;
  }

  bindEvents() {
    this.addAddressButton?.addEventListener("click", () => this.openAddressPanel());
    this.closeAddressButton?.addEventListener("click", () => this.closeAddressPanel());
    this.cancelAddressButton?.addEventListener("click", () => this.closeAddressPanel());
    this.addressForm?.addEventListener("submit", (event) => this.addTemporaryAddress(event));
    this.addressForm?.addEventListener("input", (event) => this.clearFieldError(event.target));
    this.addressList?.addEventListener("change", (event) => {
      if (event.target instanceof HTMLInputElement && event.target.name === "delivery_address") {
        this.syncSelectedAddress();
      }
    });
    this.payButton?.addEventListener("click", () => this.handlePaymentPreview());
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

  addTemporaryAddress(event) {
    event.preventDefault();
    if (!this.addressForm || !this.addressList) return false;
    if (!this.validateForm()) return false;

    const values = Object.fromEntries(new FormData(this.addressForm).entries());
    this.temporaryAddressCount += 1;
    const temporaryId = `temporary-${Date.now()}-${this.temporaryAddressCount}`;
    const card = this.buildAddressCard(values, temporaryId);

    this.addressEmptyState?.classList.add("is-hidden");
    this.addressList.classList.remove("is-empty");
    this.addressList.insertBefore(card, this.addressEmptyState || null);
    this.page.dataset.hasAddresses = "true";
    this.syncSelectedAddress();

    this.addressForm.reset();
    this.closeAddressPanel();
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    this.showToast("Address added to this checkout preview.");
    return true;
  }

  validateForm() {
    if (!this.addressForm) return false;
    let valid = true;
    let firstInvalid = null;

    this.addressForm.querySelectorAll("input[required]").forEach((field) => {
      const value = field.value.trim();
      let message = "";
      if (!value) {
        message = "This field is required.";
      } else if (field.type === "email" && !field.validity.valid) {
        message = "Enter a valid email address.";
      }

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
    if (!(target instanceof HTMLInputElement)) return;
    this.setFieldError(target, "");
  }

  buildAddressCard(values, id) {
    const card = document.createElement("label");
    card.className = "address-card is-selected is-temporary";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "delivery_address";
    radio.value = id;
    radio.checked = true;
    card.append(radio);

    const indicator = document.createElement("span");
    indicator.className = "address-radio";
    indicator.setAttribute("aria-hidden", "true");
    card.append(indicator);

    const content = document.createElement("span");
    content.className = "address-card-content";

    const top = document.createElement("span");
    top.className = "address-card-top";
    const heading = document.createElement("span");
    const eyebrow = document.createElement("small");
    eyebrow.textContent = "New address · Not saved";
    const name = document.createElement("strong");
    name.textContent = `${values.first_name || ""} ${values.last_name || ""}`.trim();
    heading.append(eyebrow, name);
    const badge = document.createElement("em");
    badge.textContent = "Selected";
    top.append(heading, badge);
    content.append(top);

    if (values.company_name) content.append(this.textLine(values.company_name, "address-company"));
    content.append(this.textLine(values.street_address_1));
    if (values.street_address_2) content.append(this.textLine(values.street_address_2));
    content.append(this.textLine(`${values.town_city || ""} ${values.postcode || ""}`.trim()));
    content.append(this.textLine(values.country));

    const contact = document.createElement("span");
    contact.className = "address-contact";
    contact.append(this.textLine(values.email), this.textLine(values.phone));
    content.append(contact);
    card.append(content);
    return card;
  }

  textLine(value, className = "") {
    const line = document.createElement("span");
    if (className) line.className = className;
    line.textContent = String(value || "Not provided");
    return line;
  }

  syncSelectedAddress() {
    if (!this.addressList) return false;
    this.addressList.querySelectorAll(".address-card").forEach((card) => {
      const radio = card.querySelector('input[name="delivery_address"]');
      card.classList.toggle("is-selected", Boolean(radio?.checked));
      const badge = card.querySelector(".address-card-top em");
      if (badge && card.classList.contains("is-temporary")) {
        badge.textContent = radio?.checked ? "Selected" : "New";
      }
    });
    return true;
  }

  handlePaymentPreview() {
    if (this.page?.dataset.hasItems !== "true") return false;
    const selectedAddress = this.addressList?.querySelector('input[name="delivery_address"]:checked');
    if (!selectedAddress) {
      this.openAddressPanel();
      this.showToast("Add or select a delivery address first.", true);
      return false;
    }

    document.querySelector(".payment-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
    this.showToast("Stripe is not connected yet. The checkout interface is ready for integration.");
    return true;
  }

  showToast(message, isError = false) {
    if (!this.toast) return false;
    window.clearTimeout(this.toastTimer);
    this.toast.textContent = String(message || "");
    this.toast.classList.toggle("is-error", isError);
    this.toast.classList.add("is-visible");
    this.toastTimer = window.setTimeout(() => this.toast?.classList.remove("is-visible"), 4200);
    return true;
  }
}

window.checkoutInterface = new CheckoutInterface();
