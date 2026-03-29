// ============================================================
// BLOCK BLAST — mobile_detect.js
// Auto-detects mobile device by screen width and updates URL
// ============================================================

(function() {
  'use strict';

  function updateMobileParam() {
    var isMobile = window.innerWidth <= 768;
    var expectedMobile = isMobile ? 'true' : 'false';
    var urlParams = new URLSearchParams(window.location.search);
    var currentMobile = urlParams.get('mobile');

    // Если параметр mobile не совпадает с шириной экрана, перезагружаем
    if (currentMobile === null || currentMobile !== expectedMobile) {
      urlParams.set('mobile', expectedMobile);
      var newUrl = window.location.pathname + '?' + urlParams.toString();
      // Заменяем URL без перезагрузки, если уже правильный
      if (currentMobile !== null) {
        window.history.replaceState({}, '', newUrl);
      } else {
        window.location.replace(newUrl);
      }
    }
  }

  // Запускаем при загрузке
  updateMobileParam();

  // Обновляем при изменении размера окна
  var resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateMobileParam, 300);
  });
})();
