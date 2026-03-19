'use strict';

const assert = require('assert');
const { loadSimulationInternals } = require('./helpers/load-simulation-internals');

const {
  buildAccessMatrices,
  buildDecisionMatrices,
  buildEnergyVectors,
  M,
  W,
  V,
} = loadSimulationInternals();

const [A0, A1, A2] = buildAccessMatrices();
const [D0, D1, D2] = buildDecisionMatrices();
const [E0, E1, E2] = buildEnergyVectors();

assert.strictEqual(A0.length, W);
assert.strictEqual(A0[0].length, M);
for (let r = 0; r < W; r++) {
  for (let c = 0; c < M; c++) {
    assert.strictEqual(A0[r][c], 1, 'A0 must be all ones');
  }
}

for (let r = 0; r < W; r++) {
  const colStart = Math.floor(r / 2);
  for (let c = 0; c < M; c++) {
    const expected = c >= colStart ? 1 : 0;
    assert.strictEqual(A1[r][c], expected, 'A1 hierarchical pattern mismatch');
  }
}

for (let r = 0; r < W; r++) {
  const target = Math.floor(r / 2);
  const ones = A2[r].reduce((acc, x) => acc + (x === 1 ? 1 : 0), 0);
  assert.strictEqual(ones, 1, 'A2 row must be one-hot');
  assert.strictEqual(A2[r][target], 1, 'A2 one-hot index mismatch');
}

for (let i = 0; i < V; i++) {
  for (let c = 0; c < M; c++) {
    assert.strictEqual(D0[i][c], 1, 'D0 must be all ones');
    assert.strictEqual(D1[i][c], c >= i ? 1 : 0, 'D1 hierarchical pattern mismatch');
    assert.strictEqual(D2[i][c], c === i ? 1 : 0, 'D2 specialized pattern mismatch');
  }
}

assert.strictEqual(E0.length, V);
assert.strictEqual(E1.length, V);
assert.strictEqual(E2.length, V);
assert(E0[0] < E0[V - 1], 'E0 should be rising');
assert(E2[0] > E2[V - 1], 'E2 should be declining');
for (let i = 1; i < V; i++) {
  assert.strictEqual(E1[i], E1[0], 'E1 should be uniform');
}

console.log('PASS: tests/test-gc-simulation-matrix-builders.js');
