'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCAN_ROOTS = ['modules', 'js'];
const SCAN_EXTS = new Set(['.js', '.html']);
const IGNORE_DIRS = new Set(['node_modules', '.git', 'vendor']);

// Every .innerHTML assignment in modules/** and js/** must match exactly one
// entry in this allowlist. Each entry describes an audited-safe site; update
// the list (with justification) when a new site is intentionally introduced.
const ALLOWLIST = [
  {
    file: 'js/nav-controller.js',
    line: "socials.innerHTML =",
    reason: 'static HTML literal, no interpolation (footer social icons)',
  },
  {
    file: 'modules/ambiguity-clarity/section-map/section-map.js',
    line: "el.innerHTML = '';",
    reason: 'clears container before rebuilding from textContent',
  },
  {
    file: 'modules/learning-feedback/mix-mapper.js',
    line: 'tooltipEl.innerHTML = contentHtml;',
    reason: 'tooltip builders pre-escape all interpolated data (mix-mapper-tooltip.js)',
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function walkFiles(baseDir) {
  const out = [];
  const stack = [baseDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) stack.push(abs);
        continue;
      }
      if (entry.isFile() && SCAN_EXTS.has(path.extname(entry.name).toLowerCase())) {
        out.push(abs);
      }
    }
  }
  return out;
}

function findInnerHtmlSites() {
  const sites = [];
  for (const rel of SCAN_ROOTS) {
    const baseDir = path.join(ROOT, rel);
    if (!fs.existsSync(baseDir)) continue;
    for (const abs of walkFiles(baseDir)) {
      const relPath = path.relative(ROOT, abs).split(path.sep).join('/');
      const source = fs.readFileSync(abs, 'utf8');
      const lines = source.split('\n');
      lines.forEach((line, idx) => {
        if (!/\.innerHTML\s*=(?!=)/.test(line)) return;
        sites.push({ file: relPath, lineNumber: idx + 1, line: line.trim() });
      });
    }
  }
  return sites;
}

function matchAllowlist(site) {
  return ALLOWLIST.find((entry) => entry.file === site.file && site.line.indexOf(entry.line) !== -1);
}

function run() {
  const sites = findInnerHtmlSites();
  const unexpected = [];
  const matchedEntries = new Set();

  for (const site of sites) {
    const entry = matchAllowlist(site);
    if (!entry) {
      unexpected.push(site);
      continue;
    }
    matchedEntries.add(entry.file + '::' + entry.line);
  }

  if (unexpected.length) {
    const detail = unexpected
      .map((site) => '  ' + site.file + ':' + site.lineNumber + ' ' + site.line)
      .join('\n');
    throw new Error(
      'Unexpected .innerHTML assignment(s) found; add an audited entry to the allowlist or use textContent/DOM APIs:\n'
        + detail
    );
  }

  const stale = ALLOWLIST.filter((entry) => !matchedEntries.has(entry.file + '::' + entry.line));
  assert(
    stale.length === 0,
    'Stale allowlist entries (no matching source line found):\n'
      + stale.map((entry) => '  ' + entry.file + ' :: ' + entry.line).join('\n')
  );

  console.log('PASS: tests/test-innerhtml-sink-contract.js');
}

run();
