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
  public function setGroups(array $groups){$this->groups = array_map('intval', $groups);}

}

?>
