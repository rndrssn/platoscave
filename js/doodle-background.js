'use strict';

(function initDoodleBackground() {
  var body = document.body;
  if (!body || !body.classList.contains('doodle-bg-page')) return;

  var main = document.getElementById('main-content');
  if (!main) return;
  var nav = document.querySelector('.main-nav');
  if (!nav) return;

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

  var FIBONACCI_LAYOUTS = {
    home: {
      desktop: { xMin: 30, xMax: 96, yMin: 8, yMax: 28, sizeMin: 96, sizeMax: 114, jitterX: 0.55, jitterY: 0.55 },
      mobile: { xMin: 24, xMax: 94, yMin: 10, yMax: 28, sizeMin: 72, sizeMax: 88, jitterX: 0.45, jitterY: 0.45 }
    },
    notes: {
      desktop: { xMin: 28, xMax: 96, yMin: 9, yMax: 30, sizeMin: 94, sizeMax: 112, jitterX: 0.55, jitterY: 0.55 },
      mobile: { xMin: 22, xMax: 94, yMin: 11, yMax: 30, sizeMin: 70, sizeMax: 86, jitterX: 0.45, jitterY: 0.45 }
    }
  };

  var hasFibonacciConfig = Object.prototype.hasOwnProperty.call(FIBONACCI_LAYOUTS, layoutId);
  var doodles = [];

  var count = Math.min(svgUrls.length, maxCount);
  if (!hasFibonacciConfig) return;

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

  var desktopJitterX = FIBONACCI_LAYOUTS[layoutId].desktop.jitterX;
  var desktopJitterY = FIBONACCI_LAYOUTS[layoutId].desktop.jitterY;
  var mobileJitterX = FIBONACCI_LAYOUTS[layoutId].mobile.jitterX;
  var mobileJitterY = FIBONACCI_LAYOUTS[layoutId].mobile.jitterY;

  var desktopSlotOrder = shuffleIndices(count);
  var mobileSlotOrder = shuffleIndices(count);
  var desktopXOrder = shuffleIndices(count);
  var desktopYOrder = shuffleIndices(count);
  var mobileXOrder = shuffleIndices(count);
  var mobileYOrder = shuffleIndices(count);
  var urlOrder = shuffleIndices(svgUrls.length);

  var jitterDesktop = [];
  var jitterMobile = [];

  for (var i = 0; i < count; i++) {
    var doodle = document.createElement('img');
    doodle.className = 'doodle-bg-item';
    doodle.src = svgUrls[urlOrder[i % urlOrder.length]];
    doodle.alt = '';
    doodle.loading = 'lazy';
    doodle.decoding = 'async';
    doodle.dataset.angle = String((-20 + Math.random() * 40).toFixed(2));
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
    var slots = buildFibonacciSlots(count, mobile ? FIBONACCI_LAYOUTS[layoutId].mobile : FIBONACCI_LAYOUTS[layoutId].desktop);
    var slotOrder = mobile ? mobileSlotOrder : desktopSlotOrder;
    var xOrder = mobile ? mobileXOrder : desktopXOrder;
    var yOrder = mobile ? mobileYOrder : desktopYOrder;
    var jitter = mobile ? jitterMobile : jitterDesktop;
    var containerWidth = main.clientWidth || window.innerWidth || 1;
    var containerHeight = main.clientHeight || window.innerHeight || 1;
    var topPanelPx = Math.max(0, Math.round(nav.getBoundingClientRect().height || 0));
    var topSafePaddingPx = topPanelPx + 10;
    for (var i = 0; i < doodles.length; i++) {
      var doodle = doodles[i];
      var slot = slots[slotOrder[i]];
      if (!slot) continue;
      var slotX = slots[xOrder[i]] || slot;
      var slotY = slots[yOrder[i]] || slot;
      var baseX = slotX ? slotX.x : slot.x;
      var baseY = slotY ? slotY.y : slot.y;
      var opacity = parseFloat(doodle.dataset.opacity || '0.1');
      var renderedSize = slot.size * 0.78;
      var dx = jitter[i] ? jitter[i].x : 0;
      var dy = jitter[i] ? jitter[i].y : 0;
      var clippedHalf = (renderedSize * 0.64) + 12;
      var halfXPercent = (clippedHalf / containerWidth) * 100;
      var halfYPercent = (clippedHalf / containerHeight) * 100;
      var x = clampCenterPercent(baseX + dx, halfXPercent);
      var minYPercent = ((clippedHalf + topSafePaddingPx) / containerHeight) * 100;
      var maxYPercent = 100 - halfYPercent;
      if (minYPercent > maxYPercent) minYPercent = maxYPercent;
      var y = clamp(baseY + dy, minYPercent, maxYPercent);
      doodle.style.left = String(x) + '%';
      doodle.style.top = String(y) + '%';
      doodle.style.width = String(renderedSize) + 'px';
      doodle.style.opacity = String(mobile ? Math.max(0.09, opacity - 0.02) : opacity);
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
