'use strict';

const geometry = require('../modules/learning-feedback/mix-mapper-geometry.js');

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
    c1: { id: 'c1', lane: 'complexity', step: 1, x: 200, y: 100 },
    c3: { id: 'c3', lane: 'complexity', step: 3, x: 200, y: 320 },
    c4: { id: 'c4', lane: 'complexity', step: 4, x: 200, y: 430 },
    c6: { id: 'c6', lane: 'complexity', step: 6, x: 200, y: 650 },
    t3: { id: 't3', lane: 'traditional', step: 3, x: 520, y: 320 },
    t4: { id: 't4', lane: 'traditional', step: 4, x: 520, y: 430 },
    t6: { id: 't6', lane: 'traditional', step: 6, x: 520, y: 650 },
    c2: { id: 'c2', lane: 'complexity', step: 2, x: 200, y: 210 }
  };

  return { layout, nodeById };
}

function testLaneSideSignContract() {
  assert(geometry.laneArcSideSign('complexity') === -1, 'Expected complexity lane to route left');
  assert(geometry.laneArcSideSign('traditional') === 1, 'Expected traditional lane to route right');
}

function testComplexityArcAnchorsLeft() {
  const { layout, nodeById } = buildFixtures();
  const link = { source: 'c4', target: 'c3', lane: 'complexity', kind: 'feedback' };
  const path = geometry.linkPath(link, nodeById, layout);
  const nums = parseNumbers(path);

  // M sourceX sourceY C curveX sourceY curveX targetY targetX targetY
  const sourceX = nums[0];
  const sourceY = nums[1];
  const curveX = nums[2];
  const targetX = nums[6];
  const targetY = nums[7];

  assert(sourceX < nodeById.c4.x, 'Expected complexity arc source anchor on left side of node');
  assert(targetX < nodeById.c3.x, 'Expected complexity arc target anchor on left side of node');
  assert(curveX < sourceX, 'Expected complexity arc track/control to run further left than port anchor');
  assert(sourceY === nodeById.c4.y, 'Expected stable source Y anchor at node center');
  assert(targetY === nodeById.c3.y, 'Expected stable target Y anchor at node center');
}

function testTraditionalArcAnchorsRight() {
  const { layout, nodeById } = buildFixtures();
  const link = { source: 't6', target: 't3', lane: 'traditional', kind: 'learning' };
  const path = geometry.linkPath(link, nodeById, layout);
  const nums = parseNumbers(path);

  const sourceX = nums[0];
  const sourceY = nums[1];
  const curveX = nums[2];
  const targetX = nums[6];
  const targetY = nums[7];

  assert(sourceX > nodeById.t6.x, 'Expected traditional arc source anchor on right side of node');
  assert(targetX > nodeById.t3.x, 'Expected traditional arc target anchor on right side of node');
  assert(curveX > sourceX, 'Expected traditional arc track/control to run further right than port anchor');
  assert(sourceY === nodeById.t6.y, 'Expected stable source Y anchor at node center');
  assert(targetY === nodeById.t3.y, 'Expected stable target Y anchor at node center');
}

function testPrimaryLinksRemainVerticalWithinLane() {
  const { layout, nodeById } = buildFixtures();
  const link = { source: 'c2', target: 'c3', lane: 'complexity', kind: 'primary' };
  const path = geometry.linkPath(link, nodeById, layout);
  const nums = parseNumbers(path);

  // M source.x source.y+offset C source.x ... target.x ... target.x target.y-offset
  assert(nums[0] === nodeById.c2.x, 'Expected primary source X to stay at node center');
  assert(nums[2] === nodeById.c2.x, 'Expected primary bezier first control X to stay centered');
  assert(nums[4] === nodeById.c3.x, 'Expected primary bezier second control X to stay centered');
  assert(nums[6] === nodeById.c3.x, 'Expected primary target X to stay centered');
}

function testArcControlPointsStayInsideCanvasBounds() {
  const { nodeById } = buildFixtures();
  const layout = {
    compact: false,
    allowArcOverflowX: false,
    width: 640,
    nodeWidth: 120,
    nodeHeight: 40,
    learningArc: 420,
    feedbackArc: 320
  };

  const complexityLink = { source: 'c6', target: 'c1', lane: 'complexity', kind: 'learning' };
  const traditionalLink = { source: 't6', target: 't3', lane: 'traditional', kind: 'learning' };
  const complexityNums = parseNumbers(geometry.linkPath(complexityLink, nodeById, layout));
  const traditionalNums = parseNumbers(geometry.linkPath(traditionalLink, nodeById, layout));

  const complexityCurveX = complexityNums[2];
  const traditionalCurveX = traditionalNums[2];

  assert(complexityCurveX >= 0, 'Expected complexity arc control point to stay inside left canvas boundary');
  assert(complexityCurveX <= layout.width, 'Expected complexity arc control point to stay inside right canvas boundary');
  assert(traditionalCurveX >= 0, 'Expected traditional arc control point to stay inside left canvas boundary');
  assert(traditionalCurveX <= layout.width, 'Expected traditional arc control point to stay inside right canvas boundary');
}

function testArcControlPointsCanOverflowDesktopWhenEnabled() {
  const { nodeById } = buildFixtures();
  const layout = {
    compact: false,
    allowArcOverflowX: true,
    width: 640,
    nodeWidth: 120,
    nodeHeight: 40,
    learningArc: 560,
    feedbackArc: 460
  };

  const complexityLink = { source: 'c6', target: 'c1', lane: 'complexity', kind: 'learning' };
  const traditionalLink = { source: 't6', target: 't3', lane: 'traditional', kind: 'learning' };
  const complexityNums = parseNumbers(geometry.linkPath(complexityLink, nodeById, layout));
  const traditionalNums = parseNumbers(geometry.linkPath(traditionalLink, nodeById, layout));

  const complexityCurveX = complexityNums[2];
  const traditionalCurveX = traditionalNums[2];

  assert(complexityCurveX < 0, 'Expected complexity arc control point to overflow left boundary when desktop overflow is enabled');
  assert(traditionalCurveX > layout.width, 'Expected traditional arc control point to overflow right boundary when desktop overflow is enabled');
}

function run() {
  testLaneSideSignContract();
  testComplexityArcAnchorsLeft();
  testTraditionalArcAnchorsRight();
  testPrimaryLinksRemainVerticalWithinLane();
  testArcControlPointsStayInsideCanvasBounds();
  testArcControlPointsCanOverflowDesktopWhenEnabled();
  console.log('PASS: tests/test-mix-mapper-arc-routing-contract.js');
}

run();
