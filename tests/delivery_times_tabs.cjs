const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
function element(attributes = {}) {
  return {attributes, events: {}, hidden: false, tabIndex: 0,
    addEventListener(name, handler) { this.events[name] = handler; },
    setAttribute(key, value) { this.attributes[key] = value; },
    getAttribute(key) { return this.attributes[key]; }, focus() { this.focused = true; }};
}
const tabs = [element({'aria-controls': 'variations-panel'}), element({'aria-controls': 'second-panel'})];
const nodes = {'variations-panel':element(), 'second-panel':element(), 'delivery-back':element(), 'delivery-next':element()};
let destination, current;
vm.runInNewContext(fs.readFileSync('view/delivery_times/delivery_times.js','utf8'), {
 document:{querySelectorAll:()=>tabs,getElementById:id=>nodes[id]},
 window:{headerAddProduct:{setCurrentHeader:value=>current=value,goNext:value=>destination=value}}
});
assert.equal(current,'Delivery Times');
tabs[1].events.click();
assert.equal(nodes['variations-panel'].hidden,true); assert.equal(nodes['second-panel'].hidden,false);
assert.equal(tabs[0].tabIndex,-1); assert.equal(tabs[1].attributes['aria-selected'],'true');
tabs[1].events.keydown({key:'ArrowRight',preventDefault(){}});
assert.equal(nodes['variations-panel'].hidden,false); assert.equal(tabs[0].focused,true);
nodes['delivery-back'].events.click(); assert.equal(destination,'../../view/prices/index.php');
nodes['delivery-next'].events.click(); assert.equal(destination,'../../view/preview_porduct/index.php');
console.log('Delivery tabs: click, keyboard navigation and workflow links passed.');
