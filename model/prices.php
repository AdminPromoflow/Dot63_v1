<?php
/**
 * =====================================================
 * Class: Prices
 * Database model for managing variation prices (rows)
 *
 * Tables:
 *   prices(price_id, min_quantity, max_quantity, price, variation_id)
 *   variations(variation_id, name, SKU, product_id, ...)
 *   products(product_id, SKU, ...)
 * =====================================================
 */
class Prices {
  // ---- Properties (solo las necesarias) ----
  private $connection;        // PDO wrapper
  private $sku;               // Product SKU (para el dropdown)
  private $sku_variation;     // Variation SKU (para resolver variation_id)

  private $price_id;          // prices.price_id
  private $min_quantity;      // prices.min_quantity
  private $max_quantity;      // prices.max_quantity
  private $price;             // prices.price
  private $variation_id;      // prices.variation_id (opcional si ya resolvemos por SKU)

  public function __construct($connection) { $this->connection = $connection; }

  // ---- Setters ----
  public function setSKU(?string $v)               { $v = trim((string)$v); $this->sku = ($v === '') ? null : $v; }
  public function setSKUVariation(?string $v)      { $v = trim((string)$v); $this->sku_variation = ($v === '') ? null : $v; }

  public function setPriceId($v)                   { $v = is_numeric($v)? (int)$v : null; $this->price_id = $v; }
  public function setMinQuantity($v)               { $v = ($v === '' || $v === null) ? null : (int)$v; $this->min_quantity = $v; }
  public function setMaxQuantity($v)               { $v = ($v === '' || $v === null) ? null : (int)$v; $this->max_quantity = $v; }
  public function setPrice($v)                     { $v = ($v === '' || $v === null) ? null : (float)$v; $this->price = $v; }
  public function setVariationId($v)               { $v = is_numeric($v)? (int)$v : null; $this->variation_id = $v; }


