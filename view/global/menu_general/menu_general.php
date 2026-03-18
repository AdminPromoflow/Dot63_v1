<?php
$cssTime = filemtime('../../view/global/menu_general/menu_general.css');
$jsTime = filemtime('');
?>
<link rel="stylesheet" href="../../view/global/menu_general/menu_general.css?v=<?= $cssTime ?>">

<header class="site-header">
  <a class="brand" href="../../view/main/index.php" aria-label="Inicio">
    <h1 class="brand-text">.63</h1>
  </a>

  <input type="checkbox" id="nav-toggle" class="nav-toggle" hidden>

  <label for="nav-toggle" class="burger" aria-label="Abrir menú" aria-controls="site-nav"></label>

  <nav id="site-nav" class="nav">
    <ul class="nav-list">
      <li><a href="../../view/product/index.php">Product</a></li>
      <li><a href="../../view/about_us/index.php">About Us</a></li>
      <li><a class="cta" href="../../view/sign_up/index.php">Log out</a></li>
    </ul>
  </nav>
</header>
