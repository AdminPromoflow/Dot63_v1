// Reuse the customer's branching configurator with the private supplier endpoint.
const { VariationsController: CustomerVariationsController } = await import(new URL(
  "../../preview_product_customers/variations/variations.js" + new URL(import.meta.url).search, import.meta.url
));

export class VariationsController extends CustomerVariationsController {
  constructor(options = {}) {
    super({ ...options, variationChildrenAction: "get_supplier_variation_children" });
  }
}
