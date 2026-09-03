class PaymentResult {
  constructor() {
    this.page = document.getElementById("payment-result-page");
    this.icon = document.getElementById("result-icon");
    this.title = document.getElementById("payment-result-title");
    this.message = document.getElementById("payment-result-message");
    this.status = document.getElementById("result-payment-status");
    this.total = document.getElementById("result-total");
    this.primaryAction = document.getElementById("result-primary-action");
    this.secondaryAction = document.getElementById("result-secondary-action");
    this.pollCount = 0;
    this.maxPolls = 12;

    if (this.page) this.init();
  }

  async init() {
    const orderId = Number(this.page.dataset.orderId || 0);
    if (this.page.dataset.authenticated !== "true") {
      this.renderError("Sign in required", "Please log in to review this payment.", "Not available");
      this.primaryAction.textContent = "Log in";
      this.primaryAction.href = "../log_in/index.php";
      return;
    }
    if (!Number.isInteger(orderId) || orderId <= 0) {
      this.renderError("Order not found", "The payment return URL does not contain a valid order.", "Not available");
      return;
    }

    await this.readStripeRedirectStatus();
    await this.pollOrder(orderId);
  }

  async readStripeRedirectStatus() {
    const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
    const publishableKey = this.page.dataset.publishableKey || "";
    if (!clientSecret || !publishableKey || typeof window.Stripe !== "function") return;

    try {
      const stripe = window.Stripe(publishableKey);
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
      if (paymentIntent?.status) this.renderStripeStatus(paymentIntent.status);
    } catch {
      // The signed webhook and server-side order status remain authoritative.
    }
  }

  async pollOrder(orderId) {
    try {
      const data = await this.request("get_payment_status", { order_id: orderId });
      this.renderOrder(data);

      if (data.complete) {
        try {
          window.sessionStorage.removeItem("promoflow_checkout_promo");
        } catch {
          // Storage is optional.
        }
        window.dispatchEvent(new CustomEvent("promoflow:cart-updated", { detail: { count: 0 } }));
        return;
      }

      const pending = ["payment_pending", "payment_processing"].includes(data.status);
      if (pending && this.pollCount < this.maxPolls) {
        this.pollCount += 1;
        window.setTimeout(() => this.pollOrder(orderId), 1500);
      }
    } catch (error) {
      this.renderError("We could not verify the payment", error.message || "Refresh this page to try again.", "Unavailable");
    }
  }

  async request(action, payload = {}) {
    const response = await fetch(this.page.dataset.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": this.page.dataset.csrfToken || ""
      },
      credentials: "same-origin",
      body: JSON.stringify({ action, ...payload })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || "The payment status could not be loaded.");
    }
    return data;
  }

  renderStripeStatus(status) {
    if (status === "succeeded") {
      this.title.textContent = "Payment received";
      this.message.textContent = "Stripe confirmed the payment. We are finalising your order now.";
      this.status.textContent = "Paid · Finalising";
    } else if (status === "processing") {
      this.status.textContent = "Processing";
    } else if (status === "requires_payment_method") {
      this.status.textContent = "Payment not completed";
    }
  }

  renderOrder(order) {
    this.total.textContent = this.formatCurrency(order.total, order.currency);
    const labels = {
      paid: "Paid",
      payment_pending: "Awaiting confirmation",
      payment_processing: "Processing",
      payment_failed: "Payment failed",
      payment_canceled: "Payment cancelled",
      payment_review: "Manual review"
    };
    this.status.textContent = labels[order.status] || order.payment_status || "Pending";

    if (order.status === "paid") {
      this.icon.className = "result-icon is-success";
      this.title.textContent = "Payment successful";
      this.message.textContent = `Thank you. Order #${order.order_id} is confirmed and ready for processing.`;
      this.secondaryAction.hidden = true;
      return;
    }

    if (["payment_failed", "payment_canceled"].includes(order.status)) {
      this.renderError(
        order.status === "payment_failed" ? "Payment was not completed" : "Payment cancelled",
        "No successful payment was recorded. You can return to checkout and try again.",
        labels[order.status]
      );
      this.primaryAction.textContent = "Try payment again";
      this.primaryAction.href = "index.php";
      this.secondaryAction.textContent = "Return to cart";
      this.secondaryAction.href = "../shopping_cart/index.php";
      return;
    }

    if (order.status === "payment_review") {
      this.renderError(
        "Payment needs review",
        "Stripe reported a payment that does not match the order total. The order has not entered fulfilment.",
        "Manual review"
      );
      return;
    }

    this.icon.className = "result-icon is-loading";
    this.title.textContent = order.status === "payment_processing" ? "Payment is processing" : "Confirming your payment";
    this.message.textContent = "Stripe is processing the payment. This page will update automatically.";
  }

  renderError(title, message, status) {
    this.icon.className = "result-icon is-error";
    this.title.textContent = title;
    this.message.textContent = message;
    this.status.textContent = status;
  }

  formatCurrency(value, currency = "GBP") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: String(currency || "GBP").toUpperCase()
    }).format(Number(value) || 0);
  }
}

document.addEventListener("DOMContentLoaded", () => new PaymentResult(), { once: true });

