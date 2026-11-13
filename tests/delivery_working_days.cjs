const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Element {
  constructor(tag) { this.tag = tag; this.children = []; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); }
  replaceChildren(...children) { this.children = children; }
  closest() { return section; }
}
const section = new Element('fieldset');
const document = {createElement: tag => new Element(tag), createDocumentFragment: () => new Element('fragment')};
const context = vm.createContext({document});
vm.runInContext(fs.readFileSync('view/global/delivery_options/common_delivery.js', 'utf8').replaceAll('export function', 'function'), context);
const options = [
  {days:15, value:25, type:'percentage'},
  {days:20, value:0, type:'amount'},
  {days:25, value:0, type:'amount'}
];
const catalog = {variations:[{id:1, name:'Base', options}]};
const result = context.commonDelivery(catalog, [1], 0, 500, 10000);
assert.equal(result.options.length, 2, 'Free options collapse into one 15-working-day option');
assert.equal(result.options[0].days, 15);
assert.equal(result.options[0].pence, 0);
assert.equal(options[1].days, 20, 'Stored catalog is not mutated');
const container = new Element('div');
let chosen = context.renderDelivery(container, result, 'normal');
assert.equal(chosen.key, 'free-15');
const blocks = container.children[0].children;
assert.equal(blocks[0].children[0].children[0].checked, true);
assert.equal(blocks[0].children[0].children[1].textContent, '15 working days · +£0.00');
assert.notEqual(blocks[0].children[0].children[0].value, blocks[1].children[0].children[0].value, 'Paid and free options with the same day remain distinct');
chosen = context.renderDelivery(container, result, '15');
assert.equal(chosen.pence, 2500, 'Explicit paid selection is preserved');
assert.equal(context.renderDelivery(container, result, 'missing').pence, 0);
context.renderDelivery(container, {configured:false, options:[]}, null);
assert.equal(section.hidden, true);
assert.equal(container.children.length, 0);
const paidOnly = context.commonDelivery({variations:[{id:1, options:[options[0]]}]}, [1], 0, 1, 10000);
assert.equal(paidOnly.options.length, 1, 'No free option is invented');
assert.equal(paidOnly.options[0].pence, 2500);
console.log('Working-day delivery: free default, ordering, shared renderer, distinct selections and empty state passed.');
