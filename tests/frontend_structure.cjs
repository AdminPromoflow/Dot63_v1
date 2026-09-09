const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(path.join(root, 'view'), { recursive: true })
  .filter(file => file.endsWith('.js'));
const transports = [];
for (const file of files) {
  const source = fs.readFileSync(path.join(root, 'view', file), 'utf8');
  const match = source.match(/^( +)async makeRequest\(url, data, options = \{\}\) \{[\s\S]*?^\1\}/m);
  if (match) transports.push({ file, method: match[0].split('\n').map(line => line.trim()).join('\n') });
  test(`${file}: local requests and constructor startup`, () => {
    assert.doesNotMatch(source, /\binit(?:[A-Z]\w*)?\s*\(/);
    assert.doesNotMatch(source, /\b(?:bindEvents|bindButtons|listenFormSubmit)\s*\(/);
    const requests = source.match(/\bfetch\s*\(/g) || [];
    assert.equal(requests.length, match ? 1 : 0, 'HTTP calls must live in the local makeRequest');
    if (match) assert.doesNotMatch(source.replace(match[0], ''), /\bfetch\s*\(/);
    assert.doesNotMatch(source, /onclick\s*=/);
  });
}

test('every requesting file has the same makeRequest implementation', () => {
  assert.ok(transports.length > 25);
  for (const transport of transports) assert.equal(transport.method, transports[0].method, transport.file);
});

function client(fetch) {
  return vm.runInNewContext(`({ ${transports[0].method} })`, {
    fetch, Headers, FormData, JSON, Error
  });
}

test('JSON requests preserve payload, cookies, headers and cancellation', async () => {
  const controller = new AbortController();
  let sent;
  const api = client(async (url, options) => {
    sent = { url, ...options };
    return new Response(JSON.stringify({ success: true, data: [1, 2] }));
  });
  const payload = { action: 'update_group', sku: 'SKU-1', group_id: 2 };
  const result = await api.makeRequest('/group.php', payload, {
    signal: controller.signal, headers: { 'X-CSRF-Token': 'test-token' }
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { success: true, data: [1, 2] });
  assert.equal(sent.method, 'POST');
  assert.equal(sent.credentials, 'same-origin');
  assert.equal(sent.headers.get('Content-Type'), 'application/json');
  assert.equal(sent.headers.get('X-CSRF-Token'), 'test-token');
  assert.equal(sent.signal, controller.signal);
  assert.deepEqual(JSON.parse(sent.body), payload);
});

test('file uploads preserve FormData and browser multipart boundaries', async () => {
  const body = new FormData();
  body.append('action', 'create_update_images');
  body.append('images[]', new Blob(['image'], { type: 'image/png' }), 'image.png');
  const api = client(async (_, options) => {
    assert.equal(options.body, body);
    assert.equal(options.headers.has('Content-Type'), false);
    assert.equal(options.headers.get('X-Requested-With'), 'XMLHttpRequest');
    return new Response('{"success":true}');
  });
  await api.makeRequest('/image.php', body, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
});

test('HTTP errors retain status, code and response details', async () => {
  const api = client(async () => new Response('{"success":false,"code":"AUTH_REQUIRED","error":"Sign in"}', { status: 401 }));
  await assert.rejects(api.makeRequest('/cart.php', {}), error =>
    error.status === 401 && error.code === 'AUTH_REQUIRED' && error.details.error === 'Sign in');
});

test('business responses return to the caller unless success is required', async () => {
  const api = client(async () => new Response('{"success":false,"error":"Validation failed"}'));
  assert.equal((await api.makeRequest('/save.php', {})).success, false);
  await assert.rejects(api.makeRequest('/save.php', {}, { requireSuccess: true }), /Validation failed/);
});

test('malformed and empty JSON fail without rendering a success state', async () => {
  for (const body of ['<html>PHP error</html>', '']) {
    const api = client(async () => new Response(body));
    await assert.rejects(api.makeRequest('/api.php', {}), /invalid response/);
  }
});

test('legacy text responses are explicit', async () => {
  const api = client(async () => new Response('Legacy result'));
  assert.equal(await api.makeRequest('/legacy.php', {}, { responseType: 'text' }), 'Legacy result');
});

test('aborted and failed requests propagate to the coordinating method', async () => {
  for (const error of [new DOMException('Aborted', 'AbortError'), new TypeError('Network error')]) {
    const api = client(async () => { throw error; });
    await assert.rejects(api.makeRequest('/api.php', {}), actual => actual === error);
  }
});
