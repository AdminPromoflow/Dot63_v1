<?php
class Resques63API{
  public function handleResques63API(){

    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    switch ($data["action"] ?? null) {
      case 'get_API_overview_data':
        $this->getAPIOverviewData($data);
        break;

      default:
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['response' => false, 'error' => 'Unsupported action']);
        break;
    }
  }

  private function getAPIOverviewData(){
    $connection = new Database();
    $product = new Products($connection);
    $result = $product->generate_sku();


    echo json_encode ($result);
  }

}
include "../../controller/config/database.php";
include_once "../../model/products.php"; // modelo correcto

if ($payload = (json_decode(file_get_contents("php://input"), true) ?? [])) {
  $apiHandler = new Resques63API();
  $apiHandler->handleResques63API();
}
?>
