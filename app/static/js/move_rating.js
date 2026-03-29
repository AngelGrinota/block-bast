// ============================================================
// BLOCK BLAST — move_rating.js
// Exposes window.MoveRating = { show(linesCleared) }
// ============================================================

(function () {
  'use strict';

  function getRating(n) {
    if (n >= 4) return { label: '\u2605 PERFECT \u2605', cls: 'rating-perfect' };
    if (n === 3) return { label: 'PERFECT',   cls: 'rating-perfect' };
    if (n === 2) return { label: 'EXCELLENT', cls: 'rating-excellent' };
    if (n === 1) return { label: 'GOOD',      cls: 'rating-good' };
    return null;
  }

  function show(linesCleared) {
    if (linesCleared < 1) return;

    var rating = getRating(linesCleared);
    if (!rating) return;

    var el = document.createElement('div');
    el.className = 'move-rating ' + rating.cls;
    el.textContent = rating.label;
    document.body.appendChild(el);

    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 900);
  }

  window.MoveRating = { show: show };
})();
