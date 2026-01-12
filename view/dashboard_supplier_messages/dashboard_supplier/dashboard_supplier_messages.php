<?php
$cssTime = filemtime('../../view/dashboard_supplier_messages/dashboard_supplier/dashboard_supplier_messages.css');
$jsTime  = filemtime('../../view/dashboard_supplier_messages/dashboard_supplier/dashboard_supplier_messages.js');
?>
<link rel="stylesheet" href="../../view/dashboard_supplier_messages/dashboard_supplier/dashboard_supplier_messages.css?v=<?= $cssTime ?>">

<main class="dashboard_supplier Messages" aria-labelledby="messages-title">
  <header class="ds-header">
    <h1 id="messages-title">Messages from Promoflow</h1>
    <div class="ds-actions">
      <button class="btn btn-primary" type="button" id="btn-refresh-messages">Refresh</button>
      <button class="btn" type="button" id="btn-mark-all-read">Mark all as read</button>
    </div>
  </header>

  <section class="messages-layout">
    <!-- ===== Sidebar: lista de mensajes ===== -->
    <aside class="card messages-sidebar" aria-labelledby="messages-inbox-title">
      <header class="messages-sidebar__header">
        <div>
          <h2 id="messages-inbox-title">Inbox</h2>
          <p class="muted">Messages sent from Promoflow</p>
        </div>

        <div class="messages-filters" role="tablist" aria-label="Message filters">
          <button class="pill is-active" type="button" data-filter="all">All</button>
          <button class="pill" type="button" data-filter="unread">Unread</button>
          <button class="pill" type="button" data-filter="approval">Approvals</button>
          <button class="pill" type="button" data-filter="system">System</button>
        </div>
      </header>

      <ul class="messages-list" id="messagesList">
        <!-- Ejemplo 1 -->
        <li class="msg-item is-unread is-active"
            data-status="unread"
            data-type="approval"
            data-thread="thread-1">
          <div class="msg-item__top">
            <span class="msg-from">Promoflow</span>
            <span class="msg-time">Today · 10:32</span>
          </div>
          <div class="msg-item__subject">
            Category approval: “Custom Gadgets”
          </div>
          <div class="msg-item__preview">
            Please review and confirm the new category you sent: “Custom Gadgets”…
          </div>
          <div class="msg-item__tags">
            <span class="msg-badge msg-badge--approval">Category</span>
            <span class="msg-badge msg-badge--priority">Action required</span>
          </div>
        </li>

        <!-- Ejemplo 2 -->
        <li class="msg-item is-unread"
            data-status="unread"
            data-type="system"
            data-thread="thread-2">
          <div class="msg-item__top">
            <span class="msg-from">Promoflow System</span>
            <span class="msg-time">Today · 09:05</span>
          </div>
          <div class="msg-item__subject">
            New order assigned: #10234
          </div>
          <div class="msg-item__preview">
            You have a new order waiting for production. Please check lead time and confirm the ship-by date…
          </div>
          <div class="msg-item__tags">
            <span class="msg-badge msg-badge--system">System</span>
            <span class="msg-badge">Orders</span>
          </div>
        </li>

        <!-- Ejemplo 3 -->
        <li class="msg-item"
            data-status="read"
            data-type="approval"
            data-thread="thread-3">
          <div class="msg-item__top">
            <span class="msg-from">Promoflow</span>
            <span class="msg-time">Yesterday · 17:20</span>
          </div>
          <div class="msg-item__subject">
            Proof approved: “Custom Lanyard 20mm”
          </div>
          <div class="msg-item__preview">
            Your artwork proof for “Custom Lanyard 20mm - 2 colours, 2 sides” has been approved…
          </div>
          <div class="msg-item__tags">
            <span class="msg-badge msg-badge--approval">Proof</span>
          </div>
        </li>

        <!-- Ejemplo 4 -->
        <li class="msg-item"
            data-status="read"
            data-type="system"
            data-thread="thread-4">
          <div class="msg-item__top">
            <span class="msg-from">Promoflow System</span>
            <span class="msg-time">2025-09-10</span>
          </div>
          <div class="msg-item__subject">
            Status update: Order #10232 shipped
          </div>
          <div class="msg-item__preview">
            We have marked order #10232 as shipped. Tracking information is now visible…
          </div>
          <div class="msg-item__tags">
            <span class="msg-badge msg-badge--system">System</span>
            <span class="msg-badge">Shipping</span>
          </div>
        </li>
      </ul>
    </aside>

    <!-- ===== Panel derecho: hilo/conversación ===== -->
    <section class="card messages-thread"
             aria-labelledby="messages-thread-title"
             aria-live="polite">
      <!-- Hilo 1 por defecto -->
      <div class="messages-thread__content is-visible" id="thread-1">
        <header class="messages-thread__header">
          <div>
            <h2 id="messages-thread-title" data-thread-title>
              Category approval: “Custom Gadgets”
            </h2>
            <p class="muted" data-thread-meta>
              From Promoflow · Today · 10:32 · Reference: CAT-2025-0911-01
            </p>
          </div>
          <div class="messages-thread__actions">
            <button class="btn btn-small" type="button" data-action="mark-read">
              Mark as read
            </button>
            <button class="btn btn-small" type="button" data-action="archive">
              Archive
            </button>
          </div>
        </header>

        <div class="messages-thread__body">
          <article class="msg-bubble is-incoming">
            <header class="msg-bubble__header">
              <span class="msg-from">Promoflow</span>
              <span class="msg-time">Today · 10:32</span>
            </header>
            <p>
              Hi! We have received your request for the new category
              <strong>“Custom Gadgets”</strong> in your supplier catalogue.
            </p>
            <p>
              Before we make this category available to buyers, please confirm:
            </p>
            <ul>
              <li>The type of products you will list in this category.</li>
              <li>Standard production times (average lead time).</li>
              <li>Any minimum order quantity (MOQ) for these products.</li>
            </ul>
            <p>
              Once you confirm, Promoflow will review and approve the category,
              so you can start assigning products to it.
            </p>
          </article>

          <article class="msg-bubble is-outgoing">
            <header class="msg-bubble__header">
              <span class="msg-from">You</span>
              <span class="msg-time">Today · 10:40</span>
            </header>
            <p>
              Hi Promoflow, thanks for your message. In this category we will list
              <strong>custom promotional gadgets</strong> (keyrings, USB sticks, etc.).
              Lead time is normally <strong>7–10 working days</strong> and MOQ starts at
              <strong>50 units</strong>.
            </p>
            <p>
              Please let us know if you need any other information.
            </p>
          </article>
        </div>

        <form class="messages-compose" id="messagesCompose" autocomplete="off">
          <label for="message-reply" class="sr-only">Reply to Promoflow</label>
          <textarea id="message-reply"
                    name="message-reply"
                    rows="4"
                    placeholder="Write a reply to Promoflow…"></textarea>
          <div class="messages-compose__actions">
            <button class="btn btn-primary btn-small" type="submit">
              Send to Promoflow
            </button>
          </div>
        </form>
      </div>

      <!-- Hilo 2 -->
      <div class="messages-thread__content" id="thread-2" hidden>
        <header class="messages-thread__header">
          <div>
            <h2>New order assigned: #10234</h2>
            <p class="muted">
              From Promoflow System · Today · 09:05
            </p>
          </div>
          <div class="messages-thread__actions">
            <button class="btn btn-small" type="button" data-action="mark-read">
              Mark as read
            </button>
          </div>
        </header>

        <div class="messages-thread__body">
          <article class="msg-bubble is-incoming">
            <header class="msg-bubble__header">
              <span class="msg-from">Promoflow System</span>
              <span class="msg-time">Today · 09:05</span>
            </header>
            <p>
              A new order <strong>#10234</strong> has been assigned to your account.
            </p>
            <p>
              Please review the items and confirm production start date. Remember to
              keep your lead times updated so buyers can see realistic delivery dates.
            </p>
          </article>
        </div>
      </div>

      <!-- Hilo 3 -->
      <div class="messages-thread__content" id="thread-3" hidden>
        <header class="messages-thread__header">
          <div>
            <h2>Proof approved: “Custom Lanyard 20mm”</h2>
            <p class="muted">
              From Promoflow · Yesterday · 17:20
            </p>
          </div>
        </header>

        <div class="messages-thread__body">
          <article class="msg-bubble is-incoming">
            <header class="msg-bubble__header">
              <span class="msg-from">Promoflow</span>
              <span class="msg-time">Yesterday · 17:20</span>
            </header>
            <p>
              Your artwork proof for <strong>“Custom Lanyard 20mm - 2 colours, 2 sides”</strong>
              has been <strong>approved</strong>. You can now move this job into production.
            </p>
          </article>
        </div>
      </div>

      <!-- Hilo 4 -->
      <div class="messages-thread__content" id="thread-4" hidden>
        <header class="messages-thread__header">
          <div>
            <h2>Status update: Order #10232 shipped</h2>
            <p class="muted">
              From Promoflow System · 2025-09-10
            </p>
          </div>
        </header>

        <div class="messages-thread__body">
          <article class="msg-bubble is-incoming">
            <header class="msg-bubble__header">
              <span class="msg-from">Promoflow System</span>
              <span class="msg-time">2025-09-10 · 14:05</span>
            </header>
            <p>
              Order <strong>#10232</strong> has been marked as <strong>shipped</strong>
              in Promoflow. Tracking details are now visible to the buyer.
            </p>
          </article>
        </div>
      </div>
    </section>
  </section>
</main>

<script src="../../view/dashboard_supplier_messages/dashboard_supplier/dashboard_supplier_messages.js?v=<?= $jsTime ?>"></script>
