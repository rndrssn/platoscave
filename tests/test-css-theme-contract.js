'use strict';

const fs = require('fs');
const path = require('path');

const themesPath = path.join(__dirname, '..', 'css', 'themes.css');

function loadCssWithImports(entryPath, seen) {
  const visited = seen || new Set();
  const absEntry = path.resolve(entryPath);
  if (visited.has(absEntry)) return '';
  visited.add(absEntry);

  const css = fs.readFileSync(absEntry, 'utf8');
  const importRe = /@import\s+url\(\s*['"]([^'"]+)['"]\s*\)\s*;/g;
  let out = css;
  let match;

  while ((match = importRe.exec(css)) !== null) {
    const rel = match[1];
    const childPath = path.resolve(path.dirname(absEntry), rel);
    if (!fs.existsSync(childPath)) {
      throw new Error('Missing imported CSS file: ' + childPath);
    }
    out += '\n' + loadCssWithImports(childPath, visited);
  }

  return out;
}

const source = loadCssWithImports(themesPath);

const REQUIRED_THEME_TOKENS = [
  '--paper',
  '--paper-dark',
  '--paper-deep',
  '--ink',
  '--ink-mid',
  '--ink-faint',
  '--ink-ghost',
  '--rust',
  '--rust-light',
  '--sage',
  '--sage-light',
  '--ochre',
  '--gold',
  '--slate',
  '--slate-light',
  '--viz-ink',
  '--viz-ink-mid',
  '--viz-ink-faint',
  '--viz-ink-ghost',
  '--viz-rust',
  '--viz-rust-light',
  '--viz-ochre',
  '--viz-gold',
  '--viz-slate',
  '--viz-sage',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getThemeBlocks(css) {
  const blocks = [];
  const re = /\[data-theme='([^']+)'\]\s*\{([\s\S]*?)\n\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    blocks.push({ name: m[1], body: m[2] });
  }
  return blocks;
}

function findDeclaredVars(blockBody) {
  return [...blockBody.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]);
}

function testNoDuplicateVarDeclarationsPerThemeBlock() {
  const blocks = getThemeBlocks(source);
  assert(blocks.length > 0, 'No [data-theme=...] { ... } token blocks found');

  for (const block of blocks) {
    const vars = findDeclaredVars(block.body);
    const seen = new Set();
    for (const v of vars) {
      assert(!seen.has(v), `Theme "${block.name}" declares "${v}" more than once`);
      seen.add(v);
    }
  }
}

function testRequiredTokensExistInEveryThemeTokenBlock() {
  const tokenBlocks = getThemeBlocks(source);

  for (const block of tokenBlocks) {
    const declared = new Set(findDeclaredVars(block.body));
    const missing = REQUIRED_THEME_TOKENS.filter((token) => !declared.has(token));
    assert(
      missing.length === 0,
      `Theme "${block.name}" missing required tokens: ${missing.join(', ')}`
    );
  }
}

function run() {
  testNoDuplicateVarDeclarationsPerThemeBlock();
  testRequiredTokensExistInEveryThemeTokenBlock();
  console.log('PASS: tests/test-css-theme-contract.js');
}

run();
