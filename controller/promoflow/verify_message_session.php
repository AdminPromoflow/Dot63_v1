<?php
// Called only by Promoflow's messaging bridge. Identity comes from the session,
// never from a supplier ID supplied in the request.
require_once __DIR__ . '/../security/bootstrap.php';
Dot63Security::post();
$email = Dot63Security::supplierEmail();
Dot63Security::csrf();
session_write_close();
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../../model/users.php';
$user = new Users(new Database());
$user->setEmail($email);
$id = $user->getIdSupplierByEmail();
if (!$id) Dot63Security::fail(403, 'Supplier not found.');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo json_encode(['response' => true, 'supplier_id' => (int)$id]);
