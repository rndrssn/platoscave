'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const docsRoot = path.join(root, 'docs');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.obsidian') continue;
      out.push(...walk(p));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

walk(docsRoot); // ensure docs dir is readable

let failed = 0;

// Core length cap to keep retrieval efficient.
const coreCaps = [
  { file: 'docs/00-core/CORE.md', max: 180 },
  { file: 'docs/00-core/CORE-loading-rules.md', max: 220 },
  { file: 'docs/00-core/CORE-quality-gates.md', max: 140 },
  { file: 'docs/40-principles/PRINCIPLE-coding-standards.md', max: 220 },
  { file: 'docs/40-principles/PRINCIPLE-design-system.md', max: 220 },
];

for (const c of coreCaps) {
  const abs = path.join(root, c.file);
  if (!fs.existsSync(abs)) continue;
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/).length;
  if (lines > c.max) {
    console.error('FAIL: core doc too long:', c.file, '(' + lines + ' lines, max ' + c.max + ')');
    failed++;
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log('PASS: docs integrity checks');
