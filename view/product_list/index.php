<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="description" content="" />
  <meta name="author" content="Promoflow" />
  <meta name="keywords" content="" />
  <title>Product List</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet" />

  <link rel="icon" type="image/png" href="/assets/img/favicon.png" />

  <link rel="stylesheet" href="../../view/product_list/style.css?v=<?php echo filemtime("../../view/product_list/style.css"); ?>">
</head>

<body class="body_product_list">
  <script src="../../view/global/security/security_helper.js" type="text/javascript"></script>
  <?php include "../../view/global/menu_supplier/menu_general.php"; ?>
  <?php include "../../view/product_list/product_list/product_list.php";?>
  <?php include "../../view/global/supplier_ui/supplier_ui.php"; ?>
</body>





</html>
