export class PreviewApi {
  constructor(options = {}) {
    this.previewUrl = options.previewUrl || "../../controller/order/product.php";
    this.cartUrl = options.cartUrl || "../../controller/order/cart.php";
    this.loginUrl = options.loginUrl || "../../controller/customers/login.php";
    this.registerUrl = options.registerUrl || "../../controller/customers/sing_up.php";
  }

  async request(url, payload, options = {}) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
      signal: options.signal
    });

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("The server returned an invalid response.");
    }

    if (!response.ok || !data?.success) {
      const error = new Error(data?.error || data?.message || "The request could not be completed.");
      error.status = response.status;
      error.code = data?.code || null;
      error.details = data;
      throw error;
    }

    return data;
  }

  getCustomerPreview(sku, options = {}) {
    return this.request(this.previewUrl, {
      action: "get_customer_preview",
      sku
    }, options);
  }

  getVariationChildren(variationId, options = {}) {
    return this.request(this.previewUrl, {
      action: "get_customer_variation_children",
      variation_id: variationId
    }, options);
  }

  getVariationPrices(sku, variationIds, quantity, options = {}) {
    return this.request(this.previewUrl, {
      action: "get_customer_variation_prices",
      sku,
      ids: variationIds,
      quantity
    }, options);
  }

  addToCart(payload, options = {}) {
    return this.request(this.cartUrl, {
      action: "add_to_cart",
      ...payload
    }, options);
  }

  loginCustomer(email, password, options = {}) {
    return this.request(this.loginUrl, {
      action: "requestLogin",
      email,
      password
    }, options);
  }

  registerCustomer(name, email, password, options = {}) {
    return this.request(this.registerUrl, {
      action: "requestSignUp",
      name,
      email,
      password
    }, options);
  }
}
