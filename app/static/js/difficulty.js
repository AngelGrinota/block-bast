// difficulty.js — board seeding by difficulty level

window.Difficulty = (function () {
  const DIFFICULTY_CONFIG = {
    beginner: {
      stoneCount: 0,
      chainCount: 0,
      chainStrength: 0,
      lockedCount: 0,
      toolFrequency: 800,
      hardcoreChance: 0,
    },
    advanced: {
      stoneCount: 4,
      chainCount: 2,
      chainStrength: 2,
      lockedCount: 0,
      toolFrequency: 1000,
      hardcoreChance: 0,
    },
    hardcore: {
      stoneCount: 8,
      chainCount: 3,
      chainStrength: 3,
      lockedCount: 3,
      toolFrequency: 1500,
      hardcoreChance: 0.15,
    },
  };

  function applyDifficulty(board, difficulty) {
    const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.beginner;
    const placed = new Set();
    const SIZE = 8;

    function randCell() {
      let r, c, key, attempts = 0;
      do {
        r = Math.floor(Math.random() * SIZE);
        c = Math.floor(Math.random() * SIZE);
        key = r + ',' + c;
        attempts++;
      } while (placed.has(key) && attempts < 200);
      placed.add(key);
      return { r, c };
    }

    for (let i = 0; i < cfg.stoneCount; i++) {
      const { r, c } = randCell();
      board[r][c] = { type: 2, color: -1, chainHits: 0 };
    }
    for (let i = 0; i < cfg.chainCount; i++) {
      const { r, c } = randCell();
      board[r][c] = { type: 3, color: -1, chainHits: cfg.chainStrength };
    }
    for (let i = 0; i < cfg.lockedCount; i++) {
      const { r, c } = randCell();
      board[r][c] = { type: 4, color: -1, chainHits: 0 };
    }
  }

  return { DIFFICULTY_CONFIG, applyDifficulty };
})();
