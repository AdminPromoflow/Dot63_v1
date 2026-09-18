const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const promo = path.resolve(root, '../Promoflow_v1');
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, {value: '', textContent: '', disabled: false, setAttribute() {}});
  return elements.get(id);
};
const navigations = [];
const context = {document: {getElementById: element, addEventListener() {}},
  window: {location: {search: '?sku=TEST'}}, URLSearchParams, console,
  headerAddProduct: {goNext: url => navigations.push(url)}};
vm.createContext(context);
let source = fs.readFileSync(path.join(root, 'view/product_details/product_details/product_details.js'), 'utf8');
source = source.replace('const classAddProductDetails = new ClassAddProductDetails();', 'this.Details = ClassAddProductDetails;');
vm.runInContext(source, context);
const details = Object.create(context.Details.prototype);
const approved = {status: 1, status_label: 'Published', pending_status: null, status_request_version: 4};

(async () => {
  details.renderApprovalState({...approved, pending_status: 0, pending_status_label: 'Draft'});
  assert.equal(element('pd_status').value, '0');
  assert.match(element('pd_approval_state').textContent, /Current status: Published.*Awaiting approval: Draft/);
  element('pd_name').value = 'Product';
  element('pd_desc').value = 'Description';
  element('pd_status').value = '3';
  details.makeRequest = async (url, data, options) => {
    assert.equal(data.status, 3);
    assert.equal(data.status_request_version, 4);
    assert.equal(options.requireSuccess, true);
    return {success:true, data:{...approved, pending_status:3, pending_status_label:'Separate combinations', status_request_version:5}, message:'Awaiting approval'};
  };
  await details.saveProductDetails(false);
  assert.equal(details.statusRequestVersion, 5);
  assert.equal(element('pd_status').value, '3');
  assert.equal(element('pd_feedback').textContent, 'Awaiting approval');
  assert.equal(element('save').disabled, false);
  details.makeRequest = async () => { throw new Error('This request has changed'); };
  await details.saveProductDetails(true);
  assert.equal(navigations.length, 0);
  assert.equal(element('pd_feedback').textContent, 'This request has changed');
  assert.equal(element('save').disabled, false);

  const markup = fs.readFileSync(path.join(root,'view/product_details/product_details/product_details.php'),'utf8');
  const options = [...markup.matchAll(/<option value="([0-3])">([^<]+)<\/option>/g)];
  assert.equal(options.length, 4);
  assert.deepEqual(options.map(option=>option[1]), ['0','1','2','3']);
  options.forEach(option=>assert.doesNotMatch(option[2], /\d/));

  source = fs.readFileSync(path.join(promo,'view/preview_porduct/preview_porduct/preview_logic.js'),'utf8');
  source = source.slice(0,source.indexOf('const previewLogic = new PreviewLogic();')) + '\nthis.Preview = PreviewLogic;';
  vm.runInContext(source,context);
  const preview = Object.create(context.Preview.prototype);
  preview.renderApprovalRequest({...approved,pending_status:0,pending_status_label:'Draft'});
  assert.equal(element('btn_publish').disabled,false);
  assert.equal(element('btn_publish').textContent,'Approve: Draft');
  preview.renderApprovalRequest(approved);
  assert.equal(element('btn_publish').disabled,true);
  assert.equal(preview.statusRequest,null);

  source = fs.readFileSync(path.join(promo,'view/overview/section_overview/section_overview.js'),'utf8') + '\nthis.Overview = SectionOverview;';
  vm.runInContext(source,context);
  const overview = Object.create(context.Overview.prototype);
  overview.tableOverviewDetails = {innerHTML:''};
  overview.renderOverviewDetailsTable([{...approved,pending_status:0,pending_status_label:'Draft',name:'<script>bad</script>',supplier:{company_name:'Test'},is_approved:1}]);
  assert.match(overview.tableOverviewDetails.innerHTML,/Published → Draft/);
  assert.doesNotMatch(overview.tableOverviewDetails.innerHTML,/<script>/);
  assert.match(overview.tableOverviewDetails.innerHTML,/Status change/);

  source = fs.readFileSync(path.join(root,'view/product/products/article.js'),'utf8').replace('const productsClass = new ProductsClass();','this.Catalog = ProductsClass;');
  vm.runInContext(source,context);
  const catalog = Object.create(context.Catalog.prototype);
  catalog.fetchTypeVariations = async () => [];
  catalog.prepareStatusThreeProducts = async products => products.map(product => ({...product,combination:true}));
  const base = {is_approved:1,category_name:'Lanyards',group_name:'Lanyards - SuperLanyard'};
  const result = await catalog.prepareProductSets([0,1,2,3].map(status=>({...base,status,product_id:status})));
  assert.deepEqual(Array.from(result.normalProducts, product=>product.status),[1,2]);
  assert.deepEqual(Array.from(result.statusThreeProducts, product=>product.status),[3]);
  const matrix = catalog.createCartesianMatrix([
    {type_id:1,type_name:'Colour',options:[{name:'Blue'},{name:'Red'}]},
    {type_id:2,type_name:'Width',options:[{name:'Narrow'},{name:'Wide'}]},
  ]);
  assert.equal(matrix.length,4);
  console.log('Product status UI passed: labels, numeric payloads, pending Draft, failure feedback, review controls, catalog modes and combinations.');
})().catch(error=>{console.error(error);process.exitCode=1;});
