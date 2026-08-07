<?php

class TypeVariation
{
  // ===== Attributes =====
  private $connection;

  private $type_id = null;
  private $type_name = null;
  private $description = null;
  private $category_id = null;
  private $groups = []; // array
  private $productIds = [];

  // ===== Constructor =====
  public function __construct($connection)
  {
    $this->connection = $connection;
  }

  public function setGroups(array $groups)
  {
    $this->groups = array_map('intval', $groups);
  }

  public function setProductIds(array $productIds): void
  {
    $this->productIds = array_values(array_unique(array_filter(
      array_map('intval', $productIds),
      static fn($id) => $id > 0
    )));
  }

  public function getTypeVariationsByProducts(): array
  {
    if (empty($this->productIds)) {
      return [];
    }

    try {
      $pdo = $this->connection->getConnection();
      $placeholders = implode(',', array_fill(0, count($this->productIds), '?'));
      $stmt = $pdo->prepare("
        SELECT DISTINCT
          tv.type_id,
          tv.type_name,
          v.name AS option_name,
          v.product_id
        FROM variations v
        INNER JOIN type_variations tv ON tv.type_id = v.type_id
        WHERE v.product_id IN ($placeholders)
          AND v.type_id IS NOT NULL
          AND tv.type_name IS NOT NULL
          AND TRIM(tv.type_name) <> ''
          AND v.name IS NOT NULL
          AND TRIM(v.name) <> ''
        ORDER BY tv.type_name, v.name
      ");
      $stmt->execute($this->productIds);

      return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
      error_log('getTypeVariationsByProducts error: ' . $e->getMessage());
      return [];
    }
  }

  public function getTypeVariationsByGroups(): array
  {
    try {
      $pdo = $this->connection->getConnection();

      // 1) Validate selected groups
      if (empty($this->groups) || !is_array($this->groups)) {
        return [];
      }

      // 2) Clean group IDs
      $groups = array_map('intval', $this->groups);
      $groups = array_values(array_unique($groups));

      if (empty($groups)) {
        return [];
      }

      // 3) Create dynamic placeholders for groups
      $placeholders = implode(',', array_fill(0, count($groups), '?'));

      // 4) Get category IDs without duplicates
      $stmt = $pdo->prepare("
        SELECT DISTINCT category_id
        FROM `groups`
        WHERE group_id IN ($placeholders)
          AND category_id IS NOT NULL
      ");

      $stmt->execute($groups);

      $categoryIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

      if (empty($categoryIds)) {
        return [];
      }

      // 5) Clean category IDs
      $categoryIds = array_map('intval', $categoryIds);
      $categoryIds = array_values(array_unique($categoryIds));

      if (empty($categoryIds)) {
        return [];
      }

      // 6) Create dynamic placeholders for categories
      $categoryPlaceholders = implode(',', array_fill(0, count($categoryIds), '?'));

      // 7) Get type variations linked to those categories without duplicates
      $stmt = $pdo->prepare("
        SELECT DISTINCT
          type_id,
          type_name
        FROM type_variations
        WHERE category_id IN ($categoryPlaceholders)
        ORDER BY type_name ASC
      ");

      $stmt->execute($categoryIds);

      return $stmt->fetchAll(PDO::FETCH_ASSOC);

    } catch (PDOException $e) {
      error_log('getTypeVariationsByGroups error: ' . $e->getMessage());
      return [];
    }
  }
}

?>
