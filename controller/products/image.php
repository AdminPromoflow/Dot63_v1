<?php
require_once __DIR__ . "/../security/catalog_access.php";
require_once __DIR__ . "/../security/uploads.php";
class Image {
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
    CatalogAccess::enforce('image', is_array($data) ? $data : []);

      switch ($action) {
          case 'update_image_main_visibility':
              $this->updateMainVisibility($data);
              break;
          case 'get_images_details':
              // Si necesitas archivos opcionales en esta acción:
              $data['_files'] = $_FILES ?? [];
              $this->getImagesDetails($data);
              break;

          case 'create_update_images':
              // Si necesitas archivos opcionales en esta acción:
              $data['_files'] = $_FILES ?? [];
              $this->createUpdateImages($data);
              break;

          case 'delete_image':
              // Si necesitas archivos opcionales en esta acción:
              $this->deleteImage($data);
              break;


          default:
              header('Content-Type: application/json; charset=utf-8');
              echo json_encode(['success' => false, 'error' => 'Unsupported action']);
              break;
      }
  }


  private function deleteImage($data){

    $connection = new Database();
    $image = new Images($connection);
    $image->setSKUVariation($data['sku_variation']);
    $image->setImageAddress($data['link_image']);
    $ok = $image->deleteImageBySkuVariationAndLink();
    echo json_encode(["success"=> $ok]);
  }

  private function updateMainVisibility(array $data): void
  {
      header('Content-Type: application/json; charset=utf-8');
      $id = filter_var($data['image_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
      $value = $data['show_on_product_main'] ?? null;
      if (!$id || !in_array($value, [0, 1, '0', '1'], true)) Dot63Security::fail(422, 'Invalid image visibility.');
      try {
          $images = new Images(new Database());
          $images->setSKUVariation($data['sku_variation']);
          if (!$images->updateMainVisibility($id, (int)$value)) Dot63Security::fail(404, 'Image not found for this variation.');
          echo json_encode(['success' => true, 'show_on_product_main' => (int)$value]);
      } catch (Throwable $error) {
          error_log('Image visibility update failed: ' . $error->getMessage());
          Dot63Security::fail(500, 'The image setting could not be saved.');
      }
  }

  private function createUpdateImages($data){
      header('Content-Type: application/json; charset=utf-8');

      // 1) Conexión + modelo reutilizables
      $connection = new Database();
      $imagesModel = new Images($connection);

      // 2) Supplier por SKU de producto (una vez)
      $imagesModel->setSKU($data['sku_product'] ?? '');
      $supplier = $imagesModel->getSupplierDetailsBySKUProduct();

      $sku_product   = $data["sku_product"]   ?? '';
      $sku_variation = $data["sku_variation"] ?? '';
      $imagesModel->setSKUVariation($sku_variation); // <- fijar una sola vez




      // 3) Todos los archivos de images[]
      $files = $data['_files']['images'] ?? null;
      if (!$files || !isset($files['tmp_name']) || !is_array($files['tmp_name'])) {
          echo json_encode(["success"=>true,"message"=>"No images have been received yet."]);
          return;
      }

      if (count($files['tmp_name']) > 20) Dot63Security::fail(422, 'Upload no more than 20 images at a time.');
      $visibility = $data['show_on_product_main'] ?? [];
      if (!is_array($visibility)) Dot63Security::fail(422, 'Invalid image visibility.');
      foreach ($visibility as $value) {
          if (!in_array($value, [0, 1, '0', '1'], true)) Dot63Security::fail(422, 'Invalid image visibility.');
      }
      // Validate the entire batch before touching any existing image records.
      foreach ($files['tmp_name'] as $index => $tmp) {
          try {
              SafeUpload::validate([
                  'tmp_name' => $tmp, 'name' => $files['name'][$index] ?? '',
                  'error' => $files['error'][$index] ?? UPLOAD_ERR_NO_FILE,
              ]);
          } catch (InvalidArgumentException $error) {
              Dot63Security::fail(422, $error->getMessage());
          }
      }

      $saved  = [];
      $errors = [];

      $count = count($files['tmp_name']);
      for ($i = 0; $i < $count; $i++) {
          // reconstruir el archivo i
          $file = [
              'name'     => $files['name'][$i]     ?? null,
              'type'     => $files['type'][$i]     ?? null,
              'tmp_name' => $files['tmp_name'][$i] ?? null,
              'error'    => $files['error'][$i]    ?? UPLOAD_ERR_NO_FILE,
              'size'     => $files['size'][$i]     ?? null,
          ];

          // validar subida
          if (empty($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
              $errors[] = ["index"=>$i, "name"=>$file['name'], "error"=>$file['error'] ?? 'tmp_name vacío'];
              continue;
          }

          // 4) Guardar archivo físico
          $path = $this->handleImageUpload($file, $supplier, $sku_product, $sku_variation);
          if ($path === null) {
              $errors[] = ["index"=>$i, "name"=>$file['name'], "error"=>"No se pudo guardar el archivo"];
              continue;
          }

          // 5) Guardar en BD (usa la misma instancia/conexión)
          $imagesModel->setImageAddress($path);
          $imagesModel->setShowOnProductMain((int)($visibility[$i] ?? 0));
          $result = $imagesModel->saveImage();

          if (!($result['success'] ?? false)) {
              // si falla DB, reportamos y seguimos (el archivo ya quedó en disco)
              $errors[] = ["index"=>$i, "name"=>$file['name'], "error"=>"No se pudo registrar en BD"];
              continue;
          }

          $saved[] = [
              "index"       => $i,
              "show_on_product_main" => (int)($visibility[$i] ?? 0),
              "path"        => $path,
              "image_id"    => $result['image_id'] ?? null,
              "variation_id"=> $result['variation_id'] ?? null,
          ];
      }

  //    $imagesModel->deleteImageWhereUpdatedIs0BySkuVariation(); // <- fijar una sola vez


      echo json_encode([
          "success"  => count($saved) > 0,
          "message" => "The images have been uploaded successfully.",
          "supplier" => $supplier,
          "paths"    => $saved,
          "errors"   => $errors,
      ]);
  }


  private function handleImageUpload(?array $imageFile = null, ?array $supplier = null, ?string $sku_product = null, ?string $sku_variation = null): ?string
  {
      try {
          return SafeUpload::store($imageFile ?? [], 'image', (string)$sku_product, (string)$sku_variation);
      } catch (InvalidArgumentException $error) {
          Dot63Security::fail(422, $error->getMessage());
      } catch (Throwable $error) {
          error_log('Image upload failed: ' . $error->getMessage());
          Dot63Security::fail(500, 'The image could not be saved.');
      }
      return null;
  }

  private function getImagesDetails($data){

    $connection = new Database();
    $image = new Images($connection);
    $image->setSKU($data['sku']);
    $variations = $image->getVariationsBySKUProduct();

    $connection = new Database();
    $image = new Images($connection);
    $image->setSKUVariation($data['sku_variation']);
    $images = $image->getImagesBySKUVariation();

    echo json_encode(["success"=> true, "variations" => $variations, "images" => $images]);
  }

}

require_once "../../controller/config/database.php";
require_once "../../model/images.php";



$imageClass = new Image();
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
  $imageClass->handleAjax();
}


/*private function createNewVariation($data){

  $connection = new Database();
  $variation = new Variation($connection);
  $sku = $this->generate_sku('VRT');
  $variation->setSKU($data['sku']);
  $variation->setSKUVariation($sku);

  echo json_encode ($variation->createEmptyVariationByProductSku());

}*/
