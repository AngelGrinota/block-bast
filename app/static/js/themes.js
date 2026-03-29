// ============================================================
// BLOCK BLAST — themes.js
// Exposes window.Themes = { init(), switch(name) }
// ============================================================

(function () {
  'use strict';

  var THEMES = [
    { name: 'cyberpunk', label: 'CYBER' },
    { name: 'steampunk', label: 'STEAM' },
    { name: 'cosmos',    label: 'COSMOS' },
  ];

  var STORAGE_KEY = 'bbTheme';
  var DEFAULT_THEME = 'cyberpunk';

  function switchTheme(name) {
    // Determine which theme is currently active before switching
    var prev = null;
    THEMES.forEach(function (t) {
      if (document.documentElement.classList.contains('theme-' + t.name)) {
        prev = t.name;
      }
    });

    // Stop FX for the theme we are leaving
    if (prev === 'cosmos' && name !== 'cosmos') {
      if (window.Starfield) window.Starfield.stop();
    }
    if (prev === 'steampunk' && name !== 'steampunk') {
      if (window.SteampunkFX) window.SteampunkFX.stop();
    }

    THEMES.forEach(function (t) {
      document.documentElement.classList.remove('theme-' + t.name);
    });
    document.documentElement.classList.add('theme-' + name);
    try { localStorage.setItem(STORAGE_KEY, name); } catch (e) {}

    // Start FX for the new theme
    if (name === 'cosmos') {
      if (window.Starfield) window.Starfield.init();
    }
    if (name === 'steampunk') {
      if (window.SteampunkFX) window.SteampunkFX.init();
    }

    // Update active state on buttons if rendered
    var btns = document.querySelectorAll('.theme-btn');
    btns.forEach(function (btn) {
      if (btn.dataset.theme === name) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function init() {
    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    var theme = saved || DEFAULT_THEME;
    switchTheme(theme);

    var container = document.getElementById('theme-switcher');
    if (!container) return;

    container.innerHTML = '';
    THEMES.forEach(function (t) {
      var btn = document.createElement('button');
      btn.className = 'theme-btn' + (t.name === theme ? ' active' : '');
      btn.dataset.theme = t.name;
      btn.textContent = t.label;
      btn.addEventListener('click', function () {
        switchTheme(t.name);
      });
      container.appendChild(btn);
    });
  }

  window.Themes = { init: init, switch: switchTheme };
})();
