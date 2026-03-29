// ============================================================
// BLOCK BLAST — themes_fx.js
// Combined theme effects: steampunk, cyberpunk, piggy
// Exposes window.SteampunkFX, window.CyberpunkFX, window.PiggyFX
// ============================================================

(function () {
  'use strict';

  // ============================================================
  // STEAMPUNK THEME
  // ============================================================
  (function () {
    var gearEls = [];
    var injectedStyle = null;
    var active = false;

    // Gear SVG path: 8-tooth gear shape
    function buildGearSVG(size, id) {
      var r = size / 2;
      var ri = r * 0.58;
      var rh = r * 0.28;
      var teeth = 8;
      var points = [];

      for (var i = 0; i < teeth; i++) {
        var angle = (i / teeth) * Math.PI * 2 - Math.PI / 2;
        var halfTooth = Math.PI / teeth * 0.38;
        points.push([ri * Math.cos(angle - halfTooth * 1.4), ri * Math.sin(angle - halfTooth * 1.4)]);
        points.push([r * Math.cos(angle - halfTooth), r * Math.sin(angle - halfTooth)]);
        points.push([r * Math.cos(angle + halfTooth), r * Math.sin(angle + halfTooth)]);
        points.push([ri * Math.cos(angle + halfTooth * 1.4), ri * Math.sin(angle + halfTooth * 1.4)]);
      }

      var d = points.map(function (p, idx) {
        return (idx === 0 ? 'M' : 'L') + (r + p[0]).toFixed(2) + ',' + (r + p[1]).toFixed(2);
      }).join(' ') + ' Z';

      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
      svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
      svg.style.overflow = 'visible';

      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'url(#gear-grad-' + id + ')');
      path.setAttribute('stroke', '#8b5e00');
      path.setAttribute('stroke-width', '1.5');

      var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      var grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      grad.setAttribute('id', 'gear-grad-' + id);
      grad.setAttribute('cx', '40%');
      grad.setAttribute('cy', '35%');
      grad.setAttribute('r', '65%');
      var stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#e8c060');
      var stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '60%');
      stop2.setAttribute('stop-color', '#b07820');
      var stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop3.setAttribute('offset', '100%');
      stop3.setAttribute('stop-color', '#6b4000');
      grad.appendChild(stop1);
      grad.appendChild(stop2);
      grad.appendChild(stop3);
      defs.appendChild(grad);

      var hub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hub.setAttribute('cx', r);
      hub.setAttribute('cy', r);
      hub.setAttribute('r', rh);
      hub.setAttribute('fill', '#1a0f00');
      hub.setAttribute('stroke', '#6b4000');
      hub.setAttribute('stroke-width', '1');

      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', r);
      dot.setAttribute('cy', r);
      dot.setAttribute('r', rh * 0.3);
      dot.setAttribute('fill', '#d4841e');

      svg.appendChild(defs);
      svg.appendChild(path);
      svg.appendChild(hub);
      svg.appendChild(dot);
      return svg;
    }

    function injectStyles() {
      if (injectedStyle) return;
      injectedStyle = document.createElement('style');
      injectedStyle.id = 'steampunk-fx-styles';
      injectedStyle.textContent = [
        '@keyframes steampunk-spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
        '@keyframes steampunk-spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }',
        '@keyframes steam-float { 0% { opacity: 0.7; transform: translateY(0) scale(1); } 60% { opacity: 0.4; transform: translateY(-40px) scale(1.4); } 100% { opacity: 0; transform: translateY(-80px) scale(1.8); } }',
        '.steampunk-gear { position: fixed; pointer-events: none; z-index: 0; opacity: 0.55; filter: drop-shadow(0 0 6px rgba(212, 132, 30, 0.5)); }',
        '.steampunk-gear.cw { animation: steampunk-spin-cw 12s linear infinite; }',
        '.steampunk-gear.ccw { animation: steampunk-spin-ccw 18s linear infinite; }',
        '.steampunk-gear.slow-cw { animation: steampunk-spin-cw 24s linear infinite; }',
        '.steam-particle { position: fixed; border-radius: 50%; pointer-events: none; z-index: 5000; animation: steam-float 0.3s ease-out forwards; }',
      ].join('\n');
      document.head.appendChild(injectedStyle);
    }

    function removeStyles() {
      if (injectedStyle && injectedStyle.parentNode) {
        injectedStyle.parentNode.removeChild(injectedStyle);
      }
      injectedStyle = null;
    }

    var GEAR_CONFIGS = [
      { size: 80, top: null, bottom: '12%', left: '2%', right: null, spinClass: 'cw' },
      { size: 56, top: '8%', bottom: null, left: null, right: '2%', spinClass: 'ccw' },
      { size: 100, top: null, bottom: '5%', left: null, right: '1%', spinClass: 'slow-cw' },
    ];

    function init() {
      if (active) return;
      active = true;
      injectStyles();
      GEAR_CONFIGS.forEach(function (cfg, idx) {
        var wrap = document.createElement('div');
        wrap.className = 'steampunk-gear ' + cfg.spinClass;
        if (cfg.top !== null) wrap.style.top = cfg.top;
        if (cfg.bottom !== null) wrap.style.bottom = cfg.bottom;
        if (cfg.left !== null) wrap.style.left = cfg.left;
        if (cfg.right !== null) wrap.style.right = cfg.right;
        var svg = buildGearSVG(cfg.size, 'g' + idx);
        wrap.appendChild(svg);
        document.body.appendChild(wrap);
        gearEls.push(wrap);
      });
    }

    function stop() {
      active = false;
      gearEls.forEach(function (el) {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      gearEls = [];
      removeStyles();
    }

    function onLineClear() {
      var board = document.getElementById('board');
      var rect = board ? board.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
      var count = Math.min(15, 8 + Math.floor(Math.random() * 5));
      for (var i = 0; i < count; i++) {
        (function () {
          var p = document.createElement('div');
          p.className = 'steam-particle';
          var size = 4 + Math.random() * 8;
          var x = rect.left + Math.random() * rect.width;
          var y = rect.top + Math.random() * rect.height;
          var delay = Math.random() * 0.4;
          p.style.cssText = [
            'width:' + size + 'px', 'height:' + size + 'px',
            'left:' + x + 'px', 'top:' + y + 'px',
            'background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,200,200,0.3) 100%)',
            'animation-delay:' + delay + 's',
          ].join(';');
          document.body.appendChild(p);
          setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, (delay + 0.35) * 1000);
        })();
      }
    }

    window.SteampunkFX = { init: init, stop: stop, onLineClear: onLineClear };
  })();

  // ============================================================
  // CYBERPUNK THEME
  // ============================================================
  (function () {
    var canvas = null;
    var ctx = null;
    var rafId = null;
    var startTime = null;
    var beams = [];

    var BEAM_DEFS = [
      { xFrac: 0.08, driftFrac: 0.11, rgb: [0, 212, 255], hw: 55, opacity: 0.055, phase: 0.0 },
      { xFrac: 0.32, driftFrac: 0.07, rgb: [176, 0, 255], hw: 45, opacity: 0.042, phase: 1.8 },
      { xFrac: 0.60, driftFrac: 0.09, rgb: [255, 0, 170], hw: 60, opacity: 0.048, phase: 3.4 },
      { xFrac: 0.82, driftFrac: 0.06, rgb: [0, 212, 255], hw: 38, opacity: 0.038, phase: 2.1 },
      { xFrac: 0.50, driftFrac: 0.05, rgb: [176, 0, 255], hw: 50, opacity: 0.032, phase: 5.0 },
    ];

    var ANGLE = -Math.PI / 5.5;

    function buildBeams() {
      var w = canvas.width;
      beams = BEAM_DEFS.map(function (d) {
        return { x: d.xFrac * w, drift: d.driftFrac * w, rgb: d.rgb, hw: d.hw, opacity: d.opacity, phase: d.phase };
      });
    }

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildBeams();
    }

    function drawBeam(b, t) {
      var h = canvas.height;
      var x = b.x + Math.sin(t * 0.00035 + b.phase) * b.drift;
      var op = b.opacity * (0.65 + 0.35 * Math.sin(t * 0.00055 + b.phase * 1.3));
      var r = b.rgb[0], g = b.rgb[1], bl = b.rgb[2];
      ctx.save();
      ctx.translate(x, 0);
      ctx.rotate(ANGLE);
      var grad = ctx.createLinearGradient(-b.hw, 0, b.hw, 0);
      grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + bl + ',0)');
      grad.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + bl + ',' + op.toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + bl + ',0)');
      ctx.fillStyle = grad;
      ctx.fillRect(-b.hw, -h * 0.6, b.hw * 2, h * 2.4);
      ctx.restore();
    }

    function frame(timestamp) {
      if (!isCyberpunkActive()) { stop(); return; }
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      beams.forEach(function (b) { drawBeam(b, elapsed); });
      rafId = requestAnimationFrame(frame);
    }

    function isCyberpunkActive() {
      return document.documentElement.classList.contains('theme-cyberpunk');
    }

    function init() {
      if (canvas) return;
      canvas = document.createElement('canvas');
      canvas.id = 'cyberpunk-canvas';
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;';
      document.body.insertBefore(canvas, document.body.firstChild);
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
      startTime = null;
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      canvas = null; ctx = null; beams = []; startTime = null;
      window.removeEventListener('resize', resize);
    }

    window.CyberpunkFX = { init: init, stop: stop };
  })();

  // ============================================================
  // PIGGY THEME
  // ============================================================
  (function () {
    var pigEls = [];
    var injectedStyle = null;
    var active = false;

    function makePigElement(imgSrc, pxWidth) {
      var wrap = document.createElement('div');
      wrap.className = 'piggy-deco';
      var img = document.createElement('img');
      img.src = imgSrc;
      img.style.width = pxWidth + 'px';
      img.style.height = 'auto';
      img.style.display = 'block';
      wrap.appendChild(img);
      return wrap;
    }

    function injectStyles() {
      if (injectedStyle) return;
      injectedStyle = document.createElement('style');
      injectedStyle.id = 'piggy-fx-styles';
      injectedStyle.textContent = [
        '@keyframes pgf-a { 0%,100% { transform: translate(-50%, -50%) translateY(0px) rotate(-1.5deg); } 50% { transform: translate(-50%, -50%) translateY(-10px) rotate(1.5deg); } }',
        '@keyframes pgf-b { 0%,100% { transform: translate(-50%, -50%) translateY(-6px) rotate(1.25deg); } 50% { transform: translate(-50%, -50%) translateY(6px) rotate(-1.75deg); } }',
        '@keyframes pgf-c { 0%,100% { transform: translate(-50%, -50%) translateY(4px) rotate(2deg) scale(0.98); } 50% { transform: translate(-50%, -50%) translateY(-8px) rotate(-1.5deg) scale(1.02); } }',
        '.piggy-deco { position: fixed; pointer-events: none; z-index: 0; line-height: 0; opacity: 0.85; filter: drop-shadow(0 0 10px rgba(255, 100, 150, 0.4)); transform: translate(-50%, -50%); }',
      ].join('\n');
      document.head.appendChild(injectedStyle);
    }

    function removeStyles() {
      if (injectedStyle && injectedStyle.parentNode) {
        injectedStyle.parentNode.removeChild(injectedStyle);
      }
      injectedStyle = null;
    }

    var PIG_IMAGES = [
      'static/images/pig-with-a-red-bow-on-its-head.PNG',
      'static/images/cupid-pig-with-lyre.PNG',
      'static/images/pig-holding-a-star.PNG',
    ];

    function getPigSizesForScreen() {
      var width = window.innerWidth;
      if (width < 400) {
        return { small: { min: 50, max: 70 }, medium: { min: 70, max: 90 }, large: { min: 85, max: 110 } };
      } else if (width < 768) {
        return { small: { min: 70, max: 90 }, medium: { min: 90, max: 120 }, large: { min: 110, max: 150 } };
      } else {
        return { small: { min: 100, max: 140 }, medium: { min: 140, max: 200 }, large: { min: 180, max: 260 } };
      }
    }

    function getRandomSize() {
      var sizes = getPigSizesForScreen();
      var sizeKeys = ['small', 'medium', 'large'];
      var sizeKey = sizeKeys[Math.floor(Math.random() * sizeKeys.length)];
      var size = sizes[sizeKey];
      return Math.floor(Math.random() * (size.max - size.min + 1)) + size.min;
    }

    function getRandomAnim() {
      var anims = ['pgf-a', 'pgf-b', 'pgf-c'];
      return anims[Math.floor(Math.random() * anims.length)];
    }

    function getRandomDuration() {
      return (4 + Math.random() * 3).toFixed(2) + 's';
    }

    function getRandomDelay() {
      return (Math.random() * 2).toFixed(2) + 's';
    }

    function rectsOverlapPx(r1, r2, padding) {
      return !(r1.right + padding < r2.left || r1.left - padding > r2.right || r1.bottom + padding < r2.top || r1.top - padding > r2.bottom);
    }

    function getPigRect(xPercent, yPercent, sizePx) {
      var aspectRatio = 1.1;
      var widthPx = sizePx;
      var heightPx = sizePx * aspectRatio;
      var xPx = (xPercent / 100) * window.innerWidth;
      var yPx = (yPercent / 100) * window.innerHeight;
      return {
        left: xPx - widthPx / 2, right: xPx + widthPx / 2,
        top: yPx - heightPx / 2, bottom: yPx + heightPx / 2,
        width: widthPx, height: heightPx
      };
    }

    function generatePigPositions(numPigs) {
      var positions = [];
      var usedRects = [];
      var padding = window.innerWidth < 768 ? 15 : 30;
      var centerZonePadding = window.innerWidth < 768 ? 30 : 50;
      var centerZonePx = {
        left: window.innerWidth * 0.35, right: window.innerWidth * 0.65,
        top: window.innerHeight * 0.12, bottom: window.innerHeight * 0.78
      };

      for (var i = 0; i < numPigs; i++) {
        var placed = false;
        var attempts = 0;
        var maxAttempts = 200;

        while (!placed && attempts < maxAttempts) {
          attempts++;
          var xPercent = Math.random() * 100;
          var yPercent = Math.random() * 100;
          var size = getRandomSize();
          var rect = getPigRect(xPercent, yPercent, size);

          if (rect.left > centerZonePx.left - centerZonePadding && rect.right < centerZonePx.right + centerZonePadding &&
              rect.top > centerZonePx.top - centerZonePadding && rect.bottom < centerZonePx.bottom + centerZonePadding) {
            continue;
          }

          var overlaps = false;
          for (var j = 0; j < usedRects.length; j++) {
            if (rectsOverlapPx(rect, usedRects[j], padding)) {
              overlaps = true;
              break;
            }
          }

          if (!overlaps) {
            usedRects.push(rect);
            positions.push({ x: xPercent, y: yPercent, size: size });
            placed = true;
          }
        }
      }
      return positions;
    }

    function init() {
      if (active) return;
      active = true;
      injectStyles();

      var width = window.innerWidth;
      var numPigs;
      if (width < 400) {
        numPigs = Math.floor(Math.random() * 4) + 6;
      } else if (width < 768) {
        numPigs = Math.floor(Math.random() * 4) + 8;
      } else {
        numPigs = Math.floor(Math.random() * 5) + 12;
      }

      var positions = generatePigPositions(numPigs);
      positions.forEach(function (pos, index) {
        var imgSrc = PIG_IMAGES[Math.floor(Math.random() * PIG_IMAGES.length)];
        var wrap = makePigElement(imgSrc, pos.size);
        wrap.style.left = pos.x + '%';
        wrap.style.top = pos.y + '%';
        wrap.style.animation = getRandomAnim() + ' ' + getRandomDuration() + ' ' + getRandomDelay() + ' ease-in-out infinite';
        document.body.appendChild(wrap);
        pigEls.push(wrap);
      });
    }

    function stop() {
      active = false;
      pigEls.forEach(function (el) {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      pigEls = [];
      removeStyles();
    }

    window.PiggyFX = { init: init, stop: stop };
  })();

  // ============================================================
  // COSMOS THEME
  // ============================================================
  (function () {
    var canvas = null;
    var ctx = null;
    var rafId = null;
    var stars = [];
    var nebulae = [];
    var startTime = null;
    var STAR_COUNT = 150;

    function isCosmosActive() {
      return document.documentElement.classList.contains('theme-cosmos');
    }

    function createStars() {
      stars = [];
      var w = canvas.width;
      var h = canvas.height;
      for (var i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          baseX: 0, baseY: 0,
          size: 0.5 + Math.random() * 2.0,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.8,
          driftAmpX: (Math.random() - 0.5) * 6,
          driftAmpY: (Math.random() - 0.5) * 4,
          driftSpeedX: 0.1 + Math.random() * 0.15,
          driftSpeedY: 0.08 + Math.random() * 0.12,
          hue: Math.random() < 0.15 ? (30 + Math.random() * 40) : (200 + Math.random() * 60),
        });
        stars[i].baseX = stars[i].x;
        stars[i].baseY = stars[i].y;
      }
    }

    function createNebulae() {
      nebulae = [];
      var w = canvas.width;
      var h = canvas.height;
      var configs = [
        { cx: w * 0.15, cy: h * 0.25, rx: w * 0.28, ry: h * 0.22, colorStop: 'rgba(100, 20, 200, 0.13)', edge: 'rgba(60,10,120,0)' },
        { cx: w * 0.80, cy: h * 0.60, rx: w * 0.30, ry: h * 0.26, colorStop: 'rgba(20, 60, 200, 0.10)', edge: 'rgba(10,30,120,0)' },
        { cx: w * 0.55, cy: h * 0.15, rx: w * 0.22, ry: h * 0.18, colorStop: 'rgba(200, 20, 100, 0.08)', edge: 'rgba(100,10,60,0)' },
        { cx: w * 0.30, cy: h * 0.80, rx: w * 0.25, ry: h * 0.20, colorStop: 'rgba(40, 100, 220, 0.09)', edge: 'rgba(20,50,110,0)' },
        { cx: w * 0.75, cy: h * 0.20, rx: w * 0.20, ry: h * 0.17, colorStop: 'rgba(140, 30, 220, 0.07)', edge: 'rgba(70,15,110,0)' },
      ];
      configs.forEach(function (c) { nebulae.push(c); });
    }

    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createStars();
      createNebulae();
    }

    function drawNebulae() {
      nebulae.forEach(function (n) {
        ctx.save();
        ctx.translate(n.cx, n.cy);
        ctx.scale(1, n.ry / n.rx);
        var grd2 = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx);
        grd2.addColorStop(0, n.colorStop);
        grd2.addColorStop(1, n.edge);
        ctx.fillStyle = grd2;
        ctx.beginPath();
        ctx.arc(0, 0, n.rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    function drawStars(elapsed) {
      stars.forEach(function (s) {
        var t = elapsed / 1000;
        var opacity = 0.65 + 0.35 * Math.sin(s.phase + t * s.speed);
        var x = s.baseX + s.driftAmpX * Math.sin(s.phase + t * s.driftSpeedX);
        var y = s.baseY + s.driftAmpY * Math.cos(s.phase * 0.7 + t * s.driftSpeedY);
        ctx.beginPath();
        ctx.arc(x, y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + s.hue + ', 80%, 90%, ' + opacity + ')';
        ctx.fill();
        if (s.size > 1.6) {
          var glow = ctx.createRadialGradient(x, y, 0, x, y, s.size * 3);
          glow.addColorStop(0, 'hsla(' + s.hue + ', 80%, 90%, ' + (opacity * 0.4) + ')');
          glow.addColorStop(1, 'hsla(' + s.hue + ', 80%, 90%, 0)');
          ctx.beginPath();
          ctx.arc(x, y, s.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      });
    }

    function frame(timestamp) {
      if (!isCosmosActive()) { stop(); return; }
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawNebulae();
      drawStars(elapsed);
      rafId = requestAnimationFrame(frame);
    }

    function init() {
      if (canvas) return;
      canvas = document.createElement('canvas');
      canvas.id = 'starfield-canvas';
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block;';
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      startTime = null;
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      canvas = null; ctx = null; stars = []; nebulae = []; startTime = null;
      window.removeEventListener('resize', resizeCanvas);
    }

    window.Starfield = { init: init, stop: stop };
  })();
})();
