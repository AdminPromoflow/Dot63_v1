<?php

class Groups {
  /** @var Database $connection Debe exponer getConnection(): PDO */
  private $connection;

  /** Atributos del modelo */
  private $group_id;    // int
  private $category_id; // int
  private $name;        // string
  private $sku;         // string

  public function __construct($connection) {
    $this->connection = $connection;
  }

  /* =========================
     SETTERS
     ========================= */
  public function setId($id) { $this->group_id = (int)$id; }         // compat
  public function setGroupId($id) { $this->group_id = (int)$id; }
  public function setCategoryId($id) { $this->category_id = (int)$id; }
  public function setSKU($sku) { $this->sku = $sku; }
  public function setName($name) { $this->name = $this->normalizeName($name); }

  /** Normaliza nombre (trim + colapsa espacios) */
  private function normalizeName($s) {
    $s = is_string($s) ? trim($s) : '';
    return preg_replace('/\s+/', ' ', $s);
  }

  /* =========================
     HELPERS
     ========================= */

  /**
   * Devuelve info del grupo (y su categoría) por SKU del producto.
   * @return array|null
   */
  public function getGroupBySKU() {
    $sku = trim((string)$this->sku);

    if ($sku === '' || strlen($sku) > 50) return null;

    try {
      $pdo = $this->connection->getConnection();

      $stmt = $pdo->prepare("
        SELECT
          g.group_id,
          g.name AS group_name,
          c.category_id,
          c.name AS category_name
        FROM products p
        LEFT JOIN `groups` g
          ON g.group_id = p.group_id
        LEFT JOIN categories c
          ON c.category_id = g.category_id
        WHERE p.SKU = :sku
        LIMIT 1
      ");

      $stmt->execute([':sku' => $sku]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);

      return $row ?: null;

    } catch (PDOException $e) {
      error_log('getGroupBySKU error (SKU ' . $sku . '): ' . $e->getMessage());
      return null;
    }
  }

  /**
   * Busca el group_id por name (y opcionalmente por category_id para evitar ambigüedad)
   * @return int|false
   */
  public function getGroupIdByName() {
    try {
      $name = isset($this->name) ? trim($this->name) : null;
      if (!$name) return false;

      $pdo = $this->connection->getConnection();

      // Si category_id está seteado, filtramos por categoría (recomendado)
      if (!empty($this->category_id)) {
        $stmt = $pdo->prepare("
          SELECT group_id
          FROM `groups`
          WHERE LOWER(name) = LOWER(:name)
            AND category_id = :category_id
          LIMIT 1
        ");
        $stmt->execute([
          ':name' => $name,
          ':category_id' => (int)$this->category_id
        ]);
      } else {
        // Fallback: por nombre solamente (puede ser ambiguo si hay nombres repetidos)
        $stmt = $pdo->prepare("
          SELECT group_id
          FROM `groups`
          WHERE LOWER(name) = LOWER(:name)
          LIMIT 1
        ");
        $stmt->execute([':name' => $name]);
      }

      $groupId = $stmt->fetchColumn();
      return $groupId !== false ? (int)$groupId : false;

    } catch (PDOException $e) {
      error_log('getGroupIdByName error: ' . $e->getMessage());
      return false;
    }
  }

  /**
   * Devuelve el group seleccionado del producto por SKU
   * JSON: { success:true, group_id:..., group_name:... }
   */
  public function getGroupSelected(): string {
    $sku = trim((string)$this->sku);
    if ($sku === '' || strlen($sku) > 50) {
      return json_encode(['success' => false, 'error' => 'SKU required/invalid'], JSON_UNESCAPED_UNICODE);
    }

    try {
      $pdo = $this->connection->getConnection();

      $sql = "
        SELECT
          p.group_id,
          g.name AS group_name
        FROM products p
        LEFT JOIN `groups` g
          ON g.group_id = p.group_id
        WHERE p.SKU COLLATE utf8mb4_general_ci = :sku
        LIMIT 1
      ";
      $stmt = $pdo->prepare($sql);
      $stmt->execute([':sku' => $sku]);

      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      if ($row === false) {
        return json_encode(['success' => false, 'error' => 'SKU not found'], JSON_UNESCAPED_UNICODE);
      }

      $gid = array_key_exists('group_id', $row) ? $row['group_id'] : null;

      return json_encode([
        'success'    => true,
        'group_id'   => ($gid === null ? null : (int)$gid),
        'group_name' => ($row['group_name'] ?? null)
      ], JSON_UNESCAPED_UNICODE);

    } catch (PDOException $e) {
      error_log('getGroupSelected error: '.$e->getMessage());
      return json_encode(['success' => false, 'error' => 'DB error'], JSON_UNESCAPED_UNICODE);
    }
  }

  /** Verifica duplicado por name (y por category_id si está seteado) */
  private function existsByName($name): bool {
    try {
      $pdo = $this->connection->getConnection();

      if (!empty($this->category_id)) {
        $stmt = $pdo->prepare("
          SELECT 1
          FROM `groups`
          WHERE LOWER(name) = LOWER(:name)
            AND category_id = :category_id
          LIMIT 1
        ");
        $stmt->execute([
          ':name' => $name,
          ':category_id' => (int)$this->category_id
        ]);
      } else {
        $stmt = $pdo->prepare("
          SELECT 1
          FROM `groups`
          WHERE LOWER(name) = LOWER(:name)
          LIMIT 1
        ");
        $stmt->execute([':name' => $name]);
      }

      return $stmt->fetchColumn() !== false;

    } catch (PDOException $e) {
      error_log('existsByName (groups) error: ' . $e->getMessage());
      return false;
    }
  }

  /** Crea un grupo */
  public function create() {
    if ($this->name === null || $this->name === '') {
      return ['success' => false, 'error' => 'Name required'];
    }
    if (mb_strlen($this->name) > 150) {
      return ['success' => false, 'error' => 'Name too long'];
    }

    try {
      if ($this->existsByName($this->name)) {
        return ['success' => false, 'error' => 'Group already exists'];
      }

      $pdo = $this->connection->getConnection();

      // Si tu tabla tiene approved y category_id, lo insertamos.
      // Si category_id no está seteado, se inserta NULL (ajusta si quieres exigirlo).
      $stmt = $pdo->prepare("
        INSERT INTO `groups` (name, approved, category_id)
        VALUES (:name, 1, :category_id)
      ");
      $stmt->execute([
        ':name' => $this->name,
        ':category_id' => (!empty($this->category_id) ? (int)$this->category_id : null)
      ]);

      $newId = (int)$pdo->lastInsertId();
      return ['success' => true, 'id' => $newId, 'name' => $this->name];

    } catch (PDOException $e) {
      error_log('create group error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  /** Actualiza un grupo por ID */
  public function update() {
    if (empty($this->group_id)) {
      return ['success' => false, 'error' => 'ID required'];
    }
    if ($this->name === null || $this->name === '') {
      return ['success' => false, 'error' => 'Name required'];
    }
    if (mb_strlen($this->name) > 150) {
      return ['success' => false, 'error' => 'Name too long'];
    }

    try {
      $pdo = $this->connection->getConnection();

      // Duplicado: mismo nombre en otro group_id (y misma category_id si está seteado)
      if (!empty($this->category_id)) {
        $dup = $pdo->prepare("
          SELECT group_id
          FROM `groups`
          WHERE LOWER(name) = LOWER(:name)
            AND category_id = :category_id
            AND group_id <> :id
          LIMIT 1
        ");
        $dup->execute([
          ':name' => $this->name,
          ':category_id' => (int)$this->category_id,
          ':id' => (int)$this->group_id
        ]);
      } else {
        $dup = $pdo->prepare("
          SELECT group_id
          FROM `groups`
          WHERE LOWER(name) = LOWER(:name)
            AND group_id <> :id
          LIMIT 1
        ");
        $dup->execute([
          ':name' => $this->name,
          ':id' => (int)$this->group_id
        ]);
      }

      if ($dup->fetch(PDO::FETCH_ASSOC)) {
        return ['success' => false, 'error' => 'Group name already in use'];
      }

      $stmt = $pdo->prepare("
        UPDATE `groups`
        SET name = :name
        WHERE group_id = :id
        LIMIT 1
      ");
      $stmt->execute([
        ':name' => $this->name,
        ':id' => (int)$this->group_id
      ]);

      return ['success' => true, 'updated' => $stmt->rowCount()];

    } catch (PDOException $e) {
      error_log('update group error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  /** Elimina un grupo por ID */
  public function delete() {
    if (empty($this->group_id)) {
      return ['success' => false, 'error' => 'ID required'];
    }

    try {
      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("DELETE FROM `groups` WHERE group_id = :id LIMIT 1");
      $stmt->execute([':id' => (int)$this->group_id]);

      return ['success' => true, 'deleted' => $stmt->rowCount()];

    } catch (PDOException $e) {
      error_log('delete group error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  /**
   * Devuelve todos los grupos (para pintar la lista en la UI).
   * Si category_id está seteado, devuelve solo los grupos de esa categoría.
   */
   public function getAllNames(): array {
     // 1) SKU requerido
     $sku = trim((string)$this->sku);
     if ($sku === '' || strlen($sku) > 50) {
       return ['success' => false, 'error' => 'SKU required/invalid'];
     }

     try {
       $pdo = $this->connection->getConnection();

       /* =========================
          1) SKU -> product_id, group_id
          ========================= */
       $stmt = $pdo->prepare("
         SELECT product_id, group_id
         FROM products
         WHERE SKU COLLATE utf8mb4_general_ci = :sku
         LIMIT 1
       ");
       $stmt->execute([':sku' => $sku]);
       $product = $stmt->fetch(PDO::FETCH_ASSOC);

       if (!$product) {
         return ['success' => false, 'error' => 'SKU not found'];
       }

       $groupId = $product['group_id'] ?? null;
       if ($groupId === null) {
         return ['success' => false, 'error' => 'Product has no group assigned'];
       }
       $groupId = (int)$groupId;

       /* =========================
          2) group_id -> category_id
          ========================= */
       $stmt = $pdo->prepare("
         SELECT category_id
         FROM `groups`
         WHERE group_id = :group_id
         LIMIT 1
       ");
       $stmt->execute([':group_id' => $groupId]);
       $categoryId = $stmt->fetchColumn();

       if ($categoryId === false || $categoryId === null) {
         return ['success' => false, 'error' => 'Category not found for this group'];
       }
       $categoryId = (int)$categoryId;

       /* =========================
          3) category_id -> ALL groups in that category
          (solo group_id y name)
          ========================= */
       $stmt = $pdo->prepare("
         SELECT
           g.group_id,
           g.name
         FROM `groups` g
         WHERE g.category_id = :category_id
           AND g.approved IN (1, TRUE)
         ORDER BY g.group_id ASC
       ");
       $stmt->execute([':category_id' => $categoryId]);
       $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

       return ['success' => true, 'data' => $rows];

     } catch (PDOException $e) {
       error_log('getAllNames groups error: ' . $e->getMessage());
       return ['success' => false, 'error' => 'DB error'];
     }
   }

}
