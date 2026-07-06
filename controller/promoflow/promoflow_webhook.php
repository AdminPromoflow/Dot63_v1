<?php

class Resques63API
{
  public function handleResques63API()
  {
    header('Content-Type: application/json; charset=utf-8');

    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    if (!is_array($data)) {
      echo json_encode([
        'success' => false,
        'error' => 'Invalid JSON payload.'
      ]);
      exit;
    }

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

      case 'publish_product':
        $this->publishProduct($data);
        break;

      case 'get_variation_children_by_id':
        $this->getVariationChildrenById($data);
        break;

      case 'get_variation_prices':
        $this->getVariationPrices($data);
        break;

        case 'get_suppliers':
          $this->getSuppliers($data);
          break;

      default:
        echo json_encode([
          'success' => false,
          'error' => 'Unsupported action.'
        ]);
        break;
    }

    exit;
  }

  private function getSuppliers($data)
  {
    echo json_encode("biueno al menos entramos");exit;
    $connection = new Database();
    $user = new Users($connection);

    $result = $user->getAllUsers();

    echo json_encode($result);
    exit;
  }

  private function approveProduct($data)
  {
    if (empty($data['sku'])) {
      echo json_encode([
        'success' => false,
        'message' => 'SKU is missing.'
      ]);
      exit;
    }

    $connection = new Database();
    $product = new Products($connection);
    $product->setSku($data['sku']);

    $result = $product->approveProductWithSKU();

    echo json_encode($result);
    exit;
  }

  private function getAPIOverviewData($data)
  {
    $connection = new Database();
    $product = new Products($connection);

    $result = $product->getPendingProducts();

    echo json_encode($result);
    exit;
  }

  private function publishProduct($data)
  {
    if (empty($data['sku'])) {
      echo json_encode([
        'success' => false,
        'message' => 'SKU is missing.'
      ]);
      exit;
    }

    $connection = new Database();
    $product = new Products($connection);
    $product->setSku($data['sku']);

    $result = $product->approveProductWithSKU();

    //
    // $result = $product->getDataForSendEmail();
    //
    // if (empty($result['success'])) {
    //   echo json_encode([
    //     'success' => false,
    //     'message' => 'Could not get product data.'
    //   ]);
    //   exit;
    // }
    //
    // $emailData = $result['data'];
    //
    // $emailSender = new EmailsSender();
    //
    // $emailSender->setRecipientEmail('admin@promoflow.net');
    // $emailSender->setRecipientName('Admin');
    //
    // $emailSender->setProductName($emailData['product_name']);
    // $emailSender->setProductSku($emailData['product_sku']);
    // $emailSender->setSupplierName($emailData['supplier_name']);
    // $emailSender->setSupplierEmail($emailData['supplier_email']);
    //
    // $emailSent = $emailSender->sendEmailProductApprovalNotice();
    //
    // echo json_encode([
    //   'success' => $emailSent,
    //   'message' => $emailSent
    //     ? 'Email sent successfully.'
    //     : 'Email could not be sent.'
    // ]);
    // exit;
  }

  private function getPreviewProductDetails($data)
  {
    if (empty($data['sku'])) {
      echo json_encode([
        'success' => false,
        'message' => 'SKU is missing.'
      ]);
      exit;
    }

    $connection = new Database();
    $user = new Users($connection);
    $user->setSKU($data['sku']);
    $company = $user->getUserCompanyBySKU();

    $connection = new Database();
    $category = new Categories($connection);
    $category->setSKU($data['sku']);
    $category_name = $category->getCategoryNameBySKU();

    $connection = new Database();
    $group = new Groups($connection);
    $group->setSKU($data['sku']);
    $group_name = $group->getGroupNameBySKU();

    $connection = new Database();
    $product = new Products($connection);
    $product->setSku($data['sku']);
    $product_details = $product->getProductDetailsBySKU();

    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setSku($data['sku']);
    $variation_details = $variation->getVariationsIdBySKUProduct();

    echo json_encode([
      $company,
      $category_name,
      $group_name,
      $product_details,
      $variation_details
    ]);
    exit;
  }

  private function getVariationChildrenById($data)
  {
    if (empty($data['variation_id'])) {
      echo json_encode([
        'success' => false,
        'message' => 'Variation ID is missing.'
      ]);
      exit;
    }

    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setVariationId($data['variation_id']);
    $childVariations = $variation->getVariationChildrenById();

    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setVariationId($data['variation_id']);
    $currentVariationData = $variation->getDetailsCurrentVariationById();

    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setVariationId($data['variation_id']);
    $variationTypes = $variation->getTypeVariationsChildByVariationId();

    $connection = new Database();
    $variation = new Variation($connection);
    $variation->setVariationId($data['variation_id']);
    $variationTypesForDelete = $variation->getTypeVariationsChildByVariationIdForDelete();

    echo json_encode([
      'childVariations' => $childVariations,
      'currentVariationData' => $currentVariationData,
      'variationTypes' => $variationTypes,
      'variationTypesForDelete' => $variationTypesForDelete
    ]);
    exit;
  }

  private function getVariationPrices($data)
  {
    if (empty($data["ids"]) || !is_array($data["ids"])) {
      echo json_encode([
        'success' => false,
        'message' => 'Variation IDs are missing.'
      ]);
      exit;
    }

    $connection = new Database();
    $prices = new Prices($connection);

    $arrayPrices = [];

    foreach ($data["ids"] as $id) {
      $id = (int) $id;

      if ($id <= 0) {
        continue;
      }

      $prices->setVariationId($id);
      $prices->setMaxQuantity($data["max_quantity"] ?? null);

      $price = $prices->getPricesByIdVariation();

      if ($price === null) {
        continue;
      }

      $arrayPrices[] = [
        'variation_id' => $id,
        'price' => $price
      ];
    }

    echo json_encode([
      'success' => true,
      'prices' => $arrayPrices
    ]);
    exit;
  }
}

include "../../controller/config/database.php";

include "../../model/products.php";
include "../../model/users.php";
include "../../model/categories.php";
include "../../model/groups.php";
include "../../model/variations.php";
include "../../model/prices.php";

include "../../controller/products/variations.php";
include "../../controller/emails/emails_sender.php";

$payload = json_decode(file_get_contents("php://input"), true);

if (is_array($payload)) {
  $apiHandler = new Resques63API();
  $apiHandler->handleResques63API();
} else {
  header('Content-Type: application/json; charset=utf-8');

  echo json_encode([
    'success' => false,
    'error' => 'No valid payload received.'
  ]);

  exit;
}

?>
