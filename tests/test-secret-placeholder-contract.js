// Contract test for frontend-safe API-key placeholders and secret-shaped literals.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WORKER_PLACEHOLDER = '__WORKER_API_KEY__';
const SATELLITE_WORKER_SCRIPTS = [
  'modules/satellite-index/demo/satellite-index.js',
  'modules/satellite-index/three/satellite-index-three.js',
];

const IGNORE_DIRS = new Set(['.git', 'node_modules', 'assets/vendor']);

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function walkFiles(baseDir, predicate) {
  const out = [];
  const stack = [baseDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      const rel = path.relative(ROOT, abs).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(rel) && !IGNORE_DIRS.has(entry.name)) stack.push(abs);
        continue;
      }
      if (entry.isFile() && predicate(abs)) out.push(abs);
    }
  }
  return out.sort();
}

const placeholderFailures = [];
for (const relPath of SATELLITE_WORKER_SCRIPTS) {
  const source = read(relPath);
  const assignment = source.match(/\bconst\s+WORKER_API_KEY\s*=\s*['"]([^'"]+)['"]/);
  assert(assignment, relPath + ' must define WORKER_API_KEY');
  if (assignment[1] !== WORKER_PLACEHOLDER) {
    placeholderFailures.push(relPath + ' must keep WORKER_API_KEY as ' + WORKER_PLACEHOLDER);
  }
  assert(
    source.includes("'X-API-Key': WORKER_API_KEY") || source.includes('"X-API-Key": WORKER_API_KEY'),
    relPath + ' must send Worker requests with X-API-Key: WORKER_API_KEY'
  );
}

const leakedWorkerKeyFailures = [];
for (const absPath of walkFiles(path.join(ROOT, 'modules', 'satellite-index'), abs => abs.endsWith('.js'))) {
  const relPath = path.relative(ROOT, absPath).split(path.sep).join('/');
  const source = fs.readFileSync(absPath, 'utf8');
  const match = source.match(/\bWORKER_API_KEY\s*=\s*['"][0-9a-f]{64}['"]/i);
  if (match) leakedWorkerKeyFailures.push(relPath + ' contains a real-looking Worker key assignment');
}

assert.strictEqual(placeholderFailures.length, 0, 'Worker placeholder failures:\n' + placeholderFailures.join('\n'));
assert.strictEqual(leakedWorkerKeyFailures.length, 0, 'Real-looking Worker key assignments:\n' + leakedWorkerKeyFailures.join('\n'));

console.log('PASS: tests/test-secret-placeholder-contract.js');
