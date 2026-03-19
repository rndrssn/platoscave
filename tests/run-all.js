'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const tests = [
  '../scripts/check-claude-links.js',
  '../scripts/check-docs-integrity.js',
  'test-gc-scoring.js',
  'test-gc-scoring-12.js',
  'test-gc-scoring-boundaries.js',
  'test-gc-diagnosis.js',
  'test-gc-diagnosis-share.js',
  'test-theme-bootstrap.js',
  'test-css-theme-contract.js',
  'test-gc-viz-contract.js',
  'test-gc-simulation-invariants.js',
  'test-gc-summary-consistency.js',
  'test-explorer-integration.js',
  'test-explorer-race-guards.js',
  'test-assess-integration.js',
  'test-a11y-critical-pages.js',
];

let failed = 0;
for (const test of tests) {
  process.stdout.write('\n==> ' + test + '\n');
  const result = spawnSync(process.execPath, [path.join(__dirname, test)], { stdio: 'inherit' });
  if (result.status !== 0) {
    failed++;
  }
}

if (failed > 0) {
  console.error('\nFAIL: ' + failed + ' test file(s) failed');
  process.exit(1);
}

console.log('\nPASS: all test files passed');
