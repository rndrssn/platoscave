'use strict';

/**
 * tests/test-gc-scoring-12.js
 * Validates gc-scoring.js (12-question spec) against known archetypes.
 *
 * Run with: node tests/test-gc-scoring-12.js
 *
 * Archetypes from docs/PRINCIPLE-organised-anarchy-questions.md
 */

const { scoreResponses } = require('../gc-scoring.js');

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (actual === expected) {
    console.log('  PASS:', label);
    passed++;
  } else {
    console.log('  FAIL:', label, '— expected', expected, 'got', actual);
    failed++;
  }
}

// ─── University department ─────────────────────────────────────────────────
// Expected: heavy load, specialized access, specialized decision
console.log('\nUniversity department:');
const university = scoreResponses([4, 5, 5, 5, 4, 2, 4, 4, 3, 4, 4, 4]);
assert('energyLoad',        university.energyLoad,        'heavy');
assert('accessStructure',   university.accessStructure,   'specialized');
assert('decisionStructure', university.decisionStructure, 'specialized');

// ─── Small product startup ─────────────────────────────────────────────────
// Expected: moderate load, hierarchical access, hierarchical decision
console.log('\nSmall product startup:');
const startup = scoreResponses([3, 3, 3, 3, 3, 3, 3, 2, 2, 3, 3, 3]);
assert('energyLoad',        startup.energyLoad,        'moderate');
assert('accessStructure',   startup.accessStructure,   'hierarchical');
assert('decisionStructure', startup.decisionStructure, 'hierarchical');

// ─── Traditional manufacturing firm ───────────────────────────────────────
// Expected: light load, unsegmented access, hierarchical decision
console.log('\nTraditional manufacturing firm:');
const manufacturer = scoreResponses([2, 2, 2, 2, 2, 4, 2, 2, 4, 3, 3, 2]);
assert('energyLoad',        manufacturer.energyLoad,        'light');
assert('accessStructure',   manufacturer.accessStructure,   'unsegmented');
assert('decisionStructure', manufacturer.decisionStructure, 'hierarchical');

// ─── Summary ──────────────────────────────────────────────────────────────
console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
