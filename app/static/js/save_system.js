// ============================================================
// BLOCK BLAST — save_system.js
// Saves/restores unfinished game state using localStorage
// Exposes window.SaveSystem = { save(state), load(), clear(), hasSave() }
// ============================================================
(function() {
  'use strict';
  var KEY = 'blockblast_save';

  function save(state) {
    // state = { difficulty, score, board, blocks }
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e) {}
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch(e) {}
  }

  function hasSave() {
    return load() !== null;
  }

  window.SaveSystem = { save: save, load: load, clear: clear, hasSave: hasSave };
})();
