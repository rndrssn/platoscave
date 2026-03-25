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

  var SLOTS = {
    home: {
      desktop: [
        { x: 12, y: 12, size: 210 },
        { x: 79, y: 18, size: 180 },
        { x: 26, y: 34, size: 220 },
        { x: 88, y: 43, size: 185 },
        { x: 14, y: 60, size: 205 },
        { x: 70, y: 74, size: 180 },
        { x: 40, y: 89, size: 195 }
      ],
      mobile: [
        { x: 16, y: 9, size: 120 },
        { x: 78, y: 20, size: 108 },
        { x: 28, y: 34, size: 126 },
        { x: 84, y: 46, size: 108 },
        { x: 20, y: 60, size: 112 },
        { x: 74, y: 75, size: 120 },
        { x: 46, y: 90, size: 108 }
      ]
    },
    notes: {
      desktop: [
        { x: 10, y: 11, size: 205 },
        { x: 82, y: 19, size: 182 },
        { x: 24, y: 35, size: 215 },
        { x: 87, y: 45, size: 185 },
        { x: 13, y: 61, size: 210 },
        { x: 73, y: 76, size: 185 },
        { x: 44, y: 90, size: 195 }
      ],
      mobile: [
        { x: 14, y: 9, size: 116 },
        { x: 80, y: 20, size: 106 },
        { x: 30, y: 35, size: 124 },
        { x: 85, y: 47, size: 106 },
        { x: 18, y: 61, size: 110 },
        { x: 72, y: 76, size: 116 },
        { x: 46, y: 90, size: 106 }
      ]
    },
    'notes-header': {
      desktop: [
        { x: 38, y: 17, size: 252 }
      ],
      mobile: [
        { x: 46, y: 14, size: 176 }
      ]
    }
  };

  var slotsByViewport = SLOTS[layoutId] || SLOTS.home;
  var colorChoices = ['var(--ink-ghost)', 'var(--ink-faint)', 'var(--ink-mid)'];
  var doodles = [];
  var count = Math.min(svgUrls.length, slotsByViewport.desktop.length, slotsByViewport.mobile.length, maxCount);

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

  var isNotesHeaderLayout = layoutId === 'notes-header';
  var desktopJitterX = isNotesHeaderLayout ? 0.8 : 4;
  var desktopJitterY = isNotesHeaderLayout ? 0.8 : 3.6;
  var mobileJitterX = isNotesHeaderLayout ? 0.6 : 2.8;
  var mobileJitterY = isNotesHeaderLayout ? 0.6 : 2.4;

  var desktopSlotOrder = shuffleIndices(slotsByViewport.desktop.length).slice(0, count);
  var mobileSlotOrder = shuffleIndices(slotsByViewport.mobile.length).slice(0, count);
  var jitterDesktop = [];
  var jitterMobile = [];

  for (var i = 0; i < count; i++) {
    var doodle = document.createElement('img');
    doodle.className = 'doodle-bg-item';
    doodle.src = svgUrls[i];
    doodle.alt = '';
    doodle.loading = 'lazy';
    doodle.decoding = 'async';
    doodle.style.color = colorChoices[i % colorChoices.length];
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
    var slots = mobile ? slotsByViewport.mobile : slotsByViewport.desktop;
    var slotOrder = mobile ? mobileSlotOrder : desktopSlotOrder;
    var jitter = mobile ? jitterMobile : jitterDesktop;
    var containerWidth = main.clientWidth || window.innerWidth || 1;
    var containerHeight = main.clientHeight || window.innerHeight || 1;
    for (var i = 0; i < doodles.length; i++) {
      var doodle = doodles[i];
      var slot = slots[slotOrder[i]];
      if (!slot) continue;
      var opacity = parseFloat(doodle.dataset.opacity || '0.1');
      var renderedSize = slot.size * 0.588;
      var dx = jitter[i] ? jitter[i].x : 0;
      var dy = jitter[i] ? jitter[i].y : 0;
      var halfXPercent = ((renderedSize * 0.5) + 8) / containerWidth * 100;
      var halfYPercent = ((renderedSize * 0.5) + 8) / containerHeight * 100;
      var x = clampCenterPercent(slot.x + dx, halfXPercent);
      var y = clampCenterPercent(slot.y + dy, halfYPercent);
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
