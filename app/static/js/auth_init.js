// ============================================================
// BLOCK BLAST — auth_init.js
// Initialize themes on auth pages (login, register)
// ============================================================

(function() {
  'use strict';

  // Инициализируем тему после загрузки DOM
  function init() {
    if (window.Themes) {
      window.Themes.init();
    }
  }

  // Если DOM уже загружен
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Небольшая задержка, чтобы header точно отрендерился
    setTimeout(init, 10);
  } else {
    // Ждём загрузки DOM
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 10);
    });
  }
})();
