'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), label || ('Expected to find: ' + needle));
}

function assertNotMatches(source, pattern, label) {
  assert(!pattern.test(source), label || ('Unexpected match: ' + pattern));
}

function selectorBlock(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(escaped + '\\s*\\{([\\s\\S]*?)\\n\\}', 'm'));
  assert(match, 'Missing CSS selector: ' + selector);
  return match[1];
}

const overviewHtml = read('cases/satellite-index/index.html');
const demoHtml = read('cases/satellite-index/demo/index.html');
const demoJs = read('cases/satellite-index/demo/satellite-index.js');
const css = read('css/pages/satellite-index.css');
const moduleRouteData = read('js/module-route-data.js');

const staleFixtureOnlyCopy = /No external API calls are made|not yet connected|synthetic fixture data seeded by the current viewport/i;
assertNotMatches(overviewHtml, staleFixtureOnlyCopy, 'Overview must not describe the demo as fixture-only');
assertNotMatches(demoHtml, staleFixtureOnlyCopy, 'Demo must not describe the pipeline as disconnected');

assertIncludes(overviewHtml, 'live-first, with a fixture fallback', 'Overview should state live-first/fallback behavior');
assertIncludes(demoHtml, 'first requests live Sentinel-derived NDVI', 'Demo note should state live data path');
assertIncludes(demoHtml, 'synthetic fixture seeded by the same', 'Demo note should state fallback path');
assertIncludes(demoHtml, 'Sentinel credentials stay outside the client', 'Demo should preserve credential boundary copy');
assertIncludes(demoHtml, 'viewport is too large', 'Demo should disclose viewport-size fallback');
assertIncludes(demoHtml, 'id="satellite-base-toggle"', 'Satellite base toggle missing');
assertIncludes(demoHtml, 'id="satellite-base-toggle" type="button" aria-pressed="true"', 'Satellite base toggle should be a button with aria-pressed state');
assertNotMatches(demoHtml, /class="satellite-base-toggle" type="checkbox"/, 'Satellite base toggle should not use the hidden checkbox pattern');
assertNotMatches(demoHtml, /id="satellite-date"|type="date"/, 'Date picker should not be present in the demo controls');
assertNotMatches(demoHtml, /<span class="satellite-control-label">Index<\/span>|Map &middot; current viewport|NDVI surface &middot; z = NDVI/, 'Technical labels above the canvases should stay removed');
assertIncludes(demoHtml, '<div class="satellite-surface-tools">', 'Satellite base toggle should sit above the Plotly surface');
assertIncludes(demoHtml, '<p class="satellite-status" id="satellite-status" aria-live="polite"></p>', 'Status line should start empty');