  public function getPricesByIdVariation()
  {
      if (!$this->variation_id || $this->max_quantity === null) {
          return null;
      }

      try {
          $pdo = $this->connection->getConnection();

          $stmt = $pdo->prepare("
              SELECT price
              FROM prices
              WHERE variation_id = :variation_id
                AND :quantity BETWEEN min_quantity AND max_quantity
                AND price IS NOT NULL
              LIMIT 1
          ");

          $stmt->execute([
              ':variation_id' => $this->variation_id,
              ':quantity' => $this->max_quantity
          ]);

          $result = $stmt->fetch(\PDO::FETCH_ASSOC);

          return $result ? (float)$result['price'] : null;

      } catch (\PDOException $e) {
          error_log('getPricesByIdVariation: ' . $e->getMessage());
          return null;
      }
  }
  // -----------------------------------------------------
  // Variations by product SKU (for the dropdown)  ← DEJAR IGUAL
  // -----------------------------------------------------
  public function getVariationsBySKUProduct(): array
  {
      if (!$this->sku) return [];

      try {
          $pdo = $this->connection->getConnection();

          // 1) Obtener product_id por SKU (case-insensitive)
          $stmt = $pdo->prepare("
              SELECT product_id
              FROM products
              WHERE LOWER(SKU) = LOWER(:sku)
              LIMIT 1
          ");
          $stmt->execute([':sku' => $this->sku]);
          $product = $stmt->fetch(\PDO::FETCH_ASSOC);

          if (!$product) return [];

          $productId = (int)$product['product_id'];

          // 2) Variaciones jerárquicas (abuelo -> padre -> hijo) + level
          try {
              // ✅ MySQL 8+ (CTE recursivo)
              $stmt = $pdo->prepare("
                  WITH RECURSIVE vtree AS (
                    -- Abuelos (raíz)
                    SELECT
                      v.variation_id,
                      v.name,
                      v.SKU,
                      v.parent_id,
                      0 AS level,
                      CONCAT(LOWER(v.name), '-', LPAD(v.variation_id, 10, '0')) AS sort_path
                    FROM variations v
                    WHERE v.product_id = :pid
                      AND (v.parent_id IS NULL OR v.parent_id = 0)

                    UNION ALL

                    -- Hijos
                    SELECT
                      c.variation_id,
                      c.name,
                      c.SKU,
                      c.parent_id,
                      p.level + 1 AS level,
                      CONCAT(p.sort_path, '>', LOWER(c.name), '-', LPAD(c.variation_id, 10, '0')) AS sort_path
                    FROM variations c
                    INNER JOIN vtree p
                      ON c.parent_id = p.variation_id
                    WHERE c.product_id = :pid
                  )

                  SELECT variation_id, name, SKU, parent_id, level
                  FROM vtree
                  ORDER BY sort_path ASC
              ");
              $stmt->execute([':pid' => $productId]);
              return $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

          } catch (\PDOException $e) {
              // 🔁 Fallback si tu BD no soporta WITH RECURSIVE
              $stmt = $pdo->prepare("
                  SELECT variation_id, name, SKU, parent_id, 0 AS level
                  FROM variations
                  WHERE product_id = :pid
                  ORDER BY name ASC, variation_id ASC
              ");
              $stmt->execute([':pid' => $productId]);
              return $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
          }

      } catch (\PDOException $e) {
          error_log('getVariationsBySKUProduct: ' . $e->getMessage());
          return [];
      }
  }
  // -----------------------------------------------------
  // Get prices by variation SKU
  // -----------------------------------------------------
  public function getPricesBySKUVariation(): array {
    if (!$this->sku_variation) return [];
    try {
      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("SELECT variation_id FROM variations WHERE SKU = :vsku LIMIT 1");
      $stmt->execute([':vsku' => $this->sku_variation]);
      $variation = $stmt->fetch(\PDO::FETCH_ASSOC);
      if (!$variation) return [];

      $variationId = (int)$variation['variation_id'];
      $stmt = $pdo->prepare("
        SELECT price_id, min_quantity, max_quantity, price
        FROM prices
        WHERE variation_id = :vid
        ORDER BY price_id ASC
      ");
      $stmt->execute([':vid' => $variationId]);
      return $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

    } catch (\PDOException $e) {
      error_log('getPricesBySKUVariation: ' . $e->getMessage());
      return [];
    }
  }

  // -----------------------------------------------------
  // Delete all prices for a given variation SKU
  // (antes: deleteItemsBySkuVariation)
  // -----------------------------------------------------
  public function deletePricesBySkuVariation(): bool {
    $vsku = $this->sku_variation ?? null;
    if (!$vsku) return false;

    try {
      $pdo = $this->connection->getConnection();
      $stmt = $pdo->prepare("SELECT variation_id FROM variations WHERE SKU = :sku LIMIT 1");
      $stmt->execute([':sku' => $vsku]);
      $variation = $stmt->fetch(\PDO::FETCH_ASSOC);
      if (!$variation) return false;

      $variationId = (int)$variation['variation_id'];
      $stmtDel = $pdo->prepare("DELETE FROM prices WHERE variation_id = :vid");
      return $stmtDel->execute([':vid' => $variationId]);

    } catch (\PDOException $e) {
      error_log('deletePricesBySkuVariation: ' . $e->getMessage());
      return false;
    }
  }

  // -----------------------------------------------------
  // Delete a single price by price_id (and optionally by variation SKU)
  // (antes: deleteItemByIdItem → ahora deletePricesByIdItem)
  // -----------------------------------------------------
  public function deletePricesByIdItem(): bool {
    $priceId = $this->price_id ?? null;
    if (!$priceId) return false;

    try {
      $pdo = $this->connection->getConnection();

      if (!empty($this->sku_variation)) {
        // valida pertenencia a la variación
        $stmt = $pdo->prepare("SELECT variation_id FROM variations WHERE SKU = :vsku LIMIT 1");
        $stmt->execute([':vsku' => $this->sku_variation]);
        $vid = $stmt->fetch(\PDO::FETCH_COLUMN);
        if ($vid === false) return false;
        $vid = (int)$vid;

        $stmtDel = $pdo->prepare("
          DELETE FROM prices
          WHERE price_id = :id AND variation_id = :vid
          LIMIT 1
        ");
        $stmtDel->execute([':id' => $priceId, ':vid' => $vid]);

      } else {
        // borrar solo por price_id
        $stmtDel = $pdo->prepare("
          DELETE FROM prices
          WHERE price_id = :id
          LIMIT 1
        ");
        $stmtDel->execute([':id' => $priceId]);
      }

      return $stmtDel->rowCount() > 0;

    } catch (\PDOException $e) {
      error_log('deletePricesByIdItem: ' . $e->getMessage());
      return false;
    }
  }

  // -----------------------------------------------------
  // Insert a single price for the current variation
  // (antes: saveItem → ahora savePrice)
  // -----------------------------------------------------
  public function savePrice(): bool {
    $vsku = $this->sku_variation ?? null;

    // Validaciones mínimas: requiere SKU de variación y price
    if (!$vsku) return false;
    if ($this->price === null) return false;

    try {
      $pdo = $this->connection->getConnection();

      // Resolver variation_id desde SKU de la variación
      $stmt = $pdo->prepare("SELECT variation_id FROM variations WHERE SKU = :vsku LIMIT 1");
      $stmt->execute([':vsku' => $vsku]);
      $vid = $stmt->fetch(\PDO::FETCH_COLUMN);
      if ($vid === false) return false;
      $vid = (int)$vid;

      // Insert
      $stmt = $pdo->prepare("
        INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
        VALUES (:minq, :maxq, :price, :vid)
      ");
      $stmt->execute([
        ':minq'  => $this->min_quantity,
        ':maxq'  => $this->max_quantity,
        ':price' => $this->price,
        ':vid'   => $vid
      ]);

      return true;

    } catch (\PDOException $e) {
      error_log('savePrice: ' . $e->getMessage());
      return false;
    }
  }
}
