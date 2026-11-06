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
  <section class="ds-columns ds-orders-layout" aria-label="Customer orders workspace">
    <div class="card ds-orders" aria-labelledby="supplier-orders-title">
      <header class="ds-orders-header">
        <div>
          <p class="ds-orders-eyebrow">Your order workspace</p>
          <h2 id="supplier-orders-title">Customer orders</h2>
          <p>Orders placed by customers with your business will appear here.</p>
        </div>
        <span class="ds-orders-badge">Coming soon</span>
      </header>

      <div class="ds-orders-table-wrap">
        <table class="ds-orders-table">
          <caption class="sr-only">Future customer orders for this supplier</caption>
          <thead>
            <tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Total</th></tr>
          </thead>
          <tbody>
            <tr><td colspan="5">
              <div class="ds-orders-empty">
                <div class="ds-orders-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
                    <path d="M15 9h-4v32h26V9h-4M18 7h12v7H18zM17 23h14M17 30h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3>A dedicated space for your orders</h3>
                <p>Customer details, ordered products and delivery progress will be brought together in one place.</p>
                <span class="ds-orders-note">Order management will be available here soon.</span>
              </div>
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <aside class="card ds-order-guide" aria-labelledby="order-guide-title">
      <p class="ds-orders-eyebrow">From request to delivery</p>
      <h2 id="order-guide-title">Every step, in one place</h2>
      <p>A preview of the order stages you’ll be able to follow.</p>
      <ol class="ds-order-stages">
        <li><span aria-hidden="true">01</span><div><h3>New order</h3><p>Customer information and order requirements.</p></div></li>
        <li><span aria-hidden="true">02</span><div><h3>In production</h3><p>Preparation and production progress.</p></div></li>
        <li><span aria-hidden="true">03</span><div><h3>Ready to ship</h3><p>Dispatch details and delivery updates.</p></div></li>
        <li><span aria-hidden="true">04</span><div><h3>Completed</h3><p>Delivered orders and their history.</p></div></li>
      </ol>
    </aside>
  </section>
</main>

<script src="../../view/dashboard_supplier/dashboard_supplier/dashboard_supplier.js?v=<?= $jsTime ?>"></script>
