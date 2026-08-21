<?php
class Products {
  /** @var Database $connection Debe exponer getConnection(): PDO */
  private $connection;

  /** Atributos del modelo (coinciden con columnas) */
  private $product_id;   // int
  private $sku;          // string (<= 50)
  private $name;         // string (<= 150)
  private $description;  // text
  private $pd_tagline;  // text
  private $status;       // string (<= 50)
  private $category_id;  // int|null
  private $supplier_id;  // int
  private $email; // string|null
  private $group_id;    // int
  private $groups = []; // array


  public function __construct($connection) {
    $this->connection = $connection;
  }

  /* ===========================
     Setters
     =========================== */
     public function setProductId($product_id) {

       $this->product_id = (int)$product_id;

     }
  public function setGroupId($id)       { $this->group_id = (int)$id; }
  public function setGroups(array $groups){$this->groups = array_map('intval', $groups);}
  public function setId($id)            { $this->product_id  = (int)$id; }
  public function setSku($sku)          { $this->sku         = $this->normalizeText($sku); }
  public function setName($name)        { $this->name        = $this->normalizeText($name); }
  public function setDescription($desc) { $this->description = is_string($desc) ? trim($desc) : null; }
  public function setTaglineDescription($pd_tagline)  { $this->pd_tagline = is_string($pd_tagline) ? trim($pd_tagline) : null; }
  public function setStatus($status)    { $this->status      = $this->normalizeText($status); }
  public function setCategoryId($id)    { $this->category_id = ($id === null || $id === '') ? null : (int)$id; }
  public function setSupplierId($id)    { $this->supplier_id = (int)$id; }
  public function setEmail($email) { $this->email = ($email === null || $email === '') ? null : strtolower(trim((string)$email)); }

  /** Normaliza strings (trim + colapsa espacios) */
  private function normalizeText($s) {
    $s = is_string($s) ? trim($s) : '';
    return preg_replace('/\s+/', ' ', $s);
  }

