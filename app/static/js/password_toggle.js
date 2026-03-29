// ============================================================
// BLOCK BLAST — password_toggle.js
// Toggle password visibility (eye button)
// ============================================================

(function() {
  'use strict';

  function initPasswordToggle(toggleBtnId, inputId) {
    var toggleBtn = document.getElementById(toggleBtnId);
    var passwordInput = document.getElementById(inputId);

    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener('click', function() {
        var type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        toggleBtn.textContent = type === 'password' ? '👁️' : '🙈';
      });
    }
  }

  function init() {
    // Register page - проверяем существование элементов
    if (document.getElementById('confirm_password')) {
      initPasswordToggle('toggle-password', 'password');
      initPasswordToggle('toggle-confirm-password', 'confirm_password');
    }
    // Login page - проверяем существование элементов
    else if (document.getElementById('password')) {
      initPasswordToggle('toggle-password', 'password');
    }
  }

  // Запускаем после загрузки DOM (defer гарантирует это)
  init();

  window.PasswordToggle = { init: init, initPasswordToggle: initPasswordToggle };
})();
