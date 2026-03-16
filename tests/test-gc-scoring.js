'use strict';
var assert = require('assert');
var scoring = require('../gc-scoring.js');

var tests = [
  {
    name: 'All 5s (high anarchy)',
    responses: [5, 5, 5, 5, 5, 1, 5, 5, 5, 5, 5, 5],
    expect: { energyLoad: 'heavy' }
  },
  {
    name: 'All 1s (low anarchy)',
    responses: [1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1],
    expect: { energyLoad: 'light' }
  },
  {
    name: 'All 3s (moderate)',
    responses: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    expect: { energyLoad: 'moderate' }
  }
];

var passed = 0;
var failed = 0;

for (var t of tests) {
  var result = scoring.scoreResponses
    ? scoring.scoreResponses(t.responses)
    : scoring.computeScoring(t.responses);
  try {
    assert.strictEqual(result.energyLoad, t.expect.energyLoad);
    console.log('PASS: ' + t.name + ' -> ' + result.energyLoad);
    console.log('  raw: energy=' + result.raw.energyScore.toFixed(2) +
      ' decision=' + result.raw.decisionScore.toFixed(2) +
      ' access=' + result.raw.accessScore.toFixed(2));
    passed++;
  } catch (e) {
    console.log('FAIL: ' + t.name + ' -> got ' + result.energyLoad + ', expected ' + t.expect.energyLoad);
    failed++;
  }
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
