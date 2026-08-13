<?php
// [Customer 1] El servidor empieza por este archivo cuando un cliente abre el producto.
// [Customer 1.1] La sesión se inicia si todavía no existe; aquí no exigimos login porque el catálogo es público.
if (session_status() !== PHP_SESSION_ACTIVE) {
  session_start();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="description" content="Configure product options and review the estimated price." />
  <meta name="author" content="Promoflow" />
  <meta name="keywords" content="" />
  <title>Product details</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet" />

  <link rel="icon" type="image/png" href="/assets/img/favicon.png" />

  <link rel="stylesheet" href="../../view/product_details/style.css?v=<?php echo filemtime("../../view/product_details/style.css"); ?>">
</head>

<body class="body_product_details">
  <!-- [Customer 1.2] Primero se agrega el menú general que verá el cliente. -->
  <?php include "../../view/global/menu_general/menu_general.php"; ?>

  <!-- [Customer 1.3] Después se ejecuta preview.php, que crea la interfaz y conecta la lógica JavaScript. -->
  <?php include __DIR__ . "/preview_porduct/preview.php"; ?>
</body>
</html>
