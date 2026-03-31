'use strict';

const data = require('../modules/mix-mapper/mix-mapper-data.js');
const semantics = require('../modules/mix-mapper/mix-mapper-semantics.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function findLink(source, target, kind) {
  return data.LINKS.find((link) => link.source === source && link.target === target && link.kind === kind);
}

function testAssumptionRoleClassifierBehavior() {
  const traditionalPrimary = findLink('t1', 't2', 'primary');
  const traditionalMinor = findLink('t4', 't3', 'minor');
  const complexityFeedback = findLink('c4', 'c3', 'feedback');
  const complexityPrimary = findLink('c1', 'c2', 'primary');

  assert(traditionalPrimary, 'Missing traditional primary fixture link');
  assert(traditionalMinor, 'Missing traditional minor fixture link');
  assert(complexityFeedback, 'Missing complexity feedback fixture link');
  assert(complexityPrimary, 'Missing complexity primary fixture link');

  assert(
    semantics.getAssumptionRole(traditionalPrimary) === 'certainty',
    'Expected traditional primary links to map to certainty role'
  );
  assert(
    semantics.getAssumptionRole(traditionalMinor) === 'certainty-revisit',
    'Expected traditional adaptive links to map to certainty-revisit role'
  );
  assert(
    semantics.getAssumptionRole(complexityFeedback) === 'learning-test',
    'Expected complexity feedback links to map to learning-test role'
  );
  assert(
    semantics.getAssumptionRole(complexityPrimary) === 'context',
    'Expected complexity primary links to map to context in assumptions lens'
  );
}

function testAssumptionNarrativeCoverage() {
  const launchToSensing = findLink('c6', 'c1', 'learning');
  assert(launchToSensing, 'Missing c6 -> c1 learning link');

  const assumptionsNarrative = semantics.complexityLinkNarrative(
    launchToSensing,
    'assumptions',
    data.COMPLEXITY_LINK_NARRATIVES
  );

  assert(
    assumptionsNarrative.includes('post-launch evidence') &&
      assumptionsNarrative.includes('upstream opportunity sensing'),
    'Expected explicit assumptions narrative for launch-to-sensing learning loop'
  );
}

function testDataContractForAssumptionsView() {
  assert(Array.isArray(data.LINKS), 'Expected LINKS array export');
  assert(data.LINKS.length >= 10, 'Expected non-trivial link graph');
  assert(
    data.LINKS.some((link) => link.lane === 'traditional' && link.kind === 'learning'),
    'Expected at least one traditional learning/upstream link for assumptions contrast'
  );
}

function run() {
  testAssumptionRoleClassifierBehavior();
  testAssumptionNarrativeCoverage();
  testDataContractForAssumptionsView();
  console.log('PASS: tests/test-mix-mapper-assumptions-contract.js');
}

run();
