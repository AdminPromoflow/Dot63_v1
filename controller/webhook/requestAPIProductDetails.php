<?php
header('Content-Type: application/json; charset=utf-8');

$data = json_decode(file_get_contents('php://input'), true) ?? [];

$action = $data['action'] ?? null;

echo json_encode([
  "ok" => true,
  "action" => $action,
  "msg" => "Acceso permitido"
]);
exit;
?>
