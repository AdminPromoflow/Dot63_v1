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
    case 'get_categories_filter_and_their_groups':
    $this->getCategoriesFilter();
      break;

    case 'get_products_by_groups':
    $this->getProductsByGroups($data["groups"]);
      break;

    default:
      echo json_encode("no entramos");
      break;
  }

  // echo json_encode($data);
}
private function getProductsByGroups($groups){
  $connection = new Database();
  $products   = new Products($connection);
  $products->setGroups($groups);
  $response = $products->getProductsByGroups();

  echo json_encode($response);
}
private function getCategoriesFilter(){
  header('Content-Type: application/json; charset=utf-8');

  $connection = new Database();
  $categories   = new Categories($connection);
  $response = $categories->getCategories();

  echo json_encode(array('success' => true,
                         'cateogories' => $response));
  
}

}
include "../../controller/config/database.php";
include "../../model/categories.php";
include "../../model/products.php";


$categotyFilterClass = new CategoryFilters();
$categotyFilterClass-> handleCategoryFilters();

 ?>
