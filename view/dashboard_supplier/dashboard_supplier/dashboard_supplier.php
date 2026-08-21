<?php
$cssTime = filemtime('../../view/dashboard_supplier/dashboard_supplier/dashboard_supplier.css');
$jsTime  = filemtime('../../view/dashboard_supplier/dashboard_supplier/dashboard_supplier.js');
?>
<link rel="stylesheet" href="../../view/dashboard_supplier/dashboard_supplier/dashboard_supplier.css?v=<?= $cssTime ?>">

<main class="dashboard_supplier" aria-labelledby="dashboard_supplier-title">
  <header class="ds-header">
    <div class="ds-heading">
      <p class="ds-eyebrow">Supplier workspace</p>
      <h1 id="dashboard_supplier-title">Supplier Dashboard</h1>
      <p class="ds-subtitle">Track orders, manage your catalogue and keep every product moving from setup to production.</p>
    </div>
    <div class="ds-actions">
      <button id="button_new_product" class="btn btn-primary" type="button">+ New Product</button>
      <a class="btn" href="../../view/products_supplier/index.php">View products</a>
    </div>
  </header>

  <section class="ds-grid">
    <article class="card stat">
      <h2>Open Orders</h2>
      <p class="stat-num">12</p>
      <small class="muted">+2 since yesterday</small>
    </article>

    <article class="card stat">
      <h2>In Production</h2>
      <p class="stat-num">7</p>
      <small class="muted">3 due today</small>
    </article>

    <article class="card stat">
      <h2>Pending Proofs</h2>
      <p class="stat-num">4</p>
      <small class="muted">Approval required</small>
    </article>

    <a href="../../view/messages/index.php" aria-label="Open messages">
      <article class="card stat">
        <h2>Messages</h2>
        <p class="stat-num">3</p>
        <small class="muted">2 unread</small>
      </article>
    </a>
  </section>
  <section class="ds-columns">
    <div class="card catalog-card" aria-labelledby="catalog-browser-title">
      <div class="catalog-toolbar">
        <button id="catalog-back" class="catalog-back" type="button" hidden aria-label="Back to the previous level">
          <span aria-hidden="true">←</span> Back
        </button>
        <div>
          <p class="catalog-eyebrow">Product catalogue</p>
          <h2 id="catalog-browser-title">Categories</h2>
        </div>
      </div>

      <p id="catalog-description" class="catalog-description">Select a category to view its groups.</p>
      <div id="catalog-status" class="catalog-status" role="status" aria-live="polite"></div>
      <div id="catalog-list" class="catalog-list" aria-live="polite"></div>
    </div>

    <!-- Lateral: perfil y acciones rápidas -->
    <aside class="card profile" aria-labelledby="profile-title">
      <h2 id="profile-title" class="sr-only">Supplier Profile</h2>

      <div class="profile-row">
        <div class="avatar" aria-hidden="true">S</div>
        <div>
          <p class="title">Supplier Name</p>
          <p class="muted">supplier@example.com</p>
        </div>
      </div>

      <ul class="meta">
        <li><span>Company:</span> Demo Company Ltd</li>
        <li><span>Country:</span> Colombia</li>
        <li><span>City:</span> Arbeláez</li>
      </ul>

      <div class="quick-links">
        <a id="open-supplier-dashboard" class="btn btn-block" >Supplier Profile</a>
        <a class="btn btn-block" href="#">Manage Promotions</a>
        <a class="btn btn-block" href="#">Download Reports</a>
      </div>

    </aside>
  </section>
</main>

<script src="../../view/dashboard_supplier/dashboard_supplier/dashboard_supplier.js?v=<?= $jsTime ?>"></script>
