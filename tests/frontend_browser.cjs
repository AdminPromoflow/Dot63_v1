const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base=process.env.FRONTEND_TEST_URL || 'http://127.0.0.1:8783';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined),headless:true,args:['--no-sandbox']});
 const context=await browser.newContext();
 await context.addCookies([{name:'PHPSESSID',value:'dot63structuretest20260909',url:base}]);
 const page=await context.newPage();let current='',errors=[]; let loginFails=false; page.setDefaultTimeout(6000);const requests=[];
 page.on('pageerror',e=>{console.log('PAGE ERROR',current,e.message); errors.push({page:current,error:e.message});});
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errors.push({page:current,error:m.text()});});
 page.on('dialog',d=>d.dismiss());
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin!==base)return route.abort();
  if(!url.pathname.includes('/controller/'))return route.continue();
  let data={};try{data=JSON.parse(req.postData()||'{}');}catch{data.action=req.postData()?.match(/name="action"\r\n\r\n([^\r]+)/)?.[1];}
  const action=data.action;requests.push({page:current,action,data,body:req.postData()});
  let result={success:true,response:true,data:[],result:[],products:[],variations:[],prices:[],items:[],images:[],type_variations:[],categories:[],cateogories:[],cart_count:0};
  const selected={success:true,data:[{group_id:1,category_id:1,name:'Unassigned Group',products_count:1}]};
  if(action==='get_groups')result={success:true,data:{success:true,data:[{group_id:2,name:'Group Two',products_count:1}]},group_selected:selected};
  if(action==='get_group_selected')result=selected;
  if(action==='get_default_variation_by_sku')result={success:true,sku_variation:'TEST-V'};
  if(action==='get_products_by_group')result={success:true,result:[{product_id:1,SKU:'TEST',name:'Test Product'},{product_id:2,SKU:'OTHER',name:'Other Product'}]};
  if(action==='get_products'||action==='search_products')result={success:true,result:[{product_id:1,SKU:'TEST',name:'Test Product',status:2,is_approved:1,category_name:'Category Two',group_name:'Group Two',images:[]}]};
  if(action==='get_categories_filter_and_their_groups')result={success:true,cateogories:[{name:'Category Two',category_id:2,approved:1,groups:[]}]};
  if(action==='requestLogin'&&loginFails)result={success:false,error:'Test credentials rejected'};
  if(action==='get_cases')result={response:true,result:[{id_case:7,name:'Test Case'}]};
  if(action==='get_categories')result={success:true,data:[{category_id:2,name:'Category Two',products_count:1}],category_selected:{success:true,data:[{category_id:1,name:'Unassigned Category'}]}};
  if(action==='get_category_selected')result={success:true,data:[{category_id:1,name:'Unassigned Category'}]};
  if(action==='verify_login_supplier')result.response=!/log_inSupplier|sign_up_supplier/.test(current);
  if(action==='get_preview_product_details')result=[{company_name:'Test'},{category_name:'Category'},{group_name:'Group'},{default_variation_id:null},{product_details:{product_name:'Product'}}];
  if(action==='get_variation_details')result={...result,current:{},parent:{},product:{}};
  if(action==='get_product_details')result={success:true,data:{name:'Test Product',description:'Test',status:2,is_approved:1}};
  if(['get_supplier_preview','get_customer_preview'].includes(action))result={success:true,product:{name:'Test Product',SKU:'TEST',status:2},readiness:{checks:[],ready:false},root_variation_id:null};
  if(action==='get_dashboard_categories')result={success:true,data:[{category_id:2,name:'Category Two',groups_count:1}]};
  if(action==='get_dashboard_groups')result={success:true,category:{name:'Category Two'},data:[{group_id:2,name:'Group Two',products_count:1}]};
  if(action==='get_dashboard_products')result={success:true,group:{name:'Group Two'},data:[]};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
 });
 const pages=['main','category','group','product_list','product_details','variations','images','items','prices','product','products_supplier','dashboard_supplier','supplier_profile','log_in','log_inSupplier','sign_up','sign_up_supplier','forg_password','shopping_cart','checkout','messages','dashboard_supplier_messages','preview_porduct','preview_product_customers','preview_product_customers_'];
 for(current of (process.argv.includes('--interactions') ? [] : pages)){await page.goto(`${base}/view/${current}/index.php?sku=TEST&sku_variation=TEST-V`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(220);console.log('LOADED',current);}

 const visit=async name=>{current=name; await page.goto(`${base}/view/${name}/index.php?sku=TEST&sku_variation=TEST-V`); await page.waitForTimeout(180);};
 const waitAction=action=>{ const pending=page.waitForRequest(req=>req.url().includes('/controller/')&&(req.postData()?.includes(`"${action}"`)||req.postData()?.includes(`\r\n${action}\r\n`))); pending.catch(()=>{}); return pending; };

 await visit('group');
 await page.locator('#edit_groups').click();
 await page.locator('#group_list .cp-group').first().waitFor();
 await page.locator('#cancel_editing').waitFor({state:'visible'});
 await page.locator('#cancel_editing').click();
 await page.waitForTimeout(80);
 assert.equal(await page.locator('#group_list').innerText(),'Unassigned Group\n1 product');
 await page.locator('#edit_groups').click();
 await page.locator('#cancel_editing').waitFor({state:'visible'});
 const groupUpdate=waitAction('update_group'); groupUpdate.catch(()=>{});
 await page.locator('#group_list .cp-group').filter({hasText:'Group Two'}).click();
 assert.equal((await groupUpdate).postDataJSON().group_id,2);
 await page.waitForURL('**/view/product_list/**');
 assert.match(page.url(),/sku=TEST/);
 console.log('PASS group edit/cancel/select/navigation');

 await visit('category');
 await page.locator('#edit_categories').click();
 const categoryUpdate=waitAction('update_category');
 await page.locator('#category_list .cp-cat').filter({hasText:'Category Two'}).click();
 assert.equal((await categoryUpdate).postDataJSON().id,2);
 await page.waitForURL('**/view/group/**');
 console.log('PASS category delegated selection');

 await visit('product_list');
 await page.locator('#choose_product').click();
 await page.getByText('Other Product',{exact:true}).waitFor();
 await page.locator('.pl-product').filter({hasText:'Other Product'}).click();
 await page.waitForURL('**/view/product_details/**');
 assert.match(page.url(),/sku=OTHER/);
 console.log('PASS dynamically rendered product selection');

 await visit('dashboard_supplier');
 await page.locator('[data-category-id="2"]').click();
 await page.locator('[data-group-id="2"]').click();
 await page.getByText('This group has no products.').waitFor();
 await page.locator('#catalog-back').click();
 await page.locator('[data-group-id="2"]').waitFor();
 console.log('PASS catalog categories/groups/back');

 await visit('product');
 await page.getByText('Test Product',{exact:true}).first().waitFor();
 await page.locator('#product-search').fill('Test');
 await page.waitForTimeout(120);
 assert.ok(requests.some(r=>r.page==='product'&&r.action==='search_products'));
 await page.getByRole('button',{name:'See more',exact:true}).first().click();
 await page.waitForURL('**/view/preview_product_customers/**');
 console.log('PASS search and product action after rendering');

 await visit('images');
 await page.locator('#images_input').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGZ8AAAAASUVORK5CYII=','base64')});
 assert.equal(await page.locator('#gallery .cp-thumb').count(),1);
 const imageUpload=waitAction('create_update_images');
 await page.locator('#variationImagesForm').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 const upload=await imageUpload;
 assert.match(upload.headers()['content-type'],/^multipart\/form-data; boundary=/);
 assert.match(upload.postData(),/filename="test.png"/);
 console.log('PASS image upload as multipart');

 await visit('items');
 await page.locator('#add_item').click();
 assert.equal(await page.locator('.text-input').count(),1);
 await page.locator('.label-input').fill('Material');
 await page.locator('.text-input').fill('Cotton');
 const saveItems=waitAction('create_items');
 await page.locator('#variationItemsForm').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 assert.deepEqual((await saveItems).postDataJSON().texts,['Cotton']);
 console.log('PASS item events and save payload');


 await visit('prices');
 await page.locator('#add_price').click();
 await page.locator('.min-input').fill('10');
 await page.locator('.max-input').fill('100');
 await page.locator('.price-input').fill('1.25');
 const savePrices=waitAction('create_prices'); const pricesReload=page.waitForNavigation({waitUntil:'domcontentloaded'});
 await page.locator('#variationPricesForm').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 assert.deepEqual((await savePrices).postDataJSON().prices,['1.25']);
 await pricesReload; console.log('PASS price validation and save payload');

 await visit('preview_product_customers');
 await page.evaluate(async()=>{
   const oldRoot=document.getElementById('wrap-prices-group'); oldRoot.replaceWith(oldRoot.cloneNode(false));
   const {PricesController}=await import('./prices/prices.js');
   const {PreviewStore}=await import('./preview_porduct/preview_store.js');
   window.testPrices=new PricesController({store:new PreviewStore(),api:{previewUrl:'../../controller/order/product.php'},getSku:()=> 'TEST'});
   window.testPrices.render([{price_id:1,min_quantity:10,max_quantity:99,price:2},{price_id:2,min_quantity:100,max_quantity:999,price:1}]);
   document.getElementById('preview_content').hidden=false;
 });
 await page.locator('.price-tier[data-price-id="2"]').click();
 assert.equal(await page.evaluate(()=>window.testPrices.store.selectedQuantity),100);
 console.log('PASS rendered preview price selection');
 await visit('log_inSupplier');
 await page.locator('#email').fill('supplier@example.test');
 await page.locator('#email').press('Enter');
 assert.equal(await page.locator('#password').evaluate(el=>document.activeElement===el),true);
 await page.locator('.toggle-pass').click();
 assert.equal(await page.locator('#password').getAttribute('type'),'text');
 await page.locator('#password').fill('Test!12345');
 const login=waitAction('requestLoginSupplier');
 await page.locator('#login_enter').click();
 assert.equal((await login).postDataJSON().email,'supplier@example.test');
 await page.waitForURL('**/view/dashboard_supplier/**'); console.log('PASS supplier keyboard, toggle and login');

 await visit('main'); loginFails=true;
 await page.locator('[data-auth-open="register"]').first().click(); await page.locator('[data-auth-tab="login"]').click();
 await page.locator('#main-login-form [name="email"]').fill('customer@example.test');
 await page.locator('#main-login-form [name="password"]').fill('Test!12345');
 await page.locator('#main-login-form button[type="submit"]').click();
 await page.getByText('Test credentials rejected',{exact:true}).waitFor();
 assert.equal(await page.locator('#main-login-form button[type="submit"]').isEnabled(),true);
 await page.locator('[data-auth-close]').first().click();
 assert.equal(await page.locator('#auth-dialog').evaluate(el=>el.open),false);
 console.log('PASS home auth errors and modal close');

 await visit('preview_product_customers');
 await page.evaluate(async()=>{
   const oldModal=document.getElementById('customer_auth_modal'); oldModal.replaceWith(oldModal.cloneNode(true));
   const {CustomerAuthModal}=await import('./preview_porduct/auth.js');
   window.testAuth=new CustomerAuthModal({api:{loginUrl:'../../controller/customers/login.php'},onAuthenticated:()=>{},onDismissed:()=>{}});
   window.testAuth.open();
 });
 await page.locator('#customer_login_form [name="email"]').fill('customer@example.test');
 await page.locator('#customer_login_form [name="password"]').fill('Test!12345');
 await page.locator('#customer_login_form').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 await page.getByText('Test credentials rejected',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.testAuth.busy),false);
 console.log('PASS preview local auth request and error handling');
 console.log(JSON.stringify({errors,requestCount:requests.length},null,2));
 await browser.close();if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
