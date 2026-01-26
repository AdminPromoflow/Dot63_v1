<?php
class Resques63API{
  public function handleResques63API(){

    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    switch ($data["action"] ?? null) {
      case 'get_API_overview_data':
        $this->getAPIOverviewData($data);
        break;
        case 'get_preview_product_details':
          $this->getPreviewProductDetails($data);
          break;
          case 'approve_product':
            $this->approveProduct($data);
            break;

      default:
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['response' => false, 'error' => 'Unsupported action']);
        break;
    }
  }

  private function approveProduct($data){
    $connection = new Database();
    $product = new Products($connection);
    $product->setSku($data['sku']);
    $result = $product->approveProductWidthSKU();


    echo json_encode ($result);
  }

  private function getAPIOverviewData(){
    $connection = new Database();
    $product = new Products($connection);
    $result = $product->getPendingProducts();


    echo json_encode ($result);
  }


  private function getPreviewProductDetails($data){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $user = new Users($connection);
    $user->setSKU($data['sku']);
    $company = $user->getUserCompanyBySKU();


    $connection = new Database();
    $category = new Categories($connection);
    $category->setSKU($data['sku']);
    $category_name = $category->getCategoryBySKU();

    $connection = new Database();
    $product = new Products($connection);
    $product->setSku($data['sku']);
    $product_details = $product->getProductDetailsBySKU();


    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setSku($data['sku']);
    $variation_details = $variation->getVariationsSKUBySKUProduct();


    echo  json_encode(array($company,$category_name, $product_details, $variation_details ));
  }
}

include "../../controller/config/database.php";
include "../../model/products.php";
include "../../model/users.php";
include "../../model/categories.php";
include "../../model/variations.php";
include "../../controller/products/variations.php";

if ($payload = (json_decode(file_get_contents("php://input"), true) ?? [])) {
  $apiHandler = new Resques63API();
  $apiHandler->handleResques63API();
}
?>
