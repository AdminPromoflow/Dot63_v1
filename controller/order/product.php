<?php
/*
 * CONTROLADOR COMPARTIDO DE PREVIEWS
 * [Supplier/Customer 4.2, 6.2 y 8.3]
 * preview_api.js llega a este archivo para obtener producto, árbol de variaciones
 * y extras por cantidad. Cada action se dirige a un método concreto.
 */
class Product {
  public function handleProduct(){
    // [Servidor 4.2.1] PHP lee el JSON enviado por fetch y obtiene el nombre de la acción.
    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    switch ($data["action"] ?? null) {

      case 'get_supplier_preview':
        // [Supplier 4.2.2] Continúa en getSupplierPreview().
        $this->getSupplierPreview($data);
        break;

      case 'get_supplier_variation_children':
        // [Supplier 6.2.2.1] Continúa en getSupplierVariationChildren().
        $this->getSupplierVariationChildren($data);
        break;

      case 'get_supplier_variation_prices':
        // [Supplier 8.3.2.1] Continúa en getSupplierVariationPrices().
        $this->getSupplierVariationPrices($data);
        break;

      case 'get_customer_preview':
        // [Customer 4.2.2] Continúa en getCustomerPreview().
        $this->getCustomerPreview($data);
        break;

      case 'get_customer_variation_children':
        // [Customer 6.2.3.1] Continúa en getCustomerVariationChildren().
        $this->getCustomerVariationChildren($data);
        break;

      case 'get_customer_variation_prices':
        // [Customer 8.3.2.1] Continúa en getCustomerVariationPrices().
        $this->getCustomerVariationPrices($data);
        break;

      case 'get_preview_product_details':
        $this->getPreviewProductDetails($data);
        break;
      case 'get_variation_children_by_id':
        $this->getVariationChildrenById($data);
        break;

        case 'get_variation_prices':
          $this->getVariationPrices($data);
          break;

      default:
        http_response_code(400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Unsupported action']);
        break;
    }
  }

  private function getSupplierSessionEmail(): ?string
  {
      // [Supplier servidor 4.2.3] Una sesión válida necesita la bandera de login y un email no vacío.
      if (session_status() !== PHP_SESSION_ACTIVE) {
          session_start();
      }

      $isLoggedIn = !empty($_SESSION['login']);
      $email = strtolower(trim((string)($_SESSION['email'] ?? '')));

      return ($isLoggedIn && $email !== '') ? $email : null;
  }

  private function jsonError(string $message, int $status = 400, array $extra = []): void
  {
      // [Servidor 4.2.4] Todos los fallos del preview usan la misma estructura JSON y status HTTP.
      http_response_code($status);
      header('Content-Type: application/json; charset=utf-8');
      echo json_encode(array_merge([
          'success' => false,
          'error' => $message,
      ], $extra), JSON_UNESCAPED_UNICODE);
  }

  private function getOwnedProduct(PDO $pdo, string $sku, string $email): ?array
  {
      // [Supplier servidor 4.2.5] La consulta exige que el SKU pertenezca al proveedor autenticado.
      // También cuenta requisitos y resuelve la variación raíz en una sola ida a la base de datos.
      $stmt = $pdo->prepare("
          SELECT
              p.product_id,
              p.SKU AS sku,
              p.name,
              p.description,
              p.descriptive_tagline,
              p.status,
              p.is_approved,
              p.group_id,
              s.supplier_id,
              s.company_name,
              s.contact_name,
              s.email AS supplier_email,
              g.name AS group_name,
              c.category_id,
              c.name AS category_name,
              (
                  SELECT v.variation_id
                  FROM variations v
                  WHERE v.product_id = p.product_id
                    AND (
                      LOWER(TRIM(v.name)) = 'default'
                      OR v.parent_id IS NULL
                    )
                  ORDER BY
                    CASE WHEN LOWER(TRIM(v.name)) = 'default' THEN 0 ELSE 1 END,
                    v.variation_id ASC
                  LIMIT 1
              ) AS root_variation_id,
              (
                  SELECT COUNT(*)
                  FROM variations v
                  WHERE v.product_id = p.product_id
                    AND v.type_id IS NOT NULL
                    AND TRIM(COALESCE(v.name, '')) <> ''
                    AND LOWER(TRIM(v.name)) <> 'default'
              ) AS variations_count,
              (
                  SELECT COUNT(*)
                  FROM images i
                  INNER JOIN variations v ON v.variation_id = i.variation_id
                  WHERE v.product_id = p.product_id
                    AND TRIM(COALESCE(i.link, '')) <> ''
              ) AS images_count,
              (
                  SELECT COUNT(*)
                  FROM prices pr
                  INNER JOIN variations v ON v.variation_id = pr.variation_id
                  WHERE v.product_id = p.product_id
                    AND COALESCE(NULLIF(TRIM(v.price_display_mode), ''), 'prices') = 'prices'
              ) AS prices_count
          FROM products p
          INNER JOIN suppliers s ON s.supplier_id = p.supplier_id
          LEFT JOIN `groups` g ON g.group_id = p.group_id
          LEFT JOIN categories c ON c.category_id = g.category_id
          WHERE LOWER(TRIM(p.SKU)) = LOWER(:sku)
            AND LOWER(TRIM(s.email)) = LOWER(:email)
          LIMIT 1
      ");

      $stmt->execute([
          ':sku' => $sku,
          ':email' => $email,
      ]);

      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      return $row ?: null;
  }

  private function buildReadiness(array $product): array
  {
      // [Supplier servidor 4.2.6] Cada check resume un requisito real de publicación.
      $checks = [
          [
              'key' => 'details',
              'label' => 'Product details',
              'complete' => trim((string)($product['name'] ?? '')) !== ''
                  && trim((string)($product['description'] ?? '')) !== '',
          ],
          [
              'key' => 'classification',
              'label' => 'Category and group',
              'complete' => !empty($product['category_id'])
                  && !empty($product['group_id'])
                  && ($product['category_name'] ?? '') !== 'Unassigned Category'
                  && ($product['group_name'] ?? '') !== 'Unassigned Group',
          ],
          [
              'key' => 'variations',
              'label' => 'Product variations',
              'complete' => (int)($product['variations_count'] ?? 0) > 0,
          ],
          [
              'key' => 'images',
              'label' => 'Product imagery',
              'complete' => (int)($product['images_count'] ?? 0) > 0,
          ],
          [
              'key' => 'pricing',
              'label' => 'Pricing',
              'complete' => (int)($product['prices_count'] ?? 0) > 0,
          ],
      ];

      $issues = [];
      // [Supplier servidor 4.2.7] issues contiene solo las etiquetas pendientes que verá la interfaz.
      foreach ($checks as $check) {
          if (!$check['complete']) {
              $issues[] = $check['label'];
          }
      }

      return [
          'complete' => empty($issues),
          'checks' => $checks,
          'issues' => $issues,
      ];
  }

  private function getInitialVariationPath(Database $database, array $product, array $data): array
  {
      $variationSku = trim((string)($data['sku_variation'] ?? ''));
      $productId = (int)($product['product_id'] ?? 0);
      $rootVariationId = (int)($product['root_variation_id'] ?? 0);

      if ($variationSku === '' || $productId <= 0 || $rootVariationId <= 0) {
          return [];
      }

      $variation = new Variation($database);
      $variation->setId($productId);
      $variation->setSKUVariation($variationSku);
      $result = $variation->getVariationPathBySkuForProduct();

      if (empty($result['success']) || !is_array($result['path'] ?? null)) {
          return [];
      }

      $path = array_values(array_filter(
          array_map('intval', $result['path']),
          static fn($id) => $id > 0
      ));
      $rootPosition = array_search($rootVariationId, $path, true);

      return $rootPosition === false
          ? []
          : array_slice($path, $rootPosition);
  }

  private function getSupplierPreview(array $data): void
  {
      // [Supplier 4.2.2] Este método arma la primera respuesta del preview privado.
      header('Content-Type: application/json; charset=utf-8');

      // [Supplier 4.2.2.1] Primero se valida sesión; después el SKU recibido.
      $email = $this->getSupplierSessionEmail();
      if ($email === null) {
          $this->jsonError('Your supplier session has expired. Please sign in again.', 401);
          return;
      }

      $sku = trim((string)($data['sku'] ?? ''));
      if ($sku === '') {
          $this->jsonError('Product SKU is required.');
          return;
      }

      $database = new Database();
      $pdo = $database->getConnection();

      // [Supplier 4.2.2.2] La consulta devuelve null si el producto no existe o pertenece a otra cuenta.
      $product = $this->getOwnedProduct($pdo, $sku, $email);

      if (!$product) {
          $this->jsonError('This product was not found or does not belong to your account.', 403);
          return;
      }

      // [Supplier 4.2.2.3] Se calculan estado, checklist y permiso de envío antes de responder.
      $readiness = $this->buildReadiness($product);
      $isApproved = (int)$product['is_approved'] === 1;
      $isPending = (string)$product['status'] === '2';
      $initialVariationPath = $this->getInitialVariationPath($database, $product, $data);

      // [Supplier 4.3] preview_api.js recibe producto, root_variation_id, readiness y permissions.
      echo json_encode([
          'success' => true,
          'product' => [
              'id' => (int)$product['product_id'],
              'sku' => (string)$product['sku'],
              'name' => (string)($product['name'] ?? ''),
              'description' => (string)($product['description'] ?? ''),
              'tagline' => (string)($product['descriptive_tagline'] ?? ''),
              'status' => (string)($product['status'] ?? ''),
              'is_approved' => $isApproved,
              'supplier_name' => (string)($product['company_name'] ?: $product['contact_name']),
              'category' => [
                  'id' => (int)($product['category_id'] ?? 0),
                  'name' => (string)($product['category_name'] ?? ''),
              ],
              'group' => [
                  'id' => (int)($product['group_id'] ?? 0),
                  'name' => (string)($product['group_name'] ?? ''),
              ],
          ],
          'root_variation_id' => (int)($product['root_variation_id'] ?? 0),
          'initial_variation_path' => $initialVariationPath,
          'readiness' => $readiness,
          'permissions' => [
              'can_edit' => !$isApproved,
              'can_submit' => !$isApproved && !$isPending && $readiness['complete'],
          ],
      ], JSON_UNESCAPED_UNICODE);
  }

  private function getOwnedVariationProduct(PDO $pdo, int $variationId, string $email): ?array
  {
      // [Supplier servidor 6.2.2.2] Cada nodo debe pertenecer también al proveedor autenticado.
      $stmt = $pdo->prepare("
          SELECT p.product_id, p.SKU AS sku
          FROM variations v
          INNER JOIN products p ON p.product_id = v.product_id
          INNER JOIN suppliers s ON s.supplier_id = p.supplier_id
          WHERE v.variation_id = :variation_id
            AND LOWER(TRIM(s.email)) = LOWER(:email)
          LIMIT 1
      ");
      $stmt->execute([
          ':variation_id' => $variationId,
          ':email' => $email,
      ]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      return $row ?: null;
  }

  private function getSupplierVariationChildren(array $data): void
  {
      // [Supplier 6.2.2.1] Este método responde una etapa del recorrido de variaciones.
      header('Content-Type: application/json; charset=utf-8');

      // [Supplier 6.2.2.1.1] Se repiten las validaciones porque cada fetch es una petición independiente.
      $email = $this->getSupplierSessionEmail();
      if ($email === null) {
          $this->jsonError('Your supplier session has expired.', 401);
          return;
      }

      $variationId = (int)($data['variation_id'] ?? 0);
      if ($variationId <= 0) {
          $this->jsonError('A valid variation is required.');
          return;
      }

      $database = new Database();
      $pdo = $database->getConnection();

      if (!$this->getOwnedVariationProduct($pdo, $variationId, $email)) {
          $this->jsonError('This variation does not belong to your account.', 403);
          return;
      }

      $variation = new Variation($database);
      $variation->setVariationId($variationId);

      // [Supplier 6.2.2.3] El flujo entra en model/variations.php para cargar:
      // hijos enriquecidos, datos del nodo actual y nombres de los tipos hijos.
      $childVariations = $variation->getVariationChildrenById();
      $currentVariationData = $variation->getDetailsCurrentVariationById();
      $variationTypes = $variation->getTypeVariationsChildByVariationId();

      if (isset($childVariations['success']) && $childVariations['success'] === false) {
          $this->jsonError((string)($childVariations['error'] ?? 'Unable to load variations.'), 500);
          return;
      }

      if (isset($currentVariationData['success']) && $currentVariationData['success'] === false) {
          $this->jsonError((string)($currentVariationData['error'] ?? 'Unable to load the selected variation.'), 500);
          return;
      }

      if (isset($variationTypes['success']) && $variationTypes['success'] === false) {
          $this->jsonError((string)($variationTypes['error'] ?? 'Unable to load variation types.'), 500);
          return;
      }

      if (($childVariations['success'] ?? null) === true && isset($childVariations['data'])) {
          $childVariations = is_array($childVariations['data']) ? $childVariations['data'] : [];
      }

      // [Supplier 6.2.2.4] Se normalizan listas y se devuelve una estructura estable al navegador.
      echo json_encode([
          'success' => true,
          'current' => $currentVariationData,
          'children' => array_values(is_array($childVariations) ? $childVariations : []),
          'types' => array_values(is_array($variationTypes) ? $variationTypes : []),
      ], JSON_UNESCAPED_UNICODE);
  }

  private function getSupplierVariationPrices(array $data): void
  {
      // [Supplier 8.3.2.1] Este método calcula extras para una cantidad concreta.
      header('Content-Type: application/json; charset=utf-8');

      $email = $this->getSupplierSessionEmail();
      if ($email === null) {
          $this->jsonError('Your supplier session has expired.', 401);
          return;
      }

      // [Supplier 8.3.2.1.1] Se limpian el SKU, la cantidad y los IDs duplicados/no válidos.
      $sku = trim((string)($data['sku'] ?? ''));
      $quantity = (int)($data['quantity'] ?? 0);
      $ids = array_values(array_unique(array_filter(
          array_map('intval', is_array($data['ids'] ?? null) ? $data['ids'] : []),
          fn($id) => $id > 0
      )));

      if ($sku === '' || $quantity <= 0 || empty($ids)) {
          $this->jsonError('Product, quantity and variation IDs are required.');
          return;
      }

      $database = new Database();
      $pdo = $database->getConnection();
      $product = $this->getOwnedProduct($pdo, $sku, $email);

      if (!$product) {
          $this->jsonError('This product does not belong to your account.', 403);
          return;
      }

      // [Supplier 8.3.2.1.2] Una sola consulta busca los extras cuyo rango contiene la cantidad.
      $placeholders = implode(',', array_fill(0, count($ids), '?'));
      $params = array_merge([(int)$product['product_id'], $quantity, $quantity], $ids);

      $stmt = $pdo->prepare("
          SELECT
              v.variation_id,
              pr.price,
              v.price_display_mode
          FROM variations v
          INNER JOIN prices pr ON pr.variation_id = v.variation_id
          WHERE v.product_id = ?
            AND ? >= pr.min_quantity
            AND (pr.max_quantity IS NULL OR pr.max_quantity <= 0 OR ? <= pr.max_quantity)
            AND v.variation_id IN ($placeholders)
            AND v.price_display_mode = 'variation'
          ORDER BY v.variation_id, pr.min_quantity DESC
      ");
      $stmt->execute($params);

      // [Supplier 8.3.2.1.3] Conservamos el primer rango aplicable por variation_id.
      $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
      $pricesByVariation = [];
      foreach ($rows as $row) {
          $id = (int)$row['variation_id'];
          if (!isset($pricesByVariation[$id])) {
              $pricesByVariation[$id] = [
                  'variation_id' => $id,
                  'price' => (float)$row['price'],
                  'price_display_mode' => (string)$row['price_display_mode'],
              ];
          }
      }

      // [Supplier 8.3.2.2] El navegador recibe un arreglo compacto de variation_id -> price.
      echo json_encode([
          'success' => true,
          'prices' => array_values($pricesByVariation),
      ], JSON_UNESCAPED_UNICODE);
  }

  private function getCustomerProduct(PDO $pdo, string $sku): ?array
  {
      // [Customer servidor 4.2.3] Solo un producto aprobado puede aparecer en el preview público.
      // La misma consulta resuelve proveedor, clasificación y variación raíz.
      $stmt = $pdo->prepare("
          SELECT
              p.product_id,
              p.SKU AS sku,
              p.name,
              p.description,
              p.descriptive_tagline,
              p.group_id,
              s.company_name,
              s.contact_name,
              g.name AS group_name,
              c.category_id,
              c.name AS category_name,
              (
                  SELECT v.variation_id
                  FROM variations v
                  WHERE v.product_id = p.product_id
                    AND (
                      LOWER(TRIM(v.name)) = 'default'
                      OR v.parent_id IS NULL
                    )
                  ORDER BY
                    CASE WHEN LOWER(TRIM(v.name)) = 'default' THEN 0 ELSE 1 END,
                    v.variation_id ASC
                  LIMIT 1
              ) AS root_variation_id
          FROM products p
          INNER JOIN suppliers s ON s.supplier_id = p.supplier_id
          LEFT JOIN `groups` g ON g.group_id = p.group_id
          LEFT JOIN categories c ON c.category_id = g.category_id
          WHERE LOWER(TRIM(p.SKU)) = LOWER(:sku)
            AND p.is_approved = 1
          LIMIT 1
      ");
      $stmt->execute([':sku' => $sku]);

      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      return $row ?: null;
  }

  private function getCustomerPreview(array $data): void
  {
      // [Customer 4.2.2] Este método arma la primera respuesta pública del producto.
      header('Content-Type: application/json; charset=utf-8');

      // [Customer 4.2.2.1] Se valida el SKU y luego se busca únicamente entre productos aprobados.
      $sku = trim((string)($data['sku'] ?? ''));
      if ($sku === '') {
          $this->jsonError('Product SKU is required.');
          return;
      }

      $database = new Database();
      $pdo = $database->getConnection();
      $product = $this->getCustomerProduct($pdo, $sku);

      if (!$product) {
          $this->jsonError('This product is unavailable.', 404);
          return;
      }

      $initialVariationPath = $this->getInitialVariationPath($database, $product, $data);

      // [Customer 4.3] preview_api.js recibe datos públicos y root_variation_id.
      echo json_encode([
          'success' => true,
          'product' => [
              'id' => (int)$product['product_id'],
              'sku' => (string)$product['sku'],
              'name' => (string)($product['name'] ?? ''),
              'description' => (string)($product['description'] ?? ''),
              'tagline' => (string)($product['descriptive_tagline'] ?? ''),
              'supplier_name' => (string)($product['company_name'] ?: $product['contact_name']),
              'category' => [
                  'id' => (int)($product['category_id'] ?? 0),
                  'name' => (string)($product['category_name'] ?? ''),
              ],
              'group' => [
                  'id' => (int)($product['group_id'] ?? 0),
                  'name' => (string)($product['group_name'] ?? ''),
              ],
          ],
          'root_variation_id' => (int)($product['root_variation_id'] ?? 0),
          'initial_variation_path' => $initialVariationPath,
      ], JSON_UNESCAPED_UNICODE);
  }

  private function getCustomerVariationChildren(array $data): void
  {
      // [Customer 6.2.3.1] Este método responde una etapa del recorrido público de variaciones.
      header('Content-Type: application/json; charset=utf-8');

      $variationId = (int)($data['variation_id'] ?? 0);
      if ($variationId <= 0) {
          $this->jsonError('A valid variation is required.');
          return;
      }

      // [Customer 6.2.3.1.1] Aunque el cliente no inicia sesión, el nodo debe pertenecer a un producto aprobado.
      $database = new Database();
      $pdo = $database->getConnection();
      $stmt = $pdo->prepare("
          SELECT p.product_id
          FROM variations v
          INNER JOIN products p ON p.product_id = v.product_id
          WHERE v.variation_id = :variation_id
            AND p.is_approved = 1
          LIMIT 1
      ");
      $stmt->execute([':variation_id' => $variationId]);

      if (!$stmt->fetchColumn()) {
          $this->jsonError('This variation is unavailable.', 404);
          return;
      }

      $variation = new Variation($database);
      $variation->setVariationId($variationId);

      // [Customer 6.2.3.3] El flujo entra en model/variations.php para cargar
      // hijos enriquecidos, nodo actual y nombres de los tipos hijos.
      $children = $variation->getVariationChildrenById();
      $current = $variation->getDetailsCurrentVariationById();
      $types = $variation->getTypeVariationsChildByVariationId();

      if (isset($children['success']) && $children['success'] === false) {
          $this->jsonError((string)($children['error'] ?? 'Unable to load variations.'), 500);
          return;
      }

      if (isset($current['success']) && $current['success'] === false) {
          $this->jsonError((string)($current['error'] ?? 'Unable to load the selected variation.'), 500);
          return;
      }

      if (isset($types['success']) && $types['success'] === false) {
          $this->jsonError((string)($types['error'] ?? 'Unable to load variation types.'), 500);
          return;
      }

      if (($children['success'] ?? null) === true && isset($children['data'])) {
          $children = is_array($children['data']) ? $children['data'] : [];
      }

      // [Customer 6.2.3.4] Se normalizan listas y se devuelve una estructura estable al navegador.
      echo json_encode([
          'success' => true,
          'current' => $current,
          'children' => array_values(is_array($children) ? $children : []),
          'types' => array_values(is_array($types) ? $types : []),
      ], JSON_UNESCAPED_UNICODE);
  }

  private function getCustomerVariationPrices(array $data): void
  {
      // [Customer 8.3.2.1] Este método calcula extras y disponibilidad para una cantidad concreta.
      header('Content-Type: application/json; charset=utf-8');

      // [Customer 8.3.2.1.1] Se limpian el SKU, la cantidad y los IDs duplicados/no válidos.
      $sku = trim((string)($data['sku'] ?? ''));
      $quantity = (int)($data['quantity'] ?? 0);
      $ids = array_values(array_unique(array_filter(
          array_map('intval', is_array($data['ids'] ?? null) ? $data['ids'] : []),
          fn($id) => $id > 0
      )));

      if ($sku === '' || $quantity <= 0 || empty($ids)) {
          $this->jsonError('Product, quantity and variation IDs are required.');
          return;
      }

      $database = new Database();
      $pdo = $database->getConnection();
      $product = $this->getCustomerProduct($pdo, $sku);

      if (!$product) {
          $this->jsonError('This product is unavailable.', 404);
          return;
      }

      // [Customer 8.3.2.1.2] La primera consulta devuelve precios cuyo rango sí contiene la cantidad.
      $placeholders = implode(',', array_fill(0, count($ids), '?'));
      $params = array_merge([(int)$product['product_id'], $quantity, $quantity], $ids);

      $stmt = $pdo->prepare("
          SELECT
              v.variation_id,
              pr.price,
              v.price_display_mode
          FROM variations v
          INNER JOIN prices pr ON pr.variation_id = v.variation_id
          WHERE v.product_id = ?
            AND ? >= pr.min_quantity
            AND (pr.max_quantity IS NULL OR pr.max_quantity <= 0 OR ? <= pr.max_quantity)
            AND v.variation_id IN ($placeholders)
            AND v.price_display_mode = 'variation'
          ORDER BY v.variation_id, pr.min_quantity DESC
      ");
      $stmt->execute($params);

      $pricesByVariation = [];
      foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
          $id = (int)$row['variation_id'];
          if (!isset($pricesByVariation[$id])) {
              $pricesByVariation[$id] = [
                  'variation_id' => $id,
                  'price' => (float)$row['price'],
                  'price_display_mode' => (string)$row['price_display_mode'],
              ];
          }
      }

      // [Customer 8.3.2.1.3] La segunda distingue una opción gratis de una opción pagada sin rango aplicable.
      $configuredStmt = $pdo->prepare("
          SELECT DISTINCT v.variation_id
          FROM variations v
          INNER JOIN prices pr ON pr.variation_id = v.variation_id
          WHERE v.product_id = ?
            AND v.variation_id IN ($placeholders)
            AND v.price_display_mode = 'variation'
            AND pr.price > 0
      ");
      $configuredStmt->execute(array_merge([(int)$product['product_id']], $ids));
      $pricedVariationIds = array_map('intval', $configuredStmt->fetchAll(PDO::FETCH_COLUMN));

      // [Customer 8.3.2.2] El navegador recibe precios aplicables y IDs con precio configurado.
      echo json_encode([
          'success' => true,
          'prices' => array_values($pricesByVariation),
          'priced_variation_ids' => $pricedVariationIds,
      ], JSON_UNESCAPED_UNICODE);
  }
  private function getVariationPrices($data)
  {
      $connection = new Database();
      $prices = new Prices($connection);

      $arrayPrices = [];

      foreach ($data["ids"] as $id) {
          $id = (int)$id;

          if ($id <= 0) {
              continue;
          }

          $prices->setVariationId($id);
          $prices->setMaxQuantity($data["max_quantity"]);

          $price = $prices->getPricesByIdVariation();

          if ($price === null) {
              continue;
          }

          $arrayPrices[] = [
              'variation_id' => $id,
              'price' => $price
          ];
      }
      echo json_encode([
          'success' => true,
          'prices' => $arrayPrices
      ]);
  }
  private function getVariationChildrenById($data){
    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setVariationId($data['variation_id']);
    $childVariations = $variation->getVariationChildrenById();

    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setVariationId($data['variation_id']);
    $currentVariationData = $variation->getDetailsCurrentVariationById();

    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setVariationId($data['variation_id']);
    $variationTypes = $variation->getTypeVariationsChildByVariationId();

    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setVariationId($data['variation_id']);
    $variationTypesForDelete = $variation->getTypeVariationsChildByVariationIdForDelete();

    echo json_encode([
      'childVariations' => $childVariations,
      'currentVariationData' => $currentVariationData,
      'variationTypes' => $variationTypes,
      'variationTypesForDelete' => $variationTypesForDelete

    ]);
  }
  private function getPreviewProductDetails($data){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $user = new Users($connection);
    $user->setSKU($data['sku']);
    $company = $user->getUserCompanyBySKU();

    $connection = new Database();
    $category = new Categories($connection);
    $category->setSKU($data['sku']);
    $category_name = $category->getCategoryNameBySKU();

    $connection = new Database();
    $group = new Groups($connection);
    $group->setSKU($data['sku']);
    $group_name = $group->getGroupNameBySKU();

    $connection = new Database();
    $product = new Products($connection);
    $product->setSku($data['sku']);
    $product_details = $product->getProductDetailsBySKU();

    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setSku($data['sku']);
    $variation_details = $variation->getVariationsIdBySKUProduct();

    echo json_encode(array($company,$category_name, $group_name, $product_details, $variation_details ));
  }


}

// [Servidor 4.2.0] Estas clases se cargan antes de despachar la petición.
include "../../controller/config/database.php";
include "../../model/products.php";
include "../../model/users.php";
include "../../model/categories.php";
include "../../model/groups.php";
include "../../model/prices.php";
include "../../model/variations.php";
include "../../controller/products/variations.php";

// [Servidor 4.2.0.1] Se crea el controlador y handleProduct() inicia el switch descrito arriba.
$productClass = new Product();
$productClass->handleProduct();
