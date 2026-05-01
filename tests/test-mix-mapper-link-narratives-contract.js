'use strict';

const data = require('../modules/learning-feedback/mix-mapper-data.js');
const semantics = require('../modules/learning-feedback/mix-mapper-semantics.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function findLink(source, target, kind) {
  return data.LINKS.find((link) => link.source === source && link.target === target && link.kind === kind);
}

function testComplexityNarrativeMapExists() {
  assert(
    data.COMPLEXITY_LINK_NARRATIVES && typeof data.COMPLEXITY_LINK_NARRATIVES === 'object',
    'Expected COMPLEXITY_LINK_NARRATIVES map export'
  );
  assert(
    data.COMPLEXITY_LINK_NARRATIVES['c6>c1:learning'],
    'Expected c6>c1 learning narrative entry'
  );
}

function testComplexityNarrativeCoverageForComplexityLinks() {
  const complexityLinks = data.LINKS.filter((link) => link.lane === 'complexity');
  assert(complexityLinks.length > 0, 'Expected complexity links in graph');

  const missing = complexityLinks.filter((link) => {
    const key = semantics.linkKey(link);
    return !data.COMPLEXITY_LINK_NARRATIVES[key];
  });

  assert(
    missing.length === 0,
    'Expected explicit narrative coverage for all complexity links. Missing: ' +
      missing.map((link) => semantics.linkKey(link)).join(', ')
  );
}

function testNarrativeResolutionByMode() {
  const link = findLink('c6', 'c2', 'learning');
  assert(link, 'Missing c6 -> c2 learning link');

  const processText = semantics.complexityLinkNarrative(link, 'process', data.COMPLEXITY_LINK_NARRATIVES);
  const assumptionsText = semantics.complexityLinkNarrative(link, 'assumptions', data.COMPLEXITY_LINK_NARRATIVES);
  const learningText = semantics.complexityLinkNarrative(link, 'learning', data.COMPLEXITY_LINK_NARRATIVES);

  assert(processText !== assumptionsText, 'Expected process and assumptions narratives to differ');
  assert(learningText !== assumptionsText, 'Expected learning and assumptions narratives to differ');
  assert(
    assumptionsText.includes('portfolio governance') || assumptionsText.includes('real outcomes'),
    'Expected assumptions narrative to mention governance/outcome assumptions'
  );
}

function testLaunchOutcomeDirectValidationLoopNarrative() {
  const link = findLink('c6', 'c4', 'learning');
  assert(link, 'Missing c6 -> c4 learning link');

  const processText = semantics.complexityLinkNarrative(link, 'process', data.COMPLEXITY_LINK_NARRATIVES);
  const assumptionsText = semantics.complexityLinkNarrative(link, 'assumptions', data.COMPLEXITY_LINK_NARRATIVES);
  const learningText = semantics.complexityLinkNarrative(link, 'learning', data.COMPLEXITY_LINK_NARRATIVES);

  assert(
    processText.includes('solution exploration') && processText.includes('validation'),
    'Expected c6 -> c4 process narrative to frame direct return to solution exploration and validation'
  );
  assert(
    assumptionsText.includes('measured outcomes') && assumptionsText.includes('solution options'),
    'Expected c6 -> c4 assumptions narrative to ground the loop in measured outcomes'
  );
  assert(
    learningText.includes('Market response') && learningText.includes('solution experiments'),
    'Expected c6 -> c4 learning narrative to describe market response redirecting experiments'
  );
}

function testModeLabelsContract() {
  assert(semantics.modeLabel('all') === 'Overview', 'Expected all mode label');
  assert(semantics.modeLabel('process') === 'Process', 'Expected process mode label');
  assert(semantics.modeLabel('assumptions') === 'Assumptions', 'Expected assumptions mode label');
  assert(semantics.modeLabel('learning') === 'Learning', 'Expected learning mode label');
}

function run() {
  testComplexityNarrativeMapExists();
  testComplexityNarrativeCoverageForComplexityLinks();
  testNarrativeResolutionByMode();
  testLaunchOutcomeDirectValidationLoopNarrative();
  testModeLabelsContract();
  console.log('PASS: tests/test-mix-mapper-link-narratives-contract.js');
}

run();
