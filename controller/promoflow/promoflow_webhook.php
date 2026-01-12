<?php



class Resques63API{
  public function handleResques63API(){

    header('Content-Type: application/json; charset=utf-8');

    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $action = $data['action'] ?? null;

    echo json_encode([
      "ok" => true,
      "action" => $action,
      "msg" => "Acceso permitido3"
    ]);
    exit;

    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    switch ($data["action"] ?? null) {
      case 'get_API_overview_data':
        //$this->getAPIOverviewData();
        break;

      default:
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['response' => false, 'error' => 'Unsupported action']);
        break;
    }

  }

  private function getAPIOverviewData(){

  }


}

//if ($payload = (json_decode(file_get_contents("php://input"), true) ?? [])) {
  $apiHandler = new Resques63API();
  $apiHandler->handleResques63API();
//}
?>
