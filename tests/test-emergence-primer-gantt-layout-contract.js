'use strict';

const fs = require('fs');
const path = require('path');

const modelPath = path.join(
  __dirname,
  '..',
  'modules',
  'emergence',
  'emergence-primer-gantt.js'
);
const modelSource = fs.readFileSync(modelPath, 'utf8');
const createEmergenceGanttModel = require(modelPath);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function overlaps(a, b) {
  return !(a.bottom < b.top || a.top > b.bottom);
}

function horizontalOverlap(a, b) {
  return !(a.right < b.left || a.left > b.right);
}

function testModuleSurface() {
  assert(typeof createEmergenceGanttModel === 'function', 'Expected gantt model factory export');
  assert(
    /root\.createEmergenceGanttModel\s*=/.test(modelSource),
    'Expected browser global registration for gantt model'
  );
}

function testLayoutContract() {
  const model = createEmergenceGanttModel({ columns: 192, rows: 120, cellSize: 5 });
  const layout = model.buildLayout();

  assert(Array.isArray(layout.phases) && layout.phases.length === 6, 'Expected 6 phases');
  assert(Array.isArray(layout.gates) && layout.gates.length === 6, 'Expected 6 milestones');
  assert(Array.isArray(layout.dependencies) && layout.dependencies.length === 6, 'Expected phase-chain dependency set');

  const phaseIds = layout.phases.map((phase) => phase.id);
  const gateIds = layout.gates.map((gate) => gate.id);
  ['requirements', 'design', 'build', 'sit', 'uat', 'hypercare'].forEach((id) => {
    assert(phaseIds.includes(id), 'Missing phase id: ' + id);
  });
  ['business-case', 'requirements-signoff', 'design-signoff', 'change-approval', 'go-live', 'closure'].forEach((id) => {
    assert(gateIds.includes(id), 'Missing milestone id: ' + id);
  });

  assert(
    !layout.dependencies.some((dependency) => dependency.from === 'phase:hypercare' && dependency.to === 'gate:closure'),
    'Expected closure milestone to be detached from dependency chain'
  );
  assert(
    !layout.dependencies.some((dependency) => dependency.to.startsWith('gate:')),
    'Expected milestone markers to be detached from dependency targets'
  );
}

function testGateMarkersOnDependencySegments() {
  const model = createEmergenceGanttModel({ columns: 192, rows: 120, cellSize: 5 });
  const layout = model.buildLayout();
  const gateById = new Map(layout.gates.map((gate) => [gate.id, gate]));
  const routeByKey = new Map();

  layout.dependencies.forEach((dependency) => {
    const fromNode = model.resolveDependencyNode(layout, dependency.from, 'from');
    const toNode = model.resolveDependencyNode(layout, dependency.to, 'to');
    const route = model.buildDependencyRoute(fromNode, toNode);
    assert(route, 'Expected dependency route for ' + dependency.from + ' -> ' + dependency.to);
    routeByKey.set(dependency.from + '->' + dependency.to, route);
  });

  const placementSpecs = [
    { gateId: 'requirements-signoff', routeKey: 'phase:requirements->phase:design' },
    { gateId: 'design-signoff', routeKey: 'phase:design->phase:build' },
    { gateId: 'change-approval', routeKey: 'phase:uat->phase:hypercare' },
    { gateId: 'go-live', routeKey: 'phase:uat->phase:hypercare' },
  ];

  placementSpecs.forEach((spec) => {
    const gate = gateById.get(spec.gateId);
    const route = routeByKey.get(spec.routeKey);
    assert(gate, 'Expected gate: ' + spec.gateId);
    assert(route, 'Expected route for marker placement: ' + spec.routeKey);

    const yMin = Math.min(route.sy, route.ty);
    const yMax = Math.max(route.sy, route.ty);
    assert(gate.x === route.elbowX, 'Expected marker on straight vertical segment for ' + spec.gateId);
    assert(gate.y > yMin && gate.y < yMax, 'Expected marker to be interior to segment for ' + spec.gateId);
    assert(gate.y !== route.ty, 'Expected marker not to sit on route turn for ' + spec.gateId);
  });
}

