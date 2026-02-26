<?php
/**
 * Class: Items
 * Database model for managing variation items (no highlight/order).
 *
 * Tables:
 *   items(item_id, name, description, variation_id)
 *   variations(variation_id, name, SKU, product_id, ...)
 */
class Items {
  // ---- Properties ----
  private $connection;        // PDO wrapper
  private $sku;               // Product SKU
  private $sku_variation;     // Variation SKU
  private $label;             // items.name
  private $text;              // items.description
  private $idItem;              // items.description

  public function __construct($connection) { $this->connection = $connection; }

  // ---- Setters ----
  public function setIDItem(?string $v)          { $v = trim((string)$v); $this->idItem = ($v === '') ? null : $v; }
  public function setSKU(?string $v)          { $v = trim((string)$v); $this->sku = ($v === '') ? null : $v; }
  public function setSKUVariation(?string $v) { $v = trim((string)$v); $this->sku_variation = ($v === '') ? null : $v; }
  public function setLabel(?string $v)        { $v = trim((string)$v); $this->label = ($v === '') ? null : $v; }
  public function setText(?string $v)         { $v = trim((string)$v); $this->text  = ($v === '') ? null : $v; }

  // Delete all items for a given variation SKU
  public function deleteItemsBySkuVariation(): bool {
    $vsku = $this->sku_variation ?? null;
    if (!$vsku) return false;

    try {
      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("SELECT variation_id FROM variations WHERE SKU = :sku LIMIT 1");
      $stmt->execute([':sku' => $vsku]);
      $variation = $stmt->fetch(\PDO::FETCH_ASSOC);
      if (!$variation) return false;

      $variationId = (int)$variation['variation_id'];
      $stmtDel = $pdo->prepare("DELETE FROM items WHERE variation_id = :vid");
      return $stmtDel->execute([':vid' => $variationId]);

    } catch (\PDOException $e) {
      error_log('deleteItemsBySkuVariation: ' . $e->getMessage());
      return false;
    }
  }

