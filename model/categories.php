<?php
class Categories {
  /** @var Database $connection Debe exponer getConnection(): PDO */
  private $connection;

  /** Atributos del modelo */
  private $category_id; // int
  private $name;        // string
  private $sku;        // string


  public function __construct($connection) {
    $this->connection = $connection;
  }

  /** Setters */
  public function setId($id) { $this->category_id = (int)$id;}
  public function setSKU($sku) { $this->sku = $sku; }
  public function setName($name) { $this->name = $this->normalizeName($name); }

  /** Normaliza nombre (trim + colapsa espacios) */
  private function normalizeName($s) {
    $s = is_string($s) ? trim($s) : '';
    return preg_replace('/\s+/', ' ', $s);
  }

  public function getCategoryBySKU(): ?array {
    $sku = trim((string)$this->sku);

    if ($sku === '' || mb_strlen($sku) > 50) {
      return null;
    }

    try {
      $pdo = $this->connection->getConnection();

      $stmt = $pdo->prepare("
        SELECT categories.name AS category_name
        FROM products
        INNER JOIN `groups`
          ON `groups`.group_id = products.group_id
        INNER JOIN categories
          ON categories.category_id = `groups`.category_id
        WHERE products.SKU = :sku
        LIMIT 1
      ");

      $stmt->execute([':sku' => $sku]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);

      return $row ?: null;

    } catch (PDOException $e) {
      error_log('getCategoryBySKU error (SKU ' . $sku . '): ' . $e->getMessage());
      return null;
    }
  }

  public function getCategoryIdByName(){
      try {
          // Usa la variable global (propiedad de clase)
          $name = isset($this->name) ? trim($this->name) : null;
          if (!$name) {
              return false; // no hay nombre, no se puede buscar
          }

          $pdo = $this->connection->getConnection();

          $stmt = $pdo->prepare("SELECT category_id
              FROM categories
              WHERE LOWER(name) = LOWER(:name)
              LIMIT 1
          ");
          $stmt->execute([':name' => $name]);

          // Retorna el ID si existe o false si no hay coincidencia
          $categoryId = $stmt->fetchColumn();
          return $categoryId !== false ? (int)$categoryId : false;

      } catch (PDOException $e) {
          error_log('getCategoryIdByName error: ' . $e->getMessage());
          return false;
      }
  }

  public function getCategorySelected() {
    $sku = trim((string)$this->sku);

    if ($sku === '' || mb_strlen($sku) > 50) {
        return null;
    }

    try {
        $pdo = $this->connection->getConnection();

        /* 1) Obtener product_id por SKU */
        $stmt1 = $pdo->prepare("
            SELECT p.product_id
            FROM products p
            WHERE p.SKU = :sku
            LIMIT 1
        ");
        $stmt1->execute([':sku' => $sku]);
        $productId = $stmt1->fetchColumn();

        if ($productId === false) {
            return null; // no existe producto con ese SKU
        }

        /* 2) Obtener group_id teniendo product_id */
        $stmt2 = $pdo->prepare("
            SELECT p.group_id
            FROM products p
            WHERE p.product_id = :product_id
            LIMIT 1
        ");
        $stmt2->execute([':product_id' => (int)$productId]);
        $groupId = $stmt2->fetchColumn();

        if ($groupId === false || empty($groupId)) {
            return null; // producto sin group_id
        }

        /* 3) Obtener category_id y category name teniendo group_id */
        $stmt3 = $pdo->prepare("
            SELECT
                c.category_id,
                c.name AS category_name
            FROM `groups` g
            INNER JOIN categories c ON c.category_id = g.category_id
            WHERE g.group_id = :group_id
            LIMIT 1
        ");
        $stmt3->execute([':group_id' => (int)$groupId]);
        $row = $stmt3->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null; // no encontró category para ese group
        }

        // Retorna lo pedido (y extra útil)
        return [
            'success'       => true,
            'category_id'   => (int)$row['category_id'],
            'category_name' => $row['category_name']
        ];

    } catch (PDOException $e) {
        error_log('getCategoryBySKU error (SKU ' . $sku . '): ' . $e->getMessage());
        return null;
    }
  }



  /** Verifica si existe una categoría con el mismo nombre (case-insensitive) */
  private function existsByName($name) {
    try {
      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("SELECT 1
        FROM categories
        WHERE LOWER(name) = LOWER(:name)
        LIMIT 1
      ");
      $stmt->execute([':name' => $name]);
      return $stmt->fetchColumn() !== false;
    } catch (PDOException $e) {
      error_log('existsByName error: ' . $e->getMessage());
      return false;
    }
  }

  /** Crea una categoría (primero verifica duplicado por nombre) */
  public function create() {
    if ($this->name === null || $this->name === '') {
      return ['success' => false, 'error' => 'Name required'];
    }
    if (mb_strlen($this->name) > 150) {
      return ['success' => false, 'error' => 'Name too long'];
    }

    try {
      if ($this->existsByName($this->name)) {
        return ['success' => false, 'error' => 'Category already exists'];
      }

      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("INSERT INTO categories (name) VALUES (:name)");
      $stmt->execute([':name' => $this->name]);

      $newId = (int)$pdo->lastInsertId();
      return ['success' => true, 'id' => $newId, 'name' => $this->name];
    } catch (PDOException $e) {
      // Si tienes UNIQUE en name, puedes capturar código 1062 (duplicate)
      error_log('create category error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  /** Actualiza una categoría por ID (valida duplicado de nombre en otro ID) */
  public function update() {
    if (empty($this->category_id)) {
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

      // ¿Existe el mismo nombre en otro ID?
      $dup = $pdo->prepare("SELECT category_id
        FROM categories
        WHERE LOWER(name) = LOWER(:name) AND category_id <> :id
        LIMIT 1
      ");
      $dup->execute([':name' => $this->name, ':id' => $this->category_id]);
      if ($dup->fetch(PDO::FETCH_ASSOC)) {
        return ['success' => false, 'error' => 'Category name already in use'];
      }

      $stmt = $pdo->prepare("UPDATE categories
        SET name = :name
        WHERE category_id = :id
        LIMIT 1
      ");
      $stmt->execute([':name' => $this->name, ':id' => $this->category_id]);

      // rowCount puede ser 0 si el nombre es igual al anterior
      return ['success' => true, 'updated' => $stmt->rowCount()];
    } catch (PDOException $e) {
      error_log('update category error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  /** Elimina una categoría por ID */
  public function delete() {
    if (empty($this->category_id)) {
      return ['success' => false, 'error' => 'ID required'];
    }

    try {
      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("DELETE FROM categories WHERE category_id = :id LIMIT 1");
      $stmt->execute([':id' => $this->category_id]);

      return ['success' => true, 'deleted' => $stmt->rowCount()];
    } catch (PDOException $e) {
      // Si hay FK a products.category_id, aquí podría fallar: manejar según tu lógica
      error_log('delete category error: ' . $e->getMessage());
      return ['success' => false, 'error' => 'DB error'];
    }
  }

  /**
   * Devuelve todas las categorías (solo nombres).
   * @return array ['Art', 'Accessories', ...]
   */
   public function getAllNames() {
     try {
       $pdo = $this->connection->getConnection();

       $sql = "
         SELECT
           c.category_id,
           c.name,
           COUNT(DISTINCT p.product_id) AS products_count
         FROM categories c
         LEFT JOIN `groups` g
           ON g.category_id = c.category_id
         LEFT JOIN products p
           ON p.group_id = g.group_id
         WHERE c.approved IN (1, TRUE)
         GROUP BY c.category_id, c.name
         ORDER BY c.category_id ASC
       ";

       $stmt = $pdo->prepare($sql);
       $stmt->execute();
       $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

       return json_encode(['success' => true, 'data' => $rows], JSON_UNESCAPED_UNICODE);

     } catch (PDOException $e) {
       error_log('getAllNames error: ' . $e->getMessage());
       return json_encode(['success' => false, 'error' => 'DB error'], JSON_UNESCAPED_UNICODE);
     }
   }


}
?>
