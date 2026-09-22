// Supplier and customer previews share quantity, extras and delivery calculations.
const { PricesController: CustomerPricesController } = await import(new URL(
  "../../preview_product_customers/prices/prices.js" + new URL(import.meta.url).search, import.meta.url
));

export class PricesController extends CustomerPricesController {
  constructor(options = {}) {
    super({ ...options, variationPricesAction: "get_supplier_variation_prices" });
  }
}
