// ============================================================
// BLOCK BLAST — game.js
// ============================================================

const BOARD_SIZE = 8;

function getCellSize() {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-size')) || 52;
}

// ---- Shapes library ----
// Indices 0-3 are the smallest fallback shapes
const SHAPES = [
  { cells: [[0,0]] },                                                          // 0: 1x1
  { cells: [[0,0],[0,1]] },                                                    // 1: 1x2
  { cells: [[0,0],[1,0]] },                                                    // 2: 2x1
  { cells: [[0,0],[0,1],[1,0],[1,1]] },                                        // 3: 2x2
  { cells: [[0,0],[0,1],[0,2]] },                                              // 4: 1x3
  { cells: [[0,0],[1,0],[2,0]] },                                              // 5: 3x1
  { cells: [[0,0],[0,1],[0,2],[0,3]] },                                        // 6: 1x4
  { cells: [[0,0],[1,0],[2,0],[3,0]] },                                        // 7: 4x1
  { cells: [[0,0],[0,1],[0,2],[0,3],[0,4]] },                                  // 8: 1x5
  { cells: [[0,0],[1,0],[2,0],[3,0],[4,0]] },                                  // 9: 5x1
  { cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]] },          // 10: 3x3
  { cells: [[0,0],[1,0],[1,1]] },                                              // 11: L
  { cells: [[0,1],[1,1],[1,0]] },                                              // 12: J
  { cells: [[0,0],[0,1],[1,1]] },                                              // 13: L2
  { cells: [[0,0],[0,1],[1,0]] },                                              // 14: J2
  { cells: [[0,0],[1,0],[2,0],[2,1]] },                                        // 15: L long
  { cells: [[0,0],[1,0],[2,0],[0,1]] },                                        // 16: J long
  { cells: [[0,1],[1,0],[1,1],[1,2]] },                                        // 17: T
  { cells: [[0,0],[0,1],[1,1],[1,2]] },                                        // 18: S
  { cells: [[0,1],[0,2],[1,0],[1,1]] },                                        // 19: Z
];

const NUM_COLORS = 5;

// ---- State ----
// board[r][c] = { type: 0|1|2|3|4, color: -1|0-4, chainHits: number }
// type 0 = empty, 1 = normal block, 2 = stone, 3 = chain, 4 = locked
let board = [];
let trayBlocks = [];
let score = 0;
let currentDifficulty = 'beginner';
let bestScore = parseInt(localStorage.getItem('bbBest_' + currentDifficulty) || '0');

// ---- DOM refs ----
const boardEl    = document.getElementById('board');
const trayEl     = document.getElementById('tray');
const scoreEl    = document.getElementById('score');
const bestEl     = document.getElementById('best-score');
const gameOverEl = document.getElementById('game-over');
const finalEl    = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const ghost      = document.getElementById('drag-ghost');
const diffScreen = document.getElementById('difficulty-screen');

// ---- Init ----
function initGame(difficulty) {
  currentDifficulty = difficulty || 'beginner';
  window.selectedDifficulty = currentDifficulty;

  board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ type: 0, color: -1, chainHits: 0 }))
  );
  trayBlocks = [];
  score = 0;
  updateScoreDisplay();
  bestScore = parseInt(localStorage.getItem('bbBest_' + currentDifficulty) || '0');
  bestEl.textContent = bestScore;
  gameOverEl.style.display = 'none';

  if (window.Difficulty) {
    window.Difficulty.applyDifficulty(board, currentDifficulty);
  }

  renderBoard();
  dealBlocks();

  if (window.Tools) {
    window.Tools.initTools(currentDifficulty);
  }
}

