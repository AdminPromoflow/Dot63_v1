<?php
$navCssTime = filemtime('../../view/about_us/navigation/navigation.css');
?>
<link rel="stylesheet" href="../../view/about_us/navigation/navigation.css?v=<?= $navCssTime ?>">

<section class="nav-section" aria-label="Page navigation">
  <nav class="nav-breadcrumbs" aria-label="Breadcrumb">
    <ol class="nav-breadcrumbs__list">
      <li class="nav-breadcrumbs__item">
        <a class="nav-breadcrumbs__link" href="../../view/dashboard_supplier/index.php">
          Dashboard Supplier
        </a>
      </li>

      <li class="nav-breadcrumbs__item">
        <span class="nav-breadcrumbs__current" aria-current="page">
          Variations
        </span>
      </li>
    </ol>
  </nav>
</section>
