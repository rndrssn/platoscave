'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IGNORE_DIRS = new Set(['.git', 'node_modules', 'docs']);

function walkHtmlFiles(baseDir) {
  const out = [];
  const stack = [baseDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      const rel = path.relative(baseDir, abs);
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) stack.push(abs);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
        out.push(rel);
      }
    }
  }
  return out.sort();
}

const htmlFiles = walkHtmlFiles(ROOT);
const failures = [];
const forbidden = /<script[^>]+src=["']https?:\/\/d3js\.org\/d3\.v7\.min\.js["']/i;

for (const relHtml of htmlFiles) {
  const source = fs.readFileSync(path.join(ROOT, relHtml), 'utf8');
  if (forbidden.test(source)) {
    failures.push(relHtml + ': external d3js.org runtime import found');
  }
}

assert.strictEqual(
  failures.length,
  0,
  'Forbidden external runtime dependency detected:\n' + failures.join('\n')
);

console.log('PASS: tests/test-no-cdn-runtime-deps.js');
