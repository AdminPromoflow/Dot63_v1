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
    $this->getCategoriesFilter($data["groups"]);
      break;

    case 'get_products_by_groups':
    $this->getProductsByGroups($data["groups"]);
      break;

    case 'get_type_variations_by_products':
      $this->getTypeVariationsByProducts($data["product_ids"] ?? []);
      break;

    default:
      echo json_encode("no entramos");
      break;
  }

  // echo json_encode($data);
}
private function getTypeVariationsByProducts($productIds){
  header('Content-Type: application/json; charset=utf-8');

  $connection = new Database();
  $typeVariation = new TypeVariation($connection);
  $typeVariation->setProductIds(is_array($productIds) ? $productIds : []);

  echo json_encode([
    'success' => true,
    'typeVariations' => $typeVariation->getTypeVariationsByProducts()
  ]);
}
private function getProductsByGroups($groups){
  $connection = new Database();
  $products   = new Products($connection);
  $products->setGroups($groups);
  $response = $products->getProductsByGroups();

  $connection = new Database();
  $typeVariation = new TypeVariation($connection);
  $typeVariation->setGroups($groups);
  $resultTypeVariations = $typeVariation->getTypeVariationsByGroups();

  echo json_encode(array('success' => true,
                         'products' => $response,
                         'typeVariations' => $resultTypeVariations
                       ));

}
private function getCategoriesFilter($groups){
  header('Content-Type: application/json; charset=utf-8');

  $connection = new Database();
  $categories   = new Categories($connection);
  $response = $categories->getCategories();


  echo json_encode(array('success' => true,
                         'cateogories' => $response
                         ));

}

}
include "../../controller/config/database.php";
include "../../model/categories.php";
include "../../model/products.php";
include "../../model/Type_variations.php";


$categotyFilterClass = new CategoryFilters();
$categotyFilterClass-> handleCategoryFilters();

 ?>
