const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
(async () => {
 const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true});
 try {
 const page = await browser.newPage();
 const errors = []; page.on('pageerror', e => errors.push(e.message));
 const widget = execFileSync('/Applications/XAMPP/xamppfiles/bin/php', [path.join(root,'view/global/quantity_selector/quantity_selector.php')], {cwd:root,encoding:'utf8'});
 await page.route('http://preview.test/**', route => {
  const url = new URL(route.request().url());
  if (url.pathname === '/') return route.fulfill({contentType:'text/html',body:`<main style="max-width:600px;margin:40px auto;font-family:Arial"><h2>Price tiers</h2><div id="wrap-prices-group"></div>${widget}<div id="prices_empty" hidden></div><p id="bb_unit_quantity"></p><p id="bb_total"></p></main>`});
  const file = path.join(root, url.pathname);
  return route.fulfill({contentType:file.endsWith('.css')?'text/css':'text/javascript',body:fs.readFileSync(file)});
 });
 for (const preview of ['preview_porduct','preview_product_customers']) {
  await page.goto('http://preview.test/');
  await page.evaluate(async preview => {
   const {PricesController} = await import(`/view/${preview}/prices/prices.js`);
   window.controller = new PricesController({store:{}});
   window.rows = [{min_quantity:10,max_quantity:99,price:5,price_id:1},{min_quantity:100,max_quantity:200,price:4,price_id:2}];
   controller.render(rows);
  }, preview);
  assert.equal(await page.locator('#quantity_input').inputValue(),'10');
  await page.locator('#quantity_input').fill('75');
  assert.equal(await page.locator('#quantity_slider').inputValue(),'75');
  assert.equal(await page.locator('#bb_total').textContent(),'£375.00');
  await page.locator('#quantity_slider').fill('150');
  assert.equal(await page.locator('#quantity_input').inputValue(),'150');
  assert.equal(await page.locator('#bb_total').textContent(),'£600.00');
  assert.equal(await page.locator('.price-tier.is-selected').getAttribute('data-price-id'),'2');
  if (preview === 'preview_product_customers') assert.equal(await page.evaluate(()=>controller.store.selectedPriceId),2);
  await page.evaluate(()=>controller.render(rows));
  assert.equal(await page.locator('#quantity_input').inputValue(),'150');
  await page.locator('.price-tier').first().click();
  assert.equal(await page.locator('#quantity_input').inputValue(),'10');
  for (const [value,expected] of [['999','999'],['-2','1'],['','1'],['20.5','21']]) {
   await page.locator('#quantity_input').fill(value);
   await page.locator('#quantity_input').press('Enter');
   assert.equal(await page.locator('#quantity_input').inputValue(),expected);
  }
  await page.evaluate(()=>controller.render([{min_quantity:10,max_quantity:20,price:5},{min_quantity:50,max_quantity:60,price:4}]));
  await page.locator('#quantity_input').fill('40');await page.locator('#quantity_input').press('Enter');
  assert.equal(await page.locator('#quantity_input').inputValue(),'40');
  await page.evaluate(()=>controller.render([{min_quantity:100,max_quantity:null,price:4}]));
  await page.locator('#quantity_input').fill('1500');
  assert.equal(await page.locator('#bb_total').textContent(),'£6000.00');
  assert.equal(await page.locator('#quantity_slider').getAttribute('max'),'20000');
  assert.equal(await page.locator('#quantity_input').getAttribute('max'),null);
  await page.locator('#quantity_input').fill('30000');
  await page.locator('#quantity_input').press('Tab');
  assert.equal(await page.locator('#quantity_input').inputValue(),'30000');
  assert.equal(await page.locator('#quantity_slider').inputValue(),'20000');
  assert.equal(await page.locator('#bb_total').textContent(),'£120000.00');
  await page.locator('#quantity_input').fill('1000000');
  assert.equal(await page.locator('#bb_total').textContent(),'£4000000.00');
  await page.locator('#quantity_input').fill('1');
  assert.equal(await page.locator('#quantity_input').inputValue(),'1');
  assert.equal(await page.locator('#bb_total').textContent(),'—');
  await page.setViewportSize({width:375,height:700});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({path:`/private/tmp/dot63-quantity-${preview}.png`});
  await page.evaluate(()=>controller.render([]));
  assert.equal(await page.locator('#quantity_selector').isVisible(),false);
  console.log(`PASS ${preview}: slider, input, pricing, boundaries, gaps, open range, retained quantity and mobile width`);
 }
 assert.deepEqual(errors,[]);
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
