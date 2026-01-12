<?php
//require '../../controller/assets/vendor/autoload.php';

header('Content-Type: application/json; charset=utf-8');

echo json_encode(["ok" => true, "msg" => "Acceso permitido"]);
exit;

?>
