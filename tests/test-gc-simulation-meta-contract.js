'use strict';

const assert = require('assert');
const { loadSimulationModule } = require('./helpers/load-simulation');

const { runGarbageCanSimulation, getGarbageCanDefaults } = loadSimulationModule();

const defs = getGarbageCanDefaults();
assert.strictEqual(defs.choices, 10);
assert.strictEqual(defs.problems, 20);
assert.strictEqual(defs.periods, 20);

const sim = runGarbageCanSimulation({
  problemIntensity: 'moderate',
  problemInflow: 'moderate',
  decisionStructure: 'hierarchical',
  accessStructure: 'hierarchical',
});

assert(sim.meta, 'result.meta must exist');
assert.strictEqual(sim.meta.choices, defs.choices, 'meta.choices mismatch');
assert.strictEqual(sim.meta.problems, defs.problems, 'meta.problems mismatch');
assert.strictEqual(sim.meta.periods, defs.periods, 'meta.periods mismatch');
assert.strictEqual(sim.meta.textScale, 'default', 'meta.textScale mismatch');

assert.strictEqual(sim.ticks.length, defs.periods + 1, 'tick count mismatch');
assert.strictEqual(sim.ticks[sim.ticks.length - 1].choices.length, defs.choices, 'choice count mismatch');
assert.strictEqual(sim.ticks[sim.ticks.length - 1].problems.length, defs.problems, 'problem count mismatch');

console.log('PASS: tests/test-gc-simulation-meta-contract.js');