// ---- Board rendering ----
function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      const cd = board[r][c];
      if (cd.type === 1) {
        cell.classList.add('filled', 'color-' + cd.color);
      } else if (cd.type === 2) {
        cell.classList.add('filled', 'cell-stone');
      } else if (cd.type === 3) {
        cell.classList.add('filled', 'cell-chain');
        cell.dataset.hits = cd.chainHits;
      } else if (cd.type === 4) {
        cell.classList.add('cell-locked');
      }
      boardEl.appendChild(cell);
    }
  }
  // Re-apply tool-mode class if a tool is active
  if (window.Tools && window.Tools.isToolActive()) {
    boardEl.classList.add('tool-mode');
  }
}

function getCell(r, c) {
  return boardEl.querySelector('[data-r="' + r + '"][data-c="' + c + '"]');
}

// ---- Tray / Block generation ----

// 1. Создаем глубокую копию доски для безопасных тестов
function cloneBoardForSim(b) {
  return b.map(row => row.map(cell => ({ type: cell.type, color: cell.color, chainHits: cell.chainHits })));
}

// 2. Проверяем, влезает ли фигура на виртуальную доску
function canPlaceOnSimBoard(simBoard, row, col, shape) {
  return shape.cells.every(rc => {
    const r = row + rc[0], c = col + rc[1];
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && simBoard[r][c].type === 0;
  });
}

// 3. Симулируем установку фигуры и очистку линий (с учетом камней и цепей)
function simulatePlacement(simBoard, row, col, shape) {
  shape.cells.forEach(rc => {
    simBoard[row + rc[0]][col + rc[1]] = { type: 1, color: 0, chainHits: 0 };
  });

  const rowsToClear = [];
  const colsToClear = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    if (simBoard[r].every(v => v.type !== 0 && v.type !== 4)) rowsToClear.push(r);
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (simBoard.every(row => row[c].type !== 0 && row[c].type !== 4)) colsToClear.push(c);
  }

  rowsToClear.forEach(r => {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (simBoard[r][c].type !== 2) {
        if (simBoard[r][c].type === 3) {
          simBoard[r][c].chainHits--;
          if (simBoard[r][c].chainHits <= 0) simBoard[r][c] = { type: 0, color: -1, chainHits: 0 };
        } else {
          simBoard[r][c] = { type: 0, color: -1, chainHits: 0 };
        }
      }
    }
  });

  colsToClear.forEach(c => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (simBoard[r][c].type !== 2) {
        if (simBoard[r][c].type === 3) {
          if (!rowsToClear.includes(r)) {
            simBoard[r][c].chainHits--;
            if (simBoard[r][c].chainHits <= 0) simBoard[r][c] = { type: 0, color: -1, chainHits: 0 };
          }
        } else {
          simBoard[r][c] = { type: 0, color: -1, chainHits: 0 };
        }
      }
    }
  });
}

// 4. Умная выдача фигур
function dealBlocks() {
  const cfg = (window.Difficulty && currentDifficulty)
    ? window.Difficulty.DIFFICULTY_CONFIG[currentDifficulty]
    : null;
  const hardcoreChance = cfg ? (cfg.hardcoreChance || 0) : 0;

  let simBoard = cloneBoardForSim(board);
  let generated = [];

  // Генерируем 3 фигуры, гарантируя 100% проходимость
  for (let i = 0; i < 3; i++) {
    let validShapes = SHAPES.filter(s => {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (canPlaceOnSimBoard(simBoard, r, c, s)) return true;
        }
      }
      return false;
    });

    // Если доска забита и ходов нет, выдаем кубики 1x1, чтобы игра могла корректно завершиться
    if (validShapes.length === 0) {
      while (generated.length < 3) {
        generated.push({ shape: SHAPES[0], color: Math.floor(Math.random() * NUM_COLORS), used: false });
      }
      break;
    }

    let shape;
    let useHardcore = hardcoreChance > 0 && Math.random() < hardcoreChance;

    if (useHardcore) {
      // На высокой сложности пытаемся подкинуть сложную случайную фигуру. 
      // Но ТОЛЬКО если она физически поместится! Иначе это будет несправедливо.
      let hardShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      shape = validShapes.includes(hardShape) ? hardShape : validShapes[Math.floor(Math.random() * validShapes.length)];
    } else {
      shape = validShapes[Math.floor(Math.random() * validShapes.length)];
    }

    generated.push({ shape: shape, color: Math.floor(Math.random() * NUM_COLORS), used: false });

    // Ставим фигуру в случайное валидное место на симулированной доске для следующего шага
    let possiblePlacements = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canPlaceOnSimBoard(simBoard, r, c, shape)) possiblePlacements.push({r, c});
      }
    }
    let placement = possiblePlacements[Math.floor(Math.random() * possiblePlacements.length)];
    simulatePlacement(simBoard, placement.r, placement.c, shape);
  }

  // Перемешиваем панель! Игрок получает честный набор, но должен сам найти порядок
  generated.sort(() => Math.random() - 0.5);

  trayBlocks = generated;
  renderTray();
  // Сохранение вызывается отдельно после действий игрока
}

