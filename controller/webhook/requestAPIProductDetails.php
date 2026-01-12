<?php
//require '../../controller/assets/vendor/autoload.php';

$token = $_SERVER['HTTP_X_API_TOKEN'] ?? ($_GET['token'] ?? ($_POST['token'] ?? null));

if (!$token) {
  http_response_code(401);
  echo json_encode(["ok" => false, "error" => "Unauthorized"]);
  exit;
}

echo json_encode(["ok" => true, "msg" => "Acceso permitido"]);
exit;

?>