  /**
   * Delete a single item by variation SKU + name + description
   * Returns true if at least one row was deleted.
   */
   public function deleteItemByIdItem(): bool
   {
       $itemId = $this->idItem ?? null;
       if (!$itemId) return false;

       try {
           $pdo = $this->connection->getConnection();

           // Si hay SKU de variación seteado, validamos pertenencia
           if (!empty($this->sku_variation)) {
               $stmt = $pdo->prepare("SELECT variation_id FROM variations WHERE SKU = :vsku LIMIT 1");
               $stmt->execute([':vsku' => $this->sku_variation]);
               $vid = $stmt->fetch(\PDO::FETCH_COLUMN);
               if ($vid === false) return false;
               $vid = (int)$vid;

               $stmtDel = $pdo->prepare("
                   DELETE FROM items
                   WHERE item_id = :id AND variation_id = :vid
                   LIMIT 1
               ");
               $stmtDel->execute([':id' => $itemId, ':vid' => $vid]);
           } else {
               // Borrar solo por item_id
               $stmtDel = $pdo->prepare("
                   DELETE FROM items
                   WHERE item_id = :id
                   LIMIT 1
               ");
               $stmtDel->execute([':id' => $itemId]);
           }

           return $stmtDel->rowCount() > 0;

       } catch (\PDOException $e) {
           error_log('deleteItemByIdItem: ' . $e->getMessage());
           return false;
       }
   }

  // Variations by product SKU (for the dropdown)
  public function getVariationsBySKUProduct(): array
  {
      if (!$this->sku) return [];

      try {
          $pdo = $this->connection->getConnection();

          // 1) Buscar product_id por SKU (case-insensitive)
          $stmt = $pdo->prepare("
              SELECT product_id
              FROM products
              WHERE LOWER(SKU) = LOWER(:sku)
              LIMIT 1
          ");
          $stmt->execute([':sku' => $this->sku]);
          $product = $stmt->fetch(\PDO::FETCH_ASSOC);
          if (!$product) return [];

          $pid = (int)$product['product_id'];

          // 2) Variations en orden jerárquico (abuelo -> padre -> hijo -> nieto...) usando CTE recursivo (MySQL 8+)
          //    Devuelve name y SKU (como antes) + parent_id y depth (útiles para UI)
          $stmt = $pdo->prepare("
              WITH RECURSIVE tree AS (
                -- Raíces: parent_id NULL/0 o huérfanas (padre no existe en el mismo producto)
                SELECT
                  v.variation_id,
                  v.name,
                  v.SKU,
                  v.parent_id,
                  0 AS depth,
                  CONCAT(
                    RPAD(LOWER(COALESCE(v.name,'')), 80, ' '),
                    '#',
                    LPAD(v.variation_id, 10, '0')
                  ) AS sort_path
                FROM variations v
                WHERE v.product_id = :pid1
                  AND (
                    v.parent_id IS NULL OR v.parent_id = 0
                    OR NOT EXISTS (
                      SELECT 1
                      FROM variations p
                      WHERE p.product_id = :pid2
                        AND p.variation_id = v.parent_id
                    )
                  )

                UNION ALL

                -- Hijos
                SELECT
                  c.variation_id,
                  c.name,
                  c.SKU,
                  c.parent_id,
                  t.depth + 1 AS depth,
                  CONCAT(
                    t.sort_path,
                    '/',
                    RPAD(LOWER(COALESCE(c.name,'')), 80, ' '),
                    '#',
                    LPAD(c.variation_id, 10, '0')
                  ) AS sort_path
                FROM variations c
                INNER JOIN tree t
                  ON t.variation_id = c.parent_id
                WHERE c.product_id = :pid3
                  AND t.depth < 50
              )
              SELECT
                name,
                SKU,
                parent_id,
                depth
              FROM tree
              ORDER BY sort_path
          ");
          $stmt->execute([
              ':pid1' => $pid,
              ':pid2' => $pid,
              ':pid3' => $pid,
          ]);

          return $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

      } catch (\PDOException $e) {
          error_log('getVariationsBySKUProduct: ' . $e->getMessage());
          return [];
      }
  }

  // Items by variation SKU
  public function getItemsBySKUVariation(): array {
    if (!$this->sku_variation) return [];
    try {
      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("SELECT variation_id FROM variations WHERE SKU = :vsku LIMIT 1");
      $stmt->execute([':vsku' => $this->sku_variation]);
      $variation = $stmt->fetch(\PDO::FETCH_ASSOC);
      if (!$variation) return [];

      $variationId = (int)$variation['variation_id'];
      $stmt = $pdo->prepare("
        SELECT item_id, name, description
        FROM items
        WHERE variation_id = :vid
        ORDER BY item_id ASC
      ");
      $stmt->execute([':vid' => $variationId]);
      return $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

    } catch (\PDOException $e) {
      error_log('getItemsBySKUVariation: ' . $e->getMessage());
      return [];
    }
  }

  // Insert a single item for the current variation
  public function saveItem(): bool
  {
      $vsku = $this->sku_variation ?? null;

      // Validaciones mínimas: requiere SKU de variación y descripción (text)
      if (!$vsku) return false;
      if ($this->text === null || $this->text === '') return false;

      try {
          $pdo = $this->connection->getConnection();

          // Resolver variation_id desde SKU
          $stmt = $pdo->prepare("SELECT variation_id FROM variations WHERE SKU = :vsku LIMIT 1");
          $stmt->execute([':vsku' => $vsku]);
          $vid = $stmt->fetch(\PDO::FETCH_COLUMN);
          if ($vid === false) return false;
          $vid = (int)$vid;

          // Insert
          $stmt = $pdo->prepare("
              INSERT INTO items (name, description, variation_id)
              VALUES (:name, :description, :vid)
          ");
          $stmt->execute([
              ':name'        => $this->label,        // puede ser null si tu esquema lo permite
              ':description' => $this->text,         // requerido
              ':vid'         => $vid
          ]);

          return true;

      } catch (\PDOException $e) {
          error_log('saveItem: ' . $e->getMessage());
          return false;
      }
  }

}
?>