function renderTray() {
  trayEl.innerHTML = '';
  trayBlocks.forEach(function (block, idx) {
    const slot = document.createElement('div');
    slot.className = 'tray-slot';
    if (!block.used) {
      const preview = buildBlockEl(block.shape, block.color, 24);
      preview.classList.add('block-preview');
      preview.dataset.idx = idx;
      attachDragHandlers(preview, idx);
      slot.appendChild(preview);
    }
    trayEl.appendChild(slot);
  });
}

function buildBlockEl(shape, color, cellSize) {
  const rows = Math.max.apply(null, shape.cells.map(function (rc) { return rc[0]; })) + 1;
  const cols = Math.max.apply(null, shape.cells.map(function (rc) { return rc[1]; })) + 1;

  const el = document.createElement('div');
  el.style.display = 'grid';
  el.style.gridTemplateColumns = 'repeat(' + cols + ', ' + cellSize + 'px)';
  el.style.gridTemplateRows    = 'repeat(' + rows + ', ' + cellSize + 'px)';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'block-cell';
      cell.style.width  = cellSize + 'px';
      cell.style.height = cellSize + 'px';
      if (shape.cells.some(function (rc) { return rc[0] === r && rc[1] === c; })) {
        cell.classList.add('color-' + color);
      } else {
        cell.style.visibility = 'hidden';
      }
      el.appendChild(cell);
    }
  }
  return el;
}

// ---- Drag & Drop (Pointer Events) ----
let dragging = null;

function attachDragHandlers(el, idx) {
  el.addEventListener('pointerdown', function (e) { startDrag(e, idx); });
}

function startDrag(e, idx) {
  // If a tool is active, don't start drag — tools use board clicks
  if (window.Tools && window.Tools.isToolActive()) return;

  e.preventDefault();
  const block = trayBlocks[idx];
  if (block.used) return;

  const previewEl = trayEl.querySelector('[data-idx="' + idx + '"]');
  if (previewEl) previewEl.classList.add('dragging');

  const cellPx = getCellSize();
  const shape = block.shape;
  const color = block.color;
  const rows = Math.max.apply(null, shape.cells.map(function (rc) { return rc[0]; })) + 1;
  const cols = Math.max.apply(null, shape.cells.map(function (rc) { return rc[1]; })) + 1;

  ghost.innerHTML = '';
  ghost.style.gridTemplateColumns = 'repeat(' + cols + ', ' + cellPx + 'px)';
  ghost.style.gridTemplateRows    = 'repeat(' + rows + ', ' + cellPx + 'px)';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'block-cell';
      cell.style.width  = cellPx + 'px';
      cell.style.height = cellPx + 'px';
      if (shape.cells.some(function (rc) { return rc[0] === r && rc[1] === c; })) {
        cell.classList.add('color-' + color);
      } else {
        cell.style.visibility = 'hidden';
      }
      ghost.appendChild(cell);
    }
  }
  ghost.style.display = 'grid';

  dragging = { idx: idx, shape: shape, color: color };
  moveGhost(e.clientX, e.clientY);

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(e) {
  if (!dragging) return;
  moveGhost(e.clientX, e.clientY);
  const coords = pointerToGridCoords(e.clientX, e.clientY);
  clearHighlights();
  if (coords.row !== null) highlightPlacement(coords.row, coords.col, dragging.shape);
}

