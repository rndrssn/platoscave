'use strict';

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

const simPath = path.join(__dirname, '..', 'modules', 'garbage-can', 'runtime', 'gc-simulation.js');

const res = spawnSync(
  process.execPath,
  ['-e', `require(${JSON.stringify(simPath)});`],
  { encoding: 'utf8' }
);

assert.strictEqual(res.status, 0, 'require(gc-simulation.js) should exit cleanly');
assert.strictEqual(
  (res.stdout || '').trim(),
  '',
  'require(gc-simulation.js) should not emit validation output on stdout'
);

console.log('PASS: tests/test-gc-simulation-import-no-side-effects.js');
