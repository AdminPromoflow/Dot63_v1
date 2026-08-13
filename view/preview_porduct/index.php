<?php
// [Supplier 1] El servidor empieza por este archivo cuando el proveedor abre el preview.
// [Supplier 1.1] Antes de enviar HTML, recuperamos la sesión y confirmamos que el proveedor siga autenticado.
if (session_status() !== PHP_SESSION_ACTIVE) {
  session_start();
}

// [Supplier 1.2] Sin una sesión válida no se carga información privada: se redirige al login y se detiene el archivo.
if (empty($_SESSION['login']) || empty($_SESSION['email'])) {
  header('Location: ../../view/log_inSupplier/index.php');
  exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="description" content="Review your configured product before submitting it for approval." />
  <meta name="author" content="Promoflow" />
  <meta name="keywords" content="" />
  <title>Supplier product preview</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet" />

  <link rel="icon" type="image/png" href="/assets/img/favicon.png" />

  <link rel="stylesheet" href="../../view/product_details/style.css?v=<?php echo filemtime("../../view/product_details/style.css"); ?>">
</head>

<body class="body_product_details">
  <!-- [Supplier 1.3] Primero se agregan el loader global y el menú del proveedor. -->
  <?php include "../../view/global/PageLoader/PageLoader.php"; ?>

  <?php include "../../view/global/menu_supplier/menu_general.php"; ?>

  <!-- [Supplier 1.4] Después se ejecuta preview.php, que crea la interfaz y conecta la lógica JavaScript. -->
  <?php include "../../view/preview_porduct/preview_porduct/preview.php";?>
</body>
</html>