function onPointerUp(e) {
  if (!dragging) return;
  ghost.style.display = 'none';
  clearHighlights();

  const coords = pointerToGridCoords(e.clientX, e.clientY);
  if (coords.row !== null && canPlace(coords.row, coords.col, dragging.shape)) {
    placeBlock(coords.row, coords.col, dragging.idx);
  } else {
    const previewEl = trayEl.querySelector('[data-idx="' + dragging.idx + '"]');
    if (previewEl) previewEl.classList.remove('dragging');
  }

  dragging = null;
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
}

function moveGhost(x, y) {
  ghost.style.left = x + 'px';
  ghost.style.top  = y + 'px';
}

function pointerToGridCoords(clientX, clientY) {
  const cellPx = getCellSize();
  const shape = dragging.shape;
  const boardRect = boardEl.getBoundingClientRect();

  const maxRow = Math.max.apply(null, shape.cells.map(function (rc) { return rc[0]; }));
  const maxCol = Math.max.apply(null, shape.cells.map(function (rc) { return rc[1]; }));

  const ghostLeft = clientX - ((maxCol + 1) / 2) * cellPx;
  const ghostTop  = clientY - ((maxRow + 1) / 2) * cellPx;

  const col = Math.round((ghostLeft - boardRect.left) / cellPx);
  const row = Math.round((ghostTop  - boardRect.top)  / cellPx);

  if (row < -1 || row > BOARD_SIZE || col < -1 || col > BOARD_SIZE) {
    return { row: null, col: null };
  }
  return { row: row, col: col };
}

function highlightPlacement(row, col, shape) {
  const valid = canPlace(row, col, shape);
  shape.cells.forEach(function (rc) {
    const cell = getCell(row + rc[0], col + rc[1]);
    if (cell) cell.classList.add(valid ? 'highlight-valid' : 'highlight-invalid');
  });
}

function clearHighlights() {
  boardEl.querySelectorAll('.highlight-valid, .highlight-invalid').forEach(function (c) {
    c.classList.remove('highlight-valid', 'highlight-invalid');
  });
}

// ---- Placement ----
function canPlace(row, col, shape) {
  return shape.cells.every(function (rc) {
    const r = row + rc[0], c = col + rc[1];
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c].type === 0;
  });
}

async function placeBlock(row, col, idx) {
  const shape = trayBlocks[idx].shape;
  const color = trayBlocks[idx].color;
  shape.cells.forEach(function (rc) {
    board[row + rc[0]][col + rc[1]] = { type: 1, color: color, chainHits: 0 };
  });
  trayBlocks[idx].used = true;

  renderBoard();
  renderTray();

  await clearLines();

  if (trayBlocks.every(function (b) { return b.used; })) {
    dealBlocks();
    // Сохраняем состояние после генерации новых блоков
    if (window.SaveSystem) window.SaveSystem.save({
      difficulty: currentDifficulty,
      score: score,
      board: board,
      blocks: trayBlocks
    });
  } else {
    checkGameOver();
    // Сохраняем состояние после установки блока (если не были сгенерированы новые)
    if (window.SaveSystem) window.SaveSystem.save({
      difficulty: currentDifficulty,
      score: score,
      board: board,
      blocks: trayBlocks
    });
  }
}

