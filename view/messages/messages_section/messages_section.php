<?php
$cssPath = '../../view/messages/messages_section/messages_section.css';
$jsPath  = '../../view/messages/messages_section/messages_section.js';
$jsPathLogic  = '../../view/messages/messages_section/messages_logics.js';

$cssV = is_file($cssPath) ? filemtime($cssPath) : time();
$jsV  = is_file($jsPath)  ? filemtime($jsPath)  : time();
$jsVLogic  = is_file($jsPathLogic)  ? filemtime($jsPathLogic)  : time();
?>

<link rel="stylesheet" href="<?= $cssPath ?>?v=<?= $cssV ?>">

<section class="msg-shell">

  <aside class="msg-sidebar" aria-label="Message conversation">

    <div class="msg-brand">
      <h2>Messaging</h2>
      <p>Live conversation</p>
    </div>

    <button id="open-create-case" class="msg-btn msg-btn-primary" type="button">
      + Create Case
    </button>

    <nav id="group_cases" class="msg-folders" aria-label="Conversations">
      <p class="msg-empty">Loading cases...</p>
    </nav>

  </aside>

  <main class="msg-main">

    <header class="msg-topbar">
      <h1 class="msg-title">Inbox</h1>
    </header>

    <section class="msg-reader" aria-label="Selected message">

      <article class="msg-preview">
        <div class="msg-preview-head">
          <h3 id="selected-case-title">No case selected</h3>
          <p id="selected-case-subtitle" class="msg-muted">
            Select a case to view the conversation.
          </p>
        </div>

        <div class="msg-preview-body msg-preview-body-empty" id="msg-preview-body">
          <p class="msg-empty">Select a case to view the conversation.</p>
        </div>
      </article>

      <form class="msg-inputbar is-disabled" id="msg-form-promoflow" autocomplete="off">
        <input
          id="msg-input-promoflow"
          class="msg-input"
          type="text"
          placeholder="Select a case before writing a message…"
          disabled
        >

        <button id="send_promoflow" class="msg-btn msg-btn-primary" type="submit" disabled>
          Send
        </button>
      </form>

    </section>

  </main>

</section>

<!-- Create Case Modal -->
<div id="create-case-modal" class="msg-case-modal" hidden>
  <div class="msg-case-modal-card" role="dialog" aria-modal="true" aria-labelledby="create-case-title">

    <div class="msg-case-modal-header">
      <h3 id="create-case-title">Create New Case</h3>

      <button id="close-create-case" class="msg-btn msg-btn-close" type="button" aria-label="Close">
        ✕
      </button>
    </div>

    <form id="create-case-form" class="msg-case-form" autocomplete="off">

      <label class="msg-case-field">
        <span>Case name</span>
        <input
          id="case-name"
          name="case_name"
          type="text"
          placeholder="Example: Approval request"
          required
        >
      </label>

      <label class="msg-case-field">
        <span>Supplier</span>

        <select id="case-supplier" name="id_supplier" required>
          <option value="">Select supplier</option>
        </select>
      </label>

      <div class="msg-case-modal-footer">
        <button id="cancel-create-case" class="msg-btn" type="button">
          Cancel
        </button>

        <button id="create_case_btn" class="msg-btn msg-btn-primary" type="submit">
          Create Case
        </button>
      </div>

    </form>

  </div>
</div>

<script defer src="<?= $jsPathLogic ?>?v=<?= $jsVLogic ?>"></script>
<script defer src="<?= $jsPath ?>?v=<?= $jsV ?>"></script>
