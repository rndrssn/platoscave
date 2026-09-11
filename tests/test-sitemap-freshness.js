// Contract test: sitemap.xml must be current (regenerating it must produce
// the committed content byte-for-byte) and every entry must resolve to a
// real file and must not be a redirect stub.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { generate, resolveFsPathFromRequestPath, isRedirectStub } = require('../scripts/generate-sitemap.js');

const ROOT = path.join(__dirname, '..');
const sitemapPath = path.join(ROOT, 'sitemap.xml');

assert(fs.existsSync(sitemapPath), 'sitemap.xml must exist — run node scripts/generate-sitemap.js');

const committed = fs.readFileSync(sitemapPath, 'utf8');
const fresh = generate();

assert.strictEqual(
  committed,
  fresh,
  'sitemap.xml is stale — a page was added, removed, or renamed without regenerating it. Run: node scripts/generate-sitemap.js'
);

const locs = [...committed.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
assert(locs.length > 0, 'sitemap.xml must list at least one URL');

const failures = [];
for (const loc of locs) {
  const url = new URL(loc);
  const absPath = resolveFsPathFromRequestPath(url.pathname);
  if (!absPath) {
    failures.push(loc + ' does not resolve to a real file');
    continue;
  }
  if (isRedirectStub(fs.readFileSync(absPath, 'utf8'))) {
    failures.push(loc + ' is a redirect stub and must not be in the sitemap');
  }
}

assert.strictEqual(failures.length, 0, 'sitemap.xml entry failures:\n' + failures.join('\n'));

console.log('PASS: tests/test-sitemap-freshness.js');
