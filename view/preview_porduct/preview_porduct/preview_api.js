export class PreviewApi {
  constructor(options = {}) {
    this.previewUrl = options.previewUrl || "../../controller/order/product.php";
    this.productUrl = options.productUrl || "../../controller/products/product.php";
  }

  async request(url, payload, options = {}) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      error.details = data;
      throw error;
    }

    return data;
  }

  getSupplierPreview(sku, options = {}) {
    return this.request(this.previewUrl, {
      action: "get_supplier_preview",
      sku
    }, options);
  }

  getVariationChildren(variationId, options = {}) {
    return this.request(this.previewUrl, {
      action: "get_supplier_variation_children",
      variation_id: variationId
    }, options);
  }

  getVariationPrices(sku, variationIds, quantity, options = {}) {
    return this.request(this.previewUrl, {
      action: "get_supplier_variation_prices",
      sku,
      ids: variationIds,
      quantity
    }, options);
  }

  submitForApproval(sku, options = {}) {
    return this.request(this.productUrl, {
      action: "publish_product",
      sku
    }, options);
  }
}
