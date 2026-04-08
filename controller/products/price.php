<?php
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

       // 3) Save the global mode FIRST
       $variation->setSKUVariation($skuVariation);
       $variation->setPriceDisplayMode($price_display_mode);

       $modeResult = $variation->updatePriceDisplayMode();
       if (empty($modeResult['success'])) {
           echo json_encode([
               "success" => false,
               "error"   => $modeResult['error'] ?? 'Could not update price_display_mode'
           ]);
           return;
       }

       // 4) Delete all previous prices for this variation
       $price->setSKUVariation($skuVariation);
       $price->deletePricesBySkuVariation();

       // 5) If there are no rows, this is still valid
       if (empty($mins) && empty($maxs) && empty($pricesA)) {
           echo json_encode([
               "success"            => true,
               "insertados"         => 0,
               "fallidos"           => 0,
               "errores"            => [],
               "prices"             => [],
               "price_display_mode" => $price_display_mode
           ]);
           return;
       }

       // 6) Insert rows
       $total = min(count($mins), count($maxs), count($pricesA));
       $insertados = 0;
       $errores = [];

       for ($i = 0; $i < $total; $i++) {
           $minq = $mins[$i] ?? null;
           $maxq = $maxs[$i] ?? null;
           $prc  = $pricesA[$i] ?? null;

           $minq = ($minq === '' || $minq === null) ? null : (int)$minq;
           $maxq = ($maxq === '' || $maxq === null) ? null : (int)$maxq;
           $prc  = ($prc  === '' || $prc  === null) ? null : (float)$prc;

           if ($prc === null) {
               continue;
           }

           if ($minq !== null && $maxq !== null && $maxq < $minq) {
               $errores[] = [
                   "index" => $i,
                   "min"   => $minq,
                   "max"   => $maxq,
                   "price" => $prc,
                   "msg"   => "max_quantity < min_quantity"
               ];
               continue;
           }

           $price->setMinQuantity($minq);
           $price->setMaxQuantity($maxq);
           $price->setPrice($prc);

           $ok = $price->savePrice();
           if ($ok) {
               $insertados++;
           } else {
               $errores[] = [
                   "index" => $i,
                   "min"   => $minq,
                   "max"   => $maxq,
                   "price" => $prc,
                   "msg"   => "No se pudo insertar la fila"
               ];
           }
       }

       // 7) Get updated rows
       $price->setSKUVariation($skuVariation);
       $rows = $price->getPricesBySKUVariation();

       echo json_encode([
           "success"            => true,
           "insertados"         => $insertados,
           "fallidos"           => count($errores),
           "errores"            => $errores,
           "prices"             => $rows,
           "price_display_mode" => $price_display_mode
       ]);
   }
}

// ------------------------------------------------------
// Bootstrap: includes and self-invocation
// ------------------------------------------------------
include_once "../../controller/config/database.php";
include_once "../../model/prices.php"; // modelo correcto
include_once "../../model/variations.php"; // modelo correcto

$priceClass = new Price(); // controlador en singular
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
  $priceClass->handleAjax();
}
