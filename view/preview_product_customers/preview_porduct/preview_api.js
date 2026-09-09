// Rutas de los endpoints. Cada controlador usa su propio makeRequest().
export class PreviewApi {
  constructor(options = {}) {
    // [Customer 4.1.1] Separamos lectura, carrito, login y registro porque cada flujo tiene su endpoint.
    this.previewUrl = options.previewUrl || "../../controller/order/product.php";
    this.cartUrl = options.cartUrl || "../../controller/order/cart.php";
    this.loginUrl = options.loginUrl || "../../controller/customers/login.php";
    this.registerUrl = options.registerUrl || "../../controller/customers/sing_up.php";
  }
}
