// ============================================================
// BLOCK BLAST — steampunk_fx.js
// Steampunk theme: decorative gears + steam particle effects
// Exposes window.SteampunkFX = { init(), stop(), onLineClear() }
// ============================================================

(function () {
  'use strict';

  var gearEls = [];
  var injectedStyle = null;
  var active = false;

  // Gear SVG path: 8-tooth gear shape
  function buildGearSVG(size, id) {
    var r  = size / 2;       // outer radius
    var ri = r * 0.58;       // inner radius (between teeth valleys)
    var rh = r * 0.28;       // hub hole radius
    var teeth = 8;
    var points = [];

    for (var i = 0; i < teeth; i++) {
      var angle = (i / teeth) * Math.PI * 2 - Math.PI / 2;
      var halfTooth = Math.PI / teeth * 0.38;

      // Valley before tooth
      points.push([
        ri * Math.cos(angle - halfTooth * 1.4),
        ri * Math.sin(angle - halfTooth * 1.4),
      ]);
      // Left flank of tooth
      points.push([
        r * Math.cos(angle - halfTooth),
        r * Math.sin(angle - halfTooth),
      ]);
      // Right flank of tooth
      points.push([
        r * Math.cos(angle + halfTooth),
        r * Math.sin(angle + halfTooth),
      ]);
      // Valley after tooth
      points.push([
        ri * Math.cos(angle + halfTooth * 1.4),
        ri * Math.sin(angle + halfTooth * 1.4),
      ]);
    }

    var d = points.map(function (p, idx) {
      return (idx === 0 ? 'M' : 'L') + (r + p[0]).toFixed(2) + ',' + (r + p[1]).toFixed(2);
    }).join(' ') + ' Z';

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width',  size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
    svg.style.overflow = 'visible';

    // Outer gear ring
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'url(#gear-grad-' + id + ')');
    path.setAttribute('stroke', '#8b5e00');
    path.setAttribute('stroke-width', '1.5');

    // Gradient definition
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    grad.setAttribute('id', 'gear-grad-' + id);
    grad.setAttribute('cx', '40%');
    grad.setAttribute('cy', '35%');
    grad.setAttribute('r',  '65%');
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

    // Hub hole (circle cutout — drawn as filled dark circle on top)
    var hub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hub.setAttribute('cx', r);
    hub.setAttribute('cy', r);
    hub.setAttribute('r',  rh);
    hub.setAttribute('fill', '#1a0f00');
    hub.setAttribute('stroke', '#6b4000');
    hub.setAttribute('stroke-width', '1');

    // Center dot
    var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', r);
    dot.setAttribute('cy', r);
    dot.setAttribute('r',  rh * 0.3);
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
      '@keyframes steampunk-spin-cw {',
      '  from { transform: rotate(0deg); }',
      '  to   { transform: rotate(360deg); }',
      '}',
      '@keyframes steampunk-spin-ccw {',
      '  from { transform: rotate(0deg); }',
      '  to   { transform: rotate(-360deg); }',
      '}',
      '@keyframes steam-float {',
      '  0%   { opacity: 0.7; transform: translateY(0)   scale(1);   }',
      '  60%  { opacity: 0.4; transform: translateY(-40px) scale(1.4); }',
      '  100% { opacity: 0;   transform: translateY(-80px) scale(1.8); }',
      '}',
      '.steampunk-gear {',
      '  position: fixed;',
      '  pointer-events: none;',
      '  z-index: 0;',
      '  opacity: 0.55;',
      '  filter: drop-shadow(0 0 6px rgba(212, 132, 30, 0.5));',
      '}',
      '.steampunk-gear.cw  { animation: steampunk-spin-cw  12s linear infinite; }',
      '.steampunk-gear.ccw { animation: steampunk-spin-ccw 18s linear infinite; }',
      '.steampunk-gear.slow-cw  { animation: steampunk-spin-cw  24s linear infinite; }',
      '.steam-particle {',
      '  position: fixed;',
      '  border-radius: 50%;',
      '  pointer-events: none;',
      '  z-index: 5000;',
      '  animation: steam-float 0.3s ease-out forwards;',
      '}',
    ].join('\n');
    document.head.appendChild(injectedStyle);
  }

  function removeStyles() {
    if (injectedStyle && injectedStyle.parentNode) {
      injectedStyle.parentNode.removeChild(injectedStyle);
    }
    injectedStyle = null;
  }

  // Gear placements: [size, top/bottom edge %, left/right edge %, corner, spin-class]
  var GEAR_CONFIGS = [
    { size: 80,  top: null,  bottom: '12%', left: '2%',  right: null, spinClass: 'cw' },
    { size: 56,  top: '8%',  bottom: null,  left: null,  right: '2%', spinClass: 'ccw' },
    { size: 100, top: null,  bottom: '5%',  left: null,  right: '1%', spinClass: 'slow-cw' },
  ];

  function init() {
    if (active) return;
    active = true;

    injectStyles();

    GEAR_CONFIGS.forEach(function (cfg, idx) {
      var wrap = document.createElement('div');
      wrap.className = 'steampunk-gear ' + cfg.spinClass;

      if (cfg.top    !== null) wrap.style.top    = cfg.top;
      if (cfg.bottom !== null) wrap.style.bottom = cfg.bottom;
      if (cfg.left   !== null) wrap.style.left   = cfg.left;
      if (cfg.right  !== null) wrap.style.right  = cfg.right;

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
    // Find board element to anchor particle position
    var board = document.getElementById('board');
    var rect = board ? board.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };

    var count = Math.min(15, 8 + Math.floor(Math.random() * 5)); // 8–12 particles, capped at 15

    for (var i = 0; i < count; i++) {
      (function () {
        var p = document.createElement('div');
        p.className = 'steam-particle';

        var size = 4 + Math.random() * 8;
        var x = rect.left + Math.random() * rect.width;
        var y = rect.top  + Math.random() * rect.height;
        var delay = Math.random() * 0.4;

        p.style.cssText = [
          'width:'  + size + 'px',
          'height:' + size + 'px',
          'left:'   + x + 'px',
          'top:'    + y + 'px',
          'background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,200,200,0.3) 100%)',
          'animation-delay:' + delay + 's',
        ].join(';');

        document.body.appendChild(p);

        // Remove after animation completes
        setTimeout(function () {
          if (p.parentNode) p.parentNode.removeChild(p);
        }, (delay + 0.35) * 1000);
      })();
    }
  }

  window.SteampunkFX = { init: init, stop: stop, onLineClear: onLineClear };
})();