assertIncludes(demoHtml, 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css', 'MapLibre CSS must be exact-pinned');
assertIncludes(demoHtml, 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js', 'MapLibre JS must be exact-pinned');
assertIncludes(demoHtml, 'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.35.3/plotly.min.js', 'Plotly must be exact-pinned');
assertNotMatches(demoHtml, /maplibre-gl@4\/|plotly\.js-dist-min@2\//, 'Satellite demo must not use floating CDN major versions');

assertNotMatches(moduleRouteData, /cases\/|satellite-index/, 'Cases should stay out of module route data');

assertIncludes(demoJs, "const WORKER_URL     = 'https://satellite-worker.platoscave.workers.dev';", 'Worker URL contract changed');
assertIncludes(demoJs, "fetch(WORKER_URL + '/ndvi'", 'NDVI endpoint should be fetched');
assertIncludes(demoJs, "fetch(WORKER_URL + '/image'", 'Image endpoint should be fetched');
assertIncludes(demoJs, 'const MIN_GRID_SIZE  = 64;', 'Minimum adaptive grid size changed');
assertIncludes(demoJs, 'const SMALL_VIEWPORT_GRID_SIZE = 128;', 'Small viewport adaptive grid size changed');
assertIncludes(demoJs, 'const MAX_GRID_SIZE  = 192;', 'Maximum adaptive grid size changed');
assertIncludes(demoJs, 'const SMALL_VIEWPORT_AREA_KM2 = 0.1;', '10 hectare small-viewport threshold changed');
assertIncludes(demoJs, 'const MAX_LIVE_VIEWPORT_KM = 2;', 'Live viewport guard changed');
assertIncludes(demoJs, 'function getViewportMetrics(bounds)', 'Viewport metrics helper missing');
assertIncludes(demoJs, 'function getAdaptiveGridSize(metrics)', 'Adaptive grid helper missing');
assertIncludes(demoJs, 'function buildLocalAxes(metrics, grid)', 'Local E/N axis helper missing');
assertIncludes(demoJs, 'function canRequestLive(metrics)', 'Live request guard helper missing');
assertIncludes(demoJs, 'function formatArea(metrics)', 'Area formatting helper missing');
assertIncludes(demoJs, 'const liveAllowed = canRequestLive(metrics);', 'Live request guard should be evaluated before fetch');
assert(/if \(liveAllowed\)[\s\S]*fetch\(WORKER_URL \+ '\/ndvi'/.test(demoJs), 'Worker fetches must be inside the live viewport guard');
assertIncludes(demoJs, 'width: gridSize, height: gridSize', 'Worker request should use adaptive grid size');
assertIncludes(demoJs, "lastLiveSkipped ? 'fixture · live skipped' : 'demo fixture'", 'Live-skipped fixture metadata missing');
assertIncludes(demoJs, 'function canUseMapLibre()', 'MapLibre dependency guard missing');
assertIncludes(demoJs, 'function canUsePlotly()', 'Plotly dependency guard missing');
assertIncludes(demoJs, 'setSurfacePlaceholder', 'Surface fallback state helper missing');
assertIncludes(demoJs, 'finally {\n    resetAnalysisButton();\n  }', 'Analysis must reset UI state in finally');
assertIncludes(demoJs, 'const date   = getAnalysisDate();', 'Demo should use an internal analysis date after removing the date picker');
assertIncludes(demoJs, 'let lastImageGrid = null;', 'Satellite base toggle should use cached image data');
assertIncludes(demoJs, 'showSatelliteBase ? lastImageGrid : null', 'Satellite base toggle should include/omit cached base without refetching');
assertIncludes(demoJs, "baseToggleEl.getAttribute('aria-pressed') === 'true'", 'Satellite base toggle should initialize from aria-pressed');
assertIncludes(demoJs, "baseToggleEl.addEventListener('click'", 'Satellite base toggle should use button click handling');
assertIncludes(demoJs, "baseToggleEl.setAttribute('aria-pressed', String(showSatelliteBase));", 'Satellite base toggle should keep aria-pressed in sync');
assertIncludes(demoJs, 'function buildPlotAnnotationText()', 'Plotly annotation text helper missing');
assertIncludes(demoJs, "return lastScene.date + ' · cloud ' + Math.round(lastScene.cloudCover) + '%';", 'Live date/cloud should render inside Plotly');
assertIncludes(demoJs, 'annotations: annotationText', 'Plotly layout should receive annotation text');
assertIncludes(demoJs, 'lastAxes = buildLocalAxes(metrics, grid);', 'Plotly render should use local E/N metric axes');
assertIncludes(demoJs, 'x: surfaceAxes.x', 'Plotly surfaces should receive local easting values');
assertIncludes(demoJs, 'y: surfaceAxes.y', 'Plotly surfaces should receive local northing values');
assertIncludes(demoJs, "title: { text: 'E'", 'Plotly x-axis should be labelled E');
assertIncludes(demoJs, "title: { text: 'N'", 'Plotly y-axis should be labelled N');
assertNotMatches(demoJs, /buildNorthArrowTraces|name: 'North'/, '3D north arrow should not be present');
assertNotMatches(demoJs, /Surface rendered ·/, 'Normal success status should not expose technical render text');

assert(/if \(imageGrid\)[\s\S]*traces\.push\(\{[\s\S]*const ndviTrace[\s\S]*traces\.push\(ndviTrace\);/.test(demoJs), 'Plotly trace order should remain RGB base first, NDVI second when base is enabled');
for (const color of ['#8B3A2A', '#9A7B3A', '#B8943A', '#6B8F62', '#4A6741']) {
  assertIncludes(demoJs, color, 'NDVI palette color missing: ' + color);
}
assert((demoJs.match(/\.reverse\(\)/g) || []).length >= 2, 'Worker PNG grids should keep north-to-south orientation correction');

assertIncludes(selectorBlock(css, '.satellite-toggle-control'), 'min-height: 44px;', 'Satellite base toggle should meet mobile touch-target minimum');
assertIncludes(selectorBlock(css, '.satellite-analyse-btn'), 'min-height: 44px;', 'Analyze button should meet mobile touch-target minimum');
assertIncludes(css, '.satellite-status--error', 'Error status style missing');
assertIncludes(css, '#satellite-map.satellite-map-fallback', 'Map dependency fallback style missing');

console.log('PASS: satellite index case contract holds');
