<?php
require_once __DIR__ . "/../security/catalog_access.php";
/**
 * =====================================================
 * Class: Price
 * Handles AJAX requests for the "Prices" module
 * (similar structure to Items/Image controller)
 * =====================================================
 */
class Price {

  public function handleAjax(): void
  {
      // 1) Detect request content type (igual)
      $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';

      // 2) Normalise $data (JSON o POST/multipart) (igual)
      $data = [];
      if (stripos($contentType, 'application/json') !== false) {
          $raw  = file_get_contents('php://input');
          $json = json_decode($raw, true);
          if (is_array($json)) {
              $data = $json;
          }
      } else {
          $data = $_POST;
      }

      // 3) Determine requested action
      $action = $data['action'] ?? null;

      // 4) Route
    CatalogAccess::enforce('price', is_array($data) ? $data : []);

      switch ($action) {
          case 'get_prices_details':
              $this->getPricesDetails($data);
              break;

          case 'create_prices':
              $this->savePrices($data);
              break;

          case 'delete_price':
              $this->deletePrice($data);
              break;

          default:
              header('Content-Type: application/json; charset=utf-8');
              echo json_encode(['success' => false, 'error' => 'Unsupported action']);
              break;
      }
  }

  /**
   * -----------------------------------------------------
   * Delete a single price row by id_price (optionally validates SKU variation)
   * -----------------------------------------------------
   */
  private function deletePrice($data): void
  {
      $connection = new Database();
      $price = new Prices($connection); // usa el modelo Prices

      $idPrice = $data['id_price'] ?? null;
      if (!$idPrice) {
          header('Content-Type: application/json; charset=utf-8');
          echo json_encode(["success" => false, "error" => "Missing id_price"]);
          return;
      }

      // Si te llega sku_variation, validará pertenencia antes de borrar
      if (!empty($data['sku_variation'])) {
          $price->setSKUVariation($data['sku_variation']);
      }

      $price->setPriceId($idPrice);
      $ok = $price->deletePricesByIdItem();

      header('Content-Type: application/json; charset=utf-8');
      echo json_encode([ "success" => $ok ]);
  }

