<?php
require_once __DIR__ . "/../security/catalog_access.php";
require_once __DIR__ . "/../security/uploads.php";
class Variations {
  public function handleAjax(): void
  {
      // 1) Detectar tipo de contenido
      $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';

      // 2) Normalizar $data desde JSON o POST (multipart)
      $data = [];
      if (stripos($contentType, 'application/json') !== false) {
          $raw  = file_get_contents('php://input');
          $json = json_decode($raw, true);
          if (is_array($json)) {
              $data = $json;
          }
      } else {
          // multipart/form-data o x-www-form-urlencoded
          $data = $_POST;
      }

      // 4) Acción
      $action = $data['action'] ?? null;

      // 5) Enrutar
    CatalogAccess::enforce('variations', is_array($data) ? $data : []);

      switch ($action) {
          case 'get_variation_details':
              // Si necesitas archivos opcionales en esta acción:
              $data['_files'] = $_FILES ?? [];
              $this->getVariationDetails($data);
          break;

          case 'create_new_variation':
              $data['_files'] = $_FILES ?? [];
              $this->createNewVariation($data);
          break;

          case 'save_variation_details':
              // Aquí sí esperas archivos image/pdf desde FormData
              $data['_files'] = $_FILES ?? [];
              $this->saveVariationDetails($data);
          break;

          case 'update_group_name':
              // Aquí sí esperas archivos image/pdf desde FormData
              $this->updateGroupName($data);
          break;
          case 'get_sku_default_variation':
              // Aquí sí esperas archivos image/pdf desde FormData
              $this->getSKUDefaultVariation($data);
          break;
          case 'delete_variation':
              // Aquí sí esperas archivos image/pdf desde FormData
              $this->deleteVariation($data);
          break;

          default:
              header('Content-Type: application/json; charset=utf-8');
              echo json_encode(['success' => false, 'error' => 'Unsupported action']);
          break;
      }
  }

  private function deleteVariation($data){

    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setSKUVariation($data["sku_variation"]);
    $response = $variation->deleteVariation();

    echo json_encode ($response);

  }

  private function saveVariationDetails(array $data): void
  {
      header('Content-Type: application/json; charset=utf-8');

      // Base data
      $sku_product         = $data['sku_product']         ?? null;
      $sku_variation       = $data['sku_variation']       ?? null;
      $sku_parent_variation= $data['sku_parent_variation']?? null;

      // IMPORTANT: cast flags to int so "0" is not treated as truthy
      $isAttachAnImage = (int)($data['isAttachAnImage'] ?? 0);
      $isAttachAPDF    = (int)($data['isAttachAPDF']    ?? 0);

      $name            = $data['name']            ?? null;
      $name_pdf_artwork= $data['name_pdf_artwork']?? null;

      // NEW: type_id (empty => NULL)
      $type_id = $data['type_id'] ?? null;
      $type_id = ($type_id === '' || $type_id === null) ? null : (int)$type_id;

      $imageFile = $_FILES['imageFile'] ?? null;
      $pdfFile   = $_FILES['pdfFile']   ?? null;


      // Supplier fallback (kept from your logic)
      $supplier = ['supplier_id' => null, 'supplier_name' => null];
      if ($sku_product) {
          $product = new Products(new Database());
          $product->setSku($sku_product);
          $supplier = $product->getSupplierDetailsBySKU() ?: $supplier;
      }

      $imagePath = '';
      $pdfPath   = '';

      if ($isAttachAnImage === 1) {
          $imagePath = $this->handleImageUpload($imageFile, $supplier, $sku_product, $sku_variation) ?: '';
      }

      if ($isAttachAPDF === 1) {
          $uploaded = $this->handlePdfUpload($pdfFile, $supplier, $sku_product, $sku_variation, $name_pdf_artwork);
          // Solo actualizar pdfPath si el upload tuvo éxito (no null)
          if ($uploaded !== null) {
              $pdfPath = $uploaded;
          }
      }

      $connection = new Database();
      $variation  = new Variation($connection);

      $variation->setName($name ?: '');
      $variation->setIsAttachAnImage($isAttachAnImage);
      $variation->setIsAttachAPDF($isAttachAPDF);
      $variation->setSKUVariation($sku_variation ?: '');
      $variation->setImage($imagePath ?: '');
      $variation->setPdfArtwork($pdfPath ?: '');
      $variation->setSKUParentVariation($sku_parent_variation ?: '');
      $variation->setNamePdfArtwork($name_pdf_artwork ?: '');

      // IMPORTANT: save type_id into variations.type_id
      $variation->setTypeId($type_id);

      $ok = $variation->updateVariationDetails();

      echo json_encode([
          'success'              => $ok,
          'image_path'           => $imagePath ?: '',
          'pdf_path'             => $pdfPath ?: '',
          'sku_parent_variation' => $sku_parent_variation,
          'type_id'              => $type_id,
      ]);
  }


