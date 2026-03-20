'use strict';

const assert = require('assert');
const { loadSimulationModule } = require('./helpers/load-simulation');

const { runGarbageCanSimulation } = loadSimulationModule();

function countLastTickProblems(lastTick) {
  return {
    resolved: lastTick.problems.filter((p) => p.state === 'resolved').length,
    inForum: lastTick.problems.filter((p) => p.state === 'attached').length,
    adrift: lastTick.problems.filter((p) => p.state === 'floating').length,
    neverEntered: lastTick.problems.filter((p) => p.state === 'inactive').length,
  };
}

function countLastTickChoices(lastTick) {
  return {
    closed: lastTick.choices.filter((c) => c.state === 'closed').length,
    open: lastTick.choices.filter((c) => c.state === 'active').length,
    inactive: lastTick.choices.filter((c) => c.state === 'inactive').length,
  };
}

const combinations = [
  ['moderate', 'moderate', 'hierarchical', 'segmented-like'],
  ['moderate', 'moderate', 'hierarchical', 'unsegmented'],
  ['heavy', 'heavy', 'specialized', 'specialized'],
  ['light', 'light', 'unsegmented', 'hierarchical'],
].map((c) => ({
  problemIntensity: c[0],
  problemInflow: c[1],
  decisionStructure: c[2],
  accessStructure: c[3] === 'segmented-like' ? 'hierarchical' : c[3],
}));

for (const params of combinations) {
  const sim = runGarbageCanSimulation(params);
  const lastTick = sim.ticks[sim.ticks.length - 1];

  const p = countLastTickProblems(lastTick);
  assert.strictEqual(p.resolved + p.inForum + p.adrift + p.neverEntered, 20, 'last tick problem partition must equal 20');

  const c = countLastTickChoices(lastTick);
  assert.strictEqual(c.closed + c.open + c.inactive, 10, 'last tick choice partition must equal 10');

  // Monte Carlo problem means should always be internally coherent.
  const problemMeanTotal = sim.problemResolved + sim.problemDisplaced + sim.problemAdrift + sim.problemInForum + sim.problemNeverEntered;
  assert(Math.abs(problemMeanTotal - 20) < 1e-6, 'mean problem outcomes must sum to 20');
  assert(Array.isArray(sim.choiceResolvedPerCoMean), 'choiceResolvedPerCoMean must exist');
  assert.strictEqual(sim.choiceResolvedPerCoMean.length, 10, 'choiceResolvedPerCoMean must have 10 entries');
  const resolvedPerCoMeanTotal = sim.choiceResolvedPerCoMean.reduce((a, b) => a + b, 0);
  assert(Math.abs(resolvedPerCoMeanTotal - sim.problemResolved) < 1e-6, 'per-CO resolved means must sum to problemResolved mean');

  // Choice-style shares should always be normalized.
  assert(Math.abs(sim.resolution + sim.oversight + sim.flight - 1) < 1e-6, 'choice style shares must sum to 1');
}

console.log('PASS: tests/test-gc-summary-consistency.js');
