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


  public function __construct($connection) {
    $this->connection = $connection;
  }

  /* ===========================
     Setters
     =========================== */
  public function setGroupId($id) { $this->group_id = (int)$id; }
  public function setId($id)            { $this->product_id  = (int)$id; }
  public function setSku($sku)          { $this->sku         = $this->normalizeText($sku); }
  public function setName($name)        { $this->name        = $this->normalizeText($name); }
  public function setDescription($desc)  { $this->description = is_string($desc) ? trim($desc) : null; }
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
           'supplier_id'  => $this->supplier_id
         ];
       } catch (PDOException $e) {
         error_log('create product error: ' . $e->getMessage());
         return ['success' => false, 'error' => 'DB error'];
       }
     }


     public function getProductsBasicBySupplierEmail() {
       if (empty($this->email)) {
         return json_encode(['success'=>false,'error'=>'Email required'], JSON_UNESCAPED_UNICODE);
       }

       try {
         $pdo = $this->connection->getConnection();

         $sql = "SELECT
                   p.`SKU`  AS sku,
                   p.`name` AS product_name,
                   COALESCE(c.`name`, '') AS category_name,
                   p.`status` AS status,
                   vdef.`SKU` AS default_variation_sku
                 FROM products p
                 INNER JOIN suppliers s
                   ON s.supplier_id = p.supplier_id
                 LEFT JOIN categories c
                   ON c.category_id = p.category_id
                 LEFT JOIN variations vdef
                   ON vdef.product_id = p.product_id
                  AND LOWER(vdef.`name`) = 'default'
                  AND (vdef.parent_id IS NULL OR vdef.parent_id = 0)
                 WHERE LOWER(s.email) = LOWER(:email)
                 ORDER BY p.`name` ASC";

         $stmt = $pdo->prepare($sql);
         $stmt->execute([':email' => $this->email]);
         $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

         return json_encode(['success'=>true,'data'=>$rows], JSON_UNESCAPED_UNICODE);

       } catch (PDOException $e) {
         error_log('getProductsBasicBySupplierEmail error: '.$e->getMessage());
         return json_encode(['success'=>false,'error'=>'DB error'], JSON_UNESCAPED_UNICODE);
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

  //  echo json_encode($sku);exit;


    // Validaciones mínimas
    if ($sku === '' || mb_strlen($sku) > 50) {
      return ['success' => false, 'error' => 'Invalid SKU'];
    }
    if ($groupId <= 0) {
      return ['success' => false, 'error' => 'Invalid group_id'];
    }

    try {
      $pdo = $this->connection->getConnection();

      /* 1) Validar que el grupo exista (y opcionalmente que esté aprobado) */
      $stmtG = $pdo->prepare("
        SELECT group_id
        FROM `groups`
        WHERE group_id = :group_id
        LIMIT 1
      ");
      $stmtG->execute([':group_id' => $groupId]);

      if ($stmtG->fetchColumn() === false) {
        return ['success' => false, 'error' => 'Group not found'];
      }

      /* 2) Actualizar products.group_id usando el SKU */
      $stmtU = $pdo->prepare("
        UPDATE products
        SET group_id = :group_id
        WHERE SKU = :sku
        LIMIT 1
      ");
      $stmtU->execute([
        ':group_id' => $groupId,
        ':sku' => $sku
      ]);

      if ($stmtU->rowCount() === 0) {
        return ['success' => false, 'error' => 'Product not found for SKU (or no changes)'];
      }

      return ['success' => true];

    } catch (PDOException $e) {
      error_log('updateGroupIdBySKU error (SKU ' . $sku . '): ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }


  public function getProductBasicBySKU(): string {
    if (empty($this->sku)) {
      return json_encode(['success' => false, 'error' => 'SKU required'], JSON_UNESCAPED_UNICODE);
    }

    try {
      $pdo = $this->connection->getConnection();

      $sql = "SELECT p.name, p.description, p.status, p.descriptive_tagline
              FROM products p
              WHERE p.SKU = :sku
              LIMIT 1";
      // Si tu colación fuera case-sensitive:
      // $sql = "SELECT name, description, status FROM products
      //         WHERE SKU COLLATE utf8mb4_general_ci = :sku LIMIT 1";

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
                  p.SKU              AS sku,
                  p.name             AS product_name,
                  p.description,
                  p.descriptive_tagline,
                  p.status
              FROM products p
              WHERE p.SKU = :sku
              LIMIT 1
          ";

          $stmt = $pdo->prepare($sql);
          $stmt->execute([':sku' => $sku]);
          $row = $stmt->fetch(PDO::FETCH_ASSOC);

          if (!$row) {
              return null; // SKU no encontrado
          }

          // Envolvemos en product_details como pediste
          return ['product_details' => $row];

      } catch (PDOException $e) {
          error_log('getProductDetailsBySKU error (SKU '.$sku.'): '.$e->getMessage());
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
          p.supplier_id,

          s.contact_name,
          s.company_name,

          vfirst.variation_sku AS sku_variations

        FROM products p
        LEFT JOIN suppliers s
          ON s.supplier_id = p.supplier_id

        -- Primer “hijo” (primera variation) por producto
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

        WHERE p.is_approved = 0
        ORDER BY p.date_status DESC, p.product_id DESC
      ");

      $stmt->execute();
      $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

      $items = [];
      foreach ($rows as $r) {
        $items[] = [
          // SKU del PRODUCTO (igual al que ya traías)
          'SKU'            => (string)($r['product_sku'] ?? ''),
          'sku_variations' => (string)($r['sku_variations'] ?? ''),
          'name'        => (string)($r['name'] ?? ''),
          'date_status' => $r['date_status'],
          'is_approved' => (int)($r['is_approved'] ?? 0),
          'supplier_id' => (int)($r['supplier_id'] ?? 0),
          'supplier'    => [
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
      return ['success' => false, 'error' => 'DB error'];
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
}
?>
