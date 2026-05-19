<?php
/**
 *
 */
class CategoryFilters 

{
public function  handleCategoryFilters(){
  $input = file_get_contents('php://input');
  $data = json_decode($input,true);
  switch ($data["action"] ?? null) {
    case 'get_categories_filter':
    $this->getCategoriesFilter();
      break;

    default:
      echo json_encode("no entramos");
      break;
  }

  // echo json_encode($data);
}
private function getCategoriesFilter(){
  header('Content-Type: application/json; charset=utf-8');

  $connection = new Database();
  $categories   = new Categories($connection);
  $response = $categories->getCategories();
  echo json_encode($response);
  // getCategories()
}

}
include "../../controller/config/database.php";
include "../../model/categories.php";


$categotyFilterClass = new CategoryFilters();
$categotyFilterClass-> handleCategoryFilters();
 ?>
