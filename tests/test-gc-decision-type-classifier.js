'use strict';

const assert = require('assert');
const { loadSimulationInternals } = require('./helpers/load-simulation-internals');

const { countDecisionTypes, M, W, PERIODS } = loadSimulationInternals();

function build2D(rows, cols, fill) {
  return Array.from({ length: rows }, () => new Array(cols).fill(fill));
}

const STATE_INACTIVE = -2;
const STATE_ACTIVE = -1;
const STATE_RESOLVED = -3;

const Choices = build2D(M, PERIODS + 1, STATE_INACTIVE);
const Problems = build2D(W, PERIODS + 1, STATE_INACTIVE);
const ChoicesEnergyRequired = build2D(M, PERIODS + 1, 0);

// Resolution: active -> active -> resolved
Choices[0][PERIODS - 2] = STATE_ACTIVE;
Choices[0][PERIODS - 1] = STATE_ACTIVE;
Choices[0][PERIODS] = STATE_RESOLVED;
Problems[0][PERIODS] = 100; // resolved at choice 0

// Oversight: resolved at end, no problem resolved there
Choices[1][PERIODS - 1] = STATE_ACTIVE;
Choices[1][PERIODS] = STATE_RESOLVED;

// Flight: active -> resolved with drop in required energy
Choices[2][PERIODS - 1] = STATE_ACTIVE;
Choices[2][PERIODS] = STATE_RESOLVED;
ChoicesEnergyRequired[2][PERIODS - 1] = 5;
ChoicesEnergyRequired[2][PERIODS] = 2;
Problems[1][PERIODS] = 102; // avoid oversight for choice 2

// Quickie: inactive -> resolved
Choices[3][PERIODS - 1] = STATE_INACTIVE;
Choices[3][PERIODS] = STATE_RESOLVED;
Problems[2][PERIODS] = 103; // avoid oversight for choice 3

const counts = countDecisionTypes(Choices, Problems, ChoicesEnergyRequired);

assert.strictEqual(counts.resolutions, 1, 'expected one resolution');
assert.strictEqual(counts.oversights, 1, 'expected one oversight');
assert.strictEqual(counts.flights, 1, 'expected one flight');
assert.strictEqual(counts.quickies, 1, 'expected one quickie');

console.log('PASS: tests/test-gc-decision-type-classifier.js');
