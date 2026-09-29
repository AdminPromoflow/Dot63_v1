const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const origin = 'http://artwork.test';
const previewUrl = `${origin}/view/preview_product_customers/index.php?sku=ARTWORK-TEST`;

(async () => {
  const php = process.env.PHP_BINARY || '/Applications/XAMPP/xamppfiles/bin/php';
  const html = execFileSync(php, [path.join(root, 'view/preview_product_customers/preview_porduct/preview.php')], {cwd: root, encoding: 'utf8'});
  const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    const errors = [], cartRequests = [], dialogs = [];
    let authenticated = true, confirmWithoutPdf = false;
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      if (confirmWithoutPdf) await dialog.accept(); else await dialog.dismiss();
    });
    await page.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== origin) return route.abort();
      const reply = (body, status = 200) => route.fulfill({status, contentType: 'application/json', body: JSON.stringify(body)});
      if (url.pathname.endsWith('/preview_product_customers/index.php')) {
        return route.fulfill({contentType: 'text/html', body: `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/view/global/security/request_security.js"></script></head><body>${html}</body></html>`});
      }
      if (url.pathname.endsWith('/security/csrf.php')) return reply({token: 'a'.repeat(64)});
      if (url.pathname.endsWith('/order/product.php')) {
        const data = request.postDataJSON();
        if (data.action === 'get_customer_preview') return reply({success: true, root_variation_id: 1, product: {sku: 'ARTWORK-TEST', name: 'Artwork test', supplier_name: 'Test supplier'}});
        if (data.action === 'get_customer_variation_children') return reply({success: true, current: {
          variation: {variation_id: 1, name: 'Default', price_display_mode: 'prices'},
          artwork: null, images: [], items: [], prices: [{price_id: 1, min_quantity: 1, max_quantity: 100, price: 2.50}]
        }, children: [], types: []});
        return reply({success: true, prices: []});
      }
      if (url.pathname.endsWith('/order/cart.php')) {
        assert.match(request.headers()['content-type'], /^multipart\/form-data; boundary=/);
        assert.equal(request.headers()['x-dot63-csrf-token'], 'a'.repeat(64));
        cartRequests.push(request.postData());
        if (!authenticated) return reply({success: false, code: 'AUTH_REQUIRED', error: 'Please log in before using your shopping cart.'}, 401);
        return reply({success: true, cart_count: cartRequests.length, message: 'The product was added to your cart.'}, 201);
      }
      if (url.pathname.endsWith('/customers/login.php')) { authenticated = true; return reply({success: true}); }
      if (url.pathname.endsWith('/shopping_cart/index.php')) return route.fulfill({contentType: 'text/html', body: '<h1>Shopping cart</h1>'});
      const file = path.join(root, url.pathname);
      if (!fs.existsSync(file)) return route.fulfill({status: 404, body: ''});
      return route.fulfill({contentType: file.endsWith('.css') ? 'text/css' : 'text/javascript', body: fs.readFileSync(file)});
    });
    const waitReady = async () => { await page.waitForFunction(() => !document.getElementById('bb_add_to_cart').disabled); };
    const choosePdf = async () => page.locator('#artwork_pdf').setInputFiles({name: 'my-artwork.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nArtwork test\n%%EOF')});
    const addAndWait = async () => {
      const response = page.waitForResponse(url => url.url().endsWith('/order/cart.php'));
      await page.locator('#bb_add_to_cart').click();
      await response;
      await waitReady();
    };
    await page.goto(previewUrl);
    await waitReady();
    assert(await page.locator('#artwork_section').isVisible(), 'Upload must be visible without supplier templates');
    await page.locator('#bb_add_to_cart').click();
    assert.equal(cartRequests.length, 0, 'Cancel should not add a cart job');
    assert.match(dialogs[0], /Are you sure.*without one/);
    confirmWithoutPdf = true;
    await addAndWait();
    assert.equal(cartRequests.length, 1);
    assert.doesNotMatch(cartRequests[0], /filename=/);
    assert.match(cartRequests[0], /name="variation_ids\[\]"\r\n\r\n1/);

    await page.locator('#artwork_pdf').setInputFiles({name: 'wrong.txt', mimeType: 'text/plain', buffer: Buffer.from('wrong')});
    await page.locator('#bb_add_to_cart').click();
    assert.equal(cartRequests.length, 1);
    assert.equal(await page.locator('#artwork_pdf').getAttribute('aria-invalid'), 'true');
    assert.match(await page.locator('#artwork_upload_status').innerText(), /choose a PDF/);
    await page.locator('#artwork_pdf').setInputFiles({name: 'large.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(8 * 1024 * 1024 + 1)});
    await page.locator('#bb_add_to_cart').click();
    assert.equal(cartRequests.length, 1);
    assert.match(await page.locator('#artwork_upload_status').innerText(), /up to 8 MB/);
    await page.locator('#artwork_remove').click();
    assert.equal(await page.locator('#artwork_pdf').inputValue(), '');

    await choosePdf();
    const dialogCount = dialogs.length;
    await addAndWait();
    assert.equal(dialogs.length, dialogCount, 'Valid artwork should not trigger missing-PDF confirmation');
    assert.match(cartRequests.at(-1), /filename="my-artwork.pdf"/);
    assert.match(cartRequests.at(-1), /%PDF-1.4/);
    assert.match(await page.locator('#artwork_upload_status').innerText(), /Saved with the product/);
    await page.locator('#artwork_section').screenshot({path: '/private/tmp/dot63-artwork-desktop.png'});

    authenticated = false;
    await choosePdf();
    await addAndWait();
    await page.locator('#customer_auth_modal').waitFor({state: 'visible'});
    assert.match(await page.locator('#artwork_upload_status').innerText(), /Sign in/);
    await page.locator('#customer_login_email').fill('customer@example.test');
    await page.locator('#customer_login_password').fill('Example123!');
    const retry = page.waitForResponse(url => url.url().endsWith('/order/cart.php') && url.status() === 201);
    await page.locator('#customer_login_form button[type="submit"]').click();
    await retry;
    await waitReady();
    assert.equal(dialogs.length, dialogCount);
    assert.match(cartRequests.at(-1), /filename="my-artwork.pdf"/);
    assert.match(cartRequests.at(-1), /%PDF-1.4/);
    assert.match(await page.locator('#artwork_upload_status').innerText(), /Saved with the product/);

    await page.setViewportSize({width: 375, height: 812});
    await page.locator('#artwork_section').scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile layout overflows');
    await page.locator('#artwork_section').screenshot({path: '/private/tmp/dot63-artwork-mobile.png'});
    await page.locator('#bb_buy_now').click();
    await page.waitForURL('**/view/shopping_cart/index.php');
    assert.match(cartRequests.at(-1), /name="intent"\r\n\r\nbuy_now/);
    assert.match(cartRequests.at(-1), /filename="my-artwork.pdf"/);
    assert.deepEqual(errors, []);
    console.log('PASS: artwork UI, missing-PDF cancel/confirm, invalid files, multipart/CSRF, sign-in retry, mobile layout and Buy now.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
