'use strict';

const semantics = require('../modules/mix-mapper/mix-mapper-semantics.js');
const modePolicyModule = require('../modules/mix-mapper/mix-mapper-mode-policy.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function approxEqual(a, b, epsilon) {
  return Math.abs(a - b) <= epsilon;
}

function buildPolicy() {
  const colors = {
    inkFaint: '#767676',
    rust: '#9A4F2F',
    processArrow: '#2A2018',
    assumptionArrow: '#3D4F5C',
    learningArrow: '#4A6741',
    learningDot: '#3D4F5C'
  };

  const policy = modePolicyModule.createModePolicy({
    getColors: () => colors,
    getProcessRole: semantics.getProcessRole,
    getAssumptionRole: semantics.getAssumptionRole,
    getLearningRole: semantics.getLearningRole,
    linkKey: semantics.linkKey
  });

  return { policy, colors };
}

function fixtures() {
  return {
    traditionalPrimary: { source: 't1', target: 't2', lane: 'traditional', kind: 'primary' },
    traditionalMinor: { source: 't4', target: 't3', lane: 'traditional', kind: 'minor' },
    traditionalLearning: { source: 't6', target: 't3', lane: 'traditional', kind: 'learning' },
    complexityPrimary: { source: 'c1', target: 'c2', lane: 'complexity', kind: 'primary' },
    complexityFeedback: { source: 'c4', target: 'c3', lane: 'complexity', kind: 'feedback' },
    complexityLearning: { source: 'c6', target: 'c2', lane: 'complexity', kind: 'learning' }
  };
}

function layout() {
  return {
    edgePrimary: 1.2,
    edgeSecondary: 0.95,
    edgeLearning: 1.05
  };
}

function testOverviewModeStylesBothLanes() {
  const { policy, colors } = buildPolicy();
  const links = fixtures();
  const box = layout();

  const traditionalPrimaryStyle = policy.modeStyle('all', links.traditionalPrimary, box);
  const complexityPrimaryStyle = policy.modeStyle('all', links.complexityPrimary, box);
  const complexityLearningStyle = policy.modeStyle('all', links.complexityLearning, box);

  assert(traditionalPrimaryStyle.color === colors.processArrow, 'Overview should render traditional process links in ink');
  assert(complexityPrimaryStyle.color === colors.processArrow, 'Overview should render complexity process links in ink');
  assert(traditionalPrimaryStyle.marker === 'url(#mix-map-arrow-process-dot)', 'Overview traditional primary should end with dot marker');
  assert(complexityPrimaryStyle.marker === 'url(#mix-map-arrow-process)', 'Overview complexity primary should end with triangle marker');
  assert(complexityLearningStyle.opacity > traditionalPrimaryStyle.opacity, 'Overview learning links should stay more visible than primary baseline');
}

function testProcessModeHighlightsProcessAndFaintsOthers() {
  const { policy, colors } = buildPolicy();
  const links = fixtures();
  const box = layout();

  const activeTraditional = policy.modeStyle('process', links.traditionalPrimary, box);
  const activeComplexity = policy.modeStyle('process', links.complexityPrimary, box);
  const contextualLearning = policy.modeStyle('process', links.complexityLearning, box);

  assert(activeTraditional.color === colors.rust, 'Process mode should highlight traditional primary in rust');
  assert(activeComplexity.color === colors.rust, 'Process mode should highlight complexity primary in rust');
  assert(activeTraditional.marker === 'url(#mix-map-arrow-process-active)', 'Process mode should use active process marker on primary links');
  assert(contextualLearning.color === colors.inkFaint, 'Process mode should fade non-process links to ink faint');
  assert(contextualLearning.opacity < activeTraditional.opacity, 'Process mode should keep non-process links less visible');
}

