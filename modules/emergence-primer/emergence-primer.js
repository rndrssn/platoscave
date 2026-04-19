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

  var playButton = document.getElementById('ep-life-play');
  var stopButton = document.getElementById('ep-life-stop');
  var resetButton = document.getElementById('ep-life-reset');
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
  var defaultSeed = isGanttMode() ? 'bunnies' : 'r-pentomino';
  var currentSeed = defaultSeed;

  function indexFor(x, y) {
    return y * COLUMNS + x;
  }

  function isGanttMode() {
    return lifeKind === 'gantt';
  }

  function buildGanttLayout() {
    var months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    var labelAxisX = 3;
    var xStart = 34;
    var xEnd = 186;
    var yTop = 30;
    var rowGap = 14;
    var barHeight = 7;
    var timelineY = 10;

    function monthToX(monthIndex) {
      var span = months.length - 1;
      return Math.round(xStart + ((xEnd - xStart) * monthIndex) / span);
    }

    var phaseDefs = [
      { id: 'requirements', label: 'Requirements Freeze', start: 0.2, end: 2.0, row: 0 },
      { id: 'design', label: 'Solution Design Sign-off', start: 2.5, end: 3.6, row: 1 },
      { id: 'build', label: 'Build', start: 4.0, end: 6.0, row: 2 },
      { id: 'sit', label: 'System Integration Test', start: 6.3, end: 7.0, row: 3 },
      { id: 'uat', label: 'UAT & Change Approval', start: 7.2, end: 7.7, row: 4 },
      { id: 'hypercare', label: 'Release / Hypercare', start: 7.85, end: 8.0, row: 5 }
    ];

    var phases = phaseDefs.map(function(def) {
      var y0 = yTop + (def.row * rowGap);
      var x0 = monthToX(def.start);
      var x1 = monthToX(def.end);
      if (x1 <= x0) x1 = x0 + 1;

      return {
        id: def.id,
        label: def.label,
        x0: x0,
        x1: x1,
        y0: y0,
        y1: y0 + barHeight
      };
    });

    var gateDefs = [
      { id: 'business-case', label: 'Business case', month: 2.25, row: 0.5 },
      { id: 'requirements-freeze', label: 'Req freeze', month: 6.15, row: 2.5 },
      { id: 'design-signoff', label: 'Design sign-off', month: 7.1, row: 3.5 },
      { id: 'change-approval', label: 'Change approval', month: 7.78, row: 4.5 },
      { id: 'go-live', label: 'Go-live', month: 7.92, row: 5 },
      { id: 'closure', label: 'Closure', month: 8.0, row: 5 }
    ];

    var gates = gateDefs.map(function(def) {
      return {
        id: def.id,
        label: def.label,
        x: monthToX(def.month),
        y: yTop + (def.row * rowGap) + Math.floor(barHeight / 2),
        r: 3
      };
    });

    var dependencies = [
      { from: 'phase:requirements', to: 'phase:design' },
      { from: 'phase:design', to: 'phase:build' },
      { from: 'phase:build', to: 'phase:sit' },
      { from: 'phase:sit', to: 'phase:uat' },
      { from: 'phase:uat', to: 'gate:change-approval' },
      { from: 'gate:change-approval', to: 'gate:go-live' }
    ];

    var quarters = [
      { label: 'Q4', start: 0, end: 1 },
      { label: 'Q1', start: 2, end: 4 },
      { label: 'Q2', start: 5, end: 7 }
    ];

    return {
      months: months,
      quarters: quarters,
      timelineY: timelineY,
      labelAxisX: labelAxisX,
      xStart: xStart,
      xEnd: xEnd,
      yTop: yTop,
      activeMinX: xStart - 1,
      activeMinY: yTop - 4,
      phases: phases,
      gates: gates,
      dependencies: dependencies
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

  function maskDrawHorizontal(maskBuffer, x0, x1, y, halfThickness) {
    var sx = Math.min(x0, x1);
    var ex = Math.max(x0, x1);
    var thickness = halfThickness || 0;

    for (var yy = y - thickness; yy <= y + thickness; yy += 1) {
      if (yy < 0 || yy >= ROWS) continue;
      for (var xx = sx; xx <= ex; xx += 1) {
        if (xx < 0 || xx >= COLUMNS) continue;
        maskBuffer[indexFor(xx, yy)] = 1;
      }
    }
  }

  function maskDrawVertical(maskBuffer, x, y0, y1, halfThickness) {
    var sy = Math.min(y0, y1);
    var ey = Math.max(y0, y1);
    var thickness = halfThickness || 0;

    for (var xx = x - thickness; xx <= x + thickness; xx += 1) {
      if (xx < 0 || xx >= COLUMNS) continue;
      for (var yy = sy; yy <= ey; yy += 1) {
        if (yy < 0 || yy >= ROWS) continue;
        maskBuffer[indexFor(xx, yy)] = 1;
      }
    }
  }

  function maskDrawDependencyRoute(maskBuffer, fromNode, toNode) {
    if (!fromNode || !toNode) return;

    var sx = fromNode.x;
    var sy = fromNode.y;
    var tx = toNode.x;
    var ty = toNode.y;
    var elbowX = Math.max(sx + 2, Math.floor((sx + tx) / 2));
    if (tx < sx) elbowX = sx + 2;

    maskDrawHorizontal(maskBuffer, sx, elbowX, sy, 0);
    maskDrawVertical(maskBuffer, elbowX, sy, ty, 0);
    maskDrawHorizontal(maskBuffer, elbowX, tx, ty, 0);

    // Small arrowhead so the dependency direction remains visible pre-erosion.
    var dir = tx >= elbowX ? 1 : -1;
    if (tx >= 0 && tx < COLUMNS && ty >= 0 && ty < ROWS) {
      maskBuffer[indexFor(tx, ty)] = 1;
      if ((tx - dir) >= 0 && (tx - dir) < COLUMNS) {
        if ((ty - 1) >= 0) maskBuffer[indexFor(tx - dir, ty - 1)] = 1;
        if ((ty + 1) < ROWS) maskBuffer[indexFor(tx - dir, ty + 1)] = 1;
      }
    }
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
    var labelFontPx = Math.max(18, Math.floor(pxPerCell * 3.4));
    var quarterFontPx = Math.max(20, Math.floor(pxPerCell * 3.8));

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
    if (!ref) return null;

    if (ref.indexOf('phase:') === 0) {
      var phaseId = ref.slice('phase:'.length);
      for (var i = 0; i < layout.phases.length; i += 1) {
        var phase = layout.phases[i];
        if (phase.id !== phaseId) continue;
        return {
          x: anchorSide === 'from' ? phase.x1 : phase.x0,
          y: Math.floor((phase.y0 + phase.y1) / 2)
        };
      }
      return null;
    }

    if (ref.indexOf('gate:') === 0) {
      var gateId = ref.slice('gate:'.length);
      for (var j = 0; j < layout.gates.length; j += 1) {
        var gate = layout.gates[j];
        if (gate.id !== gateId) continue;
        return { x: gate.x, y: gate.y };
      }
    }

    return null;
  }

  function drawGanttDependencies() {
    ctx.save();
    ctx.globalAlpha = 0.64;
    ctx.fillStyle = colors.inkMid;

    for (var y = 0; y < ROWS; y += 1) {
      for (var x = 0; x < COLUMNS; x += 1) {
        if (!ganttDependencyMask[indexFor(x, y)]) continue;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
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
    var phaseFontPx = Math.max(16, Math.floor(CELL_SIZE * 3.1));
    var gateFontPx = Math.max(20, Math.floor(CELL_SIZE * 3.8));
    var phaseLineHeight = Math.max(18, Math.floor(phaseFontPx * 1.08));
    var milestoneLabelAllowlist = {
      'business-case': true,
      'requirements-freeze': true,
      'design-signoff': true,
      'change-approval': true,
      'go-live': true,
      'closure': true
    };
    var reservedBands = [];

    function collidesReserved(top, bottom) {
      for (var bandIndex = 0; bandIndex < reservedBands.length; bandIndex += 1) {
        var band = reservedBands[bandIndex];
        if (bottom < band.top || top > band.bottom) continue;
        return true;
      }
      return false;
    }

    function reserveBand(centerY, halfHeight) {
      reservedBands.push({
        top: centerY - halfHeight - 2,
        bottom: centerY + halfHeight + 2
      });
    }

    function resolveLabelY(desiredY, halfHeight) {
      var minY = halfHeight + 1;
      var maxY = (ROWS * CELL_SIZE) - halfHeight - 1;
      var clamped = Math.max(minY, Math.min(maxY, desiredY));
      if (!collidesReserved(clamped - halfHeight, clamped + halfHeight)) return clamped;

      for (var delta = 2; delta <= 120; delta += 2) {
        var upY = clamped - delta;
        if (upY >= minY && !collidesReserved(upY - halfHeight, upY + halfHeight)) return upY;

        var downY = clamped + delta;
        if (downY <= maxY && !collidesReserved(downY - halfHeight, downY + halfHeight)) return downY;
      }

      return clamped;
    }

    ctx.save();
    ctx.fillStyle = colors.inkMid;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = String(phaseFontPx) + 'px monospace';
    ctx.globalAlpha = 0.82;

    var wrappedLabelsByPhase = {
      requirements: ['Requirements', 'Freeze'],
      design: ['Solution Design', 'Sign-off'],
      build: ['Build'],
      sit: ['System Integration', 'Test'],
      uat: ['UAT & Change', 'Approval'],
      hypercare: ['Release /', 'Hypercare']
    };

    for (var i = 0; i < layout.phases.length; i += 1) {
      var phase = layout.phases[i];
      var labelLines = wrappedLabelsByPhase[phase.id] || [phase.label];
      var labelX = (layout.labelAxisX * CELL_SIZE);
      var centerY = Math.round(((phase.y0 + phase.y1) / 2) * CELL_SIZE);

      if (labelLines.length <= 1) {
        ctx.fillText(labelLines[0], labelX, centerY);
        reserveBand(centerY, Math.ceil(phaseFontPx * 0.6));
        continue;
      }

      var firstY = centerY - Math.round(phaseLineHeight * 0.5);
      for (var lineIndex = 0; lineIndex < labelLines.length; lineIndex += 1) {
        var lineY = firstY + (lineIndex * phaseLineHeight);
        ctx.fillText(labelLines[lineIndex], labelX, lineY);
        reserveBand(lineY, Math.ceil(phaseFontPx * 0.6));
      }
    }

    ctx.globalAlpha = 0.9;
    ctx.textBaseline = 'middle';
    ctx.font = String(gateFontPx) + 'px monospace';
    var milestoneLabelX = (layout.labelAxisX * CELL_SIZE);
    for (var j = 0; j < layout.gates.length; j += 1) {
      var gate = layout.gates[j];
      if (!isGateStillVisible(gate)) continue;

      var gy = gate.y * CELL_SIZE;

      if (!milestoneLabelAllowlist[gate.id]) continue;
      ctx.fillStyle = colors.rust;
      ctx.textAlign = 'left';
      var gateHalf = Math.ceil(gateFontPx * 0.6);
      var labelY = resolveLabelY(gy, gateHalf);
      ctx.fillText(gate.label, milestoneLabelX, labelY);
      reserveBand(labelY, gateHalf);
    }

    ctx.restore();
  }

  function drawGanttScaffold() {
    if (!isGanttMode()) return;

    var layout = buildGanttLayout();
    drawGanttTimeline(layout);
    drawGanttDependencies();

    ctx.fillStyle = colors.scaffold;
    for (var y = 0; y < ROWS; y += 1) {
      for (var x = 0; x < COLUMNS; x += 1) {
        if (!ganttMask[indexFor(x, y)]) continue;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    ctx.fillStyle = colors.rust;
    for (var yy = 0; yy < ROWS; yy += 1) {
      for (var xx = 0; xx < COLUMNS; xx += 1) {
        if (!ganttGateMask[indexFor(xx, yy)]) continue;
        ctx.fillRect(xx * CELL_SIZE, yy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

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

  function syncControlState() {
    if (playButton) {
      playButton.classList.toggle('is-active', running);
      playButton.setAttribute('aria-pressed', running ? 'true' : 'false');
    }
    if (stopButton) {
      stopButton.classList.toggle('is-active', !running);
      stopButton.setAttribute('aria-pressed', running ? 'false' : 'true');
    }
  }

  function stopSimulation() {
    if (timerId) clearInterval(timerId);
    timerId = null;
    running = false;
    syncControlState();
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
    syncControlState();
  }

  function reseedSimulation() {
    var seedName = isGanttMode() ? defaultSeed : currentSeed;
    stopSimulation();
    applySeed(seedName);
  }

  if (playButton) playButton.addEventListener('click', startSimulation);
  if (stopButton) stopButton.addEventListener('click', stopSimulation);

  if (resetButton) {
    resetButton.addEventListener('click', reseedSimulation);
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

  renderSeedPreviews();
  setActiveSeed(resolveInitialSeed());
  applySeed(currentSeed);
  syncControlState();
})();
