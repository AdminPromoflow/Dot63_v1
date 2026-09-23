import assert from 'node:assert/strict';
import { ImagesRenderer } from '../view/preview_porduct/images/images.js';
import { ArtworkRenderer } from '../view/preview_porduct/artwork/artwork.js';
import { PreviewStore } from '../view/preview_porduct/preview_porduct/preview_store.js';
import { PricesController } from '../view/preview_porduct/prices/prices.js';
import { VariationsController } from '../view/preview_porduct/variations/variations.js';
import { PricesController as CustomerPrices } from '../view/preview_product_customers/prices/prices.js';
import { VariationsController as CustomerVariations } from '../view/preview_product_customers/variations/variations.js';

let selected = [];
globalThis.document = { getElementById: () => null, querySelectorAll: () => selected };
const store = new PreviewStore();
const row = id => ({ variation: { variation_id: id } });
store.setRootVariation(row(1));
store.setGroupSelection(1, 'colour', row(2), { parentVariationId: 1 });
store.setGroupSelection(1, 'width', row(4), { parentVariationId: 1 });
store.setGroupSelection(1, 'colour', row(3), { parentVariationId: 1 });
assert.deepEqual(store.getSelectedVariationIds(), [1, 3, 4], 'Changing colour lost the selected width.');
store.removeGroupSelection('colour');
assert.deepEqual(store.getSelectedVariationIds(), [1, 4]);

const prices = new PricesController({ store });
const variations = new VariationsController({ store, prices });
assert.equal(prices.variationPricesAction, 'get_supplier_variation_prices');
assert.equal(variations.variationChildrenAction, 'get_supplier_variation_children');
assert.equal(new CustomerPrices({ store }).variationPricesAction, 'get_customer_variation_prices');
assert.equal(new CustomerVariations({ store, prices }).variationChildrenAction, 'get_customer_variation_children');
assert.equal(new PricesController({ store, variationPricesAction:'get_review_variation_prices' }).variationPricesAction, 'get_review_variation_prices');
assert.equal(new VariationsController({ store, variationChildrenAction:'get_review_variation_children' }).variationChildrenAction, 'get_review_variation_children');
// Media paths follow the Dot63 module location when the document is served from Promoflow.
const assetUrl = new URL('../controller/products/images/example.png', import.meta.url).href;
for (const renderer of [new ImagesRenderer(), new ArtworkRenderer(), variations]) {
  assert.equal(renderer.resolveAssetPath('products/images/example.png'), assetUrl);
  assert.equal(renderer.resolveAssetPath('controller/products/images/example.png'), assetUrl);
  assert.equal(renderer.resolveAssetPath('https://example.test/artwork.pdf'), 'https://example.test/artwork.pdf');
}
assert.equal(variations.resolveAssetPath('', '../../view/preview_product_customers/img/icon_product.png'), new URL('../view/preview_product_customers/img/icon_product.png', import.meta.url).href);
const deliveries = [
  {value:'normal', defaultChecked:true, dataset:{surcharge:'0'}},
  {value:'10wd', dataset:{surcharge:'25'}},
  {value:'8wd', dataset:{surcharge:'50'}},
];
prices.deliveryOptions = { querySelectorAll: () => deliveries };
for (const key of Object.keys(prices.elements)) prices.elements[key] = {textContent:''};
store.selectedQuantity = 10;
store.selectedPrice = 5.46;
store.selectedPriceId = 1;
for (const [delivery,total] of [['normal','£54.60'],['10wd','£68.25'],['8wd','£81.90']]) {
  store.selectedDelivery = delivery;
  prices.updateSummary();
  assert.equal(prices.elements.total.textContent, total);
}
selected = [1.5,2].map(extra => ({dataset:{extraPrice:String(extra)},classList:{contains:()=>false}}));
store.selectedQuantity = 20;
store.selectedDelivery = '10wd';
prices.updateSummary();
assert.equal(prices.elements.extraTotal.textContent, '£70.00');
assert.equal(prices.elements.total.textContent, '£224.00');
selected[1].classList.contains = () => true;
prices.updateSummary();
assert.equal(prices.elements.total.textContent, '—', 'A missing extra price produced a misleading total.');
console.log('PASS supplier UI: independent sibling selections, private endpoints, customer delivery/price parity and unavailable extras.');
