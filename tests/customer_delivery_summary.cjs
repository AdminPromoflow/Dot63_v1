const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../view/preview_product_customers/prices/prices.js'), 'utf8')
  .replace(/^const \{ QuantitySelector \}[^\n]*\n/, '')
  .replace('export class PricesController', 'class PricesController');
let selectedOptions = [];
const context = vm.createContext({
  document: {querySelectorAll: () => selectedOptions},
});
const PricesController = vm.runInContext(`${source}\nPricesController;`, context);
const controller = Object.create(PricesController.prototype);
const deliveries = [
  {value: 'normal', dataset: {surcharge: '0'}, defaultChecked: true},
  {value: '10wd', dataset: {surcharge: '25'}},
  {value: '8wd', dataset: {surcharge: '50'}},
];
controller.deliveryOptions = {querySelectorAll: () => deliveries};
controller.elements = Object.fromEntries([
  'unit', 'quantity', 'unitTotal', 'extraUnit', 'extraQuantity', 'extraTotal',
  'deliveryPercentage', 'deliverySurcharge', 'total', 'mainPrice', 'quantityLabel', 'unitHint',
].map(key => [key, {textContent: ''}]));
controller.store = {selectedQuantity: 10, selectedPrice: 5.46, selectedPriceId: 1, selectedDelivery: 'normal'};
let summary;
controller.onSummaryChange = value => { summary = value; };

function expectDelivery(option, surcharge, total) {
  controller.store.selectedDelivery = option;
  controller.updateSummary();
  assert.equal(controller.elements.deliverySurcharge.textContent, surcharge);
  assert.equal(controller.elements.total.textContent, total);
  assert.equal(deliveries.filter(input => input.checked).length, 1);
  assert.equal(deliveries.find(input => input.checked).value, option);
  assert.equal(summary.ready, true);
}

expectDelivery('normal', '£0.00', '£54.60');
expectDelivery('10wd', '£13.65', '£68.25');
expectDelivery('8wd', '£27.30', '£81.90');
controller.store.selectedQuantity = 20;
controller.updateSummary();
assert.equal(controller.elements.total.textContent, '£163.80');
assert.equal(controller.store.selectedDelivery, '8wd');

selectedOptions = [{dataset: {extraPrice: '1.50'}, classList: {contains: () => false}}];
controller.store.selectedQuantity = 10;
expectDelivery('10wd', '£17.40', '£87.00');
assert.equal(controller.elements.extraTotal.textContent, '£15.00');
expectDelivery('normal', '£0.00', '£69.60');

// Round a half-penny surcharge once, after calculating the job subtotal.
selectedOptions = [];
controller.store.selectedPrice = 0.01;
controller.store.selectedQuantity = 1;
expectDelivery('8wd', '£0.01', '£0.02');

selectedOptions = [{dataset: {extraPrice: '0'}, classList: {contains: () => true}}];
controller.updateSummary();
assert.equal(controller.elements.total.textContent, '—');
assert.equal(controller.elements.deliverySurcharge.textContent, '—');
assert.equal(summary.ready, false);
controller.store.selectedPrice = null;
controller.updateSummary();
assert.equal(controller.elements.total.textContent, '—');
assert.equal(summary.ready, false);

// Previews without the delivery widget retain their original base calculation.
selectedOptions = [];
controller.deliveryOptions = null;
controller.store.selectedPrice = 5.46;
controller.store.selectedQuantity = 10;
controller.updateSummary();
assert.equal(controller.elements.total.textContent, '£54.60');
console.log('PASS delivery estimates: 0/25/50%, quantity changes, extras, penny rounding and unavailable prices.');
