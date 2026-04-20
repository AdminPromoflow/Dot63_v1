(function () {
  "use strict";

  var GRID_SIZE = 20;
  var TICK_MS = 130;
  var logic = window.SnakeLogic;
  var board = document.getElementById("snake-board");
  var score = document.getElementById("snake-score");
  var status = document.getElementById("snake-status");
  var pauseButton = document.getElementById("snake-pause");
  var restartButton = document.getElementById("snake-restart");
  var cells = [];
  var state;
  var timerId = null;
  var paused = false;

  if (!logic || !board || !score || !status || !pauseButton || !restartButton) {
    return;
  }

  function keyFor(point) {
    return point.x + "," + point.y;
  }

  function buildBoard() {
    var index;
    var cell;

    board.innerHTML = "";
    board.style.setProperty("--snake-size", GRID_SIZE);
    cells = [];

    for (index = 0; index < GRID_SIZE * GRID_SIZE; index += 1) {
      cell = document.createElement("div");
      cell.className = "snake_cell";
      cell.setAttribute("role", "gridcell");
      board.appendChild(cell);
      cells.push(cell);
    }
  }

  function render() {
    var snakeCells = new Set(state.snake.map(keyFor));
    var headKey = keyFor(state.snake[0]);
    var foodKey = state.food ? keyFor(state.food) : "";
    var x;
    var y;
    var index;
    var cell;
    var cellKey;

    for (index = 0; index < cells.length; index += 1) {
      cell = cells[index];
      x = index % GRID_SIZE;
      y = Math.floor(index / GRID_SIZE);
      cellKey = x + "," + y;
      cell.className = "snake_cell";

      if (snakeCells.has(cellKey)) {
        cell.classList.add("snake_cell_snake");
      }

      if (cellKey === headKey) {
        cell.classList.add("snake_cell_head");
      }

      if (cellKey === foodKey) {
        cell.classList.add("snake_cell_food");
      }
    }

    score.textContent = String(state.score);
    status.textContent = state.gameOver ? "Game over" : paused ? "Paused" : "Playing";
    pauseButton.textContent = paused ? "Resume" : "Pause";
  }

  function stopLoop() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function startLoop() {
    stopLoop();
    timerId = window.setInterval(function () {
      if (paused || state.gameOver) {
        stopLoop();
        render();
        return;
      }

      state = logic.nextState(state, Math.random);
      render();
    }, TICK_MS);
  }

  function restart() {
    state = logic.createGame({
      width: GRID_SIZE,
      height: GRID_SIZE,
      rng: Math.random
    });
    paused = false;
    render();
    startLoop();
  }

  function togglePause() {
    if (state.gameOver) {
      return;
    }

    paused = !paused;
    render();

    if (paused) {
      stopLoop();
    } else {
      startLoop();
    }
  }

  function move(direction) {
    if (state.gameOver) {
      return;
    }

    state = logic.changeDirection(state, direction);

    if (paused) {
      paused = false;
      startLoop();
    }

    render();
  }

  function directionFromKey(key) {
    var normalized = key.toLowerCase();

    if (normalized === "arrowup" || normalized === "w") {
      return "up";
    }

    if (normalized === "arrowdown" || normalized === "s") {
      return "down";
    }

    if (normalized === "arrowleft" || normalized === "a") {
      return "left";
    }

    if (normalized === "arrowright" || normalized === "d") {
      return "right";
    }

    return "";
  }

  document.addEventListener("keydown", function (event) {
    var direction = directionFromKey(event.key);

    if (direction) {
      event.preventDefault();
      move(direction);
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      togglePause();
      return;
    }

    if (event.key === "Enter" && state.gameOver) {
      event.preventDefault();
      restart();
    }
  });

  document.querySelectorAll("[data-direction]").forEach(function (button) {
    button.addEventListener("click", function () {
      move(button.dataset.direction);
    });
  });

  pauseButton.addEventListener("click", togglePause);
  restartButton.addEventListener("click", restart);

  buildBoard();
  restart();
})();