function testDependencyRouteShape() {
  const model = createEmergenceGanttModel({ columns: 192, rows: 120, cellSize: 5 });
  const layout = model.buildLayout();

  layout.dependencies.forEach((dependency) => {
    const fromNode = model.resolveDependencyNode(layout, dependency.from, 'from');
    const toNode = model.resolveDependencyNode(layout, dependency.to, 'to');
    const route = model.buildDependencyRoute(fromNode, toNode);

    assert(route, 'Expected dependency route for ' + dependency.from + ' -> ' + dependency.to);
    assert(typeof route.sx === 'number' && typeof route.sy === 'number', 'Expected route source coordinates');
    assert(typeof route.elbowX === 'number', 'Expected route elbow coordinate');
    assert(typeof route.tx === 'number' && typeof route.ty === 'number', 'Expected route target coordinates');
    assert(typeof route.dirX === 'number' && typeof route.dirY === 'number', 'Expected route direction vectors');
    assert(route.tx === toNode.x, 'Expected dependency endpoint at target anchor x');
    assert(route.ty === toNode.y, 'Expected dependency endpoint at target anchor y');
    assert(route.tx > route.sx, 'Expected first and last horizontal legs to move right');
    assert(route.elbowX > route.sx, 'Expected first kink after source');
    assert(route.elbowX < route.tx, 'Expected second kink before target');
    assert(route.dirX === 1, 'Expected rightward arrow direction');

    const cells = [];
    model.forEachDependencyCell(route, (x, y) => {
      cells.push({ x, y });
    });
    assert(cells.length > 0, 'Expected dependency route raster cells');

    const h1Min = Math.min(route.sx, route.elbowX);
    const h1Max = Math.max(route.sx, route.elbowX);
    const h2Min = Math.min(route.elbowX, route.tx);
    const h2Max = Math.max(route.elbowX, route.tx);
    const vMin = Math.min(route.sy, route.ty);
    const vMax = Math.max(route.sy, route.ty);

    const arrowPoints = [
      { x: route.tx - 1, y: route.ty - 1 },
      { x: route.tx - 1, y: route.ty + 1 },
    ];

    cells.forEach((cell) => {
      const onHorizontal1 = cell.y === route.sy && cell.x >= h1Min && cell.x <= h1Max;
      const onVertical = cell.x === route.elbowX && cell.y >= vMin && cell.y <= vMax;
      const onHorizontal2 = cell.y === route.ty && cell.x >= h2Min && cell.x <= h2Max;
      const onArrow = arrowPoints.some((point) => point.x === cell.x && point.y === cell.y);
      assert(
        onHorizontal1 || onVertical || onHorizontal2 || onArrow,
        'Found off-route dependency cell at (' + cell.x + ', ' + cell.y + ')'
      );
    });

    const spanX = route.tx - route.sx;
    const leadLen = route.elbowX - route.sx;
    const entryLen = route.tx - route.elbowX;
    assert(leadLen >= 1, 'Expected visible first leg from source');
    assert(entryLen >= 1, 'Expected visible entry leg into target');
    if (spanX >= 6) {
      assert(leadLen >= 2, 'Expected minimum lead leg length on wider spans');
      assert(entryLen >= 2, 'Expected minimum entry leg length on wider spans');
    }

    if (dependency.to.indexOf('phase:') === 0) {
      const hasLeftEntryCell = cells.some((cell) => cell.x === route.tx - 1 && cell.y === route.ty);
      assert(hasLeftEntryCell, 'Expected left-side entry cell for ' + dependency.to);
    }
  });
}

