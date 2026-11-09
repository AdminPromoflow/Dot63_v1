const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function button() { return {dataset:{}, events:{}, attributes:{}, addEventListener(n,f){this.events[n]=f;}, setAttribute(n,v){this.attributes[n]=v;}}; }
function row(level, product, branch=true) {
 const slot={appendChild(b){this.button=b;}};
 return {dataset:{treeLevel:String(level),treeProduct:String(product)},slot,hidden:false,value:'unsaved 12.50',querySelector(s){return s==='.delivery-tree-toggle-slot'?(branch?slot:null):{textContent:'Variation'};}};
}
const rows=[row(0,1),row(1,1),row(2,1,false),row(1,1,false),row(0,2),row(1,2,false)];
const expand=button(),collapse=button();expand.dataset.treeAction='expand';collapse.dataset.treeAction='collapse';
const tree={querySelectorAll:s=>s==='[data-tree-level]'?rows:[expand,collapse]};
vm.runInNewContext(fs.readFileSync('view/delivery_times/delivery_times.js','utf8'),{
 document:{querySelectorAll:s=>s==='.delivery-tree'?[tree]:[],createElement:button,getElementById:()=>({addEventListener(){}})},window:{addEventListener(){},headerAddProduct:{setCurrentHeader(){}}}
});
rows[1].slot.button.events.click();assert.equal(rows[2].hidden,true);assert.equal(rows[3].hidden,false);
rows[0].slot.button.events.click();assert.equal(rows[1].hidden,true);assert.equal(rows[3].hidden,true);assert.equal(rows[4].hidden,false);
rows[0].slot.button.events.click();assert.equal(rows[1].hidden,false);assert.equal(rows[2].hidden,true);assert.equal(rows[2].value,'unsaved 12.50');
collapse.events.click();assert.equal(rows[5].hidden,true);assert.equal(rows[4].hidden,false);
expand.events.click();assert.ok(rows.every(r=>!r.hidden));assert.equal(rows[0].slot.button.attributes['aria-expanded'],'true');
console.log('Delivery collapse: nesting, independent products, expand/collapse all and preserved inputs passed.');
