<?php
declare(strict_types=1);

$navCssFs = __DIR__ . '/navigation.css';
$navCssPublic = '../../view/about_us/navigation/navigation.css';
$navCssV = is_file($navCssFs) ? filemtime($navCssFs) : time();

$breadcrumbs = $breadcrumbs ?? [
  ['label' => 'Dashboard Supplier', 'href' => '../../view/dashboard_supplier/index.php'],
  ['label' => 'Category', 'href' => null],
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
          $isLast = ($i === count($breadcrumbs) - 1);
        ?>

        <li class="nav-breadcrumbs__item">
          <?php if (!$isLast && is_string($href) && $href !== ''): ?>
            <a class="nav-breadcrumbs__link" href="<?= htmlspecialchars($href, ENT_QUOTES, 'UTF-8') ?>">
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
