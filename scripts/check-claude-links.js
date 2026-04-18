'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();
const CONTRACT_FILES = ['CLAUDE.md', 'AGENTS.md'];

function collectBacktickPaths(source) {
  return [...source.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}

// Local-overlay docs (synced via scripts/sync-local-docs.sh) are intentionally
// gitignored. A missing path that is gitignored is a known overlay reference,
// not a broken link. git check-ignore returns exit 0 only for paths that match
// a gitignore rule AND are not tracked in the index.
function isOverlayPath(p) {
  const r = spawnSync('git', ['check-ignore', '-q', '--', p], { cwd: root });
  return r.status === 0;
}

function checkReferencedPaths(contractName, source) {
  const backtickPaths = collectBacktickPaths(source);
  let failed = 0;

  for (const p of backtickPaths) {
    if (!/[/.]/.test(p)) continue;
    if (/^(node|git|npm|pnpm|yarn|npx|if|then|else)\b/.test(p)) continue;
    if (p === 'HANDOFF.md') continue; // optional task file by contract
    if (p.endsWith('/*')) continue; // wildcard path pattern by contract

    const abs = path.join(root, p);
    if (!fs.existsSync(abs)) {
      if (isOverlayPath(p)) continue; // intentional local-overlay reference
      console.error('FAIL: missing referenced path in ' + contractName + ' ->', p);
      failed++;
    }
  }

  return failed;
}

let failed = 0;
let baseline = null;

for (const contractName of CONTRACT_FILES) {
  const contractPath = path.join(root, contractName);
  if (!fs.existsSync(contractPath)) {
    console.error('FAIL: ' + contractName + ' not found');
    failed++;
    continue;
  }

  const source = fs.readFileSync(contractPath, 'utf8');
  if (baseline === null) {
    baseline = source;
  } else if (source !== baseline) {
    console.error('FAIL: ' + contractName + ' must be identical to ' + CONTRACT_FILES[0]);
    failed++;
  }

  failed += checkReferencedPaths(contractName, source);
}

if (failed > 0) {
  process.exit(1);
}

console.log('PASS: agent contract files exist, match, and referenced paths exist');
