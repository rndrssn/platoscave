// Contract test for release and validation workflow documented in README and implemented by scripts.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

const readme = read('README.md');
const releaseScriptPath = path.join(ROOT, 'scripts', 'release-all.sh');
assert(fs.existsSync(releaseScriptPath), 'scripts/release-all.sh must exist');

const releaseScript = read('scripts/release-all.sh');
const failures = [];

for (const needle of [
  'node tests/run-all.js',
  'scripts/release-all.sh',
  'sandbox',
  'develop',
  'main',
  'scripts/check-claude-links.js',
  'AGENTS.md',
  'CLAUDE.md',
]) {
  if (!readme.includes(needle)) {
    failures.push('README.md must document workflow item: ' + needle);
  }
}

for (const needle of [
  'git checkout sandbox',
  'node tests/run-all.js',
  'git checkout develop',
  'git merge --no-ff sandbox',
  'git checkout main',
  'git merge --no-ff develop',
  'git checkout sandbox',
]) {
  if (!releaseScript.includes(needle)) {
    failures.push('scripts/release-all.sh must implement workflow step: ' + needle);
  }
}

assert.strictEqual(failures.length, 0, 'README workflow contract failures:\n' + failures.join('\n'));

console.log('PASS: tests/test-readme-workflow-contract.js');
