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

function rel(p) {
  return path.relative(root, p).replace(/\\/g, '/');
}

const files = walk(docsRoot);
const archivePrefix = 'docs/90-archive/';

const idByFile = new Map();
const idToFile = new Map();

function parseFrontmatter(src) {
  if (!src.startsWith('---\n')) return null;
  const end = src.indexOf('\n---\n', 4);
  if (end === -1) return null;
  const body = src.slice(4, end);
  const lines = body.split(/\r?\n/);
  const map = new Map();
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    map.set(k, v);
  }
  return map;
}

let failed = 0;

for (const f of files) {
  const r = rel(f);
  if (r.startsWith(archivePrefix)) continue;
  const src = fs.readFileSync(f, 'utf8');
  const fm = parseFrontmatter(src);
  if (!fm) continue;
  if (fm.has('id')) {
    const id = fm.get('id');
    idByFile.set(r, id);
    if (idToFile.has(id)) {
      console.error('FAIL: duplicate doc id:', id, 'in', r, 'and', idToFile.get(id));
      failed++;
    } else {
      idToFile.set(id, r);
    }
  }
}

const resolvable = new Set();
for (const f of files) {
  const r = rel(f);
  const stem = r.replace(/^docs\//, '').replace(/\.md$/, '');
  resolvable.add(stem);
  const base = path.basename(stem);
  resolvable.add(base);
  const id = idByFile.get(r);
  if (id) resolvable.add(id);
}

const activePrefixAllow = [
  'docs/00-core/',
  'docs/10-guides/',
  'docs/20-reference/',
  'docs/30-tasks/'
];

const requiredActiveFields = [
  'id', 'type', 'title', 'status', 'created', 'updated', 'owner', 'relates_to', 'tags',
  'load_when', 'do_not_load_when', 'token_cost_estimate'
];

for (const f of files) {
  const r = rel(f);
  if (r.startsWith(archivePrefix)) continue;

  const src = fs.readFileSync(f, 'utf8');
  const fm = parseFrontmatter(src);

  const isActiveManaged = activePrefixAllow.some((p) => r.startsWith(p));
  if (isActiveManaged) {
    if (!fm) {
      console.error('FAIL: active doc missing frontmatter:', r);
      failed++;
      continue;
    }
    for (const k of requiredActiveFields) {
      if (!fm.has(k) || fm.get(k) === '') {
        console.error('FAIL: active doc missing field', k + ':', r);
        failed++;
      }
    }
  }

  if (!fm || !fm.has('relates_to')) continue;
  const raw = fm.get('relates_to');
  const m = raw.match(/^\[(.*)\]$/);
  if (!m) continue;
  const refs = m[1].split(',').map((s) => s.trim()).filter(Boolean);
  for (const ref of refs) {
    if (!resolvable.has(ref)) {
      console.error('FAIL: unresolved relates_to reference', ref + ':', r);
      failed++;
    }
  }
}

// Core length cap to keep retrieval efficient.
const coreCaps = [
  { file: 'docs/00-core/CORE.md', max: 180 },
  { file: 'docs/00-core/CORE-loading-rules.md', max: 220 },
  { file: 'docs/00-core/CORE-quality-gates.md', max: 140 },
  { file: 'docs/00-core/CORE-style.md', max: 120 },
  { file: 'docs/PRINCIPLE-coding-standards.md', max: 220 },
  { file: 'docs/PRINCIPLE-design-system.md', max: 220 },
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
