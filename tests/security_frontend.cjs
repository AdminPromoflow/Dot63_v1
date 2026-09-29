const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let checks = 0;
class Element {
  constructor(tag = 'div') { this.tagName = tag; this.children = []; this.dataset = {}; this.attributes = {}; this._html = ''; this.textContent = ''; this.value = ''; }
  set innerHTML(value) {
    this._html = value; this.children = [];
    // These controls are the fixed, data-free template in Items.renderList().
    if (value.includes('label-input')) this.children = [new Element('button'), new Element('input'), new Element('textarea')];
  }
  get innerHTML() { return this._html; }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.children.push(node); }
  setAttribute(key, value) { this.attributes[key] = value; }
  querySelector(tag) { return this.children.find(node => node.tagName === tag); }
  querySelectorAll() { return this.children; }
  addEventListener() {}
}
const payload = '</textarea><img src=x onerror="window.audit=1">';
function load(relative, name, stop) {
  let source = fs.readFileSync(path.join(root, relative), 'utf8');
  if (stop) { assert(source.includes(stop)); source = source.slice(0, source.indexOf(stop)); }
  const list = new Element();
  const context = { document: {createElement: tag => new Element(tag), addEventListener() {}, getElementById: () => list},
    window: {category_list: list, group_list: list}, category_list: list, group_list: list,
    URL, URLSearchParams, location: {href:'http://localhost/Dot63_v1/view/images/index.php'} };
  vm.createContext(context);
  vm.runInContext(source + `\nthis.AuditClass = ${name};`, context);
  return [Object.create(context.AuditClass.prototype), list];
}
let [category, list] = load('view/category/addcategory/category.js','ClassCategory','const category_list =');
category.getCategorySelected = () => {};
category.drawListCategories({success:true,data:[{category_id:1,name:payload,products_count:1}]});
assert.equal(list.children[0].children[0].textContent,payload);
assert(!list.innerHTML.includes(payload));checks++;
let [group, groups] = load('view/group/group/group.js','ClassGroup','const group_list =');
group.getGroupSelected = () => {};
group.drawListGroups({success:true,data:[{group_id:1,name:payload,products_count:1}]});
assert.equal(groups.children[0].children[0].children[0].textContent,payload);checks++;
let [items] = load('view/items/items/items.js','Items');
items.list = new Element();items.itemsState = [{id:'" onmouseover="bad',label:payload,text:payload}];
items.renderList();
const card=items.list.children[0];
assert(!card.innerHTML.includes(payload));
assert(!card.innerHTML.includes('onmouseover'));
assert.equal(card.querySelector('textarea').value,payload);
assert.equal(card.querySelector('input').value,payload);checks++;
console.log('PASS category, group and item data stays text across rendering');

(async () => {
  const calls=[];let nextStatus=200;
  const context = {
    window:{fetch: async (input, options={}) => {
      const url=input instanceof Request?input.url:String(input);
      calls.push({url,options});
      return url.endsWith('/csrf.php') ? {ok:true,json:async()=>({token:'a'.repeat(64)})} : {status:nextStatus,ok:nextStatus===200};
    }},
    document:{currentScript:{src:'http://localhost/Dot63_v1/view/global/security/request_security.js'}},
    location:{href:'http://localhost/Dot63_v1/view/main/index.php'},URL,Request,Headers,
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'view/global/security/request_security.js'),'utf8'),context);
  await Promise.all([1,2].map(()=>context.window.fetch('../../controller/products/product.php',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})));
  assert.equal(calls.filter(c=>c.url.endsWith('/csrf.php')).length,1);
  assert.equal(calls[1].options.headers.get('X-Dot63-CSRF-Token'),'a'.repeat(64));
  assert.equal(calls[1].options.headers.get('Content-Type'),'application/json');checks++;
  await context.window.fetch('https://api.stripe.com/payment',{method:'POST'});
  assert.equal(calls.at(-1).options.headers,undefined);checks++;
  nextStatus=419;
  const before=calls.length;
  await context.window.fetch('../../controller/users/supplier_info.php',{method:'POST'});
  assert.equal(calls.length,before+1); // A mutation is never automatically retried.
  nextStatus=200;
  await context.window.fetch('../../controller/users/supplier_info.php',{method:'POST'});
  assert.equal(calls.filter(c=>c.url.endsWith('/csrf.php')).length,2);checks++;
  console.log(`PASS same-origin CSRF transport, concurrent token requests, external requests and no mutation replay (${checks} scenarios)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
