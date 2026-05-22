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

  // ===== Constructor =====
  public function __construct($connection)
  {
    $this->connection = $connection;
  }

  public function setGroups(array $groups)
  {
    $this->groups = array_map('intval', $groups);
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

      // 6) Create dynamic placeholders for categories
      $categoryPlaceholders = implode(',', array_fill(0, count($categoryIds), '?'));

      // 7) Get type variations linked to those categories
      $stmt = $pdo->prepare("
        SELECT
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
