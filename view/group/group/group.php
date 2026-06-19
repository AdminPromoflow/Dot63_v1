<?php
$cssTime = filemtime('../../view/group/group/group.css');
$jsTime  = filemtime('../../view/group/group/group.js');
?>
<link rel="stylesheet" href="../../view/group/group/group.css?v=<?= $cssTime ?>">

<main class="create_product" aria-labelledby="cp-title">
  <h1 id="cp-title" class="sr-only">Create Product</h1>

  <?php include "../../view/global/header_add_product/header_add_product.php" ?>

  <section class="cp-card" aria-labelledby="cp-group-title">
    <header class="cp-card-header">
      <div>
        <h2 id="cp-group-title">Groups</h2>
        <br>
        <p class="cp-subtitle">Choose an existing group</p>
      </div>
    </header>

    <div class="cp-group-wrapper">
      <div class="cp-group-grid" id="group_list" role="list"></div>

      <p class="cp-group-hint">Click a group to assign it to this product.</p>
      <br>
    </div>

    <hr class="cp-sep" aria-hidden="true">
  </section>

  <div class="cp-footer">
    <button class="btn btn-back" id="btn_back_groups" type="button">
      ← Back
    </button>

    <button class="btn btn-edit-groups" id="edit_groups" type="button">
      Edit Groups
    </button>

    <button class="btn btn-cancel-editing" id="cancel_editing" type="button">
      Cancel Editing
    </button>

    <button class="btn btn-next" id="next_group" type="button">
      Next
    </button>
  </div>
</main>

<script src="../../view/group/group/group.js?v=<?= $jsTime ?>"></script>
