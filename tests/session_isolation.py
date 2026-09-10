"""HTTP regression checks; server must use the same PHP session.save_path.

Run against an isolated local PHP server (no database writes):
DOT63_SESSION_SAVE_PATH=/private/tmp python3 tests/session_isolation.py
"""
import http.cookiejar
import json
import os
from pathlib import Path
import subprocess
import urllib.error
import urllib.request
import uuid

BASE = os.environ.get('DOT63_TEST_URL', 'http://127.0.0.1:8791')
PHP = os.environ.get('DOT63_PHP', '/Applications/XAMPP/xamppfiles/bin/php')
SAVE_PATH = os.environ.get('DOT63_SESSION_SAVE_PATH', '/private/tmp')
ROOT = Path(__file__).resolve().parents[1]
SUPPLIER = {'login': True, 'email': 'supplier-session-test@example.com'}
CUSTOMER = {'customer_login': True, 'customer_id': 999999,
            'customer_name': 'Session Test', 'customer_email': 'customer-session-test@example.com'}


def check(state, callback):
    sid = 'dot63isolation' + uuid.uuid4().hex
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    ids = {sid}
    subprocess.run([PHP, '-d', 'session.save_path=' + SAVE_PATH, '-r',
                    'session_id($argv[1]); session_start(); '
                    '$_SESSION=json_decode($argv[2],true); session_write_close();',
                    sid, json.dumps(state)], check=True, cwd=ROOT)

    def request(path, action=None):
        payload = None if action is None else json.dumps({'action': action}).encode()
        req = urllib.request.Request(BASE + path, data=payload)
        req.add_header('Content-Type', 'application/json')
        if not list(jar):
            req.add_header('Cookie', 'PHPSESSID=' + sid)
        try:
            response = opener.open(req)
        except urllib.error.HTTPError as error:
            response = error
        ids.update(cookie.value for cookie in jar if cookie.name == 'PHPSESSID')
        body = response.read().decode()
        return response.status, json.loads(body) if action else body

    try:
        callback(request)
    finally:
        for session_id in ids:
            Path(SAVE_PATH, 'sess_' + session_id).unlink(missing_ok=True)


def supplier_only(request):
    assert request('/controller/users/login.php', 'verify_login_supplier')[1]['response'] is True
    assert request('/controller/customers/login.php', 'verify_login_customer')[1]['authenticated'] is False
    for action in ['add_to_cart', 'get_cart_status', 'update_cart_item',
                   'remove_cart_item', 'clear_cart', 'validate_promo', 'checkout']:
        status, result = request('/controller/order/cart.php', action)
        assert status == 401 and result['code'] == 'AUTH_REQUIRED', (action, status, result)
    for path in ['/view/main/index.php', '/view/shopping_cart/index.php', '/view/checkout/index.php']:
        status, body = request(path)
        assert status == 200
        assert 'data-session-type="guest"' in body
        assert 'data-cart-count="0"' in body
        assert 'supplier-session-test@example.com' not in body
    print('PASS supplier session cannot authenticate customer pages or cart actions')


def customer_only(request):
    assert request('/controller/users/login.php', 'verify_login_supplier')[1]['response'] is False
    assert request('/controller/customers/login.php', 'verify_login_customer')[1]['authenticated'] is True
    assert request('/controller/order/product.php', 'get_supplier_preview')[0] == 401
    print('PASS customer session cannot authenticate supplier')


def logout_supplier(request):
    assert request('/controller/users/login.php', 'logout_supplier')[1]['response'] is True
    assert request('/controller/users/login.php', 'verify_login_supplier')[1]['response'] is False
    assert request('/controller/customers/login.php', 'verify_login_customer')[1]['authenticated'] is True
    body = request('/view/main/index.php')[1]
    assert 'data-session-type="customer"' in body and 'data-cart-count="3"' in body
    print('PASS supplier logout preserves customer session and cart')


def logout_customer(request):
    assert request('/controller/customers/login.php', 'logout_customer')[1]['success'] is True
    assert request('/controller/customers/login.php', 'verify_login_customer')[1]['authenticated'] is False
    assert request('/controller/users/login.php', 'verify_login_supplier')[1]['response'] is True
    body = request('/view/main/index.php')[1]
    assert 'data-session-type="guest"' in body and 'data-cart-count="0"' in body
    print('PASS customer logout preserves supplier session')


check({**SUPPLIER, 'shopping_cart_count': 3}, supplier_only)
check(CUSTOMER, customer_only)
check({**SUPPLIER, **CUSTOMER, 'shopping_cart_count': 3}, logout_supplier)
check({**SUPPLIER, **CUSTOMER, 'shopping_cart_count': 3}, logout_customer)