// ---- Line clearing ----
async function clearLines() {
  const rowsToClear = [];
  const colsToClear = [];

  // Row clears when every cell is non-empty AND non-locked
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r].every(function (v) { return v.type !== 0 && v.type !== 4; })) {
      rowsToClear.push(r);
    }
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board.every(function (row) { return row[c].type !== 0 && row[c].type !== 4; })) {
      colsToClear.push(c);
    }
  }

  if (rowsToClear.length === 0 && colsToClear.length === 0) return;

  const cellKeys = new Set();
  rowsToClear.forEach(function (r) {
    for (let c = 0; c < BOARD_SIZE; c++) cellKeys.add(r + ',' + c);
  });
  colsToClear.forEach(function (c) {
    for (let r = 0; r < BOARD_SIZE; r++) cellKeys.add(r + ',' + c);
  });

  cellKeys.forEach(function (key) {
    const parts = key.split(',');
    const domCell = getCell(+parts[0], +parts[1]);
    if (domCell) domCell.classList.add('clearing');
  });

  await new Promise(function (res) { setTimeout(res, 420); });

  cellKeys.forEach(function (key) {
    const parts = key.split(',');
    const r = +parts[0], c = +parts[1];
    const cd = board[r][c];
    if (cd.type === 2) {
      // Stone: immune, stays in place
    } else if (cd.type === 3) {
      cd.chainHits--;
      if (cd.chainHits <= 0) {
        board[r][c] = { type: 0, color: -1, chainHits: 0 };
      }
    } else {
      board[r][c] = { type: 0, color: -1, chainHits: 0 };
    }
  });

  const linesCleared = rowsToClear.length + colsToClear.length;
  if (window.MoveRating && linesCleared > 0) window.MoveRating.show(linesCleared);
  if (window.SteampunkFX && linesCleared > 0) window.SteampunkFX.onLineClear();
  const points = linesCleared * (linesCleared + 1) / 2 * 50;
  addScore(points);

  renderBoard();
}

// ---- Score ----
function addScore(pts) {
  score += pts;
  updateScoreDisplay();
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('bbBest_' + currentDifficulty, bestScore);
    bestEl.textContent = bestScore;
  }
  if (window.Tools) window.Tools.checkToolUnlock(score);
}

function updateScoreDisplay() {
  scoreEl.textContent = score;
  scoreEl.classList.remove('score-pop');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('score-pop');
}

// ---- Game Over ----
function checkGameOver() {
  const remaining = trayBlocks.filter(function (b) { return !b.used; });
  const canAny = remaining.some(function (b) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canPlace(r, c, b.shape)) return true;
      }
    }
    return false;
  });

  if (!canAny) {
    setTimeout(function () {
      finalEl.textContent = score;
      gameOverEl.style.display = 'flex';
      if (window.SaveSystem) window.SaveSystem.clear();

      if (window.AUTH && window.AUTH.loggedIn) {
        fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: score, difficulty: currentDifficulty })
        })
        .then(function(r) {
          if (!r.ok) {
            console.error('Score submit failed:', r.status);
            return null;
          }
          return r.json();
        })
        .then(function(data) {
          if (data && data.leaderboard) updateGameOverLeaderboard(data);
        })
        .catch(function(err) {
          console.error('Score submit error:', err);
        });
      } else {
        // Show login prompt modal for unauthenticated users
        var promptEl = document.getElementById('login-prompt');
        var promptScoreEl = document.getElementById('prompt-final-score');
        var closeBtn = document.getElementById('lp-close-btn');
        var loginBtn = document.getElementById('lp-login-btn');
        var registerBtn = document.getElementById('lp-register-btn');

        if (promptEl && promptScoreEl) {
          promptScoreEl.textContent = score;
          promptEl.style.display = 'flex';

          // Save score to sessionStorage for later submission after login
          sessionStorage.setItem('bb_pending_score', score.toString());
          sessionStorage.setItem('bb_pending_difficulty', currentDifficulty);

          // Close button handler
          if (closeBtn) {
            closeBtn.onclick = function() {
              promptEl.style.display = 'none';
            };
          }
          
          // Login button handler
          if (loginBtn) {
            loginBtn.onclick = function() {
              window.location.href = '/auth/login';
            };
          }
          
          // Register button handler
          if (registerBtn) {
            registerBtn.onclick = function() {
              window.location.href = '/auth/register';
            };
          }
        }
      }
    }, 200);
  }
}