function testLabelOverlapContract() {
  const model = createEmergenceGanttModel({ columns: 192, rows: 120, cellSize: 5 });
  const layout = model.buildLayout();
  const widths = [320, 360, 375, 390, 414, 430, 480, 768, 1024];
  const columns = 192;
  const rows = 120;
  const cellSize = 5;
  const canvasWidthPx = columns * cellSize;
  const canvasHeightPx = rows * cellSize;

  function responsiveFont(basePx, targetCssPx, maxPx, downscale) {
    const responsivePx = Math.round(targetCssPx * downscale);
    const withMin = Math.max(basePx, responsivePx);
    return Math.min(maxPx, withMin);
  }

  widths.forEach((width) => {
    const downscale = canvasWidthPx / width;
    const phaseLabelTargetCssPx = width <= 360 ? 6 : 7;
    const phaseFontPx = responsiveFont(Math.max(16, Math.floor(cellSize * 3.1)), phaseLabelTargetCssPx, 42, downscale);
    const gateFontPx = responsiveFont(Math.max(10, Math.floor(cellSize * 2.2)), 6, 38, downscale);
    const phaseLineHeight = Math.max(18, Math.floor(phaseFontPx * 1.08));
    const phaseLabelX = 3 * cellSize;
    const milestoneLabelX = phaseLabelX;

    const labelPlan = model.buildLabelPlan(layout, {
      phaseFontPx,
      gateFontPx,
      phaseLineHeight,
      canvasHeightPx,
      phaseLabelColumnX: phaseLabelX,
      milestoneLabelColumnX: milestoneLabelX,
    });
    assert(labelPlan, 'Expected label plan for width ' + width);

    const phaseHalf = Math.ceil(phaseFontPx * 0.6);
    const gateHalf = Math.ceil(gateFontPx * 0.6);
    const phaseAvgCharPx = Math.max(6, phaseFontPx * 0.62);
    const gateAvgCharPx = Math.max(5, gateFontPx * 0.62);

    const bands = [];
    labelPlan.phase.forEach((line) => {
      const labelWidth = Math.round(line.text.length * phaseAvgCharPx);
      const isRightAligned = line.align === 'right';
      const left = isRightAligned ? line.x - labelWidth : line.x;
      const right = isRightAligned ? line.x : line.x + labelWidth;
      bands.push({
        id: 'phase:' + line.phaseId + ':' + line.text,
        left,
        right,
        top: line.y - phaseHalf,
        bottom: line.y + phaseHalf,
      });
    });
    labelPlan.milestones.forEach((line) => {
      const labelWidth = Math.round(line.text.length * gateAvgCharPx);
      const isRightAligned = line.align === 'right';
      const left = isRightAligned ? line.x - labelWidth : line.x;
      const right = isRightAligned ? line.x : line.x + labelWidth;
      bands.push({
        id: 'gate:' + line.gateId,
        left,
        right,
        top: line.y - gateHalf,
        bottom: line.y + gateHalf,
      });
    });

    for (let i = 0; i < bands.length; i += 1) {
      for (let j = i + 1; j < bands.length; j += 1) {
        const first = bands[i];
        const second = bands[j];
        const firstPrefix = first.id.split(':').slice(0, 2).join(':');
        const secondPrefix = second.id.split(':').slice(0, 2).join(':');
        const samePhase = firstPrefix.startsWith('phase:') && firstPrefix === secondPrefix;
        if (samePhase) continue;
        if (!horizontalOverlap(first, second)) continue;
        assert(
          !overlaps(first, second),
          'Label overlap at width ' + width + ': ' + first.id + ' vs ' + second.id
        );
      }
    }
  });
}

function run() {
  testModuleSurface();
  testLayoutContract();
  testGateMarkersOnDependencySegments();
  testDependencyRouteShape();
  testLabelOverlapContract();
  console.log('PASS: tests/test-emergence-primer-gantt-layout-contract.js');
}

run();
