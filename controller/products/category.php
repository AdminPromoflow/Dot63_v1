<?php
class Category {
  public function handleCateogory(){
    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    switch ($data["action"] ?? null) {
      case 'create_new_category':
        $this->createNewCategory($data);
        break;

        case 'create_new_group':
          $this->createNewGroup($data);
          break;

      case 'get_categories':
        $this->getCategories();
        break;

      case 'get_category_selected':
        $this->getCategorySelected($data);
        break;

      default:
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['response' => false, 'error' => 'Unsupported action']);
        break;
    }
  }



  private function getCategorySelected($data){


    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $category   = new Categories($connection);

    $category->setSKU($data['sku'] ?? '');
    $response = $category->getCategorySelected();

    echo json_encode($response);
  }

  private function createNewCategory($data){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $categories   = new Categories($connection);

    $categories->setName($data['name'] ?? '');
    $response = $categories->create();


    $connection = new Database();
    $categories   = new Categories($connection);
    $categories->setName($data['name'] ?? '');


    $idCategory = $categories->getCategoryIdByName();
    // echo json_encode($data['sku']);exit;

    $connection = new Database();
    $product  = new Products($connection);
    $product-> updateCategoryIdBySKU($data['sku'],$idCategory);

    session_start();
    $_SESSION['idCategory'] = $idCategory;

    echo json_encode($response);
  }


  private function createNewGroup($data){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $groups   = new Groups($connection);

    $groups->setName($data['name'] ?? '');
    $response = $groups->create();


    session_start(); // siempre al inicio
    $idCategory = isset($_SESSION['idCategory']) ? (int)$_SESSION['idCategory'] : "";

    $connection = new Database();
    $groups  = new Groups($connection);
  //  $product-> updateGroupIdBySKU($data['sku'],$idCategory);

    echo json_encode($response);
  }

  private function getCategories(){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $categories   = new Categories($connection);
    $response = $categories->getAllNames();

    echo ($response);

  }


}

include "../../controller/config/database.php";
include "../../model/categories.php";
include "../../model/groups.php";
include "../../model/products.php";

$categoryClass = new Category(); // instancia
$categoryClass->handleCateogory();
