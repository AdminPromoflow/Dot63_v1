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
      <h2>Messages</h2>
      <p>A space to keep work moving.</p>
    </div>

    <label class="msg-search">Search conversations<input id="msg-search" type="search" placeholder="Search by case name…"></label>
    <nav id="group_cases" class="msg-folders" aria-label="Conversations">
      <p class="msg-empty">Loading cases...</p>
    </nav>

  </aside>

  <main class="msg-main">

    <header class="msg-topbar">
      <div><span class="msg-eyebrow">WORKSPACE / CONVERSATIONS</span><h1 class="msg-title">Inbox</h1></div>

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

      <p id="msg-feedback" role="status" aria-live="polite" hidden></p>
      <form class="msg-inputbar is-disabled" id="msg-form-promoflow" autocomplete="off">
        <input
          id="msg-input-promoflow"
          class="msg-input"
          type="text"
          aria-label="Message"
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

<script defer src="<?= $jsPath ?>?v=<?= $jsV ?>"></script>