  /**
   * -----------------------------------------------------
   * Fetch prices for a given variation SKU
   * -----------------------------------------------------
   */
   private function getPricesDetails($data): void
   {
       header('Content-Type: application/json; charset=utf-8');

       $connection = new Database();
       $price = new Prices($connection);
       $variation = new Variation($connection);

       $skuVariation = $data['sku_variation'] ?? null;
       if (!$skuVariation) {
           echo json_encode([
               "success" => false,
               "error"   => "Missing sku_variation"
           ]);
           return;
       }

       $price->setSKUVariation($skuVariation);
       $prices = $price->getPricesBySKUVariation();

       $variation->setSKUVariation($skuVariation);
       $modeResult = $variation->getPriceDisplayModeBySkuVariation();

       $priceDisplayMode = "prices";
       if (!empty($modeResult['success'])) {
           $priceDisplayMode = $modeResult['price_display_mode'] ?? 'prices';
       }

       echo json_encode([
           "success"            => true,
           "prices"             => $prices,
           "price_display_mode" => $priceDisplayMode
       ]);
   }
  /**
   * -----------------------------------------------------
   * Create/replace prices for a given variation
   * - Permite 0 filas: borra todas si arrays vacíos
   * - Inserta filas válidas (price no-null); min/max pueden ser null
   * -----------------------------------------------------
   */
   private function savePrices($data): void
   {
       header('Content-Type: application/json; charset=utf-8');

       // 1) Connection and models
       $connection = new Database();
       $price = new Prices($connection);
       $variation = new Variation($connection);

       // 2) Read incoming data
       $skuVariation = $data["sku_variation"] ?? null;
       if (!$skuVariation) {
           echo json_encode([
               "success" => false,
               "error"   => "Falta el SKU de la variación (sku_variation)"
           ]);
           return;
       }

       $ids     = isset($data["ids"])      && is_array($data["ids"])      ? $data["ids"]      : [];
       $mins    = isset($data["min_qty"])  && is_array($data["min_qty"])  ? $data["min_qty"]  : [];
       $maxs    = isset($data["max_qty"])  && is_array($data["max_qty"])  ? $data["max_qty"]  : [];
       $pricesA = isset($data["prices"])   && is_array($data["prices"])   ? $data["prices"]   : [];

       $price_display_mode = isset($data["price_display_mode"])
           ? trim((string)$data["price_display_mode"])
           : "prices";

       $pdo = $connection->getConnection();
       try {
           DeliveryPrice::requireColumns($pdo, 'prices');
           $days = $data['delivery_time_days'] ?? [];
           $values = $data['delivery_price'] ?? [];
           $types = $data['delivery_price_type'] ?? [];
           if (!is_array($days) || count($days) !== count($pricesA) || !is_array($values) || !is_array($types) || count($mins) !== count($pricesA) || count($maxs) !== count($pricesA)
               || count($values) !== count($pricesA) || count($types) !== count($pricesA)) {
               throw new InvalidArgumentException('Incomplete price rows. Reload the page and try again.');
           }
           $delivery = [];
           foreach ($pricesA as $i => $value) {
               $days[$i] = DeliveryPrice::normalizeDays($days[$i] ?? null);
               $delivery[$i] = DeliveryPrice::normalize($values[$i] ?? null, $types[$i] ?? null);
               if (!is_scalar($value) || !is_numeric($value) || !is_finite((float)$value) || (float)$value < 0) {
                   throw new InvalidArgumentException('Price must be a non-negative number.');
               }
               foreach ([$mins[$i], $maxs[$i]] as $qty) {
                   if ($qty !== '' && $qty !== null && (!is_scalar($qty) || !ctype_digit((string)$qty))) {
                       throw new InvalidArgumentException('Quantity must be a non-negative integer.');
                   }
               }
               if ($mins[$i] !== '' && $maxs[$i] !== '' && $mins[$i] !== null && $maxs[$i] !== null && (int)$maxs[$i] < (int)$mins[$i]) {
                   throw new InvalidArgumentException('Max quantity cannot be less than min quantity.');
               }
           }
           $pdo->beginTransaction();
           $variation->setSKUVariation($skuVariation);
           $variation->setPriceDisplayMode($price_display_mode);
           $modeResult = $variation->updatePriceDisplayMode();
           if (empty($modeResult['success'])) throw new RuntimeException('Could not save price display mode.');
           $price->setSKUVariation($skuVariation);
           if (!$price->deletePricesBySkuVariation()) throw new RuntimeException('Could not replace prices.');
           foreach ($pricesA as $i => $value) {
               $price->setMinQuantity($mins[$i]);
               $price->setMaxQuantity($maxs[$i]);
               $price->setPrice($value);
               $price->setDeliveryTimeDays($days[$i]);
               $price->setDeliveryPrice(...$delivery[$i]);
               if (!$price->savePrice()) throw new RuntimeException('Could not save price row. No changes were saved.');
           }
           $pdo->commit();
           echo json_encode(['success' => true, 'prices' => $price->getPricesBySKUVariation(), 'price_display_mode' => $price_display_mode]);
       } catch (Throwable $error) {
           if ($pdo->inTransaction()) $pdo->rollBack();
           http_response_code(422);
           echo json_encode(['success' => false, 'error' => $error->getMessage()]);
       }
   }
}

// ------------------------------------------------------
// Bootstrap: includes and self-invocation
// ------------------------------------------------------
require_once "../../controller/config/database.php";
require_once "../../model/prices.php"; // modelo correcto
require_once "../../model/variations.php"; // modelo correcto

$priceClass = new Price(); // controlador en singular
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
  $priceClass->handleAjax();
}
