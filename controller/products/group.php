<?php
require_once __DIR__ . "/../security/catalog_access.php";
class Group {
  public function handleGroup(){
    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    CatalogAccess::enforce('group', is_array($data) ? $data : []);

    switch ($data["action"] ?? null) {

      case 'create_new_group':
        $this->createNewGroup($data);
        break;

      case 'get_groups':
        $this->getGroups($data);
        break;

      case 'get_group_selected':
        $this->getGroupSelected($data);
        break;

      default:
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['response' => false, 'error' => 'Unsupported action']);
        break;
    }
  }

  private function getGroupSelected($data){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $group      = new Groups($connection);

    $group->setSKU($data['sku'] ?? '');
    $response = $group->getGroupSelected();

    echo json_encode($response);
  }

  private function createNewGroup($data){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $groups     = new Groups($connection);

    $groups->setName($data['name'] ?? '');
    $response = $groups->create();

    // Obtener ID del grupo recién creado (por nombre)
    $connection = new Database();
    $groups     = new Groups($connection);
    $groups->setName($data['name'] ?? '');

    $idGroup = $groups->getGroupIdByName();

    // Asignar group_id al producto por SKU
    $connection = new Database();
    $product    = new Products($connection);
    $product->setSku($data['sku'] ?? '');
    $product->setGroupId($idGroup);
    $product->updateGroupIdBySKU();

    echo json_encode($response);
  }

  private function getGroups($data){
    header('Content-Type: application/json; charset=utf-8');

    $connection = new Database();
    $groups     = new Groups($connection);
    $groups->setSKU($data['sku'] ?? '');
    $response = $groups->getAllNames();

    $connection = new Database();
    $group = new Groups($connection);
    $group->setSKU($data['sku'] ?? '');
    $groupSelected = $group->getGroupSelected();

    echo json_encode([
      'success' => true,
      'data' => $response,
      'group_selected' => $groupSelected
    ]);
  }
}

require_once "../../controller/config/database.php";
require_once "../../model/groups.php";
require_once "../../model/products.php";

$groupClass = new Group(); // instancia
$groupClass->handleGroup();
