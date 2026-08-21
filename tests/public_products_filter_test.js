const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const articlePath = path.join(__dirname, "../view/product/products/article.js");
const source = fs.readFileSync(articlePath, "utf8").replace(
  /const productsClass = new ProductsClass\(\);\s*$/,
  "globalThis.ProductsClass = ProductsClass;"
);

const sandbox = {
  AbortController,
  URLSearchParams,
  console,
  document: { activeElement: null },
  requestAnimationFrame: callback => callback(),
  window: { location: { href: "" } }
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: articlePath });

const products = Object.create(sandbox.ProductsClass.prototype);
products.superLanyardAxisNames = new Set([
  "theme", "material", "width", "printtechnique", "printedsides", "colour", "color"
]);

const published = products.getPublishedProducts([
  { name: "Super Lanyard", is_approved: 1, category_name: "Giveaways", group_name: "Lanyards" },
  { name: "Super Lanyard — Tubular — Polyester — 15mm — Screen Print — One Side — Full Colour", is_approved: 1, is_super_lanyard_generated: 1, category_name: "Giveaways", group_name: "Lanyards" },
  { name: "Umbrella", is_approved: 1, category_name: "Giveaways", group_name: "Umbrellas" }
]);
assert.equal(published.length, 2, "The source card must not be rendered publicly.");

const generatedA = { product_id: 10, name: "Tubular Polyester 15mm", is_super_lanyard_generated: 1, category_name: "Giveaways" };
const generatedB = { product_id: 11, name: "Tubular Polyester 20mm", is_super_lanyard_generated: 1, category_name: "Giveaways" };
const unrelated = { product_id: 12, name: "Normal product", is_super_lanyard_generated: 0, category_name: "Giveaways" };

products.productsData = [generatedA, generatedB, unrelated];
products.variationRows = [
  { product_id: 10, type_id: 1, type_name: "Theme", option_name: "Tubular" },
  { product_id: 10, type_id: 2, type_name: "Material", option_name: "Polyester" },
  { product_id: 10, type_id: 3, type_name: "Width", option_name: "15mm" },
  { product_id: 11, type_id: 1, type_name: "Theme", option_name: "Tubular" },
  { product_id: 11, type_id: 2, type_name: "Material", option_name: "Polyester" },
  { product_id: 11, type_id: 3, type_name: "Width", option_name: "20mm" },
  { product_id: 12, type_id: 1, type_name: "Theme", option_name: "Tubular" },
  { product_id: 12, type_id: 2, type_name: "Material", option_name: "Polyester" },
  { product_id: 12, type_id: 3, type_name: "Width", option_name: "15mm" }
];
products.categoryFilter = { querySelectorAll: () => [] };
products.variationFilters = {
  querySelectorAll: () => [
    { dataset: { typeId: "1", filterScope: "super-lanyard" }, value: "Tubular" },
    { dataset: { typeId: "2", filterScope: "super-lanyard" }, value: "Polyester" },
    { dataset: { typeId: "3", filterScope: "super-lanyard" }, value: "15mm" }
  ]
};

let filteredProducts = [];
products.drawProducts = result => { filteredProducts = result; };
products.drawTypeVariations = () => {};
products.applyFilters();

assert.deepEqual(
  filteredProducts.map(product => product.product_id),
  [10],
  "Theme + Material + Width must use AND logic and exclude unrelated products."
);

products.buyProduct("SLY-TUBULAR", "SLV-TUBULAR-06");
assert.equal(
  sandbox.window.location.href,
  "../../view/preview_product_customers/index.php?sku=SLY-TUBULAR&sku_variation=SLV-TUBULAR-06",
  "Buy must preserve both the generated product and its final active variation."
);

console.log("Public product filter tests passed.");

