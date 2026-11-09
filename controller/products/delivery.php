<?php
require_once __DIR__ . '/../security/catalog_access.php';
require_once __DIR__ . '/../../model/delivery_settings.php';
Dot63Security::post();
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) Dot63Security::fail(422, 'Invalid request.');
CatalogAccess::enforce('delivery', $data);
$kind = $data['action'] === 'save_variation' ? 'variation' : 'price';
try {
    $pdo = (new Database())->getConnection();
    DeliveryPrice::requireColumns($pdo, $kind === 'variation' ? 'variations' : 'prices');
    $saved = DeliverySettings::save($pdo, Dot63Security::supplierEmail(), $kind,
        (string)($kind === 'variation' ? $data['sku_variation'] : $data['id_price']), $data);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['success' => true, 'delivery' => $saved]);
} catch (InvalidArgumentException $error) {
    Dot63Security::fail(422, $error->getMessage());
} catch (PDOException $error) {
    error_log('Delivery save failed: ' . $error->getMessage());
    Dot63Security::fail(503, 'Delivery settings could not be saved. Please try again.');
} catch (RuntimeException $error) {
    Dot63Security::fail(409, $error->getMessage());
}
