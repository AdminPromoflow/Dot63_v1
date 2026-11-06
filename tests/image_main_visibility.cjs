const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.attributes = {}; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.children.push(child); }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(name, handler) { this[name] = handler; }
}
const context = {console, URL, URLSearchParams, FormData, Headers,
 document: {createElement: tag => new Element(tag), addEventListener(){}, querySelectorAll(){return [];}},
 location: {href:'http://localhost/view/images/index.php'},
 window: {location:{search:'?sku=P&sku_variation=V'}, headerAddProduct:{goNext(){}}},
 loader:{show(){},hide(){}}, alert(){}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('view/images/img/images.js','utf8').replace('const imagesClass = new Images();','this.Images = Images;'), context);
vm.runInContext(fs.readFileSync('view/images/img/image_logic.js','utf8'), context);
(async () => {
  const images = Object.create(context.Images.prototype);
  images.gallery = new Element('div');
  let calls = [];
  images.logic = {async updateMainVisibility(id, value){ calls.push({id,value}); }};
  const item = {id:'local', url:'http://localhost/test.png', name:'Test', origin:'local', show_on_product_main:0};
  let figure = images.appendThumb(item);
  let check = figure.children[3].children[0];
  assert.equal(check.checked, false);
  check.checked = true;
  await check.change();
  assert.equal(item.show_on_product_main, 1);
  assert.equal(calls.length, 0, 'New images defer the value until upload');
  item.origin = 'server'; item.image_id = 42;
  figure = images.appendThumb(item);
  check = figure.children[3].children[0];
  assert.equal(check.checked, true, 'Saved flags are restored');
  check.checked = false;
  await check.change();
  assert.deepEqual(calls, [{id:42,value:0}]);
  assert.equal(item.show_on_product_main, 0);
  images.logic.updateMainVisibility = async () => {throw new Error('Save failed');};
  check.checked = true;
  await check.change();
  assert.equal(check.checked, false, 'Failure restores the saved state');
  assert.equal(item.show_on_product_main, 0);
  assert.equal(check.disabled, false);
  const logic = Object.create(context.window.ImageLogic.prototype);
  logic.images = {items:[
    {origin:'local', name:'checked.png', file:new Blob(['one']), show_on_product_main:1},
    {origin:'local', name:'unchecked.png', file:new Blob(['two']), show_on_product_main:0}
  ]};
  let uploads = 0;
  logic.createUpdateImages = async fd => {
    assert.deepEqual(fd.getAll('show_on_product_main[]'), ['1','0']);
    assert.deepEqual(fd.getAll('images[]').map(file => file.name), ['checked.png','unchecked.png']);
    uploads++;
    return {success:true};
  };
  await logic.onSubmit({preventDefault(){}});
  await logic.onNext({preventDefault(){}});
  assert.equal(uploads, 2);
  logic.makeRequest = async (url, data, options) => {
    assert.equal(data.sku_variation, 'V');
    assert.equal(data.image_id, 42);
    assert.equal(data.show_on_product_main, 1);
    assert.equal(options.requireSuccess, true);
  };
  await logic.updateMainVisibility(42, 1);
  console.log('PASS: checkbox state, upload flags for Save and Next, immediate updates and error rollback');
})().catch(error => {console.error(error);process.exitCode=1;});