  private function handleImageUpload(?array $file = null, ?array $supplier = null, ?string $sku_product = null, ?string $sku_variation = null): ?string
  {
      return $this->storeUpload($file, 'image', $sku_product, $sku_variation);
  }

  private function handlePdfUpload(?array $file = null, ?array $supplier = null, ?string $sku_product = null, ?string $sku_variation = null, ?string $name = null): ?string
  {
      return $this->storeUpload($file, 'pdf', $sku_product, $sku_variation);
  }

  private function storeUpload(?array $file, string $kind, ?string $product, ?string $variation): ?string
  {
      if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return null;
      try {
          return SafeUpload::store($file, $kind, (string)$product, (string)$variation);
      } catch (InvalidArgumentException $error) {
          Dot63Security::fail(422, $error->getMessage());
      } catch (Throwable $error) {
          error_log('Variation upload failed: ' . $error->getMessage());
          Dot63Security::fail(500, 'The file could not be saved.');
      }
      return null;
  }

  private function createNewVariation($data){

    $connection = new Database();
    $variation = new Variation($connection);
    $sku = $this->generate_sku('VRT');
    $variation->setSKU($data['sku']);
    $variation->setSKUVariation($sku);

    echo json_encode ($variation->createEmptyVariationByProductSku());

  }
  private function getSKUDefaultVariation($data){
    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setSKU($data['sku']);

    echo json_encode ($variation->getSKUDefaultVariation());
  }

  private function updateGroupName($data){

    $connection = new Database();
    $variation = new Variation($connection);

    $variation->setSKUVariation($data['sku_variation']);
    $variation->setGroupName($data['group_name'] ?? null);

    echo json_encode ($variation->updategroupNameBySkuVariation());

  }

  private function getVariationDetails($data){

    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setSKUVariation($data['sku_variation']);
    $variation->setSKU($data['sku']);

    echo json_encode ($variation->getVariationDetailsBySkus());
  }

  public function createDefaultVariation($productId): array {

    $connection = new Database();
    $variation = new Variation($connection);
    $sku = $this->generate_sku('VRT');
    $variation->setId($productId);
    $variation->setSKU($sku);
    return $variation->createDefaultVariation();

  }

  private function generate_sku(string $prefix = 'VRT'): string {
    $dt    = new DateTimeImmutable('now', new DateTimeZone('UTC'));
    $stamp = $dt->format('Ymd-His-u'); // 20250925-175903-123456
    $rand  = strtoupper(bin2hex(random_bytes(5)));   // 10 hex
    return sprintf(
      '%s-%s-%s',
      strtoupper(preg_replace('/[^A-Z0-9]/', '', $prefix)),
      $stamp,
      $rand
    );
  }


}

require_once "../../controller/config/database.php";
require_once "../../model/products.php";
require_once "../../model/variations.php";



$variationsClass = new Variations();
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
  $variationsClass->handleAjax();
}