  public function getProductsByGroupId(): array
  {
    try {
      $pdo = $this->connection->getConnection();

      $sku = trim((string)($this->sku ?? ''));

      if ($sku === '' || mb_strlen($sku) > 50) {
        return [
          'success' => false,
          'error'   => 'SKU required/invalid'
        ];
      }

      /* 1) Consultar el producto y su group_id según el SKU. */
      $stmtGroup = $pdo->prepare("
        SELECT product_id, group_id, SKU, name
        FROM products
        WHERE SKU = :sku
        LIMIT 1
      ");

      $stmtGroup->execute([
        ':sku' => $sku
      ]);

      $currentProduct = $stmtGroup->fetch(PDO::FETCH_ASSOC);

      if (!$currentProduct || empty($currentProduct['group_id'])) {
        return [
          'success' => false,
          'error'   => 'Group ID not found for this SKU'
        ];
      }

      $groupId = (int)$currentProduct['group_id'];

      /* 2) Consultar todos los productos de ese group_id */
      $stmt = $pdo->prepare("
        SELECT
          p.product_id,
          p.SKU,
          p.name
        FROM products p
        WHERE p.group_id = :group_id
        ORDER BY p.product_id DESC
      ");

      $stmt->execute([
        ':group_id' => $groupId
      ]);

      $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

      $response = [
        'success' => true,
        'group_id' => $groupId,
        'result'  => $rows
      ];

      /*
       * Only generated SLY-* records feed the exclusive Super Lanyard
       * catalogue. The editable source product is deliberately excluded so
       * its variation tree cannot be mixed into generated combinations.
       */
      if ($this->isSuperLanyardName($currentProduct['name'] ?? '')) {
        $superLanyardProducts = array_values(array_filter(
          $rows,
          function ($row) {
            return $this->isGeneratedSuperLanyardProduct($row);
          }
        ));

        $response['catalog_type'] = 'super_lanyard';
        $response['catalog'] = $this->buildSuperLanyardCatalog(
          $pdo,
          $superLanyardProducts,
          (string)$currentProduct['SKU']
        );
      }

      return $response;

    } catch (PDOException $e) {
      error_log('getProductsByGroupId error: ' . $e->getMessage());

      return [
        'success' => false,
        'error'   => 'DB error'
      ];
    }
  }

  /**
   * Detect the catalogue without relying on letter case, spacing or dashes.
   */
  private function isSuperLanyardName($name): bool
  {
    $normalized = mb_strtolower(trim((string)$name), 'UTF-8');
    $normalized = preg_replace('/[^a-z0-9]+/u', '', $normalized);

    return strpos($normalized, 'superlanyard') === 0;
  }

  private function isGeneratedSuperLanyardProduct(array $product): bool
  {
    $sku = strtoupper(trim((string)($product['SKU'] ?? '')));
    return strpos($sku, 'SLY-') === 0
      && $this->isSuperLanyardName($product['name'] ?? '');
  }

  /**
   * Build one catalogue card for every complete, terminal configuration.
   * Paths are reconstructed in PHP because some branches store Printed Sides
   * before Colour while others store them in the opposite order. The type_id
   * relationship, not the title or the tree depth, is the source of truth.
   */
  private function buildSuperLanyardCatalog(PDO $pdo, array $products, string $currentSku): array
  {
    $filterLabels = [
      'theme' => 'Theme',
      'material' => 'Material',
      'width' => 'Width',
      'print_technique' => 'Print Technique',
      'printed_sides' => 'Printed Sides',
      'colour' => 'Colour'
    ];

    $emptyCatalog = [
      'title' => 'Super Lanyard',
      'subtitle' => 'Explore every available configuration.',
      'current_sku' => $currentSku,
      'filter_labels' => $filterLabels,
      'filter_options' => array_fill_keys(array_keys($filterLabels), []),
      'products' => []
    ];

    $productIds = array_values(array_unique(array_filter(array_map(
      static function ($product) {
        return (int)($product['product_id'] ?? 0);
      },
      $products
    ))));

    if (empty($productIds)) {
      return $emptyCatalog;
    }

    $placeholders = implode(',', array_fill(0, count($productIds), '?'));
    $stmt = $pdo->prepare("
      SELECT
        v.variation_id,
        v.parent_id,
        v.product_id,
        v.name,
        v.SKU,
        v.image,
        v.type_id,
        tv.type_name
      FROM variations v
      LEFT JOIN type_variations tv ON tv.type_id = v.type_id
      WHERE v.product_id IN ($placeholders)
      ORDER BY v.product_id ASC, v.variation_id ASC
    ");
    $stmt->execute($productIds);
    $variationRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($variationRows)) {
      return $emptyCatalog;
    }

    $variationsById = [];
    $childrenCount = [];
    $variationIds = [];

    foreach ($variationRows as $row) {
      $variationId = (int)$row['variation_id'];
      $parentId = !empty($row['parent_id']) ? (int)$row['parent_id'] : null;
      $row['variation_id'] = $variationId;
      $row['parent_id'] = $parentId;
      $row['product_id'] = (int)$row['product_id'];
      $variationsById[$variationId] = $row;
      $variationIds[] = $variationId;

      if ($parentId !== null) {
        $childrenCount[$parentId] = ($childrenCount[$parentId] ?? 0) + 1;
      }
    }

    $productById = [];
    foreach ($products as $product) {
      $productById[(int)$product['product_id']] = $product;
    }

    $assetByVariation = [];
    $priceByVariation = [];
    $variationPlaceholders = implode(',', array_fill(0, count($variationIds), '?'));

    $imageStmt = $pdo->prepare("
      SELECT variation_id, link
      FROM images
      WHERE variation_id IN ($variationPlaceholders)
        AND link IS NOT NULL
        AND TRIM(link) <> ''
      ORDER BY image_id ASC
    ");
    $imageStmt->execute($variationIds);
    foreach ($imageStmt->fetchAll(PDO::FETCH_ASSOC) as $imageRow) {
      $variationId = (int)$imageRow['variation_id'];
      if (!isset($assetByVariation[$variationId])) {
        $assetByVariation[$variationId] = trim((string)$imageRow['link']);
      }
    }

    $priceStmt = $pdo->prepare("
      SELECT variation_id, MIN(price) AS starting_price
      FROM prices
      WHERE variation_id IN ($variationPlaceholders)
        AND price IS NOT NULL
        AND price > 0
      GROUP BY variation_id
    ");
    $priceStmt->execute($variationIds);
    foreach ($priceStmt->fetchAll(PDO::FETCH_ASSOC) as $priceRow) {
      $priceByVariation[(int)$priceRow['variation_id']] = (float)$priceRow['starting_price'];
    }

    $cardsByCombination = [];

    foreach ($variationsById as $leafId => $leaf) {
      if (isset($childrenCount[$leafId]) || empty($leaf['type_id'])) {
        continue;
      }

      $configuration = [];
      $pathIds = [];
      $cursorId = $leafId;
      $visited = [];

      while ($cursorId && isset($variationsById[$cursorId]) && !isset($visited[$cursorId])) {
        $visited[$cursorId] = true;
        $node = $variationsById[$cursorId];
        $pathIds[] = $cursorId;

        $filterKey = $this->superLanyardFilterKey($node['type_name'] ?? '');
        $optionName = trim((string)($node['name'] ?? ''));
        if ($filterKey !== null && $optionName !== '' && !isset($configuration[$filterKey])) {
          $configuration[$filterKey] = $optionName;
        }

        $cursorId = $node['parent_id'];
      }

      $isComplete = true;
      foreach (array_keys($filterLabels) as $requiredKey) {
        if (!isset($configuration[$requiredKey]) || $configuration[$requiredKey] === '') {
          $isComplete = false;
          break;
        }
      }
      if (!$isComplete) {
        continue;
      }

      $orderedConfiguration = [];
      foreach ($filterLabels as $key => $label) {
        $orderedConfiguration[$key] = $configuration[$key];
      }

      $image = '';
      $startingPrice = null;
      foreach ($pathIds as $pathId) {
        if ($image === '') {
          $image = $assetByVariation[$pathId]
            ?? trim((string)($variationsById[$pathId]['image'] ?? ''));
        }
        if ($startingPrice === null && isset($priceByVariation[$pathId])) {
          $startingPrice = $priceByVariation[$pathId];
        }
        if ($image !== '' && $startingPrice !== null) {
          break;
        }
      }

      $product = $productById[(int)$leaf['product_id']] ?? [];
      $combinationKeyParts = array_map(
        static function ($value) {
          return mb_strtolower(trim((string)$value), 'UTF-8');
        },
        array_values($orderedConfiguration)
      );
      $combinationKey = implode('|', $combinationKeyParts);
      $title = 'Super Lanyard — ' . implode(' — ', array_values($orderedConfiguration));

      $card = [
        'id' => $leafId,
        'product_sku' => (string)($product['SKU'] ?? $currentSku),
        'sku' => trim((string)($leaf['SKU'] ?? '')),
        'title' => $title,
        'image' => $image,
        'starting_price' => $startingPrice,
        'configuration' => $orderedConfiguration
      ];

      /* Prefer the richest record if historical data contains a duplicate. */
      $score = ($image !== '' ? 2 : 0) + ($startingPrice !== null ? 1 : 0);
      $existingScore = isset($cardsByCombination[$combinationKey])
        ? (($cardsByCombination[$combinationKey]['image'] !== '' ? 2 : 0)
          + ($cardsByCombination[$combinationKey]['starting_price'] !== null ? 1 : 0))
        : -1;

      if ($score > $existingScore) {
        $cardsByCombination[$combinationKey] = $card;
      }
    }

    $cards = array_values($cardsByCombination);
    usort($cards, static function ($left, $right) {
      return strnatcasecmp((string)$left['title'], (string)$right['title']);
    });

    $filterOptions = array_fill_keys(array_keys($filterLabels), []);
    foreach ($cards as $card) {
      foreach ($card['configuration'] as $key => $value) {
        $filterOptions[$key][$value] = true;
      }
    }
    foreach ($filterOptions as $key => $values) {
      $options = array_keys($values);
      usort($options, 'strnatcasecmp');
      $filterOptions[$key] = $options;
    }

    $emptyCatalog['filter_options'] = $filterOptions;
    $emptyCatalog['products'] = $cards;

    return $emptyCatalog;
  }

  /** Map database type labels to stable API keys used by the filters. */
  private function superLanyardFilterKey($typeName): ?string
  {
    $normalized = mb_strtolower(trim((string)$typeName), 'UTF-8');
    $normalized = preg_replace('/[^a-z0-9]+/u', '', $normalized);

    $aliases = [
      'theme' => 'theme',
      'material' => 'material',
      'width' => 'width',
      'printtechnique' => 'print_technique',
      'printmethod' => 'print_technique',
      'printedsides' => 'printed_sides',
      'printsides' => 'printed_sides',
      'colour' => 'colour',
      'color' => 'colour'
    ];

    return $aliases[$normalized] ?? null;
  }

  public function getByGroupForDashboard(): array
  {
    if (empty($this->group_id)) {
      return ['success' => false, 'error' => 'Group ID required'];
    }

    try {
      $pdo = $this->connection->getConnection();

      if (!$pdo instanceof PDO) {
        return ['success' => false, 'error' => 'Database connection unavailable'];
      }

      $stmt = $pdo->prepare("
        SELECT
          p.product_id,
          p.group_id,
          p.SKU AS sku,
          p.name,
          p.status,
          first_variation.SKU AS sku_variation
        FROM products p
        LEFT JOIN (
          SELECT v.product_id, v.SKU
          FROM variations v
          INNER JOIN (
            SELECT product_id, MIN(variation_id) AS variation_id
            FROM variations
            WHERE product_id IS NOT NULL
            GROUP BY product_id
          ) first_variation_id
            ON first_variation_id.product_id = v.product_id
           AND first_variation_id.variation_id = v.variation_id
        ) first_variation
          ON first_variation.product_id = p.product_id
        WHERE p.group_id = :group_id
        ORDER BY p.name ASC, p.product_id ASC
      ");
      $stmt->execute([':group_id' => $this->group_id]);

      $rows = array_map(static function ($row) {
        return [
          'product_id' => (int)$row['product_id'],
          'group_id' => (int)$row['group_id'],
          'sku' => $row['sku'],
          'sku_variation' => $row['sku_variation'],
          'name' => $row['name'],
          'status' => $row['status']
        ];
      }, $stmt->fetchAll(PDO::FETCH_ASSOC));

      return ['success' => true, 'data' => $rows];
    } catch (PDOException $e) {
      error_log('getByGroupForDashboard products error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  public function changeStatusForPending(): array
  {
      $sku = trim((string)($this->sku ?? ''));

      if ($sku === '' || mb_strlen($sku) > 50) {
          return [
              'success' => false,
              'error'   => 'SKU required/invalid'
          ];
      }

      try {
          $pdo = $this->connection->getConnection();

          $stmt = $pdo->prepare("
              UPDATE products
              SET status = :status
              WHERE SKU = :sku
              LIMIT 1
          ");

          $stmt->execute([
              ':status' => '2',
              ':sku'    => $sku
          ]);

          return [
              'success' => true,
              'updated' => $stmt->rowCount()
          ];

      } catch (PDOException $e) {
          error_log('changeStatusForPending error: ' . $e->getMessage());

          return [
              'success' => false,
              'error'   => 'DB error'
          ];
      }
  }
  /** Verifica si ya existe un producto con el mismo SKU para el mismo proveedor (case-insensitive) */

  private function existsBySkuForSupplier($sku, $supplierId) {
    try {
      $pdo = $this->connection->getConnection();
      $sql = "SELECT 1
                FROM products
               WHERE LOWER(sku) = LOWER(:sku)
                 AND supplier_id = :supplier_id
               LIMIT 1";
      $stmt = $pdo->prepare($sql);
      $stmt->execute([
        ':sku' => $sku,
        ':supplier_id' => $supplierId
      ]);
      return $stmt->fetchColumn() !== false;
    } catch (PDOException $e) {
      error_log('existsBySkuForSupplier error: ' . $e->getMessage());
      return false;
    }
  }

  public function approveProductWithSKU(): bool
  {
      try {
          $sku = trim((string)($this->sku ?? ''));

          if ($sku === '') {
              return false;
          }

          $pdo = $this->connection->getConnection();

          $sql = "
              UPDATE products
              SET
                  is_approved = 1,
                  status = '2'
              WHERE LOWER(TRIM(SKU)) = LOWER(:sku)
              LIMIT 1
          ";

          $stmt = $pdo->prepare($sql);

          $stmt->execute([
              ':sku' => $sku
          ]);

          if ($stmt->rowCount() > 0) {
              return true;
          }

          /*
           * rowCount() can return 0 when the product already
           * has is_approved = 1 and status = 2.
           * We therefore verify whether the SKU exists.
           */
          $checkSql = "
              SELECT product_id
              FROM products
              WHERE LOWER(TRIM(SKU)) = LOWER(:sku)
              LIMIT 1
          ";

          $checkStmt = $pdo->prepare($checkSql);

          $checkStmt->execute([
              ':sku' => $sku
          ]);

          return (bool)$checkStmt->fetchColumn();

      } catch (PDOException $e) {
          error_log('approveProductWithSKU error: ' . $e->getMessage());
          return false;
      }
  }


  public function getSupplierDetailsBySKU(): ?array
  {
      if (empty($this->sku)) {
          return null;
      }


      try {
          $pdo = $this->connection->getConnection();

          $sql = "SELECT
                  s.supplier_id AS supplier_id,
                  s.contact_name AS supplier_name
              FROM products p
              INNER JOIN suppliers s  ON s.supplier_id = p.supplier_id
              LEFT  JOIN variations v ON v.product_id  = p.product_id
              WHERE p.SKU = :sku OR v.SKU = :sku
              LIMIT 1
          ";

          $stmt = $pdo->prepare($sql);
          $stmt->execute([':sku' => $this->sku]);

          $row = $stmt->fetch(PDO::FETCH_ASSOC);
          return $row ?: null;

      } catch (PDOException $e) {
          error_log('getSupplierDetailsBySKU error: '.$e->getMessage());
          return null;
      }
  }



  /* ===========================
     CREATE: crea con sku + supplier_id
     =========================== */
     // 3) create() MINIMAL, resolviendo supplier_id por email y usando `SKU`
     public function create() {


       // Validaciones mínimas
       if ($this->sku === null || $this->sku === '') {
         return ['success' => false, 'error' => 'SKU required'];
       }
       if (mb_strlen($this->sku) > 50) {
         return ['success' => false, 'error' => 'SKU too long'];
       }

       try {
         $pdo = $this->connection->getConnection();

         // Resolver supplier_id por email si no vino seteado
         if (empty($this->supplier_id)) {
           if (!$this->email) {
             return ['success' => false, 'error' => 'Email required to resolve supplier'];
           }
           $q = $pdo->prepare("SELECT supplier_id
                               FROM suppliers
                               WHERE LOWER(email) = LOWER(:email)
                               LIMIT 1");
           $q->execute([':email' => $this->email]);
           $sid = $q->fetchColumn();
           if ($sid === false) {
             return ['success' => false, 'error' => 'Supplier not found for email'];
           }
           $this->supplier_id = (int)$sid;


         }

         // Verificar duplicado (asegúrate que existsBySkuForSupplier use la columna `SKU`)
         if ($this->existsBySkuForSupplier($this->sku, $this->supplier_id)) {
           return ['success' => false, 'error' => 'Product already exists for this supplier'];

         }





         // 1) Resolver group_id para: Unassigned Group (hijo de Unassigned Category)
         $qg = $pdo->prepare("
           SELECT g.group_id
           FROM `groups` g
           INNER JOIN `categories` c ON c.category_id = g.category_id
           WHERE g.name = :group_name
             AND c.name = :category_name
           LIMIT 1
         ");
         $qg->execute([
           ':group_name'    => 'Unassigned Group',
           ':category_name' => 'Unassigned Category'
         ]);

         $unassignedGroupId = $qg->fetchColumn();

         if ($unassignedGroupId === false) {
           return ['success' => false, 'error' => 'Unassigned Group / Unassigned Category not found'];
         }




         // 2) Inserción mínima: SKU + supplier_id + group_id
         $stmt = $pdo->prepare("
           INSERT INTO products (`SKU`, `supplier_id`, `group_id`)
           VALUES (:sku, :supplier_id, :group_id)
         ");

         $stmt->execute([
           ':sku'         => $this->sku,
           ':supplier_id' => $this->supplier_id,
           ':group_id'    => (int)$unassignedGroupId
         ]);



         $newId = (int)$pdo->lastInsertId();
         return [
           'success'      => true,
           'id'           => $newId,
           'sku'          => $this->sku,
         ];
       } catch (PDOException $e) {
         error_log('create product error: ' . $e->getMessage());
         return ['success' => false, 'error' => 'DB error'];
       }
     }


     public function getProductsBasicBySupplierEmail()
     {
         if (empty($this->email)) {
             return json_encode(['success' => false, 'error' => 'Email required'], JSON_UNESCAPED_UNICODE);
         }

         try {
             $pdo = $this->connection->getConnection();

             // 1) email -> supplier_id
             $sql1 = "SELECT supplier_id
                      FROM suppliers
                      WHERE LOWER(email) = LOWER(:email)
                      LIMIT 1";
             $stmt1 = $pdo->prepare($sql1);
             $stmt1->execute([':email' => $this->email]);
             $supplierId = $stmt1->fetchColumn();

             if (!$supplierId) {
                 return json_encode(['success' => false, 'error' => 'Supplier not found'], JSON_UNESCAPED_UNICODE);
             }

             // 2) supplier_id -> products (incluye group_id)
             $sql2 = "SELECT
                         p.product_id,
                         p.SKU         AS sku,
                         p.name        AS product_name,
                         p.status      AS status,
                         p.date_status AS status_date,
                         p.group_id,
                         CASE
                           WHEN UPPER(COALESCE(p.SKU, '')) LIKE 'SLY-%'
                            AND COALESCE(p.name, '') LIKE 'Super Lanyard — %'
                           THEN 1 ELSE 0
                         END AS is_super_lanyard_generated
                      FROM products p
                      WHERE p.supplier_id = :supplier_id
                      ORDER BY p.name ASC";
             $stmt2 = $pdo->prepare($sql2);
             $stmt2->execute([':supplier_id' => $supplierId]);
             $products = $stmt2->fetchAll(PDO::FETCH_ASSOC);

             if (!$products) {
                 return json_encode(['success' => true, 'data' => []], JSON_UNESCAPED_UNICODE);
             }

             // 3) product_id -> variation_sku (SKU de la primera variation insertada)
             $productIds = [];
             foreach ($products as $p) {
                 $productIds[(int)$p['product_id']] = true;
             }
             $productIds = array_keys($productIds);

             $firstVariationSkuByProductId = [];
             if (!empty($productIds)) {
                 $placeholders = implode(',', array_fill(0, count($productIds), '?'));

                 $sql3 = "SELECT v.product_id, v.SKU AS variation_sku
                          FROM variations v
                          INNER JOIN (
                             SELECT product_id, MIN(variation_id) AS min_variation_id
                             FROM variations
                             WHERE product_id IN ($placeholders)
                             GROUP BY product_id
                          ) t
                            ON t.product_id = v.product_id
                           AND t.min_variation_id = v.variation_id";
                 $stmt3 = $pdo->prepare($sql3);
                 $stmt3->execute($productIds);
                 $rows3 = $stmt3->fetchAll(PDO::FETCH_ASSOC);

                 foreach ($rows3 as $r) {
                     $firstVariationSkuByProductId[(int)$r['product_id']] = $r['variation_sku'] ?? null;
                 }
             }

             // 4) Valores exactos de filtro de cada producto generado de Super Lanyard.
             // Se consultan por producto para que los filtros nunca mezclen opciones
             // pertenecientes a productos normales del catálogo.
             $superLanyardOptionsByProductId = [];
             $superLanyardLeafSkuByProductId = [];
             $superLanyardProductIds = [];
             foreach ($products as $p) {
                 if ((int)($p['is_super_lanyard_generated'] ?? 0) === 1) {
                     $superLanyardProductIds[] = (int)$p['product_id'];
                 }
             }

             if ($superLanyardProductIds) {
                 $placeholders = implode(',', array_fill(0, count($superLanyardProductIds), '?'));
                 $sqlOptions = "SELECT
                                  v.product_id,
                                  v.SKU AS variation_sku,
                                  tv.type_name,
                                  v.name AS option_name
                                FROM variations v
                                INNER JOIN type_variations tv ON tv.type_id = v.type_id
                                WHERE v.product_id IN ($placeholders)
                                  AND v.type_id IS NOT NULL
                                  AND TRIM(COALESCE(v.name, '')) <> ''";
                 $stmtOptions = $pdo->prepare($sqlOptions);
                 $stmtOptions->execute($superLanyardProductIds);

                 $axisNames = [
                     'theme' => 'theme',
                     'material' => 'material',
                     'width' => 'width',
                     'printtechnique' => 'print_technique',
                     'printedsides' => 'printed_sides',
                     'colour' => 'colour',
                     'color' => 'colour',
                 ];

                 foreach ($stmtOptions->fetchAll(PDO::FETCH_ASSOC) as $optionRow) {
                     $normalisedType = strtolower(trim((string)$optionRow['type_name']));
                     $normalisedType = preg_replace('/[^a-z0-9]+/', '', $normalisedType);
                     $axisKey = $axisNames[$normalisedType] ?? null;
                     if ($axisKey === null) {
                         continue;
                     }

                     $pid = (int)$optionRow['product_id'];
                     if (!isset($superLanyardOptionsByProductId[$pid])) {
                         $superLanyardOptionsByProductId[$pid] = [];
                     }
                     $superLanyardOptionsByProductId[$pid][$axisKey] = $optionRow['option_name'];
                     if ($axisKey === 'colour') {
                         $superLanyardLeafSkuByProductId[$pid] = $optionRow['variation_sku'];
                     }
                 }
             }

             // 5) group_id -> groups (group_name, category_id)
             $groupIds = [];
             foreach ($products as $p) {
                 if (!empty($p['group_id'])) {
                     $groupIds[(int)$p['group_id']] = true;
                 }
             }
             $groupIds = array_keys($groupIds);

             $groupsById = [];
             $categoryIds = [];

             if (!empty($groupIds)) {
                 $placeholders = implode(',', array_fill(0, count($groupIds), '?'));

                 $sql4 = "SELECT
                             g.group_id,
                             g.name AS group_name,
                             g.category_id
                          FROM `groups` g
                          WHERE g.group_id IN ($placeholders)";
                 $stmt4 = $pdo->prepare($sql4);
                 $stmt4->execute($groupIds);
                 $groups = $stmt4->fetchAll(PDO::FETCH_ASSOC);

                 foreach ($groups as $g) {
                     $gid = (int)$g['group_id'];
                     $groupsById[$gid] = $g;

                     if (!empty($g['category_id'])) {
                         $categoryIds[(int)$g['category_id']] = true;
                     }
                 }
                 $categoryIds = array_keys($categoryIds);
             }

             // 6) category_id -> categories (category_name)
             $categoriesById = [];
             if (!empty($categoryIds)) {
                 $placeholders = implode(',', array_fill(0, count($categoryIds), '?'));

                 $sql5 = "SELECT
                             c.category_id,
                             c.name AS category_name
                          FROM categories c
                          WHERE c.category_id IN ($placeholders)";
                 $stmt5 = $pdo->prepare($sql5);
                 $stmt5->execute($categoryIds);
                 $cats = $stmt5->fetchAll(PDO::FETCH_ASSOC);

                 foreach ($cats as $c) {
                     $categoriesById[(int)$c['category_id']] = $c;
                 }
             }

             // Armar respuesta final por producto
             $result = [];
             foreach ($products as $p) {
                 $pid = (int)$p['product_id'];
                 $gid = !empty($p['group_id']) ? (int)$p['group_id'] : null;

                 $groupName = null;
                 $categoryId = null;
                 $categoryName = null;

                 if ($gid !== null && isset($groupsById[$gid])) {
                     $groupName = $groupsById[$gid]['group_name'] ?? null;

                     if (!empty($groupsById[$gid]['category_id'])) {
                         $categoryId = (int)$groupsById[$gid]['category_id'];

                         if (isset($categoriesById[$categoryId])) {
                             $categoryName = $categoriesById[$categoryId]['category_name'] ?? null;
                         }
                     }
                 }

                 $result[] = [
                     'product_id'           => $pid,
                     'sku'                  => $p['sku'] ?? null,
                     'product_name'         => $p['product_name'] ?? null,
                     'status'               => $p['status'] ?? null,
                     'status_date'          => $p['status_date'] ?? null,
                     'is_super_lanyard_generated' => (int)($p['is_super_lanyard_generated'] ?? 0),
                     'super_lanyard_options' => $superLanyardOptionsByProductId[$pid] ?? [],
                     'super_lanyard_variation_sku' => $superLanyardLeafSkuByProductId[$pid] ?? null,

                     'first_variation_sku'  => $firstVariationSkuByProductId[$pid] ?? null,

                     'group_id'             => $gid,
                     'group_name'           => $groupName,

                     'category_id'          => $categoryId,
                     'category_name'        => $categoryName,
                 ];
             }

             return json_encode(['success' => true, 'data' => $result], JSON_UNESCAPED_UNICODE);

         } catch (PDOException $e) {
             error_log('getProductsBasicBySupplierEmail error: ' . $e->getMessage());
             return json_encode(['success' => false, 'error' => 'DB error'], JSON_UNESCAPED_UNICODE);
         }
     }

  /* ===========================
     UPDATE (lote): name, description, status, category_id
     Solo actualiza los campos provistos (no null)
     =========================== */
     public function update(): array
     {


       // Validaciones básicas
       $sku = trim((string)($this->sku ?? ''));
       if ($sku === '' || mb_strlen($sku) > 50) {
         return ['success' => false, 'error' => 'SKU required/invalid'];
       }

       try {
         $pdo = $this->connection->getConnection();
         $sql = "UPDATE products
                   SET name        = COALESCE(:name, name),
                       description = COALESCE(:description, description),
                       descriptive_tagline = COALESCE(:descriptive_tagline, descriptive_tagline),
                       status      = COALESCE(:status, status)
                 WHERE SKU = :sku
                 LIMIT 1";
         // Si tu colación fuese case-sensitive, usa:
         // WHERE SKU COLLATE utf8mb4_general_ci = :sku
         //echo json_encode($this->pd_tagline."ssss");exit;

         $stmt = $pdo->prepare($sql);
         $stmt->execute([
           ':name'        => $this->name,
           ':description' => $this->description,
           ':descriptive_tagline' => $this->pd_tagline,
           ':status'      => $this->status,
           ':sku'         => $sku,
         ]);

         return ['success'=>true,'updated'=>$stmt->rowCount()];
       } catch (PDOException $e) {
         error_log('update product by SKU error: '.$e->getMessage());
         return ['success'=>false,'error'=>'DB error'];
       }
     }



  /* ===========================
     UPDATEs individuales
     =========================== */

  public function updateName($id, $name) {
    $name = $this->normalizeText($name);
    if ($name === '') return ['success' => false, 'error' => 'Name required'];
    if (mb_strlen($name) > 150) return ['success' => false, 'error' => 'Name too long'];

    try {
      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("UPDATE products SET name = :name WHERE product_id = :id LIMIT 1");
      $stmt->execute([':name' => $name, ':id' => (int)$id]);
      return ['success' => true, 'updated' => $stmt->rowCount()];
    } catch (PDOException $e) {
      error_log('updateName error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  public function getProducts(): array
  {
      try {
          $pdo = $this->connection->getConnection();

          $sql = "
              SELECT
                  p.product_id,
                  p.SKU,
                  p.name,
                  p.is_approved,
                  CASE
                      WHEN UPPER(COALESCE(p.SKU, '')) LIKE 'SLY-%'
                       AND COALESCE(p.name, '') LIKE 'Super Lanyard — %'
                      THEN 1 ELSE 0
                  END AS is_super_lanyard_generated,
                  g.name AS group_name,
                  c.name AS category_name,
                  i.link AS image_link
              FROM products p
              LEFT JOIN `groups` g
                  ON p.group_id = g.group_id
              LEFT JOIN categories c
                  ON g.category_id = c.category_id
              LEFT JOIN variations v
                  ON p.product_id = v.product_id
              LEFT JOIN images i
                  ON v.variation_id = i.variation_id
              ORDER BY p.product_id DESC
          ";

          $stmt = $pdo->prepare($sql);
          $stmt->execute();

          $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

          $products = [];

          foreach ($rows as $row) {
              $productId = $row['product_id'];

              if (!isset($products[$productId])) {
                  $products[$productId] = [
                      'product_id'    => $row['product_id'],
                      'SKU'           => $row['SKU'],
                      'name'          => $row['name'],
                      'is_approved'   => $row['is_approved'],
                      'is_super_lanyard_generated' => (int)$row['is_super_lanyard_generated'],
                      'group_name'    => $row['group_name'],
                      'category_name' => $row['category_name'],
                      'images'        => []
                  ];
              }

              if (!empty($row['image_link']) && !in_array($row['image_link'], $products[$productId]['images'])) {
                  $products[$productId]['images'][] = $row['image_link'];
              }
          }

          return [
              'success' => true,
              'result'  => array_values($products)
          ];

      } catch (PDOException $e) {
          error_log('getProducts error: ' . $e->getMessage());
          return [
              'success' => false,
              'error'   => 'DB error'
          ];
      }
  }

  public function searchProducts(string $search): array
  {
      $search = trim($search);

      if ($search === '') {
          return $this->getProducts();
      }

      try {
          $pdo = $this->connection->getConnection();
          $term = '%' . $search . '%';

          $sql = "
              SELECT
                  p.product_id,
                  p.SKU,
                  p.name,
                  p.is_approved,
                  CASE
                      WHEN UPPER(COALESCE(p.SKU, '')) LIKE 'SLY-%'
                       AND COALESCE(p.name, '') LIKE 'Super Lanyard — %'
                      THEN 1 ELSE 0
                  END AS is_super_lanyard_generated,
                  g.name AS group_name,
                  c.name AS category_name,
                  image.link AS image_link
              FROM products p
              LEFT JOIN `groups` g
                  ON p.group_id = g.group_id
              LEFT JOIN categories c
                  ON g.category_id = c.category_id
              LEFT JOIN variations image_variation
                  ON p.product_id = image_variation.product_id
              LEFT JOIN images image
                  ON image_variation.variation_id = image.variation_id
              WHERE COALESCE(p.name, '') LIKE :product_name
                 OR COALESCE(p.SKU, '') LIKE :product_sku
                 OR COALESCE(c.name, '') LIKE :category_name
                 OR COALESCE(g.name, '') LIKE :group_name
                 OR COALESCE(p.description, '') LIKE :product_description
                 OR COALESCE(p.descriptive_tagline, '') LIKE :descriptive_tagline
                 OR EXISTS (
                      SELECT 1
                      FROM variations item_variation
                      INNER JOIN items item
                          ON item.variation_id = item_variation.variation_id
                      WHERE item_variation.product_id = p.product_id
                        AND COALESCE(item.name, '') LIKE :item_name
                 )
              ORDER BY p.product_id DESC
          ";

          $stmt = $pdo->prepare($sql);
          $stmt->execute([
              ':product_name' => $term,
              ':product_sku' => $term,
              ':category_name' => $term,
              ':group_name' => $term,
              ':product_description' => $term,
              ':descriptive_tagline' => $term,
              ':item_name' => $term
          ]);

          $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
          $products = [];

          foreach ($rows as $row) {
              $productId = $row['product_id'];

              if (!isset($products[$productId])) {
                  $products[$productId] = [
                      'product_id'    => $row['product_id'],
                      'SKU'           => $row['SKU'],
                      'name'          => $row['name'],
                      'is_approved'   => $row['is_approved'],
                      'is_super_lanyard_generated' => (int)$row['is_super_lanyard_generated'],
                      'group_name'    => $row['group_name'],
                      'category_name' => $row['category_name'],
                      'images'        => []
                  ];
              }

              if (!empty($row['image_link']) && !in_array($row['image_link'], $products[$productId]['images'])) {
                  $products[$productId]['images'][] = $row['image_link'];
              }
          }

          return [
              'success' => true,
              'result'  => array_values($products)
          ];

      } catch (PDOException $e) {
          error_log('searchProducts error: ' . $e->getMessage());
          return [
              'success' => false,
              'error'   => 'DB error'
          ];
      }
  }

  public function updateDescription($id, $description) {
    $description = is_string($description) ? trim($description) : null;
    try {
      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("UPDATE products SET description = :description WHERE product_id = :id LIMIT 1");
      $stmt->execute([':description' => $description, ':id' => (int)$id]);
      return ['success' => true, 'updated' => $stmt->rowCount()];
    } catch (PDOException $e) {
      error_log('updateDescription error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  public function updateStatus($id, $status) {
    $status = $this->normalizeText($status);
    if ($status !== '' && mb_strlen($status) > 50) {
      return ['success' => false, 'error' => 'Status too long'];
    }
    try {
      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("UPDATE products SET status = :status WHERE product_id = :id LIMIT 1");
      $stmt->execute([':status' => $status, ':id' => (int)$id]);
      return ['success' => true, 'updated' => $stmt->rowCount()];
    } catch (PDOException $e) {
      error_log('updateStatus error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  public function updateCategoryIdBySKU() {

    $sku = trim((string)$this->sku);
    $categoryId = (int)($this->category_id ?? 0);

    // Validaciones mínimas
    if ($sku === '' || mb_strlen($sku) > 50) {
      return ['success' => false, 'error' => 'Invalid SKU'];
    }
    if ($categoryId <= 0) {
      return ['success' => false, 'error' => 'Invalid category_id'];
    }

    try {
      $pdo = $this->connection->getConnection();

      /* 1) Encontrar product_id por SKU */
      $stmt1 = $pdo->prepare("
        SELECT product_id
        FROM products
        WHERE SKU = :sku
        LIMIT 1
      ");
      $stmt1->execute([':sku' => $sku]);
      $productId = $stmt1->fetchColumn();

      if ($productId === false) {
        return ['success' => false, 'error' => 'Product not found for SKU'];
      }

      /* 2) Buscar group_id donde name = 'Unassigned Group' y category_id = el id recibido */
      $stmt2 = $pdo->prepare("
        SELECT group_id
        FROM `groups`
        WHERE name = :gname
          AND category_id = :category_id
        LIMIT 1
      ");
      $stmt2->execute([
        ':gname' => 'Unassigned Group',
        ':category_id' => $categoryId
      ]);
      $groupId = $stmt2->fetchColumn();

      if ($groupId === false) {
        return ['success' => false, 'error' => 'Unassigned Group not found for this category'];
      }

      /* 3) Asignar group_id como FK en products */
      $stmt3 = $pdo->prepare("
        UPDATE products
        SET group_id = :group_id
        WHERE product_id = :product_id
        LIMIT 1
      ");
      $stmt3->execute([
        ':group_id' => (int)$groupId,
        ':product_id' => (int)$productId
      ]);

      return [
        'success' => true
      ];

    } catch (PDOException $e) {
      error_log('updateCategoryIdBySKU error (SKU ' . $sku . '): ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  public function updateGroupIdBySKU() {

    $sku = trim((string)$this->sku);
    $groupId = (int)($this->group_id ?? 0);

    if ($sku === '') {
      return ['success' => false, 'error' => 'SKU required'];
    }
    if ($groupId <= 0) {
      return ['success' => false, 'error' => 'Group ID required'];
    }

    try {
      $pdo = $this->connection->getConnection();

      $stmt = $pdo->prepare("
        UPDATE products
        SET group_id = :group_id
        WHERE sku = :sku
        LIMIT 1
      ");
      $stmt->execute([
        ':group_id' => $groupId,
        ':sku'      => $sku,
      ]);

      // Si cambió algo
      if ($stmt->rowCount() > 0) {
        return ['success' => true, 'updated' => 1];
      }

      // rowCount() = 0 => puede ser SKU inexistente o mismo valor
      $check = $pdo->prepare("SELECT group_id FROM products WHERE sku = :sku LIMIT 1");
      $check->execute([':sku' => $sku]);
      $row = $check->fetch(PDO::FETCH_ASSOC);

      // SKU no existe
      if (!$row) {
        return ['success' => false, 'error' => 'Product not found for SKU'];
      }

      // SKU existe y ya tenía ese mismo group_id (o no hubo cambio real)
      return ['success' => true, 'updated' => 0];

    } catch (PDOException $e) {
      error_log('updateGroupIdBySKU error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }


  public function getProductBasicBySKU(): string {
    if (empty($this->sku)) {
      return json_encode(['success' => false, 'error' => 'SKU required'], JSON_UNESCAPED_UNICODE);
    }

    try {
      $pdo = $this->connection->getConnection();

      $sql = "SELECT p.name, p.description, p.status, p.descriptive_tagline,
                     p.date_status, p.is_approved
              FROM products p
              WHERE p.SKU = :sku
              LIMIT 1";

      $stmt = $pdo->prepare($sql);
      $stmt->execute([':sku' => trim($this->sku)]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);

      if (!$row) {
        return json_encode(['success' => false, 'error' => 'SKU not found'], JSON_UNESCAPED_UNICODE);
      }

      return json_encode(['success' => true, 'data' => $row], JSON_UNESCAPED_UNICODE);

    } catch (PDOException $e) {
      error_log('getProductBasicBySKU error: ' . $e->getMessage());
      return json_encode(['success' => false, 'error' => 'DB error'], JSON_UNESCAPED_UNICODE);
    }
  }

  public function getProductDetailsBySKU(): ?array
  {
      // Validar SKU
      $sku = trim((string)($this->sku ?? ''));

      if ($sku === '' || mb_strlen($sku) > 50) {
          return null;
      }

      try {
          $pdo = $this->connection->getConnection();

          $sql = "
              SELECT
                  p.SKU AS sku,
                  p.name AS product_name,
                  p.description,
                  p.descriptive_tagline,
                  p.status,
                  p.is_approved
              FROM products p
              WHERE p.SKU = :sku
              LIMIT 1
          ";

          $stmt = $pdo->prepare($sql);
          $stmt->execute([':sku' => $sku]);

          $row = $stmt->fetch(PDO::FETCH_ASSOC);

          if (!$row) {
              return null;
          }

          return [
              'product_details' => $row
          ];
      } catch (PDOException $e) {
          error_log(
              'getProductDetailsBySKU error (SKU '.$sku.'): '.$e->getMessage()
          );

          return null;
      }
  }
  public function getPendingProducts() {

    try {
      $pdo = $this->connection->getConnection();

      $stmt = $pdo->prepare("
        SELECT
          p.SKU AS product_sku,
          p.name,
          p.date_status,
          p.is_approved,
          p.status,
          p.supplier_id,

          s.contact_name,
          s.company_name,

          vfirst.variation_sku AS sku_variations

        FROM products p
        LEFT JOIN suppliers s
          ON s.supplier_id = p.supplier_id

        LEFT JOIN (
          SELECT v1.product_id, v1.SKU AS variation_sku
          FROM variations v1
          INNER JOIN (
            SELECT product_id, MIN(variation_id) AS first_variation_id
            FROM variations
            WHERE product_id IS NOT NULL
              AND parent_id IS NULL
            GROUP BY product_id
          ) fv
            ON fv.first_variation_id = v1.variation_id
        ) vfirst
          ON vfirst.product_id = p.product_id

        WHERE p.status = '2'
        ORDER BY p.date_status DESC, p.product_id DESC
      ");

      $stmt->execute();
      $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

      $items = [];

      foreach ($rows as $r) {
        $items[] = [
          'SKU'            => (string)($r['product_sku'] ?? ''),
          'sku_variations' => (string)($r['sku_variations'] ?? ''),
          'name'           => (string)($r['name'] ?? ''),
          'date_status'    => $r['date_status'],
          'is_approved'    => (int)($r['is_approved'] ?? 0),
          'status'         => (string)($r['status'] ?? ''),
          'supplier_id'    => (int)($r['supplier_id'] ?? 0),
          'supplier'       => [
            'contact_name' => (string)($r['contact_name'] ?? ''),
            'company_name' => (string)($r['company_name'] ?? ''),
          ],
        ];
      }

      return [
        'success' => true,
        'result'  => $items
      ];

    } catch (PDOException $e) {
      error_log('getPendingProducts error: ' . $e->getMessage());

      return [
        'success' => false,
        'error'   => 'DB error'
      ];
    }
  }








  /* ===========================
     Delete (opcional)
     =========================== */
/*  public function delete() {
    if (empty($this->product_id)) {
      return ['success' => false, 'error' => 'ID required'];
    }
    try {
      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("DELETE FROM products WHERE product_id = :id LIMIT 1");
      $stmt->execute([':id' => $this->product_id]);
      return ['success' => true, 'deleted' => $stmt->rowCount()];
    } catch (PDOException $e) {
      error_log('delete product error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }*/

  /**
   * Obtiene datos del producto y proveedor para enviar por email
   * Usa el SKU actual del objeto (propiedad sku)
   * @return array Datos para email
   */
   public function getDataForSendEmail() {
       try {
           // 1. Check that SKU exists
           if (empty($this->sku)) {
               return [
                   'success' => false,
                   'error' => 'SKU not set'
               ];
           }

           // 2. Get database connection
           $pdo = $this->connection->getConnection();

           // 3. Get product and supplier data
           $stmt = $pdo->prepare("
               SELECT
                   p.name AS product_name,
                   p.SKU AS product_sku,
                   COALESCE(s.company_name, s.contact_name, '') AS supplier_name,
                   s.email AS supplier_email
               FROM products p
               LEFT JOIN suppliers s
                   ON p.supplier_id = s.supplier_id
               WHERE p.SKU = :sku
               LIMIT 1
           ");

           // 4. Execute query
           $stmt->execute([
               ':sku' => $this->sku
           ]);

           $result = $stmt->fetch(PDO::FETCH_ASSOC);

           // 5. Check if product exists
           if (!$result) {
               return [
                   'success' => false,
                   'error' => 'Product not found'
               ];
           }

           // 6. Return formatted data
           return [
               'success' => true,
               'data' => [
                   'product_name'   => $result['product_name'] ?? '',
                   'product_sku'    => $result['product_sku'] ?? '',
                   'supplier_name'  => $result['supplier_name'] ?? '',
                   'supplier_email' => $result['supplier_email'] ?? ''
               ]
           ];

       } catch (PDOException $e) {
           error_log('Products::getDataForSendEmail error: ' . $e->getMessage());

           return [
               'success' => false,
               'error' => 'Database error'
           ];
       }
   }










   /* ===========================
      DELETE PRODUCT
      =========================== */

   /**
    * Delete a product and all its dependent records.
    *
    * The product is identified using the SKU
    * stored in the current Products object.
    *
    * @return array
    */
   public function deleteProduct(): array
   {
       $sku = trim((string)($this->sku ?? ''));

       /*
        * Validate that the SKU exists.
        */
       if ($sku === '') {
           return [
               'success' => false,
               'error'   => 'SKU required'
           ];
       }

       $pdo = null;

       try {
           /*
            * Get the database connection.
            */
           $pdo = $this->connection->getConnection();

           /*
            * Start the transaction.
            */
           $pdo->beginTransaction();

           /*
            * Get the product ID using the SKU.
            */
           $productId = $this->getProductIdBySku(
               $pdo,
               $sku
           );

           /*
            * Stop if the product does not exist.
            */
           if ($productId === null) {
               $pdo->rollBack();

               return [
                   'success' => false,
                   'error'   => 'Product not found'
               ];
           }

           /*
            * Get all variations connected to the product.
            */
           $variationIds = $this->getVariationIdsByProductId(
               $pdo,
               $productId
           );

           /*
            * Delete the records connected to the variations.
            */
           if (!empty($variationIds)) {
               $this->deleteVariationPromotions(
                   $pdo,
                   $variationIds
               );

               $this->deletePrices(
                   $pdo,
                   $variationIds
               );

               $this->deleteImages(
                   $pdo,
                   $variationIds
               );

               $this->deleteItems(
                   $pdo,
                   $variationIds
               );

               $this->deleteJobDetails(
                   $pdo,
                   $variationIds
               );

               /*
                * Remove variation parent relationships
                * before deleting the variations.
                */
               $this->removeVariationParentRelationships(
                   $pdo,
                   $productId
               );

               /*
                * Delete all product variations.
                */
               $this->deleteVariations(
                   $pdo,
                   $productId
               );
           }

           /*
            * Delete the main product record.
            */
           $deletedProducts = $this->deleteProductRecord(
               $pdo,
               $productId
           );

           /*
            * Confirm that the product was deleted.
            */
           if ($deletedProducts === 0) {
               $pdo->rollBack();

               return [
                   'success' => false,
                   'error'   => 'The product could not be deleted'
               ];
           }

           /*
            * Confirm all deletions.
            */
           $pdo->commit();

           return [
               'success'            => true,
               'message'            => 'Product deleted successfully',
               'product_id'         => $productId,
               'sku'                => $sku,
               'deleted_variations' => count($variationIds)
           ];

       } catch (PDOException $e) {
           /*
            * Cancel all queries if a database error occurs.
            */
           if (
               $pdo instanceof PDO &&
               $pdo->inTransaction()
           ) {
               $pdo->rollBack();
           }

           error_log(
               'deleteProduct database error for SKU ' .
               $sku .
               ': ' .
               $e->getMessage()
           );

           return [
               'success' => false,
               'error'   => 'DB error'
           ];

       } catch (Throwable $e) {
           /*
            * Cancel all queries if another error occurs.
            */
           if (
               $pdo instanceof PDO &&
               $pdo->inTransaction()
           ) {
               $pdo->rollBack();
           }

           error_log(
               'deleteProduct unexpected error for SKU ' .
               $sku .
               ': ' .
               $e->getMessage()
           );

           return [
               'success' => false,
               'error'   => 'Unexpected error'
           ];
       }
   }

   /**
    * Get the product ID using its SKU.
    *
    * @param PDO    $pdo
    * @param string $sku
    *
    * @return int|null
    */
   private function getProductIdBySku(
       PDO $pdo,
       string $sku
   ): ?int {
       $statement = $pdo->prepare("
           SELECT product_id
           FROM products
           WHERE SKU = :sku
           LIMIT 1
       ");

       $statement->execute([
           ':sku' => $sku
       ]);

       $productId = $statement->fetchColumn();

       if ($productId === false) {
           return null;
       }

       return (int)$productId;
   }

   /**
    * Get all variation IDs connected to a product.
    *
    * @param PDO $pdo
    * @param int $productId
    *
    * @return array
    */
   private function getVariationIdsByProductId(
       PDO $pdo,
       int $productId
   ): array {
       $statement = $pdo->prepare("
           SELECT variation_id
           FROM variations
           WHERE product_id = :product_id
       ");

       $statement->execute([
           ':product_id' => $productId
       ]);

       $variationIds = $statement->fetchAll(
           PDO::FETCH_COLUMN
       );

       return array_map(
           'intval',
           $variationIds
       );
   }

   /**
    * Delete relationships between variations and promotions.
    *
    * @param PDO   $pdo
    * @param array $variationIds
    *
    * @return int
    */
   private function deleteVariationPromotions(
       PDO $pdo,
       array $variationIds
   ): int {
       if (empty($variationIds)) {
           return 0;
       }

       $placeholders = $this->createSqlPlaceholders(
           count($variationIds)
       );

       $statement = $pdo->prepare("
           DELETE FROM variation_promotions
           WHERE variation_id IN ($placeholders)
       ");

       $statement->execute($variationIds);

       return $statement->rowCount();
   }

   /**
    * Delete prices connected to the variations.
    *
    * @param PDO   $pdo
    * @param array $variationIds
    *
    * @return int
    */
   private function deletePrices(
       PDO $pdo,
       array $variationIds
   ): int {
       if (empty($variationIds)) {
           return 0;
       }

       $placeholders = $this->createSqlPlaceholders(
           count($variationIds)
       );

       $statement = $pdo->prepare("
           DELETE FROM prices
           WHERE variation_id IN ($placeholders)
       ");

       $statement->execute($variationIds);

       return $statement->rowCount();
   }

   /**
    * Delete images connected to the variations.
    *
    * This deletes only the database records.
    * It does not delete image files from the server.
    *
    * @param PDO   $pdo
    * @param array $variationIds
    *
    * @return int
    */
   private function deleteImages(
       PDO $pdo,
       array $variationIds
   ): int {
       if (empty($variationIds)) {
           return 0;
       }

       $placeholders = $this->createSqlPlaceholders(
           count($variationIds)
       );

       $statement = $pdo->prepare("
           DELETE FROM images
           WHERE variation_id IN ($placeholders)
       ");

       $statement->execute($variationIds);

       return $statement->rowCount();
   }

   /**
    * Delete items connected to the variations.
    *
    * @param PDO   $pdo
    * @param array $variationIds
    *
    * @return int
    */
   private function deleteItems(
       PDO $pdo,
       array $variationIds
   ): int {
       if (empty($variationIds)) {
           return 0;
       }

       $placeholders = $this->createSqlPlaceholders(
           count($variationIds)
       );

       $statement = $pdo->prepare("
           DELETE FROM items
           WHERE variation_id IN ($placeholders)
       ");

       $statement->execute($variationIds);

       return $statement->rowCount();
   }

   /**
    * Delete job details connected to the variations.
    *
    * @param PDO   $pdo
    * @param array $variationIds
    *
    * @return int
    */
   private function deleteJobDetails(
       PDO $pdo,
       array $variationIds
   ): int {
       if (empty($variationIds)) {
           return 0;
       }

       $placeholders = $this->createSqlPlaceholders(
           count($variationIds)
       );

       $statement = $pdo->prepare("
           DELETE FROM job_details
           WHERE variation_id IN ($placeholders)
       ");

       $statement->execute($variationIds);

       return $statement->rowCount();
   }

   /**
    * Remove parent-child relationships between variations.
    *
    * @param PDO $pdo
    * @param int $productId
    *
    * @return int
    */
   private function removeVariationParentRelationships(
       PDO $pdo,
       int $productId
   ): int {
       $statement = $pdo->prepare("
           UPDATE variations
           SET parent_id = NULL
           WHERE product_id = :product_id
       ");

       $statement->execute([
           ':product_id' => $productId
       ]);

       return $statement->rowCount();
   }

   /**
    * Delete all variations connected to the product.
    *
    * @param PDO $pdo
    * @param int $productId
    *
    * @return int
    */
   private function deleteVariations(
       PDO $pdo,
       int $productId
   ): int {
       $statement = $pdo->prepare("
           DELETE FROM variations
           WHERE product_id = :product_id
       ");

       $statement->execute([
           ':product_id' => $productId
       ]);

       return $statement->rowCount();
   }

   /**
    * Delete the main product record.
    *
    * @param PDO $pdo
    * @param int $productId
    *
    * @return int
    */
   private function deleteProductRecord(
       PDO $pdo,
       int $productId
   ): int {
       $statement = $pdo->prepare("
           DELETE FROM products
           WHERE product_id = :product_id
           LIMIT 1
       ");

       $statement->execute([
           ':product_id' => $productId
       ]);

       return $statement->rowCount();
   }

   /**
    * Create placeholders for an SQL IN clause.
    *
    * Example:
    *
    * createSqlPlaceholders(3)
    *
    * Returns:
    *
    * ?,?,?
    *
    * @param int $quantity
    *
    * @return string
    */
   private function createSqlPlaceholders(
       int $quantity
   ): string {
       return implode(
           ',',
           array_fill(0, $quantity, '?')
       );
   }
}
?>
