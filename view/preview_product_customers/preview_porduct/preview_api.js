/*
 * [Customer 4.1 / 6.2 / 8.3 / 10.2]
 * Este archivo es la única puerta de salida del preview hacia PHP.
 * La interfaz llama métodos con nombres claros y esta clase traduce cada uno
 * al action y payload que entiende el controlador correspondiente.
 */
export class PreviewApi {
  constructor(options = {}) {
    // [Customer 4.1.1] Separamos lectura, carrito, login y registro porque cada flujo tiene su endpoint.
    this.previewUrl = options.previewUrl || "../../controller/order/product.php";
    this.cartUrl = options.cartUrl || "../../controller/order/cart.php";
    this.loginUrl = options.loginUrl || "../../controller/customers/login.php";
    this.registerUrl = options.registerUrl || "../../controller/customers/sing_up.php";
  }

  async request(url, payload, options = {}) {
    // [Customer 4.1.2] Todas las llamadas usan POST y JSON; same-origin conserva la cookie de sesión.
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
      signal: options.signal
    });

    const text = await response.text();
    let data = null;

    // [Customer 4.1.3] Leemos primero como texto para detectar una respuesta PHP vacía o inválida.
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("The server returned an invalid response.");
    }

    // [Customer 4.1.4] Normalizamos errores HTTP y de negocio; code permite reconocer AUTH_REQUIRED.
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
    // [Customer 4.1.5] Primera solicitud: producto público aprobado y variación raíz.
    return this.request(this.previewUrl, {
      action: "get_customer_preview",
      sku,
      sku_variation: String(options.variationSku || "").trim()
    }, options);
  }

  getVariationChildren(variationId, options = {}) {
    // [Customer 6.2] Cada selección pide el nodo actual, sus hijos y los tipos que los agrupan.
    return this.request(this.previewUrl, {
      action: "get_customer_variation_children",
      variation_id: variationId
    }, options);
  }

  getVariationPrices(sku, variationIds, quantity, options = {}) {
    // [Customer 8.3] Al elegir cantidad se consultan los extras aplicables a las opciones visibles.
    return this.request(this.previewUrl, {
      action: "get_customer_variation_prices",
      sku,
      ids: variationIds,
      quantity
    }, options);
  }

  addToCart(payload, options = {}) {
    // [Customer 10.2] Se envía una selección ya validada al carrito.
    return this.request(this.cartUrl, {
      action: "add_to_cart",
      ...payload
    }, options);
  }

  loginCustomer(email, password, options = {}) {
    // [Customer 10.5.1] El modal utiliza este método para iniciar sesión sin abandonar el producto.
    return this.request(this.loginUrl, {
      action: "requestLogin",
      email,
      password
    }, options);
  }

  registerCustomer(name, email, password, options = {}) {
    // [Customer 10.5.2] El registro también crea una sesión para poder reintentar el carrito enseguida.
    return this.request(this.registerUrl, {
      action: "requestSignUp",
      name,
      email,
      password
    }, options);
  }
}
