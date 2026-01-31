<?php
$cssTime = filemtime('../../view/group/group/group.css'); // ejemplo: '../Home/5.Video/video.css'
$jsTime  = filemtime('../../view/group/group/group.js');  // ejemplo: '../Home/5.Video/video.js'
?>
<link rel="stylesheet" href="../../view/group/group/group.css?v=<?= $cssTime ?>">

<!-- =============== Create Product: Group Tab (updated) =============== -->
<main class="create_product" aria-labelledby="cp-title">
  <h1 id="cp-title" class="sr-only">Create Product</h1>

  <?php include "../../view/global/header_add_product/header_add_product.php" ?>

  <!-- Content -->
  <section class="cp-card" aria-labelledby="cp-group-title">
    <header class="cp-card-header">
      <div>
        <h2 id="cp-group-title">Group</h2>
        <p class="cp-subtitle">Choose an existing group or create a new one for this product.</p>
      </div>
      <!--  <div class="cp-actions">
        <input id="cp-search" class="cp-search" type="search" placeholder="Search group…" aria-label="Search group">
      </div>-->
    </header>

    <!-- Existing groups -->
    <div class="cp-group-wrapper">
      <button id="arrow_up_group" class="page_arrow page_arrow--up" type="button" aria-label="Scroll up">▲</button>
      <button id="arrow_down_group" class="page_arrow page_arrow--down" type="button" aria-label="Scroll down">▼</button>
      <div class="cp-group-grid" id="group_list" role="list">
        <div class="cp-group" role="listitem">
          <span class="cp-group-name">Lanyards</span>
          <small class="cp-group-meta">12 products</small>
        </div>
        <div class="cp-group" role="listitem">
          <span class="cp-group-name">Badges</span>
          <small class="cp-group-meta">7 products</small>
        </div>
        <div class="cp-group" role="listitem">
          <span class="cp-group-name">Wristbands</span>
          <small class="cp-group-meta">3 products</small>
        </div>
      </div>

      <p class="cp-group-hint">Click a group to assign it to this product.</p>
    </div>

    <hr class="cp-sep" aria-hidden="true">

    <!-- Create new group inline -->
  <!--  <form id="newGroupForm" class="cp-inline-form" autocomplete="off" novalidate>
      <label class="cp-label" for="new_group">Add new group</label>
      <div class="cp-inline-row">
        <input id="new_group" name="name" type="text" required
               placeholder="Group name"
               aria-describedby="new_group_help">
        <button id="btn-create-new-group" class="btn btn-primary" type="button">Create</button>
      </div>
      <small id="new_group_help" class="cp-hint">
        If your group isn't listed, create a new one here.
      </small>
    </form>-->
  </section>

  <!-- Footer: Next button -->
  <div class="cp-footer">
    <button class="btn btn-danger" id="reset" type="button">Reset</button>
    <div class="cp-footer-actions">
      <button class="btn btn-primary" id="save" type="button">Save</button>
      <button class="btn" id="next_group" type="button">Save & Next</button>
    </div>
  </div>
</main>

<script src="../../view/group/group/group.js?v=<?= $jsTime ?>"></script>
