// tools.js — helper tools inventory and effects

window.Tools = (function () {
  const TOOL_TYPES = [
    { id: 'hammer',     name: 'HAMMER',    icon: '\u26d2' },
    { id: 'bomb',       name: 'BOMB',      icon: '\u{1F4A5}' },
    { id: 'laser',      name: 'LASER',     icon: '\u26a1' },
    { id: 'shuffle',    name: 'SHUFFLE',   icon: '\u{1F500}' },
    { id: 'chainbreak', name: 'CHAIN BRK', icon: '\u26d3' },
  ];

  let inventory = [];
  let nextToolScore = 1000;
  let activeTool = null;

  function initTools(difficulty) {
    inventory = [];
    activeTool = null;
    if (window.Difficulty && difficulty && window.Difficulty.DIFFICULTY_CONFIG[difficulty]) {
      nextToolScore = window.Difficulty.DIFFICULTY_CONFIG[difficulty].toolFrequency;
    } else {
      nextToolScore = 1000;
    }
    renderToolBar();
  }

  function isToolActive() {
    return activeTool !== null;
  }

  function checkToolUnlock(score) {
    if (score >= nextToolScore) {
      const tool = TOOL_TYPES[Math.floor(Math.random() * TOOL_TYPES.length)];
      inventory.push(tool.id);
      const freq = (window.Difficulty && window.selectedDifficulty &&
        window.Difficulty.DIFFICULTY_CONFIG[window.selectedDifficulty])
        ? window.Difficulty.DIFFICULTY_CONFIG[window.selectedDifficulty].toolFrequency
        : 1000;
      nextToolScore += freq;
      showToolNotification(tool.name);
      renderToolBar();
    }
  }

  function renderToolBar() {
    const bar = document.getElementById('tool-bar');
    if (!bar) return;
    bar.innerHTML = '';

    if (inventory.length === 0) {
      bar.innerHTML = '<span class="tool-empty">NO TOOLS</span>';
      return;
    }

    const counts = {};
    inventory.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

    Object.entries(counts).forEach(([id, count]) => {
      const info = TOOL_TYPES.find(t => t.id === id);
      if (!info) return;
      const btn = document.createElement('button');
      btn.className = 'tool-btn' + (activeTool === id ? ' tool-active' : '');
      btn.dataset.tool = id;
      btn.textContent = info.icon + ' ' + info.name + (count > 1 ? ' \xd7' + count : '');
      btn.addEventListener('click', () => selectTool(id));
      bar.appendChild(btn);
    });
  }

  function selectTool(id) {
    if (id === 'shuffle') {
      const idx = inventory.indexOf('shuffle');
      if (idx < 0) return;
      inventory.splice(idx, 1);
      activeTool = null;
      if (typeof dealBlocks === 'function') dealBlocks();
      renderToolBar();
      updateBoardCursor();
      // Сохраняем состояние после shuffle
      if (window.SaveSystem) window.SaveSystem.save({
        difficulty: currentDifficulty,
        score: score,
        board: board,
        blocks: trayBlocks
      });
      return;
    }

    activeTool = (activeTool === id) ? null : id;
    renderToolBar();
    updateBoardCursor();
  }

  function updateBoardCursor() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    if (activeTool) {
      boardEl.classList.add('tool-mode');
    } else {
      boardEl.classList.remove('tool-mode');
    }
  }

  function handleToolClick(r, c, board, onChanged) {
    if (!activeTool) return false;
    const id = activeTool;

    if (id === 'hammer') {
      const cd = board[r][c];
      if (cd.type === 1 || cd.type === 3) {
        board[r][c] = { type: 0, color: -1, chainHits: 0 };
        consumeTool(id);
        onChanged();
      }
      return true;
    }

    if (id === 'bomb') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (board[nr][nc].type !== 2 && board[nr][nc].type !== 4) {
              board[nr][nc] = { type: 0, color: -1, chainHits: 0 };
            }
          }
        }
      }
      consumeTool(id);
      onChanged();
      return true;
    }

    if (id === 'laser') {
      showLaserModal(r, c, board, onChanged);
      return true;
    }

    if (id === 'chainbreak') {
      for (let br = 0; br < 8; br++) {
        for (let bc = 0; bc < 8; bc++) {
          if (board[br][bc].type === 3) {
            board[br][bc] = { type: 0, color: -1, chainHits: 0 };
          }
        }
      }
      consumeTool(id);
      onChanged();
      return true;
    }

    return false;
  }

  function showLaserModal(r, c, board, onChanged) {
    const existing = document.getElementById('laser-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'laser-modal';
    modal.className = 'laser-modal';
    modal.innerHTML =
      '<div class="laser-modal-panel">' +
        '<div class="laser-modal-title">\u26a1 LASER TARGET</div>' +
        '<button class="laser-btn" id="laser-row-btn">Clear Row ' + (r + 1) + '</button>' +
        '<button class="laser-btn" id="laser-col-btn">Clear Col ' + (c + 1) + '</button>' +
        '<button class="laser-btn laser-cancel" id="laser-cancel-btn">Cancel</button>' +
      '</div>';
    document.body.appendChild(modal);

    document.getElementById('laser-row-btn').addEventListener('click', function () {
      for (let bc = 0; bc < 8; bc++) {
        if (board[r][bc].type !== 2 && board[r][bc].type !== 4) {
          board[r][bc] = { type: 0, color: -1, chainHits: 0 };
        }
      }
      consumeTool('laser');
      modal.remove();
      onChanged();
    });

    document.getElementById('laser-col-btn').addEventListener('click', function () {
      for (let br = 0; br < 8; br++) {
        if (board[br][c].type !== 2 && board[br][c].type !== 4) {
          board[br][c] = { type: 0, color: -1, chainHits: 0 };
        }
      }
      consumeTool('laser');
      modal.remove();
      onChanged();
    });

    document.getElementById('laser-cancel-btn').addEventListener('click', function () {
      modal.remove();
      activeTool = null;
      renderToolBar();
      updateBoardCursor();
    });
  }

  function consumeTool(id) {
    const idx = inventory.indexOf(id);
    if (idx >= 0) inventory.splice(idx, 1);
    activeTool = null;
    updateBoardCursor();
    renderToolBar();
  }

  function showToolNotification(toolName) {
    const notif = document.getElementById('tool-notification');
    if (!notif) return;
    notif.textContent = '\u2605 NEW TOOL: ' + toolName;
    notif.classList.remove('tool-notif-show');
    void notif.offsetWidth;
    notif.classList.add('tool-notif-show');
  }

  return {
    initTools,
    isToolActive,
    checkToolUnlock,
    renderToolBar,
    handleToolClick,
  };
})();