function testAssumptionsModeMarkersAndOpacity() {
  const { policy, colors } = buildPolicy();
  const links = fixtures();
  const box = layout();

  const certainty = policy.modeStyle('assumptions', links.traditionalPrimary, box);
  const learningTest = policy.modeStyle('assumptions', links.complexityFeedback, box);
  const certaintyRevisit = policy.modeStyle('assumptions', links.traditionalLearning, box);
  const context = policy.modeStyle('assumptions', links.complexityPrimary, box);

  assert(certainty.color === colors.assumptionArrow, 'Assumptions mode should highlight certainty links in assumption color');
  assert(certainty.marker === 'url(#mix-map-arrow-assumption)', 'Assumptions mode traditional links should use ---o marker');
  assert(certaintyRevisit.color === colors.assumptionArrow, 'Assumptions mode should keep revisited assumption arcs in assumption color');
  assert(learningTest.marker === 'url(#mix-map-arrow-assumption-triangle)', 'Assumptions mode complexity links should keep triangle marker');
  assert(context.color === colors.inkFaint, 'Assumptions mode should faint context-only links');
  assert(context.opacity < certainty.opacity, 'Assumptions mode should reduce context link opacity');
}

function testLearningModeAndDotSemantics() {
  const { policy, colors } = buildPolicy();
  const links = fixtures();
  const box = layout();

  const complexityLoop = policy.modeStyle('learning', links.complexityLearning, box);
  const traditionalLegacy = policy.modeStyle('learning', links.traditionalLearning, box);
  const support = policy.modeStyle('learning', links.complexityPrimary, box);

  assert(complexityLoop.color === colors.inkFaint, 'Learning mode should keep complexity learning arcs neutral');
  assert(complexityLoop.marker === 'url(#mix-map-arrow-ink-faint)', 'Learning mode complexity loops should keep neutral markers');
  assert(traditionalLegacy.color === colors.inkFaint, 'Learning mode should keep traditional upstream arcs neutral');
  assert(traditionalLegacy.marker === 'url(#mix-map-arrow-process-dot)', 'Learning mode traditional upstream links should keep neutral dot markers');
  assert(support.color === colors.inkFaint, 'Learning mode should faint process/support links');
  assert(support.opacity < complexityLoop.opacity, 'Learning mode should keep support arcs dimmer than learning-loop arcs without changing arc color');
}

function testPulseContractAcrossModeMatrix() {
  const { policy, colors } = buildPolicy();
  const links = fixtures();

  const processDot = policy.pulseDotColor('process', links.complexityLearning);
  const assumptionsDot = policy.pulseDotColor('assumptions', links.complexityLearning);
  const learningDot = policy.pulseDotColor('learning', links.complexityLearning);
  const learningDotTraditional = policy.pulseDotColor('learning', links.traditionalLearning);

  assert(processDot === colors.inkFaint, 'Process mode pulse dots should stay neutral');
  assert(assumptionsDot === colors.inkFaint, 'Assumptions mode pulse dots should stay neutral');
  assert(learningDot === colors.learningDot, 'Learning mode pulse dots should highlight active learning links');
  assert(learningDotTraditional === colors.learningDot, 'Learning mode pulse dots should highlight traditional learning links too');

  assert(policy.pulseOpacityForMode('all', links.traditionalLearning, false) > 0, 'Overview should keep traditional learning pulses visible');
  assert(policy.pulseOpacityForMode('all', links.complexityLearning, false) > 0, 'Overview should keep complexity learning pulses visible');
  assert(
    policy.pulseOpacityForMode('learning', links.complexityLearning, false) >
      policy.pulseOpacityForMode('process', links.complexityLearning, false),
    'Learning mode should increase pulse prominence for learning links'
  );
  assert(
    approxEqual(policy.pulseOpacityForMode('learning', links.complexityPrimary, false), 0.07, 0.03),
    'Learning mode should keep complexity primary pulses faint'
  );
}

function run() {
  testOverviewModeStylesBothLanes();
  testProcessModeHighlightsProcessAndFaintsOthers();
  testAssumptionsModeMarkersAndOpacity();
  testLearningModeAndDotSemantics();
  testPulseContractAcrossModeMatrix();
  console.log('PASS: tests/test-mix-mapper-mode-matrix-contract.js');
}

run();
