<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="description" content="palabras........" />
  <meta name="author" content="Promoflow" />
  <meta name="keywords" content="palabras claves..........." />

  <title>Product</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet" />

  <link rel="icon" type="image/png" href="/assets/img/favicon.png" />

  <link rel="stylesheet" href="../../view/products_supplier/style.css?v=<?php echo filemtime("../../view/products_supplier/style.css"); ?>">
</head>

<body class="body_product">
  <?php include "../../view/global/menu_supplier/menu_general.php"; ?>
  <?php include "../../view/products_supplier/navigation/navigation.php" ?>
  <?php include "../../view/products_supplier/products/article.php";?>
  <?php include "../../view/global/supplier_ui/supplier_ui.php"; ?>
</body>
</html>
