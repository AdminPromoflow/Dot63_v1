<?php
require_once __DIR__ . '/bootstrap.php';
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') Dot63Security::fail(405, 'Use GET.');
if (in_array($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '', ['cross-site'], true)) Dot63Security::fail(403, 'Use the application to request a token.');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo json_encode(['token' => Dot63Security::csrfToken()]);
