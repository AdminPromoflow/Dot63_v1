<?php

class Product {
  public function handleProduct(){

    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    switch ($data["action"] ?? null) {
      case 'create_new_product':
        $this->createNewProduct();
        break;

      case 'get_products':
        $this->getProducts();
        break;

      case 'get_products_by_group':
        $this->getProductsByGroup($data);
        break;

      case 'update_products':
        $this->getUpdate();
        break;

      case 'update_category':
        $this->updateCategory($data);
        break;

      case 'update_group':
        $this->updateGroup($data);
        break;

      case 'save_product_details':
        $this->saveProductDetails($data);
        break;

      case 'get_all_products_supplier':
        $this->getProductsBasicBySupplierEmail($data);
        break;

      case 'get_product_details':
        $this->getProductBasicBySKU($data);
        break;

      case 'get_preview_product_details':
        $this->getPreviewProductDetails($data);
        break;

      case 'publish_product':
        $this->publishProduct($data);
        break;

      case 'get_default_variation_by_sku':
      $this->getDefaultVariationBySKU($data);
      break;

      default:
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['response' => false, 'error' => 'Unsupported action']);
        break;
    }
  }

  private function getDefaultVariationBySKU($data){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $product   = new Variation($connection);


    $product->setSku($data['sku'] ?? '');

    $response = $product->getDefaultVariationBySKU();

    echo json_encode($response);
  }


  private function getProductsByGroup($data){
    header('Content-Type: application/json; charset=utf-8');

    if (session_status() !== PHP_SESSION_ACTIVE) {
      session_start();
    }

    $email    = $_SESSION['email'] ?? null;
    $sku     = $data["sku"];

    $connection = new Database();
    $products   = new Products($connection);

    $products->setSku($sku);
    $products->setEmail($email);

    $response = $products->getProductsByGroupId();

    echo json_encode($response);
  }

  private function publishProduct($data){
    header('Content-Type: application/json; charset=utf-8');

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

    $result = $product->getDataForSendEmail();


    $connection = new Database();
    $product = new Products($connection);
    $product->setSku($data['sku']);

    $status = $product->changeStatusForPending();

    if (empty($result['success'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Could not get product data.'
        ]);
        exit;
    }

    $emailData = $result['data'];

    $emailSender = new EmailsSender();

    $emailSender->setRecipientEmail('admin@promoflow.net');
    $emailSender->setRecipientName('Admin');

    $emailSender->setProductName($emailData['product_name']);
    $emailSender->setProductSku($emailData['product_sku']);
    $emailSender->setSupplierName($emailData['supplier_name']);
    $emailSender->setSupplierEmail($emailData['supplier_email']);

    $emailSent = $emailSender->sendEmailProductApprovalNotice();

    echo json_encode([
        'success' => $emailSent,
        'message' => $emailSent
            ? 'Email sent successfully.'
            : 'Email could not be sent.'
    ]);
    exit;
  }

  private function getPreviewProductDetails($data){
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode("response");
  }

  private function getProductBasicBySKU($data){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $product   = new Products($connection);

    $product->setSku($data['sku'] ?? '');
    $response = $product->getProductBasicBySKU();

    echo ($response);
  }

  private function getProductsBasicBySupplierEmail(){
    header('Content-Type: application/json; charset=utf-8');
    $connection = new Database();
    $products   = new Products($connection);

    if (session_status() !== PHP_SESSION_ACTIVE) {
      session_start();
    }

    $products->setEmail($_SESSION['email']);

    $response   = $products->getProductsBasicBySupplierEmail();
    echo ($response);
  }

  private function saveProductDetails($data){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $product   = new Products($connection);

    if (session_status() !== PHP_SESSION_ACTIVE) {
      session_start();
    }

    $product->setId($_SESSION['idProduct']);

    $product->setName($data["name"]);
    $product->setStatus($data["status"]);
    $product->setDescription($data["description"]);
    $product->setTaglineDescription($data["pd_tagline"]);
    $product->setSku($data["sku"]);

    $response = $product->update();

    echo json_encode($response);
  }

  private function updateCategory(array $data) {
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $product    = new Products($connection);

    $sku = isset($data['sku']) ? trim((string)$data['sku']) : '';
    $categoryId = $data['id'] ?? null;

    $product->setSku($sku);
    $product->setCategoryId($categoryId);
    $response = $product->updateCategoryIdBySKU();

    echo json_encode($response);
  }

  private function updateGroup(array $data) {
    header('Content-Type: application/json; charset=utf-8');

    if (session_status() !== PHP_SESSION_ACTIVE) {
      session_start();
    }

    $connection = new Database();
    $product    = new Products($connection);

    $sku = isset($data['sku']) ? trim((string)$data['sku']) : '';
    $group_id = $data['group_id'] ?? null;

    $_SESSION['group_id'] = $group_id;

    $product->setSku($sku);
    $product->setGroupId($group_id);
    $response = $product->updateGroupIdBySKU();

    echo json_encode($response);
  }

  private function createNewProduct(){

    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $products   = new Products($connection);

    $sku = $this->generate_sku();
    $products->setSku($sku);

    if (session_status() !== PHP_SESSION_ACTIVE) {
      session_start();
    }

    $email = $_SESSION['email'] ?? '';
    if ($email === '') {
      echo json_encode(['success' => false, 'error' => 'Email required in session'], JSON_UNESCAPED_UNICODE);
      return;
    }

    $products->setEmail($email);

    $response = $products->create();

    if ($response['success']) {
      $variation = new Variations();
      $response2 = $variation->createDefaultVariation($response['id']);

      if ($response2['success']) {
        $result =  ['success' => true, 'sku' => $response['sku'], 'all_variation' => $response2];

        echo json_encode($result);
      }
    }
  }

  private function generate_sku(string $prefix = 'PRD'): string {
    $dt    = new DateTimeImmutable('now', new DateTimeZone('UTC'));
    $stamp = $dt->format('Ymd-His-u');
    $rand  = strtoupper(bin2hex(random_bytes(5)));
    return sprintf(
      '%s-%s-%s',
      strtoupper(preg_replace('/[^A-Z0-9]/', '', $prefix)),
      $stamp,
      $rand
    );
  }

  private function getProducts(){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $products   = new Products($connection);

    $response   = $products->getProducts();

    echo json_encode($response);
  }

  private function getUpdate(){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $products   = new Products($connection);
    $response   = $products->getAllNames();

    echo ($response);
  }
}

include "../../controller/config/database.php";

include "../../model/products.php";

include "../../controller/products/variations.php";
include "../../controller/emails/send_emails.php";

$productClass = new Product();

$productClass->handleProduct();
