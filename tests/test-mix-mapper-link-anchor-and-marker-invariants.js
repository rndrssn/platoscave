'use strict';

const fs = require('fs');
const path = require('path');

const geometry = require('../modules/mix-mapper/mix-mapper-geometry.js');

const geometrySource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'mix-mapper-geometry.js'),
  'utf8'
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseNumbers(pathData) {
  return String(pathData)
    .trim()
    .split(/\s+/)
    .filter((token) => token !== 'M' && token !== 'C' && token !== 'L')
    .map((value) => Number(value));
}

function buildFixtures() {
  const layout = {
    compact: false,
    nodeWidth: 120,
    nodeHeight: 40,
    learningArc: 190,
    feedbackArc: 118
  };

  const nodeById = {
    c2: { id: 'c2', lane: 'complexity', step: 2, x: 220, y: 220 },
    c3: { id: 'c3', lane: 'complexity', step: 3, x: 220, y: 330 },
    c4: { id: 'c4', lane: 'complexity', step: 4, x: 220, y: 440 },
    c6: { id: 'c6', lane: 'complexity', step: 6, x: 220, y: 660 },
    t3: { id: 't3', lane: 'traditional', step: 3, x: 560, y: 330 },
    t4: { id: 't4', lane: 'traditional', step: 4, x: 560, y: 440 },
    t6: { id: 't6', lane: 'traditional', step: 6, x: 560, y: 660 }
  };

  return { layout, nodeById };
}

function testSharedComplexityEntryPortsStayAligned() {
  const { layout, nodeById } = buildFixtures();
  const halfNodeW = layout.nodeWidth / 2;
  const expectedTargetX = geometry.arcPortX(nodeById.c2, halfNodeW);
  const expectedTargetY = geometry.arcPortY(nodeById.c2);

  const linksIntoC2 = [
    { source: 'c3', target: 'c2', lane: 'complexity', kind: 'feedback' },
    { source: 'c4', target: 'c2', lane: 'complexity', kind: 'feedback' },
    { source: 'c6', target: 'c2', lane: 'complexity', kind: 'learning' }
  ];

  const targetAnchors = linksIntoC2.map((link) => {
    const pathData = geometry.linkPath(link, nodeById, layout);
    const nums = parseNumbers(pathData);
    return { x: nums[6], y: nums[7] };
  });

  targetAnchors.forEach((anchor, idx) => {
    assert(
      anchor.x === expectedTargetX,
      'Expected complexity arc target port x to stay aligned for link index ' + idx
    );
    assert(
      anchor.y === expectedTargetY,
      'Expected complexity arc target port y to stay aligned for link index ' + idx
    );
  });
}

function testSharedTraditionalEntryPortsStayAligned() {
  const { layout, nodeById } = buildFixtures();
  const halfNodeW = layout.nodeWidth / 2;
  const expectedTargetX = geometry.arcPortX(nodeById.t3, halfNodeW);
  const expectedTargetY = geometry.arcPortY(nodeById.t3);

  const linksIntoT3 = [
    { source: 't4', target: 't3', lane: 'traditional', kind: 'minor' },
    { source: 't6', target: 't3', lane: 'traditional', kind: 'learning' }
  ];

  const targetAnchors = linksIntoT3.map((link) => {
    const pathData = geometry.linkPath(link, nodeById, layout);
    const nums = parseNumbers(pathData);
    return { x: nums[6], y: nums[7] };
  });

  targetAnchors.forEach((anchor, idx) => {
    assert(
      anchor.x === expectedTargetX,
      'Expected traditional arc target port x to stay aligned for link index ' + idx
    );
    assert(
      anchor.y === expectedTargetY,
      'Expected traditional arc target port y to stay aligned for link index ' + idx
    );
  });
}

function testAssumptionDotMarkerContract() {
  assert(
    /id === 'mix-map-arrow-assumption'/.test(geometrySource) &&
      /id === 'mix-map-arrow-process-dot'/.test(geometrySource),
    'Expected explicit dot marker branches for assumption and process-dot markers'
  );
  assert(
    /\.append\('circle'\)/.test(geometrySource),
    'Expected dot-capable markers to append a circle endpoint'
  );
  assert(
    /\.append\('line'\)/.test(geometrySource),
    'Expected dot-capable markers to include a small leader line before the endpoint dot'
  );
  assert(
    /\.attr\('r',\s*3\.9\)/.test(geometrySource) &&
      /\.attr\('r',\s*2\.9\)/.test(geometrySource),
    'Expected assumption marker dot to be intentionally larger than process-dot marker'
  );
}

function run() {
  testSharedComplexityEntryPortsStayAligned();
  testSharedTraditionalEntryPortsStayAligned();
  testAssumptionDotMarkerContract();
  console.log('PASS: tests/test-mix-mapper-link-anchor-and-marker-invariants.js');
}

run();
