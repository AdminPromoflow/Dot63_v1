<?php
$cssTime = filemtime('../../view/snake/snake/snake.css');
$logicTime = filemtime('../../view/snake/snake/snake_logic.js');
$jsTime = filemtime('../../view/snake/snake/snake.js');
?>
<link rel="stylesheet" href="../../view/snake/snake/snake.css?v=<?= $cssTime ?>">

<main class="snake_page" aria-labelledby="snake-title">
  <section class="snake_panel">
    <header class="snake_header">
      <div>
        <h1 id="snake-title">Snake</h1>
        <p class="snake_meta">Score <span id="snake-score">0</span></p>
      </div>

      <div class="snake_actions">
        <button id="snake-pause" class="snake_button" type="button">Pause</button>
        <button id="snake-restart" class="snake_button snake_button_primary" type="button">Restart</button>
      </div>
    </header>

    <div id="snake-board" class="snake_board" role="grid" aria-label="Snake board"></div>

    <div class="snake_footer">
      <p id="snake-status" class="snake_status" aria-live="polite">Ready</p>

      <div class="snake_controls" aria-label="Snake controls">
        <button class="snake_control snake_control_up" type="button" data-direction="up" aria-label="Move up">&#9650;</button>
        <button class="snake_control snake_control_left" type="button" data-direction="left" aria-label="Move left">&#9664;</button>
        <button class="snake_control snake_control_down" type="button" data-direction="down" aria-label="Move down">&#9660;</button>
        <button class="snake_control snake_control_right" type="button" data-direction="right" aria-label="Move right">&#9654;</button>
      </div>
    </div>
  </section>
</main>

<script src="../../view/snake/snake/snake_logic.js?v=<?= $logicTime ?>"></script>
<script src="../../view/snake/snake/snake.js?v=<?= $jsTime ?>"></script>
