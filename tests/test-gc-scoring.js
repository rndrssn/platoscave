'use strict';

/**
 * test-gc-scoring.js
 *
 * Validates that the three organisation archetypes defined in
 * SPIKE-organised-anarchy-questions produce the expected parameter sets
 * when run through scoreResponses().
 *
 * Usage:
 *   node tests/test-gc-scoring.js
 *
 * All tests must pass before the scoring spike is marked VALIDATED.
 */

const { scoreResponses } = require('../gc-scoring.js');

let passed = 0;
let failed = 0;
const failures = [];

function assert(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓  ${label}: ${actual}`);
    passed++;
  } else {
    const msg = `${label}: expected "${expected}", got "${actual}"`;
    console.log(`  ✗  ${msg}`);
    failed++;
    failures.push(msg);
  }
}

function assertDistinct(label, values) {
  const unique = new Set(values).size === values.length;
  if (unique) {
    console.log(`  ✓  ${label} are distinct: [${values.join(', ')}]`);
    passed++;
  } else {
    const msg = `${label} are not all distinct: [${values.join(', ')}]`;
    console.log(`  ✗  ${msg}`);
    failed++;
    failures.push(msg);
  }
}

console.log('');
console.log('════════════════════════════════════════════════════════════════');
console.log('  Garbage Can — Scoring Tests');
console.log('════════════════════════════════════════════════════════════════');

// ─── Archetype 1: University department ──────────────────────────────────────
//
// Chaotic goals, opaque processes, fluid participation → heavy load
// Anyone joins any discussion → unsegmented decision structure
// Problems surface wherever → unsegmented access structure
//
// Responses: [5,5,5, 5,1, 5,1,1]
//   Q0=5 goals in flux, Q1=5 judgement-led, Q2=5 fluid participation
//   Q3=5 fully open, Q4=1 title irrelevant
//   Q5=5 problems float, Q6=1 no routing conventions, Q7=1 no escalation

console.log('\n── Archetype 1: University department ──────────────────────────\n');

const university = scoreResponses([5, 5, 5,  5, 1,  5, 1, 1]);

assert('energyLoad',        university.energyLoad,        'heavy');
assert('decisionStructure', university.decisionStructure, 'unsegmented');
assert('accessStructure',   university.accessStructure,   'unsegmented');

// ─── Archetype 2: Small product startup ──────────────────────────────────────
//
// Some goal drift, emerging processes, somewhat fluid → moderate load
// Open participation, problems float to wherever the conversation is → unsegmented
//
// Responses: [3,4,3, 4,2, 4,2,2]
//   Q0=3 moderate goal drift, Q1=4 mostly judgement, Q2=3 somewhat fluid
//   Q3=4 fairly open, Q4=2 title matters a little
//   Q5=4 problems float mostly, Q6=2 loose conventions, Q7=2 little escalation

console.log('\n── Archetype 2: Small product startup ──────────────────────────\n');

const startup = scoreResponses([3, 4, 3,  4, 2,  4, 2, 2]);

assert('energyLoad',        startup.energyLoad,        'moderate');
assert('decisionStructure', startup.decisionStructure, 'unsegmented');
assert('accessStructure',   startup.accessStructure,   'unsegmented');

// ─── Archetype 3: Traditional manufacturing firm ─────────────────────────────
//
// Stable goals, clear methods, consistent participants → light load
// Seniority determines meeting access → hierarchical decision structure
// Problems escalate through levels → hierarchical access structure
//
// Responses: [2,1,1, 2,4, 1,3,4]
//   Q0=2 stable goals, Q1=1 clear process, Q2=1 same people always
//   Q3=2 restricted, Q4=4 title determines access
//   Q5=1 problems go to right place, Q6=3 some conventions, Q7=4 escalation-based

console.log('\n── Archetype 3: Traditional manufacturing firm ──────────────────\n');

const manufacturer = scoreResponses([2, 1, 1,  2, 4,  1, 3, 4]);

assert('energyLoad',        manufacturer.energyLoad,        'light');
assert('decisionStructure', manufacturer.decisionStructure, 'hierarchical');
assert('accessStructure',   manufacturer.accessStructure,   'hierarchical');

// ─── Raw score variance ───────────────────────────────────────────────────────
//
// Confirm raw scores vary continuously and meaningfully between archetypes.

console.log('\n── Raw score variance ──────────────────────────────────────────\n');

assertDistinct('energyScore values',
  [university.raw.energyScore, startup.raw.energyScore, manufacturer.raw.energyScore]);

assertDistinct('decisionScore values',
  [university.raw.decisionScore, startup.raw.decisionScore, manufacturer.raw.decisionScore]);

assertDistinct('accessScore values',
  [university.raw.accessScore, startup.raw.accessScore, manufacturer.raw.accessScore]);

// ─── Results ──────────────────────────────────────────────────────────────────

console.log('');
console.log('════════════════════════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed`);

if (failures.length > 0) {
  console.log('\n  Failures:');
  failures.forEach(f => console.log(`    • ${f}`));
  console.log('\n  ✗  Tests failed — spike NOT validated.');
  console.log('════════════════════════════════════════════════════════════════\n');
  process.exit(1);
} else {
  console.log('\n  ✓  All tests passed — SPIKE-organised-anarchy-scoring VALIDATED.');
  console.log('════════════════════════════════════════════════════════════════\n');
}
