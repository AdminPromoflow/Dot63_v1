
<?php
$cssTime = filemtime('../../view/global/menu_supplier/menu_general.css'); // ejemplo: '../Home/5.Video/video.css'
$jsTime = filemtime('../../view/global/menu_supplier/menu_general.js');   // ejemplo: '../Home/5.Video/video.js'
?>
<link rel="stylesheet" href="../../view/global/menu_supplier/menu_general.css?v=<?= $cssTime ?>">
<header class="site-header">
  <a class="brand" href="../../view/dashboard_supplier/index.php" aria-label="PromoFlow supplier dashboard">
    <span class="brand-mark"><span>.</span>63</span>
    <span class="brand-copy">
      <strong>PromoFlow</strong>
      <small>Supplier portal</small>
    </span>
  </a>

  <input type="checkbox" id="nav-toggle" class="nav-toggle" hidden>
  <label for="nav-toggle" class="burger" aria-label="Open menu" aria-controls="site-nav">
    <span></span>
  </label>

  <nav id="site-nav" class="nav">
    <ul class="nav-list">
      <li><a href="../../view/dashboard_supplier/index.php">Dashboard</a></li>
      <li><a href="../../view/products_supplier/index.php">Products</a></li>
      <li><button class="cta" id="logout" type="button">Log out</button></li>
    </ul>
  </nav>
</header>
<script src="../../view/global/menu_supplier/menu_general.js?v=<?= $jsTime ?>" type="text/javascript"></script>
