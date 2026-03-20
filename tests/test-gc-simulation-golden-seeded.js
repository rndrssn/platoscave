'use strict';

const assert = require('assert');
const { loadSimulationInternals } = require('./helpers/load-simulation-internals');

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runSeeded(seed, params) {
  const { runGarbageCanSimulation } = loadSimulationInternals({ random: mulberry32(seed) });
  return runGarbageCanSimulation(params);
}

function snap(result) {
  return {
    resolution: Number(result.resolution.toFixed(12)),
    oversight: Number(result.oversight.toFixed(12)),
    flight: Number(result.flight.toFixed(12)),
    problemResolved: Number(result.problemResolved.toFixed(2)),
    problemDisplaced: Number(result.problemDisplaced.toFixed(2)),
    problemAdrift: Number(result.problemAdrift.toFixed(2)),
    problemInForum: Number(result.problemInForum.toFixed(2)),
    problemNeverEntered: Number(result.problemNeverEntered.toFixed(2)),
  };
}

const seed = 123456;

const cases = [
  {
    params: { problemIntensity: 'moderate', problemInflow: 'moderate', decisionStructure: 'hierarchical', accessStructure: 'hierarchical' },
    expected: {
      resolution: 0.159065628476,
      oversight: 0.429922135706,
      flight: 0.411012235818,
      problemResolved: 18.77,
      problemDisplaced: 0,
      problemAdrift: 1.23,
      problemInForum: 0,
      problemNeverEntered: 0,
    },
  },
  {
    params: { problemIntensity: 'heavy', problemInflow: 'heavy', decisionStructure: 'unsegmented', accessStructure: 'unsegmented' },
    expected: {
      resolution: 0,
      oversight: 0.5,
      flight: 0.5,
      problemResolved: 0,
      problemDisplaced: 0,
      problemAdrift: 0,
      problemInForum: 20,
      problemNeverEntered: 0,
    },
  },
  {
    params: { problemIntensity: 'light', problemInflow: 'light', decisionStructure: 'specialized', accessStructure: 'specialized' },
    expected: {
      resolution: 0.305483028721,
      oversight: 0.694516971279,
      flight: 0,
      problemResolved: 6.08,
      problemDisplaced: 0,
      problemAdrift: 13.92,
      problemInForum: 0,
      problemNeverEntered: 0,
    },
  },
];

for (const c of cases) {
  const actual = snap(runSeeded(seed, c.params));
  assert.deepStrictEqual(actual, c.expected, 'seeded golden mismatch for ' + JSON.stringify(c.params));
}

// Same seed should reproduce exactly.
const one = snap(runSeeded(seed, cases[0].params));
const two = snap(runSeeded(seed, cases[0].params));
assert.deepStrictEqual(one, two, 'same-seed reproducibility failed');

console.log('PASS: tests/test-gc-simulation-golden-seeded.js');
