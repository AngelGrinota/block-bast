// ============================================================
// BLOCK BLAST — starfield.js
// Cosmos theme: animated starfield canvas with nebula clouds
// Exposes window.Starfield = { init(), stop() }
// ============================================================

(function () {
  'use strict';

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
        x:        Math.random() * w,
        y:        Math.random() * h,
        baseX:    0, // set after push
        baseY:    0,
        size:     0.5 + Math.random() * 2.0,
        // twinkle: each star has its own phase and speed
        phase:    Math.random() * Math.PI * 2,
        speed:    0.4 + Math.random() * 0.8,
        // parallax drift amplitude (pixels)
        driftAmpX: (Math.random() - 0.5) * 6,
        driftAmpY: (Math.random() - 0.5) * 4,
        driftSpeedX: 0.1 + Math.random() * 0.15,
        driftSpeedY: 0.08 + Math.random() * 0.12,
        // color: mostly white-blue, occasional warm
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

    configs.forEach(function (c) {
      nebulae.push(c);
    });
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    createStars();
    createNebulae();
  }

  function drawNebulae() {
    nebulae.forEach(function (n) {
      // Draw elliptical nebula via save/scale/restore
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
      // Twinkle: opacity oscillates between 0.3 and 1.0
      var opacity = 0.65 + 0.35 * Math.sin(s.phase + t * s.speed);
      // Parallax drift
      var x = s.baseX + s.driftAmpX * Math.sin(s.phase + t * s.driftSpeedX);
      var y = s.baseY + s.driftAmpY * Math.cos(s.phase * 0.7 + t * s.driftSpeedY);

      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + s.hue + ', 80%, 90%, ' + opacity + ')';
      ctx.fill();

      // Add a soft glow for larger stars
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
    if (!isCosmosActive()) {
      stop();
      return;
    }
    if (!startTime) startTime = timestamp;
    var elapsed = timestamp - startTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNebulae();
    drawStars(elapsed);

    rafId = requestAnimationFrame(frame);
  }

  function init() {
    if (canvas) return; // already running

    canvas = document.createElement('canvas');
    canvas.id = 'starfield-canvas';
    canvas.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'z-index:-1',
      'pointer-events:none',
      'display:block',
    ].join(';');

    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    startTime = null;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    canvas = null;
    ctx = null;
    stars = [];
    nebulae = [];
    startTime = null;
    window.removeEventListener('resize', resizeCanvas);
  }

  window.Starfield = { init: init, stop: stop };
})();
