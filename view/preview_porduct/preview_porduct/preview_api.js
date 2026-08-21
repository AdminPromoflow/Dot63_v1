/*
 * [Supplier 4.1 / 6.2 / 8.3 / 10.2]
 * Este archivo es la única puerta de salida del preview hacia PHP.
 * La interfaz llama métodos con nombres claros y esta clase traduce cada uno
 * al action y payload que entiende el controlador correspondiente.
 */
export class PreviewApi {
  constructor(options = {}) {
    // [Supplier 4.1.1] previewUrl atiende lectura del preview; productUrl atiende la publicación.
    this.previewUrl = options.previewUrl || "../../controller/order/product.php";
    this.productUrl = options.productUrl || "../../controller/products/product.php";
  }

  async request(url, payload, options = {}) {
    // [Supplier 4.1.2] Todas las llamadas comparten POST, JSON y una señal opcional para cancelarlas.
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: options.signal
    });

    const text = await response.text();
    let data = null;

    // [Supplier 4.1.3] Leemos primero como texto para poder detectar una respuesta PHP vacía o inválida.
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("The server returned an invalid response.");
    }

    // [Supplier 4.1.4] Convertimos cualquier error HTTP o success=false en una excepción uniforme.
    // El coordinador puede manejarla sin conocer los detalles de fetch.
    if (!response.ok || !data?.success) {
      const error = new Error(data?.error || data?.message || "The request could not be completed.");
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  getSupplierPreview(sku, options = {}) {
    // [Supplier 4.1.5] Primera solicitud: datos generales, checklist y variación raíz.
    return this.request(this.previewUrl, {
      action: "get_supplier_preview",
      sku
    }, options);
  }

  getVariationChildren(variationId, options = {}) {
    // [Supplier 6.2] Cada selección pide el nodo actual, sus hijos y los tipos que los agrupan.
    return this.request(this.previewUrl, {
      action: "get_supplier_variation_children",
      variation_id: variationId
    }, options);
  }

  getVariationPrices(sku, variationIds, quantity, options = {}) {
    // [Supplier 8.3] Al elegir cantidad se consultan los extras aplicables a todas las opciones visibles.
    return this.request(this.previewUrl, {
      action: "get_supplier_variation_prices",
      sku,
      ids: variationIds,
      quantity
    }, options);
  }

  submitForApproval(sku, options = {}) {
    // [Supplier 10.2] El cierre del flujo envía el producto al controlador de publicación.
    return this.request(this.productUrl, {
      action: "publish_product",
      sku
    }, options);
  }
}
