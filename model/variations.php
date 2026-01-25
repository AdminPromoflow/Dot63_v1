<?php
class Variation {
  // ===== Atributos =====
  private $connection;          // PDO wrapper (->getConnection())
  private $product_id;          // FK al producto (padre)
  private $name = null;
  private $sku  = null;
  private $sku_variation = null;
  private $sku_parent_variation = null;
  private $image = null;
  private $pdf_artwork = null;
  private $isAttachAnImage;
  private $isAttachAPDF;
  private $group_name;
  private $name_pdf_artwork;



  // ===== Constructor =====
  public function __construct($connection) { $this->connection = $connection; }

  // ===== Setters =====
  public function setId($id)              { $this->product_id = (int)$id; }


  public function setIsAttachAnImage($isAttachAnImage): void
  {
      // true para: true, 1, "1", "true", "on", "yes" (case-insensitive)
      // false para: false, 0, "0", "false", "off", "no", "", null, valores no reconocidos
      $this->isAttachAnImage = filter_var(
          $isAttachAnImage,
          FILTER_VALIDATE_BOOLEAN,
          FILTER_NULL_ON_FAILURE
      ) === true;
  }

  public function setIsAttachAPDF($isAttachAPDF): void
  {
      $this->isAttachAPDF = filter_var(
          $isAttachAPDF,
          FILTER_VALIDATE_BOOLEAN,
          FILTER_NULL_ON_FAILURE
      ) === true;
  }



  public function setName(?string $v)     { $v = trim((string)$v); $this->name = ($v === '') ? null : $v; }
  public function setGroupName(?string $v)     { $v = trim((string)$v); $this->group_name = ($v === '') ? null : $v; }
  public function setNamePdfArtwork(?string $v)     { $v = trim((string)$v); $this->name_pdf_artwork = ($v === '') ? null : $v; }
  public function setSKU(?string $v)      { $v = trim((string)$v); $this->sku  = ($v === '') ? null : $v; }
  public function setSKUParentVariation(?string $v)      { $v = trim((string)$v); $this->sku_parent_variation  = ($v === '') ? null : $v; }
  public function setSKUVariation(?string $v)      { $v = trim((string)$v); $this->sku_variation  = ($v === '') ? null : $v; }
  public function setImage(?string $v)    { $v = trim((string)$v); $this->image = ($v === '') ? null : $v; }
  public function setPdfArtwork(?string $v){ $v = trim((string)$v); $this->pdf_artwork = ($v === '') ? null : $v; }


