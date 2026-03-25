'use strict';

(function initDoodleBackground() {
  var body = document.body;
  if (!body || !body.classList.contains('doodle-bg-page')) return;

  var main = document.getElementById('main-content');
  if (!main) return;

  var urlsAttr = body.getAttribute('data-doodle-svgs') || '';
  var svgUrls = urlsAttr
    .split(',')
    .map(function(url) { return url.trim(); })
    .filter(Boolean);
  if (!svgUrls.length) return;

  var layoutId = body.getAttribute('data-doodle-layout') || 'home';
  var maxCount = parseInt(body.getAttribute('data-doodle-count') || '', 10);
  if (!Number.isFinite(maxCount) || maxCount < 1) {
    maxCount = svgUrls.length;
  }

  var existingLayer = main.querySelector('.doodle-bg-layer');
  if (existingLayer && existingLayer.parentNode) {
    existingLayer.parentNode.removeChild(existingLayer);
  }

  var layer = document.createElement('div');
  layer.className = 'doodle-bg-layer';
  layer.setAttribute('aria-hidden', 'true');

  var STATIC_SLOTS = {
    'notes-header': {
      desktop: [
        { x: 26, y: 22, size: 180 },
        { x: 50, y: 22, size: 176 },
        { x: 74, y: 23, size: 172 },
        { x: 62, y: 30, size: 166 }
      ],
      mobile: [
        { x: 28, y: 20, size: 124 },
        { x: 52, y: 21, size: 120 },
        { x: 74, y: 22, size: 118 },
        { x: 60, y: 29, size: 114 }
      ]
    }
  };

  var FIBONACCI_LAYOUTS = {
    home: {
      desktop: { xMin: 10, xMax: 90, yMin: 8, yMax: 38, sizeMin: 144, sizeMax: 164, jitterX: 1.1, jitterY: 0.9 },
      mobile: { xMin: 10, xMax: 90, yMin: 8, yMax: 34, sizeMin: 100, sizeMax: 114, jitterX: 0.8, jitterY: 0.7 }
    },
    notes: {
      desktop: { xMin: 10, xMax: 90, yMin: 10, yMax: 40, sizeMin: 142, sizeMax: 160, jitterX: 1.1, jitterY: 0.9 },
      mobile: { xMin: 10, xMax: 90, yMin: 10, yMax: 36, sizeMin: 98, sizeMax: 112, jitterX: 0.8, jitterY: 0.7 }
    }
  };

  var hasFibonacciConfig = Object.prototype.hasOwnProperty.call(FIBONACCI_LAYOUTS, layoutId);
  var staticSlotsByViewport = STATIC_SLOTS[layoutId] || STATIC_SLOTS['notes-header'];
  var doodles = [];

  var count = Math.min(svgUrls.length, maxCount);
  if (!hasFibonacciConfig) {
    count = Math.min(count, staticSlotsByViewport.desktop.length, staticSlotsByViewport.mobile.length);
  }

  function shuffleIndices(length) {
    var indices = [];
    var i;
    for (i = 0; i < length; i++) indices.push(i);
    for (i = length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    return indices;
  }

  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function clampCenterPercent(value, halfPercent) {
    var min = halfPercent;
    var max = 100 - halfPercent;
    if (min > max) return 50;
    return clamp(value, min, max);
  }

  function buildFibonacciSlots(countSlots, cfg) {
    var out = [];
    if (!cfg || countSlots < 1) return out;
    var goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (var idx = 0; idx < countSlots; idx++) {
      var t = (idx + 0.5) / countSlots;
      var radiusNorm = 0.24 + 0.74 * Math.sqrt(t);
      var theta = idx * goldenAngle;
      var xNorm = 0.5 + 0.5 * radiusNorm * Math.cos(theta);
      var yNorm = 0.5 + 0.5 * radiusNorm * Math.sin(theta);
      var x = cfg.xMin + (cfg.xMax - cfg.xMin) * xNorm;
      var y = cfg.yMin + (cfg.yMax - cfg.yMin) * yNorm;
      var sizeWave = 0.5 + 0.5 * Math.sin((idx + 1) * 1.35);
      var size = cfg.sizeMin + (cfg.sizeMax - cfg.sizeMin) * sizeWave;
      out.push({ x: x, y: y, size: size });
    }
    return out;
  }

  var isNotesHeaderLayout = layoutId === 'notes-header';
  var desktopJitterX = isNotesHeaderLayout ? 0.5 : (hasFibonacciConfig ? FIBONACCI_LAYOUTS[layoutId].desktop.jitterX : 1.0);
  var desktopJitterY = isNotesHeaderLayout ? 0.4 : (hasFibonacciConfig ? FIBONACCI_LAYOUTS[layoutId].desktop.jitterY : 0.8);
  var mobileJitterX = isNotesHeaderLayout ? 0.4 : (hasFibonacciConfig ? FIBONACCI_LAYOUTS[layoutId].mobile.jitterX : 0.7);
  var mobileJitterY = isNotesHeaderLayout ? 0.3 : (hasFibonacciConfig ? FIBONACCI_LAYOUTS[layoutId].mobile.jitterY : 0.6);

  var desktopSlotOrder = hasFibonacciConfig
    ? shuffleIndices(count)
    : shuffleIndices(staticSlotsByViewport.desktop.length).slice(0, count);
  var mobileSlotOrder = hasFibonacciConfig
    ? shuffleIndices(count)
    : shuffleIndices(staticSlotsByViewport.mobile.length).slice(0, count);
  var desktopXOrder = hasFibonacciConfig ? shuffleIndices(count) : null;
  var desktopYOrder = hasFibonacciConfig ? shuffleIndices(count) : null;
  var mobileXOrder = hasFibonacciConfig ? shuffleIndices(count) : null;
  var mobileYOrder = hasFibonacciConfig ? shuffleIndices(count) : null;

  var jitterDesktop = [];
  var jitterMobile = [];

  for (var i = 0; i < count; i++) {
    var doodle = document.createElement('img');
    doodle.className = 'doodle-bg-item';
    doodle.src = svgUrls[i % svgUrls.length];
    doodle.alt = '';
    doodle.loading = 'lazy';
    doodle.decoding = 'async';
    doodle.dataset.angle = String((Math.random() * 25).toFixed(2));
    doodle.dataset.opacity = String((0.13 + Math.random() * 0.05).toFixed(3));
    layer.appendChild(doodle);
    doodles.push(doodle);

    jitterDesktop.push({
      x: (-desktopJitterX / 2) + Math.random() * desktopJitterX,
      y: (-desktopJitterY / 2) + Math.random() * desktopJitterY
    });
    jitterMobile.push({
      x: (-mobileJitterX / 2) + Math.random() * mobileJitterX,
      y: (-mobileJitterY / 2) + Math.random() * mobileJitterY
    });
  }

  function layout() {
    var mobile = window.innerWidth <= 640;
    var slots = hasFibonacciConfig
      ? buildFibonacciSlots(count, mobile ? FIBONACCI_LAYOUTS[layoutId].mobile : FIBONACCI_LAYOUTS[layoutId].desktop)
      : (mobile ? staticSlotsByViewport.mobile : staticSlotsByViewport.desktop);
    var slotOrder = mobile ? mobileSlotOrder : desktopSlotOrder;
    var xOrder = mobile ? mobileXOrder : desktopXOrder;
    var yOrder = mobile ? mobileYOrder : desktopYOrder;
    var jitter = mobile ? jitterMobile : jitterDesktop;
    var containerWidth = main.clientWidth || window.innerWidth || 1;
    var containerHeight = main.clientHeight || window.innerHeight || 1;
    for (var i = 0; i < doodles.length; i++) {
      var doodle = doodles[i];
      var slot = slots[slotOrder[i]];
      if (!slot) continue;
      var slotX = hasFibonacciConfig && xOrder ? slots[xOrder[i]] : slot;
      var slotY = hasFibonacciConfig && yOrder ? slots[yOrder[i]] : slot;
      var baseX = slotX ? slotX.x : slot.x;
      var baseY = slotY ? slotY.y : slot.y;
      var opacity = parseFloat(doodle.dataset.opacity || '0.1');
      var renderedSize = slot.size * 0.78;
      var dx = jitter[i] ? jitter[i].x : 0;
      var dy = jitter[i] ? jitter[i].y : 0;
      var halfXPercent = ((renderedSize * 0.5) + 8) / containerWidth * 100;
      var halfYPercent = ((renderedSize * 0.5) + 8) / containerHeight * 100;
      var x = clampCenterPercent(baseX + dx, halfXPercent);
      var y = clampCenterPercent(baseY + dy, halfYPercent);
      doodle.style.left = String(x) + '%';
      doodle.style.top = String(y) + '%';
      doodle.style.width = String(renderedSize) + 'px';
      doodle.style.opacity = String(mobile ? Math.max(0.11, opacity - 0.02) : opacity);
      doodle.style.transform = 'translate(-50%, -50%) rotate(' + doodle.dataset.angle + 'deg)';
    }
  }

  main.insertBefore(layer, main.firstChild);
  layout();

  var resizeTimer = null;
  window.addEventListener('resize', function() {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layout, 120);
  });
})();
