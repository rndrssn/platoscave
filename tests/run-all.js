'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const tests = [
  '../scripts/check-claude-links.js',
  '../scripts/check-docs-integrity.js',
  'test-notes-build-contract.js',
  'test-notes-build-negative.js',
  'test-browser-smoke-optional.js',
  'test-gc-scoring.js',
  'test-gc-scoring-12.js',
  'test-gc-scoring-boundaries.js',
  'test-gc-diagnosis.js',
  'test-gc-diagnosis-share.js',
  'test-gc-pressure-narrative.js',
  'test-theme-bootstrap.js',
  'test-theme-config-contract.js',
  'test-mix-mapper-assumptions-contract.js',
  'test-mix-mapper-mode-motion-contract.js',
  'test-mix-mapper-link-narratives-contract.js',
  'test-mix-mapper-lane-header-fit-contract.js',
  'test-mix-mapper-node-label-layout-contract.js',
  'test-mix-mapper-arc-routing-contract.js',
  'test-mix-mapper-link-anchor-and-marker-invariants.js',
  'test-mix-mapper-mode-matrix-contract.js',
  'test-mix-mapper-interaction-tooltip-contract.js',
  'test-nav-controller.js',
  'test-nav-modules-menu-contract.js',
  'test-module-landing-pattern-contract.js',
  'test-module-subpage-back-link-contract.js',
  'test-the-descent-section-map-contract.js',
  'test-emergence-primer-gantt-layout-contract.js',
  'test-emergence-primer-jump-anchors-contract.js',
  'test-css-theme-contract.js',
  'test-nav-theme-contract.js',
  'test-link-language-contract.js',
  'test-navigation-links.js',
  'test-no-cdn-runtime-deps.js',
  'test-security-hardening-contract.js',
  'test-build-notes-link-sanitization.js',
  'test-experience-skill-graph-security-contract.js',
  'test-innerhtml-sink-contract.js',
  'test-vendor-d3-checksum.js',
  'test-gc-viz-contract.js',
  'test-gc-viz-event-contract.js',
  'test-gc-viz-typography-contract.js',
  'test-gc-simulation-import-no-side-effects.js',
  'test-gc-simulation-require-fallback.js',
  'test-gc-simulation-matrix-builders.js',
  'test-gc-decision-type-classifier.js',
  'test-gc-simulation-meta-contract.js',
  'test-gc-simulation-golden-seeded.js',
  'test-gc-simulation-invariants.js',
  'test-gc-summary-consistency.js',
  'test-explorer-integration.js',
  'test-explorer-race-guards.js',
  'test-explorer-narrative-combinations.js',
  'test-can-explainer-integration.js',
  'test-assess-integration.js',
  'test-a11y-critical-pages.js',
];

let failed = 0;
const failedTests = [];
for (const test of tests) {
  process.stdout.write('\n==> ' + test + '\n');
  const result = spawnSync(process.execPath, [path.join(__dirname, test)], { stdio: 'inherit' });
  if (result.status !== 0) {
    failed++;
    failedTests.push(test);
  }
}

if (failed > 0) {
  console.error('\nFailed test files:');
  for (const failedTest of failedTests) {
    console.error('- ' + failedTest);
  }
  console.error('\nFAIL: ' + failed + ' test file(s) failed');
  process.exit(1);
}

console.log('\nPASS: all test files passed');
