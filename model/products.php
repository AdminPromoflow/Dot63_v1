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

      /* 1) Consultar el group_id del producto según el SKU */
      $stmtGroup = $pdo->prepare("
        SELECT group_id
        FROM products
        WHERE SKU = :sku
        LIMIT 1
      ");

      $stmtGroup->execute([
        ':sku' => $sku
      ]);

      $groupId = $stmtGroup->fetchColumn();

      if ($groupId === false || empty($groupId)) {
        return [
          'success' => false,
          'error'   => 'Group ID not found for this SKU'
        ];
      }

      /* 2) Consultar todos los productos de ese group_id */
      $stmt = $pdo->prepare("
        SELECT
          p.SKU,
          p.name
        FROM products p
        WHERE p.group_id = :group_id
        ORDER BY p.product_id DESC
      ");

      $stmt->execute([
        ':group_id' => (int)$groupId
      ]);

      $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

      return [
        'success' => true,
        'group_id' => (int)$groupId,
        'result'  => $rows
      ];

    } catch (PDOException $e) {
      error_log('getProductsByGroupId error: ' . $e->getMessage());

      return [
        'success' => false,
        'error'   => 'DB error'
      ];
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
                         p.group_id
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

             // 4) group_id -> groups (group_name, category_id)
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

             // 5) category_id -> categories (category_name)
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
