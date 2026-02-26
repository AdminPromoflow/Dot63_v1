<?php
class Variation {
  // ===== Atributos =====
  private $connection;          // PDO wrapper (->getConnection())
  private $product_id;          // FK al producto (padre)
  private $variation_id;          // FK al producto (padre)
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
  private ?int $type_id = null;



  // ===== Constructor =====
  public function __construct($connection) { $this->connection = $connection; }

  // ===== Setters =====
  public function setId($id)              { $this->product_id = (int)$id; }
  public function setVariationId($variation_id){
    $this->variation_id = (int)$variation_id;
  }

  public function setTypeId(?int $typeId): void{
      $this->type_id = $typeId;
  }
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


  public function getVariationChildrenById(): array
  {
    $parentVariationId = (int)($this->variation_id ?? 0);

    if ($parentVariationId <= 0) {
      return ['success' => false, 'error' => 'variation_id requerido'];
    }

    try {
      $pdo = $this->connection->getConnection();

      // (Opcional) validar que exista el padre
      $stmt = $pdo->prepare("
        SELECT variations.variation_id
        FROM variations
        WHERE variations.variation_id = :id
        LIMIT 1
      ");
      $stmt->execute([':id' => $parentVariationId]);
      $exists = (int)$stmt->fetchColumn();

      if (!$exists) {
        return ['success' => false, 'error' => 'Variación padre no encontrada por variation_id'];
      }

      // 1) Obtener variaciones hijas (SIN pdf_artwork / name_pdf_artwork)
      $stmt = $pdo->prepare("
        SELECT
          variations.variation_id,
          variations.name,
          variations.SKU,
          variations.image,
          variations.parent_id,
          variations.product_id,
          variations.type_id
        FROM variations
        WHERE variations.parent_id = :parent_id
        ORDER BY variations.variation_id ASC
      ");
      $stmt->execute([':parent_id' => $parentVariationId]);
      $children = $stmt->fetchAll(PDO::FETCH_ASSOC);

      if (!$children) {
        return ['success' => true, 'data' => []];
      }

      // IDs de las hijas para consultas IN (...)
      $childIds = array_map(fn($r) => (int)$r['variation_id'], $children);
      $placeholders = implode(',', array_fill(0, count($childIds), '?'));

      // 2) Traer ARTWORK en bloque (pdf_artwork + name_pdf_artwork)
      $stmt = $pdo->prepare("
        SELECT
          variations.variation_id,
          variations.pdf_artwork,
          variations.name_pdf_artwork
        FROM variations
        WHERE variations.variation_id IN ($placeholders)
      ");
      $stmt->execute($childIds);
      $artworkRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

      $artworkByVariation = [];
      foreach ($artworkRows as $row) {
        $vid = (int)$row['variation_id'];
        $artworkByVariation[$vid] = [
          'pdf_artwork' => $row['pdf_artwork'] ?? null,
          'name_pdf_artwork' => $row['name_pdf_artwork'] ?? null,
        ];
      }

      // 3) Traer IMAGES en bloque
      $stmt = $pdo->prepare("
        SELECT
          images.image_id,
          images.link,
          images.updated,
          images.variation_id
        FROM images
        WHERE images.variation_id IN ($placeholders)
        ORDER BY images.image_id ASC
      ");
      $stmt->execute($childIds);
      $imagesRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

      $imagesByVariation = [];
      foreach ($imagesRows as $row) {
        $vid = (int)$row['variation_id'];
        if (!isset($imagesByVariation[$vid])) $imagesByVariation[$vid] = [];
        $imagesByVariation[$vid][] = $row;
      }

      // 4) Traer ITEMS en bloque
      $stmt = $pdo->prepare("
        SELECT
          items.item_id,
          items.name,
          items.description,
          items.variation_id
        FROM items
        WHERE items.variation_id IN ($placeholders)
        ORDER BY items.item_id ASC
      ");
      $stmt->execute($childIds);
      $itemsRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

      $itemsByVariation = [];
      foreach ($itemsRows as $row) {
        $vid = (int)$row['variation_id'];
        if (!isset($itemsByVariation[$vid])) $itemsByVariation[$vid] = [];
        $itemsByVariation[$vid][] = $row;
      }

      // 5) Traer PRICES en bloque
      $stmt = $pdo->prepare("
        SELECT
          prices.price_id,
          prices.min_quantity,
          prices.max_quantity,
          prices.price,
          prices.variation_id
        FROM prices
        WHERE prices.variation_id IN ($placeholders)
        ORDER BY prices.price_id ASC
      ");
      $stmt->execute($childIds);
      $pricesRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

      $pricesByVariation = [];
      foreach ($pricesRows as $row) {
        $vid = (int)$row['variation_id'];
        if (!isset($pricesByVariation[$vid])) $pricesByVariation[$vid] = [];
        $pricesByVariation[$vid][] = $row;
      }

      // 6) EXTRA: type_name por type_id
      $typeIds = [];
      foreach ($children as $ch) {
        if (!empty($ch['type_id'])) $typeIds[] = (int)$ch['type_id'];
      }
      $typeIds = array_values(array_unique($typeIds));

      $typeNameById = [];
      if (!empty($typeIds)) {
        $typePlaceholders = implode(',', array_fill(0, count($typeIds), '?'));

        $stmt = $pdo->prepare("
          SELECT type_variations.type_id, type_variations.type_name
          FROM type_variations
          WHERE type_variations.type_id IN ($typePlaceholders)
        ");
        $stmt->execute($typeIds);

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
          $typeNameById[(int)$r['type_id']] = $r['type_name'];
        }
      }

      // 7) Armar estructura final
      $result = [];
      foreach ($children as $child) {
        $vid = (int)$child['variation_id'];

        // Agregar type_name dentro de "variation"
        $tid = !empty($child['type_id']) ? (int)$child['type_id'] : 0;
        $child['type_name'] = $tid ? ($typeNameById[$tid] ?? null) : null;

        $result[] = [
          'variation' => $child, // ✅ SIN pdf_artwork / name_pdf_artwork
          'images'  => $imagesByVariation[$vid] ?? [],
          'items'   => $itemsByVariation[$vid] ?? [],
          'prices'  => $pricesByVariation[$vid] ?? [],
          'artwork' => $artworkByVariation[$vid] ?? [
            'pdf_artwork' => null,
            'name_pdf_artwork' => null
          ],
        ];
      }

      return $result;

    } catch (PDOException $e) {
      error_log('getVariationChildrenById: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }
  public function getTypeVariationsChildByVariationId(): array
  {
    $parentVariationId = (int)($this->variation_id ?? 0);

    if ($parentVariationId <= 0) {
      return ['success' => false, 'error' => 'variation_id required'];
    }

    try {
      $pdo = $this->connection->getConnection();

      $stmt = $pdo->prepare("
        SELECT DISTINCT
          variations.type_id,
          type_variations.type_name
        FROM variations
        LEFT JOIN type_variations
          ON type_variations.type_id = variations.type_id
        WHERE variations.parent_id = :parent_variation_id
        ORDER BY variations.type_id ASC
      ");

      $stmt->execute([':parent_variation_id' => $parentVariationId]);
      $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

      return $rows;

    } catch (PDOException $e) {
      error_log('getTypeVariationsChildByVariationId error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
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
                v.type_id,
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

                  // ✅ NUEVO: type_id agregado al return
                  'type_id'          => !empty($row['type_id']) ? (int)$row['type_id'] : null,
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
      $targetSku = trim((string)($this->sku_variation ?? ''));
      if ($targetSku === '') {
          return false;
      }

      try {
          $pdo = $this->connection->getConnection();
          $pdo->beginTransaction();

          // 1) Resolve parent_id from parent SKU (if provided)
          $stmt = $pdo->prepare("
              SELECT variation_id
              FROM variations
              WHERE SKU = :parentSku
              LIMIT 1
          ");
          $stmt->execute([':parentSku' => (string)($this->sku_parent_variation ?? '')]);
          $parentId = $stmt->fetch(\PDO::FETCH_COLUMN);

          // 2) Fallback: find "default" parent within the same product
          if ($parentId === false) {
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
                  return false;
              }

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

              if ($parentId === false) {
                  $pdo->rollBack();
                  return false;
              }

              $parentId = (int)$parentId;
          } else {
              $parentId = (int)$parentId;
          }

          // 3) Build UPDATE dynamically based on attach flags
          $set = [
              'name = :name',
              'type_id = :type_id',
              'name_pdf_artwork = :name_pdf_artwork',
              'parent_id = :parent_id',
          ];

          if ((int)$this->isAttachAnImage === 1) {
              $set[] = 'image = :image';
          }
          if ((int)$this->isAttachAPDF === 1) {
              $set[] = 'pdf_artwork = :pdf_artwork';
          }

          $sql = "
              UPDATE variations
                 SET " . implode(",\n                   ", $set) . "
               WHERE SKU = :sku
               LIMIT 1
          ";

          $stmt = $pdo->prepare($sql);

          // Bind common fields
          $stmt->bindValue(':name', (string)($this->name ?? ''), \PDO::PARAM_STR);

          // type_id can be NULL
          if ($this->type_id === null) {
              $stmt->bindValue(':type_id', null, \PDO::PARAM_NULL);
          } else {
              $stmt->bindValue(':type_id', (int)$this->type_id, \PDO::PARAM_INT);
          }

          $stmt->bindValue(':name_pdf_artwork', (string)($this->name_pdf_artwork ?? ''), \PDO::PARAM_STR);
          $stmt->bindValue(':parent_id', $parentId, \PDO::PARAM_INT);
          $stmt->bindValue(':sku', $targetSku, \PDO::PARAM_STR);

          // Bind optional file paths only if included in SET
          if ((int)$this->isAttachAnImage === 1) {
              $stmt->bindValue(':image', (string)($this->image ?? ''), \PDO::PARAM_STR);
          }
          if ((int)$this->isAttachAPDF === 1) {
              $stmt->bindValue(':pdf_artwork', (string)($this->pdf_artwork ?? ''), \PDO::PARAM_STR);
          }

          $ok = $stmt->execute();
          $pdo->commit();

          return $ok;
      } catch (\PDOException $e) {
          if (isset($pdo)) $pdo->rollBack();
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


  public function getVariationsIdBySKUProduct(): array
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
      $pid = (int)$stmt->fetchColumn();

      if (!$pid) {
        return ['success' => false, 'error' => 'Producto no encontrado por SKU'];
      }

      // 2) Obtener el variation_id de la variación 'Default'
      $stmt = $pdo->prepare("
        SELECT variation_id
        FROM variations
        WHERE product_id = :pid
          AND name = 'Default'
        LIMIT 1
      ");
      $stmt->execute([':pid' => $pid]);
      $defaultVariationId = (int)$stmt->fetchColumn();

      if (!$defaultVariationId) {
        return ['success' => false, 'error' => "No se encontró la variación 'Default' para este producto"];
      }

      return [
        'success' => true,
        'default_variation_id' => $defaultVariationId
      ];

    } catch (PDOException $e) {
      error_log('getVariationsIdBySKUProduct: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }


}


?>
