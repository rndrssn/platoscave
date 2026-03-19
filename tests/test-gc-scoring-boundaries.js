'use strict';

const assert = require('assert');
const { scoreResponses } = require('../gc-scoring');

function makeResponses({ energy, access, decision }) {
  // Q0..Q4 = energy, Q5..Q7 = access (Q5 inverted), Q8..Q11 = decision
  const q5 = 6 - access; // invert at scorer level => to produce access mean target
  return [energy, energy, energy, energy, energy, q5, access, access, decision, decision, decision, decision];
}

function runCase(label, means, expected) {
  const result = scoreResponses(makeResponses(means));
  assert.strictEqual(result.energyLoad, expected.energyLoad, label + ' energy');
  assert.strictEqual(result.accessStructure, expected.accessStructure, label + ' access');
  assert.strictEqual(result.decisionStructure, expected.decisionStructure, label + ' decision');
}

runCase('exact low threshold',
  { energy: 2, access: 2, decision: 2 },
  { energyLoad: 'light', accessStructure: 'unsegmented', decisionStructure: 'unsegmented' }
);

runCase('exact upper-mid threshold',
  { energy: 3.5, access: 3.5, decision: 3.5 },
  { energyLoad: 'moderate', accessStructure: 'hierarchical', decisionStructure: 'hierarchical' }
);

runCase('above threshold',
  { energy: 4, access: 4, decision: 4 },
  { energyLoad: 'heavy', accessStructure: 'specialized', decisionStructure: 'specialized' }
);

assert.throws(() => scoreResponses([1,2,3]), /exactly 12 responses/);

console.log('PASS: tests/test-gc-scoring-boundaries.js');
