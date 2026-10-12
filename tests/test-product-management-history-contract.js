// Contract tests for the product-management article and its interactive metro map.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ARTICLE_SLUG = 'product-management-intellectual-history';

const build = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build-notes.js')], {
  cwd: ROOT,
  encoding: 'utf8'
});

assert.strictEqual(build.status, 0, `Article build failed:\n${build.stdout}\n${build.stderr}`);

const html = fs.readFileSync(path.join(ROOT, 'articles', ARTICLE_SLUG, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(ROOT, 'js', 'product-management-history.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css', 'pages', 'product-management-history.css'), 'utf8');
const articleIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'articles-index.json'), 'utf8'));

assert(html.includes('data-pm-map'), 'Generated article must include the metro map root');
assert(html.includes('class="pm-map-svg" role="img"'), 'Metro map must expose an accessible SVG image');
assert(html.includes('class="pm-map-transcript"'), 'Metro map must include a complete textual station index');
assert(html.includes('Contributed:</span>'), 'Station transcript must expose contributions');
assert(html.includes('Limits &amp; failure modes:</span>'), 'Station transcript must expose limits and failure modes');
assert(html.includes('../../assets/vendor/d3.v7.min.js'), 'Article must use the vendored D3 runtime');
assert(html.includes('../../js/product-management-history-data.js'), 'Article must load the shared station data');
assert(html.includes('../../js/product-management-history.js'), 'Article must load its metro-map renderer');
assert(html.includes('../../css/pages/product-management-history.css'), 'Article must load its scoped styles');
assert(!html.includes('{{product-management-metro}}'), 'Visualization marker must not leak into generated HTML');
assert(articleIndex.some((entry) => entry.slug === ARTICLE_SLUG), 'Article must appear in generated article data');

const { stations } = require(path.join(ROOT, 'js', 'product-management-history-data.js'));
for (const station of stations) {
  assert(station.references.length > 0, `Station ${station.id} must link at least one reference`);
  station.references.forEach((reference) => assert(reference.url.startsWith('https://'), `Station ${station.id} reference must use https`));
}
assert(html.includes('class="pm-map-transcript-links"'), 'Station index must render reference links');

for (const lineage of ['brand', 'engineering', 'design', 'discovery', 'product', 'backlash']) {
  assert(script.includes(`route('${lineage}'`), `Metro map is missing the ${lineage} route`);
}

assert(css.includes('prefers-reduced-motion: reduce'), 'Map transitions must respect reduced-motion preferences');
assert(script.includes('detailContributed.textContent = d.contributed'), 'Station selection must show its contribution');
assert(script.includes('detailLimits.textContent = d.limits'), 'Station selection must show its limits');
assert(!/\.innerHTML\s*=/.test(script), 'Metro map must not write HTML through innerHTML');
assert(css.includes('.pm-map-stage'), 'Metro map styles must include the scrollable stage');
assert(css.includes('@media (max-width: 700px)'), 'Metro map must define a mobile layout');

console.log('PASS: tests/test-product-management-history-contract.js');
