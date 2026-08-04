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

      case 'delete_product':
      $this->deleteProduct($data);
      break;

      default:
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['response' => false, 'error' => 'Unsupported action']);
        break;
    }
  }

  private function deleteProduct($data){
    header('Content-Type: application/json; charset=utf-8');

    $database = new Database();
    $product = new Products($database);
    $product->setSku($data['sku'] ?? '');
    $result = $product->deleteProduct();

    echo json_encode(
        $result,
        JSON_UNESCAPED_UNICODE
    );

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

    if (session_status() !== PHP_SESSION_ACTIVE) {
      session_start();
    }

    $email = strtolower(trim((string)($_SESSION['email'] ?? '')));
    $isLoggedIn = !empty($_SESSION['login']);

    if (!$isLoggedIn || $email === '') {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Your supplier session has expired. Please sign in again.'
        ]);
        exit;
    }

    $sku = trim((string)($data['sku'] ?? ''));
    if ($sku === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'SKU is missing.'
        ]);
        exit;
    }

    $database = new Database();
    $pdo = $database->getConnection();

    $stmt = $pdo->prepare("
      SELECT
        p.product_id,
        p.name AS product_name,
        p.description,
        p.SKU AS product_sku,
        p.status,
        p.is_approved,
        p.group_id,
        COALESCE(s.company_name, s.contact_name, '') AS supplier_name,
        s.email AS supplier_email,
        g.name AS group_name,
        c.name AS category_name,
        (
          SELECT COUNT(*)
          FROM variations v
          WHERE v.product_id = p.product_id
            AND v.type_id IS NOT NULL
            AND TRIM(COALESCE(v.name, '')) <> ''
            AND LOWER(TRIM(v.name)) <> 'default'
        ) AS variations_count,
        (
          SELECT COUNT(*)
          FROM images i
          INNER JOIN variations v ON v.variation_id = i.variation_id
          WHERE v.product_id = p.product_id
            AND TRIM(COALESCE(i.link, '')) <> ''
        ) AS images_count,
        (
          SELECT COUNT(*)
          FROM prices pr
          INNER JOIN variations v ON v.variation_id = pr.variation_id
          WHERE v.product_id = p.product_id
        ) AS prices_count
      FROM products p
      INNER JOIN suppliers s ON s.supplier_id = p.supplier_id
      LEFT JOIN `groups` g ON g.group_id = p.group_id
      LEFT JOIN categories c ON c.category_id = g.category_id
      WHERE LOWER(TRIM(p.SKU)) = LOWER(:sku)
        AND LOWER(TRIM(s.email)) = LOWER(:email)
      LIMIT 1
    ");
    $stmt->execute([
      ':sku' => $sku,
      ':email' => $email,
    ]);
    $productData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$productData) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'This product was not found or does not belong to your account.'
        ]);
        exit;
    }

    if ((int)$productData['is_approved'] === 1) {
        echo json_encode([
            'success' => true,
            'message' => 'This product is already approved.',
            'status' => 'approved',
        ]);
        exit;
    }

    if ((string)$productData['status'] === '2') {
        echo json_encode([
            'success' => true,
            'message' => 'This product has already been submitted for approval.',
            'status' => 'pending_approval',
        ]);
        exit;
    }

    $missing = [];
    if (trim((string)$productData['product_name']) === '') $missing[] = 'product name';
    if (trim((string)$productData['description']) === '') $missing[] = 'product description';
    if (empty($productData['group_id'])
        || ($productData['group_name'] ?? '') === 'Unassigned Group'
        || ($productData['category_name'] ?? '') === 'Unassigned Category') {
        $missing[] = 'category and group';
    }
    if ((int)$productData['variations_count'] <= 0) $missing[] = 'variations';
    if ((int)$productData['images_count'] <= 0) $missing[] = 'images';
    if ((int)$productData['prices_count'] <= 0) $missing[] = 'pricing';

    if (!empty($missing)) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Complete the product before submitting it for approval.',
            'missing' => $missing,
        ]);
        exit;
    }

    $emailSender = new EmailsSender();

    $emailSender->setRecipientEmail('admin@promoflow.net');
    $emailSender->setRecipientName('Admin');

    $emailSender->setProductName($productData['product_name']);
    $emailSender->setProductSku($productData['product_sku']);
    $emailSender->setSupplierName($productData['supplier_name']);
    $emailSender->setSupplierEmail($productData['supplier_email']);

    $emailSent = $emailSender->sendEmailProductApprovalNotice();

    if (!$emailSent) {
      http_response_code(502);
      echo json_encode([
          'success' => false,
          'message' => 'The approval request could not be sent. Your product remains a draft.'
      ]);
      exit;
    }

    $stmt = $pdo->prepare("
      UPDATE products
      SET status = '2'
      WHERE product_id = :product_id
        AND (status IS NULL OR status <> '2')
      LIMIT 1
    ");
    $updated = $stmt->execute([
      ':product_id' => (int)$productData['product_id'],
    ]);

    if (!$updated) {
      http_response_code(500);
      echo json_encode([
          'success' => false,
          'message' => 'The request was emailed, but the product status could not be updated. Please contact support.'
      ]);
      exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Product submitted for approval successfully.',
        'status' => 'pending_approval',
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
