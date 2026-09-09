// Rutas de los endpoints. Cada controlador usa su propio makeRequest().
export class PreviewApi {
  constructor(options = {}) {
    // [Supplier 4.1.1] previewUrl atiende lectura del preview; productUrl atiende la publicación.
    this.previewUrl = options.previewUrl || "../../controller/order/product.php";
    this.productUrl = options.productUrl || "../../controller/products/product.php";
  }
}