  public function getDataVariationBySkuVariation(): array
  {
    if (empty($this->sku_variation)) {
      return [
        'success' => false,
        'level' => 0,
        'variations' => []
      ];
    }

    try {
      $pdo = $this->connection->getConnection();

      $stmtRoots = $pdo->prepare("
        SELECT `variation_id`
        FROM `variations`
        WHERE `SKU` = :sku
        ORDER BY `variation_id` ASC
      ");
      $stmtRoots->bindValue(':sku', $this->sku_variation, PDO::PARAM_STR);
      $stmtRoots->execute();
      $roots = $stmtRoots->fetchAll(PDO::FETCH_ASSOC);
      $stmtRoots->closeCursor();

      if (!$roots) {
        return [
          'success' => true,
          'level' => 0,
          'variations' => []
        ];
      }

      $stmtVarById = $pdo->prepare("
        SELECT
          `variation_id`,
          `name`,
          `SKU`,
          `image`,
          `pdf_artwork`,
          `name_pdf_artwork`,
          `parent_id`
        FROM `variations`
        WHERE `variation_id` = :vid
        LIMIT 1
      ");

      $stmtImages = $pdo->prepare("
        SELECT `image_id`, `link`
        FROM `images`
        WHERE `variation_id` = :vid
        ORDER BY `updated` DESC, `image_id` DESC
      ");

      $stmtItems = $pdo->prepare("
        SELECT `item_id`, `name`, `description`
        FROM `items`
        WHERE `variation_id` = :vid
        ORDER BY `item_id` ASC
      ");

      $stmtPrices = $pdo->prepare("
        SELECT `price_id`, `min_quantity`, `max_quantity`, `price`
        FROM `prices`
        WHERE `variation_id` = :vid
        ORDER BY `min_quantity` ASC, `max_quantity` ASC
      ");

      $stmtChildren = $pdo->prepare("
        SELECT `variation_id`
        FROM `variations`
        WHERE `parent_id` = :vid
        ORDER BY `variation_id` ASC
      ");

      $variationsOut = [];
      $visited = [];
      $maxDepthSafety = 60;

      // ✅ ESTE es el nivel máximo padre->hijo alcanzado desde el SKU consultado
      $maxLevel = 0;

      $walk = function (int $variationId, int $depth) use (
        &$walk,
        &$visited,
        &$variationsOut,
        &$maxLevel,
        $maxDepthSafety,
        $stmtVarById,
        $stmtImages,
        $stmtItems,
        $stmtPrices,
        $stmtChildren
      ): void {
        if ($depth > $maxDepthSafety) {
          return;
        }

        if (isset($visited[$variationId])) {
          return;
        }
        $visited[$variationId] = true;

        // ✅ actualiza nivel máximo
        if ($depth > $maxLevel) {
          $maxLevel = $depth;
        }

        $stmtVarById->bindValue(':vid', $variationId, PDO::PARAM_INT);
        $stmtVarById->execute();
        $v = $stmtVarById->fetch(PDO::FETCH_ASSOC);
        $stmtVarById->closeCursor();

        if (!$v) {
          return;
        }

        $stmtImages->bindValue(':vid', $variationId, PDO::PARAM_INT);
        $stmtImages->execute();
        $images = $stmtImages->fetchAll(PDO::FETCH_ASSOC);
        $stmtImages->closeCursor();

        $stmtItems->bindValue(':vid', $variationId, PDO::PARAM_INT);
        $stmtItems->execute();
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
        $stmtItems->closeCursor();

        $stmtPrices->bindValue(':vid', $variationId, PDO::PARAM_INT);
        $stmtPrices->execute();
        $prices = $stmtPrices->fetchAll(PDO::FETCH_ASSOC);
        $stmtPrices->closeCursor();

        // ✅ Opcional: guardar el level por cada variación (muy útil)
        $variationsOut[] = [
          'level' => $depth,
          'details' => [
            'name' => $v['name'] ?? null,
            'sku' => $v['SKU'] ?? null,
            'image' => $v['image'] ?? null,
            'pdf_artwork' => $v['pdf_artwork'] ?? null,
            'name_pdf_artwork' => $v['name_pdf_artwork'] ?? null
          ],
          'images' => $images,
          'items'  => $items,
          'price'  => $prices
        ];

        // Recorrer hijos
        $stmtChildren->bindValue(':vid', $variationId, PDO::PARAM_INT);
        $stmtChildren->execute();
        $childRows = $stmtChildren->fetchAll(PDO::FETCH_ASSOC);
        $stmtChildren->closeCursor();

        foreach ($childRows as $c) {
          $walk((int)$c['variation_id'], $depth + 1);
        }
      };

      foreach ($roots as $r) {
        $walk((int)$r['variation_id'], 0);
      }

      return [
        'success' => true,
        'level' => $maxLevel,          // ✅ ESTE es el “nivel padre->hijo” alcanzado
        'variations' => $variationsOut
      ];

    } catch (PDOException $e) {
      error_log('getDataVariationBySkuVariation error (' . $this->sku_variation . '): ' . $e->getMessage());
      return [
        'success' => false,
        'level' => 0,
        'variations' => []
      ];
    }
  }




  public function checkProductAndVariationExistenceBySkus(): bool
  {
      if (empty($this->sku) || empty($this->sku_variation)) {
          return false;
      }

      try {
          $pdo = $this->connection->getConnection();

          $stmt = $pdo->prepare("SELECT product_id FROM products WHERE SKU = :sku LIMIT 1");
          $stmt->execute([':sku' => $this->sku]);
          $product = $stmt->fetch(PDO::FETCH_ASSOC);
          if (!$product) {
              return false;
          }
          $productId = (int)$product['product_id'];

          $stmt = $pdo->prepare("SELECT variation_id FROM variations WHERE SKU = :vsku AND product_id = :pid LIMIT 1");
          $stmt->execute([':vsku' => $this->sku_variation, ':pid' => $productId]);
          $variation = $stmt->fetch(PDO::FETCH_ASSOC);

          return (bool)$variation;

      } catch (PDOException $e) {
          error_log('getVariationDetailsBySkus error: ' . $e->getMessage());
          return false;
      }
  }

  public function getVariationDetailsBySkus(): array
  {
      // 0) Validaciones mínimas
      if (!$this->sku) {
          return ['success' => false, 'error' => 'Product SKU requerido'];
      }
      if (!$this->sku_variation) {
          return ['success' => false, 'error' => 'Variation SKU (sku_variation) requerido'];
      }

      try {
          $pdo = $this->connection->getConnection();

          // 1) Obtener product_id, name, SKU y group_id desde products por SKU de producto
          $stmt = $pdo->prepare("
              SELECT product_id, name AS product_name, SKU AS product_sku, group_id
              FROM products
              WHERE LOWER(SKU) = LOWER(:sku)
              LIMIT 1
          ");
          $stmt->execute([':sku' => $this->sku]);
          $prod = $stmt->fetch(PDO::FETCH_ASSOC);

          if (!$prod) {
              return ['success' => false, 'error' => 'Producto no encontrado por SKU'];
          }

          $productId   = (int)$prod['product_id'];
          $productName = $prod['product_name'];
          $productSku  = $prod['product_sku'];
          $groupId     = !empty($prod['group_id']) ? (int)$prod['group_id'] : null;

          // 2) Variación actual + datos del padre (name/sku) en una sola consulta
          $stmt = $pdo->prepare("
              SELECT
                v.variation_id,
                v.name,
                v.image,
                v.SKU,
                v.pdf_artwork,
                v.name_pdf_artwork,
                v.parent_id,
                vp.name AS parent_name,
                vp.SKU  AS parent_sku
              FROM variations v
              LEFT JOIN variations vp
                ON vp.variation_id = v.parent_id
              WHERE v.product_id = :pid
                AND LOWER(v.SKU) = LOWER(:vsku)
              LIMIT 1
          ");
          $stmt->execute([
              ':pid'  => $productId,
              ':vsku' => $this->sku_variation
          ]);
          $row = $stmt->fetch(PDO::FETCH_ASSOC);

          if (!$row) {
              return ['success' => false, 'error' => 'Variation SKU no pertenece al producto dado o no existe'];
          }

          // 3) Listar todas las variaciones del producto (name, SKU)
          $stmt = $pdo->prepare("
              SELECT variation_id, name, SKU
              FROM variations
              WHERE product_id = :pid
              ORDER BY name ASC
          ");
          $stmt->execute([':pid' => $productId]);
          $variations = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

          // 4) Con product_id (vía group->category) traer type_variations asociados a la categoría del producto
          //    (si el producto no tiene group_id, devolverá lista vacía)
          $typeVariations = [];
          if ($groupId !== null) {
              $stmt = $pdo->prepare("
                  SELECT
                    tv.type_id,
                    tv.type_name,
                    tv.description,
                    tv.category_id
                  FROM products p
                  INNER JOIN `groups` g
                    ON g.group_id = p.group_id
                  INNER JOIN type_variations tv
                    ON tv.category_id = g.category_id
                  WHERE p.product_id = :pid
                  ORDER BY tv.type_name ASC
              ");
              $stmt->execute([':pid' => $productId]);
              $typeVariations = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
          }

          // 5) Respuesta final (sin json_encode)
          return [
              'success' => true,
              'product' => [
                  'product_id'   => $productId,
                  'product_name' => $productName,
                  'product_sku'  => $productSku,
                  'group_id'     => $groupId,
              ],
              'variations' => $variations,
              'current' => [
                  'variation_id'     => (int)$row['variation_id'],
                  'name'             => $row['name'],
                  'image'            => $row['image'] ?? null,
                  'sku'              => $row['SKU'],
                  'pdf_artwork'      => $row['pdf_artwork'] ?? null,
                  'name_pdf_artwork' => $row['name_pdf_artwork'] ?? null,
                  'parent_id'        => !empty($row['parent_id']) ? (int)$row['parent_id'] : null,
              ],
              'parent' => [
                  'name' => $row['parent_name'] ?? null,
                  'sku'  => $row['parent_sku']  ?? null,
              ],
              'type_variations' => $typeVariations,
          ];

      } catch (PDOException $e) {
          error_log('getVariationDetailsBySkus: ' . $e->getMessage());
          return ['success' => false, 'error' => 'DB error'];
      }
  }



  public function createDefaultVariation(): array
  {
    if (empty($this->product_id) || $this->product_id <= 0) {
      return ['success' => false, 'error' => 'product_id required'];
    }

    try {
      $pdo = $this->connection->getConnection();

      $name = $this->name ?? 'Default';
      $sku  = $this->sku ?? null;       // si no seteaste SKU, quedará null
      $img  = $this->image ?? null;
      $pdf  = $this->pdf_artwork ?? null;

      $stmt = $pdo->prepare("
        INSERT INTO variations (name, SKU, image, pdf_artwork, product_id)
        VALUES (:name, :sku, :image, :pdf, :pid)
      ");
      $stmt->execute([
        ':name'  => $name,
        ':sku'   => $sku,
        ':image' => $img,
        ':pdf'   => $pdf,
        ':pid'   => $this->product_id,
      ]);

      // Éxito: retorna el SKU insertado
      return ['success' => true, 'sku_variation' => $sku];

    } catch (PDOException $e) {
      error_log('createDefaultVariation error (product_id '.$this->product_id.'): '.$e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  // En tu modelo Variation
  public function updateVariationDetails(): bool
  {
      // 1) SKU objetivo (la variación que vamos a actualizar)
      $targetSku = trim((string)($this->sku_variation ?? ''));
      if ($targetSku === '') {
          return false; // Esto está bien
      }

      try {
          $pdo = $this->connection->getConnection();
          $pdo->beginTransaction();

          // 2) parent_id obligatorio: buscar por SKU del padre (variación)
          $stmt = $pdo->prepare("
              SELECT variation_id
              FROM variations
              WHERE SKU = :parentSku
              LIMIT 1
          ");
          $stmt->execute([':parentSku' => (string)$this->sku_parent_variation]);
          $parentId = $stmt->fetch(\PDO::FETCH_COLUMN);

          // 3) Si no retorna parentId: buscar la variación 'default' por NOMBRE dentro del mismo producto del target
          if ($parentId === false) {
              // 3.a) Obtener product_id de la variación objetivo
              $stmt = $pdo->prepare("
                  SELECT product_id
                  FROM variations
                  WHERE SKU = :sku
                  LIMIT 1
              ");
              $stmt->execute([':sku' => $targetSku]);
              $pid = $stmt->fetch(\PDO::FETCH_COLUMN);
              if ($pid === false) {
                  $pdo->rollBack();
                  return false; // no se pudo determinar el producto del target
              }

              // 3.b) Buscar variación cuyo nombre contenga 'default' (case-insensitive) en ese producto
              $stmt = $pdo->prepare("
                  SELECT variation_id
                  FROM variations
                  WHERE product_id = :pid
                    AND LOWER(name) LIKE :like
                  ORDER BY variation_id ASC
                  LIMIT 1
              ");
              $stmt->execute([
                  ':pid'  => (int)$pid,
                  ':like' => '%default%',
              ]);
              $parentId = $stmt->fetch(\PDO::FETCH_COLUMN);

              // 4) Si tampoco se encuentra, abortar
              if ($parentId === false) {
                  $pdo->rollBack();
                  return false;
              }

              $parentId = (int)$parentId; // normalizar a int
          } else {
              $parentId = (int)$parentId; // normalizar a int cuando sí existía por SKU padre
          }

          // 5) UPDATE por SKU de la variación objetivo

          if ($this->isAttachAnImage && $this->isAttachAPDF) {

              $stmt = $pdo->prepare("
                  UPDATE variations
                     SET name             = :name,
                         `group`          = :group_name,
                         image            = :image,
                         pdf_artwork      = :pdf_artwork,
                         name_pdf_artwork = :name_pdf_artwork,
                         parent_id        = :parent_id
                   WHERE SKU = :sku
                   LIMIT 1
              ");

              $stmt->bindValue(':name',             (string)($this->name ?? ''),              \PDO::PARAM_STR);
              $stmt->bindValue(':group_name',       (string)($this->group_name ?? ''),        \PDO::PARAM_STR);
              $stmt->bindValue(':image',            (string)($this->image ?? ''),             \PDO::PARAM_STR); // TEXT
              $stmt->bindValue(':pdf_artwork',      (string)($this->pdf_artwork ?? ''),       \PDO::PARAM_STR); // TEXT
              $stmt->bindValue(':name_pdf_artwork', (string)($this->name_pdf_artwork ?? ''),  \PDO::PARAM_STR);
              $stmt->bindValue(':parent_id',        $parentId,                                \PDO::PARAM_INT);
              $stmt->bindValue(':sku',              $targetSku,                               \PDO::PARAM_STR);

          } elseif ($this->isAttachAnImage && !$this->isAttachAPDF) {

              $stmt = $pdo->prepare("
                  UPDATE variations
                     SET name             = :name,
                         `group`          = :group_name,
                         image            = :image,
                         name_pdf_artwork = :name_pdf_artwork,
                         parent_id        = :parent_id
                   WHERE SKU = :sku
                   LIMIT 1
              ");

              $stmt->bindValue(':name',             (string)($this->name ?? ''),             \PDO::PARAM_STR);
              $stmt->bindValue(':group_name',       (string)($this->group_name ?? ''),       \PDO::PARAM_STR);
              $stmt->bindValue(':image',            (string)($this->image ?? ''),            \PDO::PARAM_STR); // TEXT
              $stmt->bindValue(':name_pdf_artwork', (string)($this->name_pdf_artwork ?? ''), \PDO::PARAM_STR);
              $stmt->bindValue(':parent_id',        $parentId,                               \PDO::PARAM_INT);
              $stmt->bindValue(':sku',              $targetSku,                              \PDO::PARAM_STR);

          } elseif (!$this->isAttachAnImage && $this->isAttachAPDF) {

              $stmt = $pdo->prepare("
                  UPDATE variations
                     SET name             = :name,
                         `group`          = :group_name,
                         pdf_artwork      = :pdf_artwork,
                         name_pdf_artwork = :name_pdf_artwork,
                         parent_id        = :parent_id
                   WHERE SKU = :sku
                   LIMIT 1
              ");

              $stmt->bindValue(':name',             (string)($this->name ?? ''),             \PDO::PARAM_STR);
              $stmt->bindValue(':group_name',       (string)($this->group_name ?? ''),       \PDO::PARAM_STR);
              $stmt->bindValue(':pdf_artwork',      (string)($this->pdf_artwork ?? ''),      \PDO::PARAM_STR); // TEXT
              $stmt->bindValue(':name_pdf_artwork', (string)($this->name_pdf_artwork ?? ''), \PDO::PARAM_STR);
              $stmt->bindValue(':parent_id',        $parentId,                               \PDO::PARAM_INT);
              $stmt->bindValue(':sku',              $targetSku,                              \PDO::PARAM_STR);

          } elseif (!$this->isAttachAnImage && !$this->isAttachAPDF) {

              $stmt = $pdo->prepare("
                  UPDATE variations
                     SET name             = :name,
                         `group`          = :group_name,
                         name_pdf_artwork = :name_pdf_artwork,
                         parent_id        = :parent_id
                   WHERE SKU = :sku
                   LIMIT 1
              ");

              $stmt->bindValue(':name',             (string)($this->name ?? ''),             \PDO::PARAM_STR);
              $stmt->bindValue(':group_name',       (string)($this->group_name ?? ''),       \PDO::PARAM_STR);
              $stmt->bindValue(':name_pdf_artwork', (string)($this->name_pdf_artwork ?? ''), \PDO::PARAM_STR);
              $stmt->bindValue(':parent_id',        $parentId,                               \PDO::PARAM_INT);
              $stmt->bindValue(':sku',              $targetSku,                              \PDO::PARAM_STR);
          }

          $ok = $stmt->execute();
          $pdo->commit();

          return $ok; // true si ejecutó correctamente (aunque no cambie filas)
      } catch (\PDOException $e) {
          if (isset($pdo)) {
              $pdo->rollBack();
          }
          // error_log('updateVariationDetails error (sku '.$targetSku.'): '.$e->getMessage());
          return false;
      }
  }

  public function updategroupNameBySkuVariation(): bool
  {

      // 1) SKU objetivo (la variación que vamos a actualizar)
      $targetSku = trim((string)($this->sku_variation ?? ''));
      if ($targetSku === '') {
          return false;
      }

  //    echo  json_encode($this->group_name );exit;

      try {
          $pdo = $this->connection->getConnection();
          $pdo->beginTransaction();

          // Ojo: `group` va entre backticks porque es palabra reservada
          $stmt = $pdo->prepare("
              UPDATE variations
                 SET `group` = :group_name
               WHERE SKU = :sku
               LIMIT 1
          ");


          // Usamos exactamente la propiedad que rellena setGroupName()
            $stmt->bindValue(':group_name', (string)($this->group_name ?? ''), \PDO::PARAM_STR);
            $stmt->bindValue(':sku',        $targetSku,                        \PDO::PARAM_STR);

            $ok = $stmt->execute();
            $pdo->commit();

            return $ok; // true aunque no cambie filas

        } catch (\PDOException $e) {
            if (isset($pdo)) {
                $pdo->rollBack();
            }
            // error_log('updategroupNameBySkuVariation error (sku '.$targetSku.'): '.$e->getMessage());
            return false;
        }
  }



  public function createEmptyVariationByProductSku(): array
  {
      // Requiere: $this->sku  (SKU del producto)  y  $this->sku_variation (SKU de la variación)
      $productSku   = isset($this->sku) ? trim((string)$this->sku) : '';
      $variationSku = isset($this->sku_variation) ? trim((string)$this->sku_variation) : '';

      if ($productSku === '') {
          return ['success' => false, 'error' => 'Product SKU requerido'];
      }
      if ($variationSku === '') {
          return ['success' => false, 'error' => 'Variation SKU requerido'];
      }

      try {
          $pdo = $this->connection->getConnection();

          // 1) Obtener product_id por SKU de producto
          $stmt = $pdo->prepare("
              SELECT product_id
              FROM products
              WHERE SKU = :sku
              LIMIT 1
          ");
          $stmt->execute([':sku' => $productSku]);
          $prod = $stmt->fetch(PDO::FETCH_ASSOC);

          if (!$prod) {
              return ['success' => false, 'error' => 'Producto no encontrado por SKU'];
          }

          $productId = (int)$prod['product_id'];

          // 2) Verificar si ya existe una variación con ese SKU (opcional pero recomendado)
          $stmt = $pdo->prepare("
              SELECT variation_id
              FROM variations
              WHERE SKU = :vsku
              LIMIT 1
          ");
          $stmt->execute([':vsku' => $variationSku]);
          if ($stmt->fetch(PDO::FETCH_ASSOC)) {
              return ['success' => false, 'error' => 'Variation SKU ya existe'];
          }

          // 3) Insertar nueva variación con campos vacíos y SKU de variación provisto
          $stmt = $pdo->prepare("
              INSERT INTO variations (name, SKU, image, pdf_artwork, parent_id, product_id)
              VALUES (:name, :sku_variation, :image, :pdf, :parent_id, :pid)
          ");
          $stmt->execute([
              ':name'          => null,              // vacío
              ':sku_variation' => $variationSku,     // SKU de la variación (provisto)
              ':image'         => null,              // vacío
              ':pdf'           => null,              // vacío
              ':parent_id'     => null,              // sin padre por defecto
              ':pid'           => $productId,
          ]);

          $variationId = (int)$pdo->lastInsertId();

          return [
              'success'        => true,
              'product_id'     => $productId,
              'variation_id'   => $variationId,
              'sku_variation'  => $variationSku,
              'name'           => null,
              'image'          => null,
              'pdf_artwork'    => null,
              'parent_id'      => null,
          ];

      } catch (PDOException $e) {
          error_log('createEmptyVariationByProductSku: '.$e->getMessage());
          return ['success' => false, 'error' => 'DB error'];
      }
  }


  public function getVariationsSKUBySKUProduct(): array
  {
      if (!$this->sku) {
          return ['success' => false, 'error' => 'Product SKU requerido'];
      }

      try {
          $pdo = $this->connection->getConnection();

          // 1) Obtener product_id por SKU del producto
          $stmt = $pdo->prepare("
              SELECT product_id
              FROM products
              WHERE SKU = :sku
              LIMIT 1
          ");
          $stmt->execute([':sku' => $this->sku]);
          $pid = $stmt->fetchColumn();

          if (!$pid) {
              return ['success' => false, 'error' => 'Producto no encontrado por SKU'];
          }

          // 2) Obtener el SKU de la variación 'Default' del producto (un solo valor)
          $stmt = $pdo->prepare("
              SELECT SKU
              FROM variations
              WHERE product_id = :pid
                AND name = 'Default'
              LIMIT 1
          ");
          $stmt->execute([':pid' => (int)$pid]);
          $defaultSku = $stmt->fetchColumn();

          if (!$defaultSku) {
              return ['success' => false, 'error' => "No se encontró la variación 'Default' para este producto"];
          }

          return [
              'success' => true,
              'default_variation_sku' => $defaultSku
          ];

      } catch (PDOException $e) {
          error_log('getVariationsSKUBySKUProduct: ' . $e->getMessage());
          return ['success' => false, 'error' => 'DB error'];
      }
  }


}


?>
