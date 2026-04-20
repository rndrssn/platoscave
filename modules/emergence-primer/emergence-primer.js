'use strict';

(function initEmergencePrimer() {
  var canvas = document.getElementById('ep-life-canvas');
  if (!canvas) return;
  var overlayCanvas = document.getElementById('ep-life-overlay');

  var fallback = document.getElementById('ep-life-fallback');
  var cellCtx = canvas.getContext && canvas.getContext('2d');
  if (!cellCtx) {
    if (fallback) fallback.hidden = false;
    return;
  }
  var overlayCtx = null;
  if (overlayCanvas && overlayCanvas.getContext) overlayCtx = overlayCanvas.getContext('2d');
  var ctx = cellCtx;

  var startButton = document.getElementById('ep-life-start');
  var resetButton = document.getElementById('ep-life-reset');
  var patternToggleButton = document.querySelector('[data-ep-pattern-toggle]');
  var patternPanel = document.getElementById('ep-pattern-panel');
  var seedSelect = document.getElementById('ep-life-seed');
  var seedButtons = Array.prototype.slice.call(
    document.querySelectorAll('.ep-seed-btn[data-ep-seed]')
  );

  var lifeKind = (canvas.getAttribute('data-life-kind') || 'vanilla').toLowerCase();

  var COLUMNS = 192;
  var ROWS = 120;
  var CELL_SIZE = 5;
  var TOTAL_CELLS = COLUMNS * ROWS;
  var FIXED_TICKS_PER_SECOND = 10;

  var birthMask = (1 << 3); // B3
  var surviveMask = (1 << 2) | (1 << 3); // S23

  canvas.width = COLUMNS * CELL_SIZE;
  canvas.height = ROWS * CELL_SIZE;
  if (overlayCanvas) {
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;
  }

  var grid = new Uint8Array(TOTAL_CELLS);
  var nextGrid = new Uint8Array(TOTAL_CELLS);
  var ganttMask = new Uint8Array(TOTAL_CELLS);
  var ganttGateMask = new Uint8Array(TOTAL_CELLS);
  var ganttDependencyMask = new Uint8Array(TOTAL_CELLS);

  var generation = 0;
  var running = false;
  var timerId = null;
  var ganttEmitterEvents = [];
  var ganttActiveBounds = {
    minX: 0,
    maxX: COLUMNS - 1,
    minY: 0,
    maxY: ROWS - 1
  };

  function cssVar(name, fallbackValue) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    var value = raw ? raw.trim() : '';
    return value || fallbackValue;
  }

  var colors = {
    alive: '#000000',
    scaffold: cssVar('--viz-sage-light', cssVar('--sage-light', '#6B8F62')),
    scaffoldFaint: cssVar('--ink-ghost', '#C8BDA8'),
    inkMid: cssVar('--ink-mid', '#5C4F3A'),
    rust: cssVar('--viz-rust', cssVar('--rust', '#B65231')),
    gold: cssVar('--viz-gold', cssVar('--gold', '#D4AF37'))
  };
  var defaultSeed = 'bunnies';
  var currentSeed = defaultSeed;
  var CANVAS_TEXT_TARGET_CSS_PX = {
    timelineMonth: 7,
    timelineQuarter: 7,
    phaseLabel: 6,
    milestoneLabel: 5
  };
  var ganttModel = null;
  if (typeof window !== 'undefined' && typeof window.createEmergenceGanttModel === 'function') {
    ganttModel = window.createEmergenceGanttModel({
      columns: COLUMNS,
      rows: ROWS,
      cellSize: CELL_SIZE
    });
  }

  function indexFor(x, y) {
    return y * COLUMNS + x;
  }

  function isGanttMode() {
    return lifeKind === 'gantt';
  }

  function getCanvasDownscaleFactor() {
    if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return 1;
    var rect = canvas.getBoundingClientRect();
    if (!rect || !rect.width) return 1;
    return canvas.width / rect.width;
  }

  function responsiveCanvasFontPx(basePx, targetCssPx, maxPx) {
    var downscale = getCanvasDownscaleFactor();
    var responsivePx = Math.round(targetCssPx * downscale);
    var withMin = Math.max(basePx, responsivePx);
    if (typeof maxPx === 'number') return Math.min(maxPx, withMin);
    return withMin;
  }

  function buildGanttLayout() {
    if (ganttModel && typeof ganttModel.buildLayout === 'function') {
      return ganttModel.buildLayout();
    }
    return {
      months: [],
      quarters: [],
      timelineY: 10,
      labelAxisX: 3,
      xStart: 34,
      xEnd: 186,
      yTop: 30,
      activeMinX: 33,
      activeMinY: 26,
      phases: [],
      gates: [],
      dependencies: []
    };
  }

  function maskFillRect(maskBuffer, x0, y0, x1, y1) {
    var sx = Math.max(0, Math.floor(Math.min(x0, x1)));
    var ex = Math.min(COLUMNS, Math.ceil(Math.max(x0, x1)));
    var sy = Math.max(0, Math.floor(Math.min(y0, y1)));
    var ey = Math.min(ROWS, Math.ceil(Math.max(y0, y1)));

    for (var y = sy; y < ey; y += 1) {
      for (var x = sx; x < ex; x += 1) {
        maskBuffer[indexFor(x, y)] = 1;
      }
    }
  }

  function maskFillDiamond(maskBuffer, cx, cy, radius) {
    var sx = Math.max(0, cx - radius);
    var ex = Math.min(COLUMNS - 1, cx + radius);
    var sy = Math.max(0, cy - radius);
    var ey = Math.min(ROWS - 1, cy + radius);

    for (var y = sy; y <= ey; y += 1) {
      for (var x = sx; x <= ex; x += 1) {
        if (Math.abs(x - cx) + Math.abs(y - cy) > radius) continue;
        maskBuffer[indexFor(x, y)] = 1;
      }
    }
  }

  function buildDependencyRoute(fromNode, toNode) {
    if (!ganttModel || typeof ganttModel.buildDependencyRoute !== 'function') return null;
    return ganttModel.buildDependencyRoute(fromNode, toNode);
  }

  function forEachDependencyMaskCell(route, visitor) {
    if (!route || typeof visitor !== 'function') return;
    if (!ganttModel || typeof ganttModel.forEachDependencyCell !== 'function') return;
    ganttModel.forEachDependencyCell(route, function collect(xx, yy) {
      visitor(indexFor(xx, yy), xx, yy);
    });
  }

  function maskDrawDependencyRoute(maskBuffer, fromNode, toNode) {
    var route = buildDependencyRoute(fromNode, toNode);
    forEachDependencyMaskCell(route, function(idx) {
      maskBuffer[idx] = 1;
    });
  }

  function initializeGanttMask() {
    ganttMask.fill(0);
    ganttGateMask.fill(0);
    ganttDependencyMask.fill(0);
    var layout = buildGanttLayout();
    ganttActiveBounds = {
      minX: layout.activeMinX,
      maxX: COLUMNS - 1,
      minY: layout.activeMinY,
      maxY: ROWS - 1
    };

    for (var i = 0; i < layout.phases.length; i += 1) {
      var phase = layout.phases[i];
      maskFillRect(ganttMask, phase.x0, phase.y0, phase.x1, phase.y1);
    }

    for (var j = 0; j < layout.gates.length; j += 1) {
      var gate = layout.gates[j];
      maskFillDiamond(ganttGateMask, gate.x, gate.y, gate.r);
    }

    for (var k = 0; k < layout.dependencies.length; k += 1) {
      var dep = layout.dependencies[k];
      var fromNode = resolveDependencyNode(layout, dep.from, 'from');
      var toNode = resolveDependencyNode(layout, dep.to, 'to');
      maskDrawDependencyRoute(ganttDependencyMask, fromNode, toNode);
    }
  }

  function drawGanttTimeline(layout) {
    var pxPerCell = CELL_SIZE;
    var timelineYPx = layout.timelineY * pxPerCell;
    var startXPx = layout.xStart * pxPerCell;
    var endXPx = layout.xEnd * pxPerCell;
    var labelFontBasePx = Math.max(18, Math.floor(pxPerCell * 3.4));
    var quarterFontBasePx = Math.max(20, Math.floor(pxPerCell * 3.8));
    var labelFontPx = responsiveCanvasFontPx(
      labelFontBasePx,
      CANVAS_TEXT_TARGET_CSS_PX.timelineMonth,
      42
    );
    var quarterFontPx = responsiveCanvasFontPx(
      quarterFontBasePx,
      CANVAS_TEXT_TARGET_CSS_PX.timelineQuarter,
      46
    );

    ctx.save();
    ctx.globalAlpha = 0.74;
    ctx.strokeStyle = colors.inkMid;
    ctx.fillStyle = colors.inkMid;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(startXPx, timelineYPx);
    ctx.lineTo(endXPx, timelineYPx);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = String(labelFontPx) + 'px monospace';

    for (var i = 0; i < layout.months.length; i += 1) {
      var monthX = Math.round(startXPx + ((endXPx - startXPx) * i) / (layout.months.length - 1));
      ctx.beginPath();
      ctx.moveTo(monthX, timelineYPx);
      ctx.lineTo(monthX, timelineYPx + (pxPerCell * 1.8));
      ctx.stroke();
      ctx.fillText(layout.months[i], monthX, timelineYPx - 2);
    }

    ctx.textBaseline = 'top';
    ctx.font = String(quarterFontPx) + 'px monospace';
    for (var q = 0; q < layout.quarters.length; q += 1) {
      var quarter = layout.quarters[q];
      var qStart = Math.round(startXPx + ((endXPx - startXPx) * quarter.start) / (layout.months.length - 1));
      var qEnd = Math.round(startXPx + ((endXPx - startXPx) * quarter.end) / (layout.months.length - 1));
      ctx.fillText(quarter.label, Math.round((qStart + qEnd) / 2), timelineYPx + (pxPerCell * 2.6));
    }

    ctx.restore();
  }

  function resolveDependencyNode(layout, ref, anchorSide) {
    if (!ganttModel || typeof ganttModel.resolveDependencyNode !== 'function') return null;
    return ganttModel.resolveDependencyNode(layout, ref, anchorSide);
  }

  function dependencyMaskCoverage(route, maskBuffer) {
    var total = 0;
    var remaining = 0;
    forEachDependencyMaskCell(route, function(idx) {
      total += 1;
      if (maskBuffer[idx]) remaining += 1;
    });
    if (!total) return 0;
    return remaining / total;
  }

  function gateMaskCoverage(gate, maskBuffer) {
    var total = 0;
    var remaining = 0;
    for (var dy = -gate.r; dy <= gate.r; dy += 1) {
      for (var dx = -gate.r; dx <= gate.r; dx += 1) {
        if (Math.abs(dx) + Math.abs(dy) > gate.r) continue;
        var x = gate.x + dx;
        var y = gate.y + dy;
        if (x < 0 || y < 0 || x >= COLUMNS || y >= ROWS) continue;
        total += 1;
        if (maskBuffer[indexFor(x, y)]) remaining += 1;
      }
    }
    if (!total) return 0;
    return remaining / total;
  }

  function drawGanttDependencies(layout) {
    ctx.save();
    ctx.strokeStyle = colors.inkMid;
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';
    ctx.lineWidth = Math.max(1, CELL_SIZE * 0.22);

    for (var i = 0; i < layout.dependencies.length; i += 1) {
      var dep = layout.dependencies[i];
      var fromNode = resolveDependencyNode(layout, dep.from, 'from');
      var toNode = resolveDependencyNode(layout, dep.to, 'to');
      var route = buildDependencyRoute(fromNode, toNode);
      if (!route) continue;

      var coverage = dependencyMaskCoverage(route, ganttDependencyMask);
      if (coverage <= 0) continue;

      var sx = (route.sx + 0.5) * CELL_SIZE;
      var sy = (route.sy + 0.5) * CELL_SIZE;
      var ex = (route.elbowX + 0.5) * CELL_SIZE;
      var tx = (route.tx + 0.5) * CELL_SIZE;
      var ty = (route.ty + 0.5) * CELL_SIZE;

      ctx.globalAlpha = 0.22 + (0.72 * coverage);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, sy);
      ctx.lineTo(ex, ty);
      ctx.lineTo(tx, ty);
      var arrowSize = Math.max(2.2, CELL_SIZE * 0.34);
      if (route.tx !== route.elbowX) {
        var xBack = tx - (route.dirX * arrowSize);
        ctx.moveTo(tx, ty);
        ctx.lineTo(xBack, ty - (arrowSize * 0.75));
        ctx.moveTo(tx, ty);
        ctx.lineTo(xBack, ty + (arrowSize * 0.75));
      } else if (route.sy !== route.ty) {
        var yBack = ty - (route.dirY * arrowSize);
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - (arrowSize * 0.75), yBack);
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + (arrowSize * 0.75), yBack);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGanttMilestones(layout) {
    ctx.save();
    ctx.fillStyle = colors.rust;

    var diamondRadius = Math.max(2.4, CELL_SIZE * 0.42) * 3;
    for (var i = 0; i < layout.gates.length; i += 1) {
      var gate = layout.gates[i];
      var coverage = gateMaskCoverage(gate, ganttGateMask);
      if (coverage <= 0) continue;

      var cx = (gate.x + 0.5) * CELL_SIZE;
      var cy = (gate.y + 0.5) * CELL_SIZE;
      ctx.globalAlpha = 0.14 + (0.82 * coverage);

      ctx.beginPath();
      ctx.moveTo(cx, cy - diamondRadius);
      ctx.lineTo(cx + diamondRadius, cy);
      ctx.lineTo(cx, cy + diamondRadius);
      ctx.lineTo(cx - diamondRadius, cy);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function isGateStillVisible(gate) {
    for (var dy = -gate.r; dy <= gate.r; dy += 1) {
      for (var dx = -gate.r; dx <= gate.r; dx += 1) {
        if (Math.abs(dx) + Math.abs(dy) > gate.r) continue;
        var x = gate.x + dx;
        var y = gate.y + dy;
        if (x < 0 || y < 0 || x >= COLUMNS || y >= ROWS) continue;
        if (ganttGateMask[indexFor(x, y)]) return true;
      }
    }
    return false;
  }

  function drawGanttLabelsAndMilestones(layout) {
    if (!ganttModel || typeof ganttModel.buildLabelPlan !== 'function') return;

    var phaseLabelTargetCssPx = CANVAS_TEXT_TARGET_CSS_PX.phaseLabel;
    if (canvas && typeof canvas.getBoundingClientRect === 'function') {
      var rect = canvas.getBoundingClientRect();
      if (rect && rect.width && rect.width <= 360) {
        phaseLabelTargetCssPx = Math.max(5, phaseLabelTargetCssPx - 1);
      }
    }

    var phaseFontBasePx = Math.max(14, Math.floor(CELL_SIZE * 2.8));
    var phaseFontPx = responsiveCanvasFontPx(
      phaseFontBasePx,
      phaseLabelTargetCssPx,
      42
    );
    var gateFontBasePx = Math.max(9, Math.floor(CELL_SIZE * 2.0));
    var gateFontPx = responsiveCanvasFontPx(
      gateFontBasePx,
      CANVAS_TEXT_TARGET_CSS_PX.milestoneLabel,
      38
    );
    var phaseLineHeight = Math.max(18, Math.floor(phaseFontPx * 1.08));
    var phaseLabelX = (layout.labelAxisX * CELL_SIZE);
    var milestoneLabelX = phaseLabelX;
    var labelPlan = ganttModel.buildLabelPlan(layout, {
      phaseFontPx: phaseFontPx,
      gateFontPx: gateFontPx,
      phaseLineHeight: phaseLineHeight,
      canvasHeightPx: ROWS * CELL_SIZE,
      phaseLabelColumnX: phaseLabelX,
      milestoneLabelColumnX: milestoneLabelX
    });
    if (!labelPlan) return;

    var gateById = Object.create(null);
    for (var i = 0; i < layout.gates.length; i += 1) {
      gateById[layout.gates[i].id] = layout.gates[i];
    }

    ctx.save();
    ctx.fillStyle = colors.scaffold;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = String(phaseFontPx) + 'px monospace';
    ctx.globalAlpha = 0.82;
    for (var phaseIndex = 0; phaseIndex < labelPlan.phase.length; phaseIndex += 1) {
      var phaseLine = labelPlan.phase[phaseIndex];
      ctx.textAlign = phaseLine.align === 'right' ? 'right' : 'left';
      ctx.fillText(phaseLine.text, phaseLine.x, phaseLine.y);
    }

    ctx.globalAlpha = 0.9;
    ctx.textBaseline = 'middle';
    ctx.font = String(gateFontPx) + 'px monospace';
    for (var milestoneIndex = 0; milestoneIndex < labelPlan.milestones.length; milestoneIndex += 1) {
      var milestoneLine = labelPlan.milestones[milestoneIndex];
      var gate = gateById[milestoneLine.gateId];
      if (!gate) continue;
      if (!isGateStillVisible(gate)) continue;
      ctx.fillStyle = colors.rust;
      ctx.textAlign = milestoneLine.align === 'right' ? 'right' : 'left';
      ctx.fillText(milestoneLine.text, milestoneLine.x, milestoneLine.y);
    }

    ctx.restore();
  }

  function drawGanttScaffold() {
    if (!isGanttMode()) return;

    var layout = buildGanttLayout();
    drawGanttTimeline(layout);
    drawGanttDependencies(layout);

    ctx.fillStyle = colors.scaffold;
    for (var y = 0; y < ROWS; y += 1) {
      for (var x = 0; x < COLUMNS; x += 1) {
        if (!ganttMask[indexFor(x, y)]) continue;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    drawGanttMilestones(layout);
    drawGanttLabelsAndMilestones(layout);
  }

  function drawGrid() {
    // Transparent dead cells: clear to canvas background (white in CSS).
    cellCtx.clearRect(0, 0, canvas.width, canvas.height);

    cellCtx.fillStyle = colors.alive;
    for (var y = 0; y < ROWS; y += 1) {
      for (var x = 0; x < COLUMNS; x += 1) {
        if (!grid[indexFor(x, y)]) continue;
        cellCtx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    if (overlayCtx) {
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      if (isGanttMode()) {
        var previousCtx = ctx;
        ctx = overlayCtx;
        drawGanttScaffold();
        ctx = previousCtx;
      }
      return;
    }

    drawGanttScaffold();
  }

  function resetGrid() {
    grid.fill(0);
    nextGrid.fill(0);
    ganttMask.fill(0);
    ganttGateMask.fill(0);
    ganttDependencyMask.fill(0);
    generation = 0;
    ganttEmitterEvents = [];

    if (isGanttMode()) initializeGanttMask();

    drawGrid();
  }

  function placePatternAt(pattern, originX, originY) {
    if (!pattern || !pattern.length) return;

    for (var i = 0; i < pattern.length; i += 1) {
      var x = originX + pattern[i][0];
      var y = originY + pattern[i][1];
      if (x < 0 || y < 0 || x >= COLUMNS || y >= ROWS) continue;
      grid[indexFor(x, y)] = 1;
    }
  }

  function placePatternCentered(pattern) {
    if (!pattern || !pattern.length) return;

    var maxX = 0;
    var maxY = 0;
    for (var i = 0; i < pattern.length; i += 1) {
      maxX = Math.max(maxX, pattern[i][0]);
      maxY = Math.max(maxY, pattern[i][1]);
    }

    var offsetX = Math.floor((COLUMNS - (maxX + 1)) / 2);
    var offsetY = Math.floor((ROWS - (maxY + 1)) / 2);
    placePatternAt(pattern, offsetX, offsetY);
  }

  function seedPattern(seedName) {
    if (seedName === 'r-pentomino') {
      return [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]];
    }

    if (seedName === 'acorn') {
      return [[1, 0], [3, 1], [0, 2], [1, 2], [4, 2], [5, 2], [6, 2]];
    }

    if (seedName === 'bunnies') {
      return [[0, 0], [6, 0], [2, 1], [6, 1], [2, 2], [5, 2], [7, 2], [1, 3], [3, 3]];
    }

    return null;
  }

  function canonicalPattern(patternName) {
    if (patternName === 'block') {
      return [[0, 0], [1, 0], [0, 1], [1, 1]];
    }

    if (patternName === 'beehive') {
      return [[1, 0], [2, 0], [0, 1], [3, 1], [1, 2], [2, 2]];
    }

    if (patternName === 'blinker') {
      return [[0, 1], [1, 1], [2, 1]];
    }

    if (patternName === 'glider') {
      return [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]];
    }

    if (patternName === 'boat') {
      return [[0, 0], [1, 0], [0, 1], [2, 1], [1, 2]];
    }

    if (patternName === 'loaf') {
      return [[1, 0], [2, 0], [0, 1], [3, 1], [1, 2], [3, 2], [2, 3]];
    }

    if (patternName === 'tub') {
      return [[1, 0], [0, 1], [2, 1], [1, 2]];
    }

    if (patternName === 'toad') {
      return [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]];
    }

    if (patternName === 'beacon') {
      return [[0, 0], [1, 0], [0, 1], [1, 1], [2, 2], [3, 2], [2, 3], [3, 3]];
    }

    return null;
  }

  function resolveInitialSeed() {
    if (seedSelect && seedPattern(seedSelect.value)) return seedSelect.value;

    for (var i = 0; i < seedButtons.length; i += 1) {
      if (!seedButtons[i].classList.contains('is-active')) continue;
      var activeSeed = seedButtons[i].getAttribute('data-ep-seed');
      if (seedPattern(activeSeed)) return activeSeed;
    }

    if (seedButtons.length) {
      var firstSeed = seedButtons[0].getAttribute('data-ep-seed');
      if (seedPattern(firstSeed)) return firstSeed;
    }

    return defaultSeed;
  }

  function setActiveSeed(seedName) {
    var normalized = seedPattern(seedName) ? seedName : defaultSeed;
    currentSeed = normalized;

    if (seedSelect) seedSelect.value = normalized;

    for (var i = 0; i < seedButtons.length; i += 1) {
      var buttonSeed = seedButtons[i].getAttribute('data-ep-seed');
      var isActive = buttonSeed === normalized;
      seedButtons[i].classList.toggle('is-active', isActive);
      seedButtons[i].setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    return normalized;
  }

  function renderSeedPreviews() {
    var previewCellSize = 4;

    for (var i = 0; i < seedButtons.length; i += 1) {
      var previewCanvas = seedButtons[i].querySelector('.ep-seed-preview');
      if (!previewCanvas || typeof previewCanvas.getContext !== 'function') continue;

      var previewCtx = previewCanvas.getContext('2d');
      if (!previewCtx) continue;

      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

      var seedName = seedButtons[i].getAttribute('data-ep-seed');
      var pattern = seedPattern(seedName);
      if (!pattern || !pattern.length) continue;

      var maxX = 0;
      var maxY = 0;
      for (var j = 0; j < pattern.length; j += 1) {
        maxX = Math.max(maxX, pattern[j][0]);
        maxY = Math.max(maxY, pattern[j][1]);
      }

      var cellsW = maxX + 1;
      var cellsH = maxY + 1;
      var patternW = cellsW * previewCellSize;
      var patternH = cellsH * previewCellSize;
      var offsetX = Math.floor((previewCanvas.width - patternW) / 2);
      var offsetY = Math.floor((previewCanvas.height - patternH) / 2);

      previewCtx.fillStyle = colors.alive;
      for (var k = 0; k < pattern.length; k += 1) {
        previewCtx.fillRect(
          offsetX + (pattern[k][0] * previewCellSize),
          offsetY + (pattern[k][1] * previewCellSize),
          previewCellSize,
          previewCellSize
        );
      }
    }
  }

  function renderCanonicalPatternPreviews() {
    var patternCanvases = Array.prototype.slice.call(
      document.querySelectorAll('.ep-pattern-preview[data-ep-pattern]')
    );
    var previewCellSize = 5;

    for (var i = 0; i < patternCanvases.length; i += 1) {
      var previewCanvas = patternCanvases[i];
      if (!previewCanvas || typeof previewCanvas.getContext !== 'function') continue;

      var previewCtx = previewCanvas.getContext('2d');
      if (!previewCtx) continue;

      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

      var patternName = previewCanvas.getAttribute('data-ep-pattern');
      var pattern = canonicalPattern(patternName);
      if (!pattern || !pattern.length) continue;

      var maxX = 0;
      var maxY = 0;
      for (var j = 0; j < pattern.length; j += 1) {
        maxX = Math.max(maxX, pattern[j][0]);
        maxY = Math.max(maxY, pattern[j][1]);
      }

      var cellsW = maxX + 1;
      var cellsH = maxY + 1;
      var patternW = cellsW * previewCellSize;
      var patternH = cellsH * previewCellSize;
      var offsetX = Math.floor((previewCanvas.width - patternW) / 2);
      var offsetY = Math.floor((previewCanvas.height - patternH) / 2);

      previewCtx.fillStyle = colors.alive;
      for (var k = 0; k < pattern.length; k += 1) {
        previewCtx.fillRect(
          offsetX + (pattern[k][0] * previewCellSize),
          offsetY + (pattern[k][1] * previewCellSize),
          previewCellSize,
          previewCellSize
        );
      }
    }
  }

  function setPatternPanelOpen(isOpen) {
    if (!patternToggleButton || !patternPanel) return;
    patternToggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    patternToggleButton.textContent = isOpen ? '- Patterns to look for' : '+ Patterns to look for';
    patternPanel.classList.toggle('is-open', isOpen);
    patternPanel.classList.toggle('is-collapsed', !isOpen);
    patternPanel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  }

  function resolveEmitterSeed(seedName) {
    return seedPattern(seedName) ? seedName : defaultSeed;
  }

  function getPatternBounds(pattern) {
    if (!pattern || !pattern.length) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, centerY: 0 };
    }

    var minX = pattern[0][0];
    var maxX = pattern[0][0];
    var minY = pattern[0][1];
    var maxY = pattern[0][1];

    for (var i = 1; i < pattern.length; i += 1) {
      minX = Math.min(minX, pattern[i][0]);
      maxX = Math.max(maxX, pattern[i][0]);
      minY = Math.min(minY, pattern[i][1]);
      maxY = Math.max(maxY, pattern[i][1]);
    }

    return {
      minX: minX,
      maxX: maxX,
      minY: minY,
      maxY: maxY,
      centerY: (minY + maxY) / 2
    };
  }

  function findNearestNonOverlappingSeedY(pattern, seedX, preferredY, minY, maxY) {
    if (!overlapsGanttMask(pattern, seedX, preferredY)) return preferredY;

    var maxDelta = Math.max(preferredY - minY, maxY - preferredY);
    for (var delta = 1; delta <= maxDelta; delta += 1) {
      var up = preferredY - delta;
      if (up >= minY && !overlapsGanttMask(pattern, seedX, up)) return up;

      var down = preferredY + delta;
      if (down <= maxY && !overlapsGanttMask(pattern, seedX, down)) return down;
    }

    return preferredY;
  }

  function buildGanttEmitterEvents(seedName) {
    var layout = buildGanttLayout();
    var resolvedSeed = resolveEmitterSeed(seedName);
    var events = [];
    var pattern = seedPattern(resolvedSeed);
    var bounds = getPatternBounds(pattern);
    var minSeedX = -bounds.minX;
    var maxSeedX = (COLUMNS - 1) - bounds.maxX;
    var minSeedY = -bounds.minY;
    var maxSeedY = (ROWS - 1) - bounds.maxY;

    for (var i = 0; i < layout.phases.length; i += 1) {
      var phase = layout.phases[i];
      var seedX = Math.max(minSeedX, Math.min(maxSeedX, phase.x1 + 1));
      var phaseCenterY = (phase.y0 + (phase.y1 - 1)) / 2;
      var preferredSeedY = Math.round(phaseCenterY - bounds.centerY);
      preferredSeedY = Math.max(minSeedY, Math.min(maxSeedY, preferredSeedY));
      var seedY = findNearestNonOverlappingSeedY(pattern, seedX, preferredSeedY, minSeedY, maxSeedY);

      events.push({
        generation: i * 14,
        x: seedX,
        y: seedY,
        seed: resolvedSeed,
        done: false
      });
    }

    return events;
  }

  function overlapsGanttMask(pattern, originX, originY) {
    if (!pattern || !pattern.length) return false;

    for (var i = 0; i < pattern.length; i += 1) {
      var x = originX + pattern[i][0];
      var y = originY + pattern[i][1];
      if (x < 0 || y < 0 || x >= COLUMNS || y >= ROWS) continue;
      if (ganttMask[indexFor(x, y)]) return true;
    }
    return false;
  }

  function injectGanttEventsForGeneration(currentGeneration) {
    if (!isGanttMode() || !ganttEmitterEvents.length) return;

    for (var i = 0; i < ganttEmitterEvents.length; i += 1) {
      var event = ganttEmitterEvents[i];
      if (event.done || event.generation !== currentGeneration) continue;

      var pattern = seedPattern(event.seed);
      if (pattern) placePatternAt(pattern, event.x, event.y);
      event.done = true;
    }
  }

  function applySeed(seedName) {
    resetGrid();

    if (isGanttMode()) {
      ganttEmitterEvents = buildGanttEmitterEvents(seedName || defaultSeed);
      injectGanttEventsForGeneration(0);
      clampGanttLifeArea(grid);
    } else {
      var pattern = seedPattern(seedName);
      if (!pattern) pattern = seedPattern(defaultSeed);
      placePatternCentered(pattern);
    }

    drawGrid();
  }

  function neighborCount(x, y) {
    var total = 0;
    var minX = 0;
    var maxX = COLUMNS - 1;
    var minY = 0;
    var maxY = ROWS - 1;

    if (isGanttMode()) {
      minX = ganttActiveBounds.minX;
      maxX = ganttActiveBounds.maxX;
      minY = ganttActiveBounds.minY;
      maxY = ganttActiveBounds.maxY;
    }

    for (var dy = -1; dy <= 1; dy += 1) {
      for (var dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;

        var nx = x + dx;
        var ny = y + dy;

        if (nx < minX) nx = maxX;
        if (nx > maxX) nx = minX;
        if (ny < minY) ny = maxY;
        if (ny > maxY) ny = minY;

        total += grid[indexFor(nx, ny)];
      }
    }

    return total;
  }

  function erodeGanttMaskFrom(liveBuffer) {
    if (!isGanttMode()) return;

    for (var i = 0; i < TOTAL_CELLS; i += 1) {
      if (!liveBuffer[i]) continue;
      if (ganttMask[i]) ganttMask[i] = 0;
      if (ganttGateMask[i]) ganttGateMask[i] = 0;
      if (ganttDependencyMask[i]) ganttDependencyMask[i] = 0;
    }
  }

  function clampGanttLifeArea(liveBuffer) {
    if (!isGanttMode()) return;
    var minX = ganttActiveBounds.minX;
    var minY = ganttActiveBounds.minY;
    for (var y = 0; y < ROWS; y += 1) {
      for (var x = 0; x < COLUMNS; x += 1) {
        if (x >= minX && y >= minY) continue;
        liveBuffer[indexFor(x, y)] = 0;
      }
    }
  }

  function stepSimulation() {
    injectGanttEventsForGeneration(generation);

    for (var y = 0; y < ROWS; y += 1) {
      for (var x = 0; x < COLUMNS; x += 1) {
        var idx = indexFor(x, y);
        var current = grid[idx];
        var neighbors = neighborCount(x, y);
        var mask = current ? surviveMask : birthMask;
        var nextValue = (mask >> neighbors) & 1;

        nextGrid[idx] = nextValue;
      }
    }

    clampGanttLifeArea(nextGrid);
    erodeGanttMaskFrom(nextGrid);

    var swap = grid;
    grid = nextGrid;
    nextGrid = swap;
    generation += 1;
  }

  function stopSimulation() {
    if (timerId) clearInterval(timerId);
    timerId = null;
    running = false;
    syncStartControl();
  }

  function startSimulation() {
    if (running) return;

    var intervalMs = Math.max(1, Math.round(1000 / FIXED_TICKS_PER_SECOND));

    if (timerId) clearInterval(timerId);
    timerId = setInterval(function () {
      stepSimulation();
      drawGrid();
    }, intervalMs);

    running = true;
    syncStartControl();
  }

  function syncStartControl() {
    if (!startButton) return;
    startButton.classList.toggle('is-active', running);
    startButton.setAttribute('aria-pressed', running ? 'true' : 'false');
  }

  function reseedSimulation(seedName) {
    var resolvedSeed = seedName || currentSeed;
    var shouldResume = running;
    stopSimulation();
    applySeed(resolvedSeed);
    if (shouldResume) startSimulation();
  }

  if (startButton) {
    startButton.addEventListener('click', startSimulation);
  }

  if (resetButton) {
    resetButton.addEventListener('click', function () {
      reseedSimulation(currentSeed);
    });
  }

  if (seedSelect) {
    seedSelect.addEventListener('change', function () {
      stopSimulation();
      setActiveSeed(seedSelect.value);
      applySeed(currentSeed);
    });
  }

  if (seedButtons.length) {
    seedButtons.forEach(function(button) {
      button.addEventListener('click', function () {
        stopSimulation();
        setActiveSeed(button.getAttribute('data-ep-seed'));
        applySeed(currentSeed);
      });
    });
  }

  if (patternToggleButton && patternPanel) {
    setPatternPanelOpen(false);
    patternToggleButton.addEventListener('click', function () {
      var isExpanded = patternToggleButton.getAttribute('aria-expanded') === 'true';
      setPatternPanelOpen(!isExpanded);
    });
  }

  renderSeedPreviews();
  renderCanonicalPatternPreviews();
  setActiveSeed(resolveInitialSeed());
  applySeed(currentSeed);
  syncStartControl();
})();
