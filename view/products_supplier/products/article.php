<?php

$cssTime = filemtime('../../view/products_supplier/products/article.css');
$jsTime  = filemtime('../../view/products_supplier/products/article.js');
?>
<link rel="stylesheet" href="../../view/products_supplier/products/article.css?v=<?= $cssTime ?>">

<main class="dashboard_supplier" aria-labelledby="products-title">
  <header class="ds-header">
    <div class="ds-heading">
      <p class="ds-eyebrow">Catalogue management</p>
      <h1 id="products-title">Products</h1>
      <p class="ds-subtitle">Search, filter and update the products connected to your supplier account.</p>
    </div>
    <div class="ds-actions">
      <a class="btn" href="../../view/dashboard_supplier/index.php">Back to dashboard</a>
    </div>
  </header>

  <!-- Filtros -->
  <section class="card products__filters" aria-labelledby="filters-title">
    <h2 id="filters-title" class="sr-only">Filters</h2>
    <form id="product-filters" class="products__filters-grid" autocomplete="off">
      <label class="products__field field field--withicon">
        <span>Name / SKU</span>
        <input type="search" name="q" placeholder="Search by name or SKU…" />
        <svg class="infield-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 21l-4.3-4.3M10.8 18.5a7.7 7.7 0 1 1 0-15.4 7.7 7.7 0 0 1 0 15.4z"
                fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </label>

      <label class="products__field field">
        <span>Category</span>
        <select id="list_categories" name="category">
          <option value="">All</option>
        </select>
      </label>

      <label class="products__field field">
        <span>Group</span>
        <select id="list_groups" name="group">
          <option value="">All</option>
        </select>
      </label>

      <label class="products__field field">
        <span>Status</span>
        <select name="status">
          <option value="">All</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Draft</option>
          <option>Archived</option>
        </select>
      </label>

      <div class="products__field products__actions">
        <button class="btn" type="reset">Reset</button>
        <button class="btn btn-primary" type="submit">Apply</button>
      </div>
    </form>
  </section>

  <!-- Listado: SOLO TABLA -->
  <section class="card table-card" aria-labelledby="product-list-title">
    <div class="card-header sticky-blur">
      <h2 id="product-list-title">Product List</h2>
    </div>

    <div class="table-wrap">
      <table class="table products__table" role="table">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Category</th>
            <th scope="col">Group</th>
            <th scope="col" class="center">Status</th>
          </tr>
        </thead>

        <tbody id="products__table">
          <tr><td colspan="4">Loading products…</td></tr>
        </tbody>
      </table>
    </div>

  </section>
</main>

<script src="../../view/products_supplier/products/article.js?v=<?= $jsTime ?>"></script>
