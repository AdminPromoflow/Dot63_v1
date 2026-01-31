<?php
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
          default:
              header('Content-Type: application/json; charset=utf-8');
              echo json_encode(['success' => false, 'error' => 'Unsupported action']);
              break;
      }
  }


  private function saveVariationDetails(array $data): void
  {
      header('Content-Type: application/json; charset=utf-8');

      // Base data
      $sku_product         = $_POST['sku_product']         ?? $data['sku_product']         ?? null;
      $sku_variation       = $_POST['sku_variation']       ?? $data['sku_variation']       ?? null;
      $sku_parent_variation= $_POST['sku_parent_variation']?? $data['sku_parent_variation']?? null;

      // IMPORTANT: cast flags to int so "0" is not treated as truthy
      $isAttachAnImage = (int)($_POST['isAttachAnImage'] ?? $data['isAttachAnImage'] ?? 0);
      $isAttachAPDF    = (int)($_POST['isAttachAPDF']    ?? $data['isAttachAPDF']    ?? 0);

      $name            = $_POST['name']            ?? $data['name']            ?? null;
      $name_pdf_artwork= $_POST['name_pdf_artwork']?? $data['name_pdf_artwork']?? null;

      // NEW: type_id (empty => NULL)
      $type_id = $_POST['type_id'] ?? $data['type_id'] ?? null;
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


  /**
   * Stub: función “desocupada”. No sube ni valida nada.
   * Acepta nulls de forma segura.
   */
   private function handleImageUpload(
       ?array $imageFile = null,
       ?array $supplier = null,
       ?string $sku_product = null,
       ?string $sku_variation = null
   ): ?string {
       // 0) Validaciones mínimas
       if (!$imageFile || empty($imageFile['tmp_name'])) {
           return null;
       }

       $err = $imageFile['error'] ?? UPLOAD_ERR_NO_FILE;
       if ($err !== UPLOAD_ERR_OK) {
           error_log("IMAGE upload error code: " . $err);
           return null;
       }

       $tmp = (string)$imageFile['tmp_name'];
       if (!is_uploaded_file($tmp)) {
           error_log("IMAGE tmp_name is not an uploaded file.");
           return null;
       }

       // 1) Límite de tamaño (ajusta si quieres)
       $size = (int)($imageFile['size'] ?? 0);
       $maxBytes = 8 * 1024 * 1024; // 8MB
       if ($size <= 0 || $size > $maxBytes) {
           error_log("IMAGE invalid size: {$size} bytes");
           return null;
       }

       // 2) Validar MIME real
       try {
           $finfo = new finfo(FILEINFO_MIME_TYPE);
           $mime  = $finfo->file($tmp);
       } catch (\Throwable $e) {
           error_log("IMAGE finfo failed: " . $e->getMessage());
           return null;
       }

       // Tipos permitidos
       $mimeToExt = [
           'image/jpeg' => 'jpg',
           'image/png'  => 'png',
           'image/webp' => 'webp',
           // Si quieres permitir GIF, descomenta:
           // 'image/gif'  => 'gif',
       ];

       if (!isset($mimeToExt[$mime])) {
           error_log("IMAGE invalid mime: " . $mime);
           return null;
       }

       // 3) Validación extra: que realmente sea imagen
       $imgInfo = @getimagesize($tmp);
       if ($imgInfo === false) {
           error_log("IMAGE getimagesize failed (not a real image).");
           return null;
       }

       // 4) Sanitizadores
       $clean = static function (string $value, int $maxLen = 80): string {
           $value = trim($value);
           $value = str_replace(['../', '..\\', '/', '\\'], '-', $value);
           $value = preg_replace('/[^a-zA-Z0-9_-]+/', '_', $value) ?? '';
           $value = preg_replace('/_+/', '_', $value) ?? '';
           $value = trim($value, '_-');
           return $value !== '' ? substr($value, 0, $maxLen) : 'unknown';
       };

       // 5) Datos supplier/sku (con fallbacks seguros)
       $supplierIdRaw   = (string)($supplier['supplier_id']   ?? '');
       $supplierNameRaw = (string)($supplier['supplier_name'] ?? '');

       $supplierId   = $clean($supplierIdRaw, 30);
       $supplierName = $clean($supplierNameRaw, 60);

       $skuP = $clean((string)($sku_product ?? ''), 80);
       $skuV = $clean((string)($sku_variation ?? ''), 80);

       // 6) Nombre del archivo (base del nombre original)
       $originalName = (string)($imageFile['name'] ?? 'image');
       $baseName     = pathinfo($originalName, PATHINFO_FILENAME);
       $safeBase     = $clean((string)$baseName, 120);

       $ext = $mimeToExt[$mime];

       // 7) Encontrar raíz del proyecto (robusto)
       $dir = __DIR__;
       $projectRoot = null;

       while ($dir !== dirname($dir)) {
           if (basename($dir) === 'controllers') {
               $projectRoot = dirname($dir);
               break;
           }
           $dir = dirname($dir);
       }

       if (!$projectRoot) {
           $projectRoot = dirname(__DIR__);
       }

       // 8) Carpeta destino: views/uploads/{supplierId}_{supplierName}/{skuP}/{skuV}
       $baseDir = $projectRoot . '/views/uploads';
       $folder  = $baseDir . '/' . $supplierId . '_' . $supplierName . '/' . $skuP . '/' . $skuV;

       if (!is_dir($folder)) {
           if (!mkdir($folder, 0755, true)) {
               error_log("IMAGE mkdir failed: " . $folder);
               return null;
           }
       }

       if (!is_writable($folder)) {
           error_log("IMAGE folder not writable: " . $folder);
           return null;
       }

       // 9) Nombre final + evitar sobrescribir
       $finalName = $safeBase . '.' . $ext;
       $destination = $folder . '/' . $finalName;

       if (file_exists($destination)) {
           $suffix = bin2hex(random_bytes(4));
           $finalName = $safeBase . '_' . $suffix . '.' . $ext;
           $destination = $folder . '/' . $finalName;
       }

       // 10) Mover archivo
       if (!move_uploaded_file($tmp, $destination)) {
           error_log("IMAGE move_uploaded_file failed: " . $destination);
           return null;
       }

       // 11) Retornar ruta relativa para guardar en DB
       return 'views/uploads/'
           . $supplierId . '_' . $supplierName . '/'
           . $skuP . '/'
           . $skuV . '/'
           . $finalName;
   }



   private function handlePdfUpload(
       ?array $pdfFile = null,
       ?array $supplier = null,
       ?string $sku_product = null,
       ?string $sku_variation = null,
       ?string $name_pdf_artwork = null
   ): ?string {
       // 0) Validaciones mínimas de presencia
       if (!$pdfFile || empty($pdfFile['tmp_name'])) {
           return null;
       }

       $err = $pdfFile['error'] ?? UPLOAD_ERR_NO_FILE;
       if ($err !== UPLOAD_ERR_OK) {
           error_log("PDF upload error code: " . $err);
           return null;
       }

       $tmp = (string)$pdfFile['tmp_name'];
       if (!is_uploaded_file($tmp)) {
           error_log("PDF tmp_name is not an uploaded file.");
           return null;
       }

       // 1) Límite de tamaño (ajusta si quieres)
       $size = (int)($pdfFile['size'] ?? 0);
       $maxBytes = 10 * 1024 * 1024; // 10MB
       if ($size <= 0 || $size > $maxBytes) {
           error_log("PDF invalid size: {$size} bytes");
           return null;
       }

       // 2) Validar MIME real
       try {
           $finfo = new finfo(FILEINFO_MIME_TYPE);
           $mime  = $finfo->file($tmp);
       } catch (\Throwable $e) {
           error_log("PDF finfo failed: " . $e->getMessage());
           return null;
       }

       if ($mime !== 'application/pdf') {
           error_log("PDF invalid mime: " . $mime);
           return null;
       }

       // 3) Sanitizadores (segmentos / nombre)
       $clean = static function (string $value, int $maxLen = 80): string {
           $value = trim($value);

           // evita traversal y separadores
           $value = str_replace(['../', '..\\', '/', '\\'], '-', $value);

           // deja solo letras, números, guión y guión bajo
           $value = preg_replace('/[^a-zA-Z0-9_-]+/', '_', $value) ?? '';
           $value = preg_replace('/_+/', '_', $value) ?? '';
           $value = trim($value, '_-');

           return $value !== '' ? substr($value, 0, $maxLen) : 'unknown';
       };

       $ensurePdfName = static function (string $clientName, callable $cleanFn): string {
           $clientName = trim($clientName);
           if ($clientName === '') {
               $clientName = 'artwork';
           }
           $base = pathinfo($clientName, PATHINFO_FILENAME);
           $base = $cleanFn((string)$base, 120);
           return $base . '.pdf';
       };

       // 4) Datos supplier/sku (con fallbacks seguros)
       $supplierIdRaw   = (string)($supplier['supplier_id']   ?? '');
       $supplierNameRaw = (string)($supplier['supplier_name'] ?? '');

       $supplierId   = $clean($supplierIdRaw, 30);
       $supplierName = $clean($supplierNameRaw, 60);

       $skuP = $clean((string)($sku_product ?? ''), 80);
       $skuV = $clean((string)($sku_variation ?? ''), 80);

       // 5) Nombre final del PDF (usa input; si viene vacío, usa nombre real del archivo)
       $clientProvided = (string)($name_pdf_artwork ?? '');
       if (trim($clientProvided) === '') {
           $clientProvided = (string)($pdfFile['name'] ?? 'artwork.pdf');
       }
       $finalName = $ensurePdfName($clientProvided, $clean);

       // 6) Encontrar raíz del proyecto de forma robusta (sube hasta /controllers y luego 1 arriba)
       $dir = __DIR__;
       $projectRoot = null;

       while ($dir !== dirname($dir)) {
           if (basename($dir) === 'controllers') {
               $projectRoot = dirname($dir);
               break;
           }
           $dir = dirname($dir);
       }

       // fallback si no encontró carpeta controllers
       if (!$projectRoot) {
           $projectRoot = dirname(__DIR__);
       }

       // 7) Carpeta destino: views/uploads/{supplierId}_{supplierName}/{skuP}/{skuV}
       $baseDir = $projectRoot . '/views/uploads';
       $folder  = $baseDir . '/' . $supplierId . '_' . $supplierName . '/' . $skuP . '/' . $skuV;

       if (!is_dir($folder)) {
           if (!mkdir($folder, 0755, true)) {
               error_log("PDF mkdir failed: " . $folder);
               return null;
           }
       }

       if (!is_writable($folder)) {
           error_log("PDF folder not writable: " . $folder);
           return null;
       }

       // 8) Evitar sobrescribir
       $destination = $folder . '/' . $finalName;

       if (file_exists($destination)) {
           $base = pathinfo($finalName, PATHINFO_FILENAME);
           $suffix = bin2hex(random_bytes(4));
           $finalName = $base . '_' . $suffix . '.pdf';
           $destination = $folder . '/' . $finalName;
       }

       // 9) Mover archivo
       if (!move_uploaded_file($tmp, $destination)) {
           error_log("PDF move_uploaded_file failed: " . $destination);
           return null;
       }

       // 10) Ruta relativa para guardar en DB
       return 'views/uploads/'
           . $supplierId . '_' . $supplierName . '/'
           . $skuP . '/'
           . $skuV . '/'
           . $finalName;
   }




  private function createNewVariation($data){

    $connection = new Database();
    $variation = new Variation($connection);
    $sku = $this->generate_sku('VRT');
    $variation->setSKU($data['sku']);
    $variation->setSKUVariation($sku);

    echo json_encode ($variation->createEmptyVariationByProductSku());

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

include_once "../../controller/config/database.php";
include_once "../../model/products.php";
include_once "../../model/variations.php";



$variationsClass = new Variations();
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
  $variationsClass->handleAjax();
}
