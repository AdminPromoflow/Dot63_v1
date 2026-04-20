(function (root, factory) {
  "use strict";

  var logic = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = logic;
  }

  root.SnakeLogic = logic;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  function clonePoint(point) {
    return { x: point.x, y: point.y };
  }

  function samePoint(a, b) {
    return Boolean(a && b && a.x === b.x && a.y === b.y);
  }

  function pointKey(point) {
    return point.x + "," + point.y;
  }

  function normalizeDirection(direction) {
    if (typeof direction === "string" && DIRECTIONS[direction]) {
      return clonePoint(DIRECTIONS[direction]);
    }

    if (
      direction &&
      Number.isInteger(direction.x) &&
      Number.isInteger(direction.y) &&
      Math.abs(direction.x) + Math.abs(direction.y) === 1
    ) {
      return clonePoint(direction);
    }

    throw new TypeError("Invalid direction");
  }

  function isOppositeDirection(a, b) {
    return a.x + b.x === 0 && a.y + b.y === 0;
  }

  function normalizeSize(value, fallback) {
    var size = Number(value || fallback);

    if (!Number.isInteger(size) || size < 2) {
      throw new RangeError("Grid size must be an integer greater than 1");
    }

    return size;
  }

  function maxStartingLength(head, width, height, direction) {
    if (direction.x === 1) {
      return head.x + 1;
    }

    if (direction.x === -1) {
      return width - head.x;
    }

    if (direction.y === 1) {
      return head.y + 1;
    }

    return height - head.y;
  }

  function buildStartingSnake(width, height, direction) {
    var head = {
      x: Math.floor(width / 2),
      y: Math.floor(height / 2)
    };
    var length = Math.min(3, width * height, maxStartingLength(head, width, height, direction));
    var snake = [];
    var index;

    for (index = 0; index < length; index += 1) {
      snake.push({
        x: head.x - direction.x * index,
        y: head.y - direction.y * index
      });
    }

    return snake;
  }

  function includesPoint(points, target) {
    return points.some(function (point) {
      return samePoint(point, target);
    });
  }

  function randomIndex(length, rng) {
    var value = typeof rng === "function" ? rng() : Math.random();
    var index = Math.floor(value * length);

    if (index < 0) {
      return 0;
    }

    if (index >= length) {
      return length - 1;
    }

    return index;
  }

  function placeFood(width, height, snake, rng) {
    var occupied = new Set(snake.map(pointKey));
    var openCells = [];
    var x;
    var y;

    for (y = 0; y < height; y += 1) {
      for (x = 0; x < width; x += 1) {
        if (!occupied.has(x + "," + y)) {
          openCells.push({ x: x, y: y });
        }
      }
    }

    if (openCells.length === 0) {
      return null;
    }

    return openCells[randomIndex(openCells.length, rng)];
  }

  function createGame(options) {
    var settings = options || {};
    var width = normalizeSize(settings.width, 20);
    var height = normalizeSize(settings.height, 20);
    var direction = normalizeDirection(settings.direction || "right");
    var snake = settings.snake
      ? settings.snake.map(clonePoint)
      : buildStartingSnake(width, height, direction);
    var food = settings.food ? clonePoint(settings.food) : placeFood(width, height, snake, settings.rng);

    return {
      width: width,
      height: height,
      snake: snake,
      direction: direction,
      pendingDirection: clonePoint(direction),
      food: food,
      score: Number(settings.score || 0),
      gameOver: Boolean(settings.gameOver)
    };
  }

  function changeDirection(state, direction) {
    var nextDirection = normalizeDirection(direction);
    var activeDirection = state.pendingDirection || state.direction;

    if (
      state.snake.length > 1 &&
      (isOppositeDirection(state.direction, nextDirection) ||
        isOppositeDirection(activeDirection, nextDirection))
    ) {
      return state;
    }

    return Object.assign({}, state, {
      pendingDirection: nextDirection
    });
  }

  function nextState(state, rng) {
    var direction;
    var currentHead;
    var nextHead;
    var ateFood;
    var collisionBody;
    var nextSnake;
    var nextFood;
    var nextScore;

    if (state.gameOver) {
      return state;
    }

    direction = normalizeDirection(state.pendingDirection || state.direction);
    currentHead = state.snake[0];
    nextHead = {
      x: currentHead.x + direction.x,
      y: currentHead.y + direction.y
    };

    if (
      nextHead.x < 0 ||
      nextHead.y < 0 ||
      nextHead.x >= state.width ||
      nextHead.y >= state.height
    ) {
      return Object.assign({}, state, {
        direction: direction,
        pendingDirection: clonePoint(direction),
        gameOver: true
      });
    }

    ateFood = samePoint(nextHead, state.food);
    collisionBody = ateFood ? state.snake : state.snake.slice(0, -1);

    if (includesPoint(collisionBody, nextHead)) {
      return Object.assign({}, state, {
        direction: direction,
        pendingDirection: clonePoint(direction),
        gameOver: true
      });
    }

    nextSnake = [nextHead].concat(state.snake.map(clonePoint));

    if (!ateFood) {
      nextSnake.pop();
    }

    nextScore = ateFood ? state.score + 1 : state.score;
    nextFood = ateFood ? placeFood(state.width, state.height, nextSnake, rng) : state.food;

    return Object.assign({}, state, {
      snake: nextSnake,
      direction: direction,
      pendingDirection: clonePoint(direction),
      food: nextFood,
      score: nextScore,
      gameOver: nextFood === null
    });
  }

  return {
    DIRECTIONS: DIRECTIONS,
    changeDirection: changeDirection,
    createGame: createGame,
    isOppositeDirection: isOppositeDirection,
    nextState: nextState,
    placeFood: placeFood,
    samePoint: samePoint
  };
});