// ---- Tool board click handler ----
boardEl.addEventListener('click', function (e) {
  if (!window.Tools || !window.Tools.isToolActive()) return;
  const cellEl = e.target.closest('.cell');
  if (!cellEl) return;
  const r = +cellEl.dataset.r;
  const c = +cellEl.dataset.c;
  window.Tools.handleToolClick(r, c, board, function () {
    renderBoard();
    checkGameOver();
    // Сохраняем состояние после использования инструмента
    if (window.SaveSystem) window.SaveSystem.save({
      difficulty: currentDifficulty,
      score: score,
      board: board,
      blocks: trayBlocks
    });
  });
});

// ---- Difficulty screen (legacy overlay — kept in DOM, always hidden) ----
function showDifficultyScreen() {
  if (diffScreen) diffScreen.style.display = 'none'; // permanently hidden
}

function hideDifficultyScreen() {
  if (diffScreen) diffScreen.style.display = 'none';
}

// ---- Difficulty switcher strip ----
function switchDifficulty(diff) {
  if (diff === currentDifficulty) return;
  currentDifficulty = diff;
  score = 0;
  // Update active button state
  document.querySelectorAll('.diff-switch-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.diff === diff);
  });
  initGame(diff);
}

// Wire up difficulty switcher buttons
document.querySelectorAll('.diff-switch-btn').forEach(function (btn) {
  btn.addEventListener('click', function () { switchDifficulty(btn.dataset.diff); });
});

// ---- Restart → re-init same difficulty ----
restartBtn.addEventListener('click', function () {
  gameOverEl.style.display = 'none';
  initGame(currentDifficulty);
});

// ---- Restore saved game state ----
function restoreGame(state) {
  currentDifficulty = state.difficulty;
  window.selectedDifficulty = currentDifficulty;
  score = state.score;
  board = state.board;
  trayBlocks = state.blocks;
  updateScoreDisplay();
  bestScore = parseInt(localStorage.getItem('bbBest_' + currentDifficulty) || '0');
  bestEl.textContent = bestScore;
  renderBoard();
  renderTray();
  // update difficulty buttons
  document.querySelectorAll('.diff-switch-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.diff === currentDifficulty);
  });
  if (window.Tools) window.Tools.initTools(currentDifficulty);
}

// ---- Game-over leaderboard panel update ----
function updateGameOverLeaderboard(data) {
  var panel = document.getElementById('leaderboard-panel');
  var rowsEl = document.getElementById('lb-rows');
  var rankMsg = document.getElementById('lb-rank-msg');
  if (!panel || !rowsEl) return;

  rowsEl.innerHTML = '';
  (data.leaderboard || []).forEach(function(entry) {
    var row = document.createElement('div');
    row.className = 'lb-row';
    if (window.AUTH && entry.username === window.AUTH.username) {
      row.classList.add('lb-row--mine');
    }
    row.innerHTML = '<span class="lb-rank">#' + entry.rank + '</span>' +
      '<span class="lb-name">' + entry.username + '</span>' +
      '<span class="lb-score">' + entry.score + '</span>';
    rowsEl.appendChild(row);
  });

  if (data.player_rank != null) {
    rankMsg.style.display = 'block';
    rankMsg.textContent = 'YOUR RANK: #' + data.player_rank;
    rankMsg.classList.add('rank-up');
    setTimeout(function() { rankMsg.classList.remove('rank-up'); }, 700);
  }

  panel.style.display = 'block';
}

// ---- Start: check for saved game first ----
(function startGame() {
  if (window.SaveSystem && window.SaveSystem.hasSave()) {
    var saved = window.SaveSystem.load();
    if (saved && saved.board && saved.blocks) {
      var resume = confirm('Resume previous game? (' + saved.difficulty + ', score: ' + saved.score + ')');
      if (resume) {
        restoreGame(saved);
        return;
      }
    }
    window.SaveSystem.clear();
  }
  // No save or user declined — start new game
  initGame('beginner');
})();
