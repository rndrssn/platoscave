// Contract test for the git/release workflow documented in README and implemented by scripts.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

const readme = read('README.md');

for (const relPath of ['scripts/ship.sh', 'scripts/start-feature.sh']) {
  assert(fs.existsSync(path.join(ROOT, relPath)), relPath + ' must exist');
}

const shipScript = read('scripts/ship.sh');
const startFeatureScript = read('scripts/start-feature.sh');
const failures = [];

for (const needle of [
  'node tests/run-all.js',
  'scripts/ship.sh',
  'scripts/start-feature.sh',
  'main',
  'feature',
  'scripts/check-claude-links.js',
  'AGENTS.md',
  'CLAUDE.md',
]) {
  if (!readme.includes(needle)) {
    failures.push('README.md must document workflow item: ' + needle);
  }
}

for (const needle of [
  'node tests/run-all.js',
  'git checkout main',
  'git merge --no-ff',
  'git push origin main',
  'git branch -d',
  'git push origin --delete',
]) {
  if (!shipScript.includes(needle)) {
    failures.push('scripts/ship.sh must implement workflow step: ' + needle);
  }
}

for (const needle of ['git checkout -b', 'origin main']) {
  if (!startFeatureScript.includes(needle)) {
    failures.push('scripts/start-feature.sh must implement workflow step: ' + needle);
  }
}

// The old three-branch flow must actually be gone, not just supplemented.
for (const stale of ['scripts/release-all.sh', 'develop` -> `main', 'sandbox` -> `develop']) {
  if (readme.includes(stale)) {
    failures.push('README.md still references the retired sandbox/develop flow: ' + stale);
  }
}

assert.strictEqual(failures.length, 0, 'README workflow contract failures:\n' + failures.join('\n'));

console.log('PASS: tests/test-readme-workflow-contract.js');
