<?php
// Cache-busting robusto (md5 del archivo) con fallback seguro
$base = realpath(__DIR__ . '/../items/items/') ?: (__DIR__ . '/../items/items/');

$cssPath      = $base . 'items.css';
$jsPath       = $base . 'items.js';
$jsLogicPath  = $base . 'items_logic.js';

$cssVer     = file_exists($cssPath)     ? md5_file($cssPath)     : time();
$jsVer      = file_exists($jsPath)      ? md5_file($jsPath)      : time();
$jsLogicVer = file_exists($jsLogicPath) ? md5_file($jsLogicPath) : time();
?>

<link rel="stylesheet" href="../../view/items/items/items.css?v=<?= $cssVer ?>">

<main class="create_product" aria-labelledby="it-title">
  <!-- Tabs -->
  <?php include "../../view/global/header_add_product/header_add_product.php" ?>

  <section class="cp-card cp-section" id="variation_decision_section" aria-labelledby="cp-var-decision-title">
    <header class="cp-card-header">
      <h2 id="cp-var-decision-title">Variations</h2>
    </header>

    <div class="cp-decision">
      <div class="cp-choice">
        <div class="cp-choice-body">
          <div class="cp-actions cp-actions-decision" style="gap:6px; position:relative;">
            <button class="btn btn-ghost" id="menu_btn" type="button" aria-haspopup="true" aria-expanded="false">
              Select variation ▾
            </button>

            <ul id="menu_list" class="cp-menu-list" hidden
              style="position:absolute; right:0; top:110%; list-style:none; margin:0; padding:6px; background:#fff; border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow); min-width:220px; max-height:260px; overflow:auto;">
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>


  <section class="cp-card cp-section" aria-labelledby="cp-items-title">
    <header class="cp-card-header">
      <h2 id="cp-items-title">Items</h2>
    </header>

    <form id="variationItemsForm" class="cp-form" autocomplete="off" novalidate>
      <div class="cp-field cp-field-full">

        <div class="cp-actions">
          <button type="button" class="btn" id="add_item">+ Add item</button>
        </div>

        <div id="items_list" class="cp-list" aria-live="polite" aria-relevant="additions removals"></div>

        <small class="cp-hint">Add short text snippets to be displayed to customers.</small>
      </div>
    </form>
  </section>

  <div class="cp-footer">
    <button class="btn btn-danger" type="button" id="reset_form">Reset</button>
    <div class="cp-footer-actions">
      <button class="btn btn-primary" type="submit" id="save_items" form="variationItemsForm">Save</button>
      <button class="btn" id="next_items" type="button">Save & Next</button>
    </div>
  </div>
</main>

<script src="../../view/items/items/items_logic.js?v=<?= $jsLogicVer ?>" defer></script>
<script src="../../view/items/items/items.js?v=<?= $jsVer ?>" defer></script>
