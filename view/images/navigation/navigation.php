<?php
declare(strict_types=1);

/* Filesystem path for filemtime */
$navCssFs = __DIR__ . '/view/images/navigation/navigation.css';

/* Public path used in HTML */
$navCssPublic = '../../view/images/navigation/navigation.css';

/* Cache-busting version */
$navCssV = is_file($navCssFs) ? filemtime($navCssFs) : time();

/*
  Reusable breadcrumb items.
  If href is null, the item is rendered as the current page.
*/
$breadcrumbs = $breadcrumbs ?? [
  ['label' => 'Main', 'href' => '../../view/main/index.php'],
  ['label' => 'Dashboard Supplier', 'href' => '../../view/dashboard_supplier/index.php'],
  ['label' => 'Category', 'href' => '../../view/category/index.php'],
  ['label' => 'Group', 'href' => '../../view/group/index.php'],
  ['label' => 'Product Details', 'href' => '../../view/product_details/index.php'],
  ['label' => 'Variation', 'href' => '../../view/variations/index.php'],
  ['label' => 'Images', 'href' => null],
];
?>

<link rel="stylesheet" href="<?= htmlspecialchars($navCssPublic, ENT_QUOTES, 'UTF-8') ?>?v=<?= $navCssV ?>">

<section class="nav-section" aria-label="Page navigation">
  <nav class="nav-breadcrumbs" aria-label="Breadcrumb">
    <ol class="nav-breadcrumbs__list">
      <?php foreach ($breadcrumbs as $i => $item): ?>
        <?php
          $label  = (string)($item['label'] ?? '');
          $href   = $item['href'] ?? null;
          $isLast = ($i === array_key_last($breadcrumbs));
        ?>

        <li class="nav-breadcrumbs__item">
          <?php if (!$isLast && is_string($href) && $href !== ''): ?>
            <a
              class="nav-breadcrumbs__link"
              href="<?= htmlspecialchars($href, ENT_QUOTES, 'UTF-8') ?>"
            >
              <?= htmlspecialchars($label, ENT_QUOTES, 'UTF-8') ?>
            </a>
          <?php else: ?>
            <span class="nav-breadcrumbs__current" aria-current="page">
              <?= htmlspecialchars($label, ENT_QUOTES, 'UTF-8') ?>
            </span>
          <?php endif; ?>
        </li>
      <?php endforeach; ?>
    </ol>
  </nav>
</section>
