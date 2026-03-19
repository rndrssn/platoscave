'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const claudePath = path.join(root, 'CLAUDE.md');

if (!fs.existsSync(claudePath)) {
  console.error('FAIL: CLAUDE.md not found');
  process.exit(1);
}

const source = fs.readFileSync(claudePath, 'utf8');
const backtickPaths = [...source.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

let failed = 0;
for (const p of backtickPaths) {
  if (!/[/.]/.test(p)) continue;
  if (/^(node|git|npm|pnpm|yarn|npx|if|then|else)\b/.test(p)) continue;
  if (p === 'HANDOFF.md') continue; // optional task file by contract
  if (p.endsWith('/*')) continue; // wildcard path pattern by contract

  const abs = path.join(root, p);
  if (!fs.existsSync(abs)) {
    console.error('FAIL: missing referenced path in CLAUDE.md ->', p);
    failed++;
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log('PASS: CLAUDE.md referenced paths exist');
