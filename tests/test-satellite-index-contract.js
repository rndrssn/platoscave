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
assertIncludes(overviewHtml, 'Analyse viewport', 'Overview try-it copy should match demo action wording');
assertNotMatches(overviewHtml, /select a date|Analyse visible area/, 'Overview should not reference removed date picker or old action copy');
assertIncludes(demoHtml, 'Spectral Index Demo', 'Demo heading should describe the multi-index surface set');
assertIncludes(demoHtml, 'six companion spectral indices', 'Demo intro should not frame the page as NDVI-only');
assertIncludes(demoHtml, 'Each surface uses index value as analytical height', 'Demo intro should explain surface-height semantics across all indices');
assertNotMatches(demoHtml, /<h1 class="module-header-title">NDVI Demo<\/h1>|Surface height represents NDVI/, 'Demo intro should not use stale NDVI-only framing');
assertIncludes(demoHtml, 'first requests live Sentinel-derived NDVI', 'Demo note should state live data path');
assertIncludes(demoHtml, 'synthetic fixture seeded by the same', 'Demo note should state fallback path');
assertIncludes(demoHtml, 'Sentinel credentials stay outside the client', 'Demo should preserve credential boundary copy');
assertIncludes(demoHtml, 'viewport exceeds the live request limit', 'Demo should disclose viewport-size request limiting');
assertIncludes(demoHtml, 'the action asks you to zoom in', 'Demo should not imply disabled large-viewport requests fall back');
assertNotMatches(demoHtml, /viewport is too large[\s\S]*surface falls back/, 'Demo should not describe large viewports as a fetch-then-fallback path');
assertIncludes(demoHtml, 'id="satellite-base-toggle"', 'Satellite base toggle missing');
assertIncludes(demoHtml, 'id="satellite-base-toggle" type="button" aria-pressed="true"', 'Satellite base toggle should be a button with aria-pressed state');
assertIncludes(demoHtml, 'aria-label="Toggle satellite base map"', 'Satellite base toggle should expose a clear accessible name');
assertIncludes(demoHtml, '<span class="satellite-control-label">Base map</span>', 'Satellite base toggle should use quiet panel-setting copy');
assertNotMatches(demoHtml, /Satellite base/, 'Satellite base copy should not return as a peer action label');
assertNotMatches(demoHtml, /class="satellite-base-toggle" type="checkbox"/, 'Satellite base toggle should not use the hidden checkbox pattern');
assertNotMatches(demoHtml, /satellite-toggle-control--right/, 'Satellite base toggle should sit next to the analyse button, not be pushed to the far edge');
assertIncludes(demoHtml, 'id="satellite-viewport-readout"', 'Live viewport readout missing');
assertIncludes(demoHtml, 'Analyse viewport', 'Primary action should use analyse viewport wording');
assertNotMatches(demoHtml, /Analyse visible area/, 'Primary action should not use technical analysis wording');
assertIncludes(demoHtml, '<p class="satellite-surface-placeholder">Run analysis to view</p>', 'Main Plotly placeholder should match the index placeholder copy');
assertNotMatches(demoHtml, /Navigate to an area<br>and get NDVI/, 'Main Plotly placeholder should not use navigation-oriented copy');
assertNotMatches(demoHtml, /id="satellite-date"|type="date"/, 'Date picker should not be present in the demo controls');
assertNotMatches(demoHtml, /<span class="satellite-control-label">Index<\/span>|Map &middot; current viewport|NDVI surface &middot; z = NDVI/, 'Technical labels above the canvases should stay removed');
assertIncludes(demoHtml, 'id="satellite-base-toggle"', 'Satellite base toggle should be present in the controls bar');
assertNotMatches(demoHtml, /data-control-style|data-control-style-option|satellite-control-style-switch/, 'Temporary control style switcher should not remain after choosing the Experience style');
assertIncludes(demoHtml, '<p class="satellite-status" id="satellite-status" aria-live="polite"></p>', 'Status line should start empty');
assert(demoHtml.indexOf('id="satellite-meta"') < demoHtml.indexOf('class="satellite-demo-stage"'), 'Analysis metadata should appear above the map and Plotly surfaces');
assert(demoHtml.indexOf('id="satellite-meta"') < demoHtml.indexOf('id="satellite-viewport-readout"'), 'Viewport readout should live inside the request receipt');
assert(demoHtml.indexOf('id="satellite-viewport-readout"') < demoHtml.indexOf('class="satellite-demo-stage"'), 'Viewport readout should appear before the map and Plotly surfaces');
assertIncludes(demoHtml, 'satellite-receipt-line satellite-receipt-line--request', 'Request receipt line missing');
assertIncludes(demoHtml, 'satellite-receipt-line satellite-receipt-line--scene', 'Scene receipt line missing');
assertIncludes(demoHtml, 'data-satellite-scene-meta', 'Acquisition metadata target missing');
assertIncludes(demoHtml, '<span class="satellite-receipt-label">Request</span>', 'Request receipt label missing');
assertIncludes(demoHtml, '<span class="satellite-receipt-label">Scene</span>', 'Scene receipt label missing');
assertIncludes(demoHtml, '<span class="satellite-receipt-value satellite-receipt-value--empty">Pending</span>', 'Initial scene receipt value should be pending, not another instruction');
assertNotMatches(demoHtml, /satellite-receipt-value--empty">Run analysis</, 'Initial scene receipt should not compete with the primary action copy');
assertNotMatches(demoHtml, /satellite-meta-style-switch|data-meta-style|data-meta-style-option/, 'Metadata style selector should be removed after choosing Bar');

assertIncludes(demoHtml, 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css', 'MapLibre CSS must be exact-pinned');
assertIncludes(demoHtml, 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js', 'MapLibre JS must be exact-pinned');
assertIncludes(demoHtml, 'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.35.3/plotly.min.js', 'Plotly must be exact-pinned');
assertNotMatches(demoHtml, /maplibre-gl@4\/|plotly\.js-dist-min@2\//, 'Satellite demo must not use floating CDN major versions');

assertNotMatches(moduleRouteData, /cases\/|satellite-index/, 'Cases should stay out of module route data');

assertIncludes(demoJs, "const WORKER_URL     = 'https://satellite-worker.platoscave.workers.dev';", 'Worker URL contract changed');
assertIncludes(demoJs, "const WORKER_API_KEY = '__WORKER_API_KEY__';", 'WORKER_API_KEY must use placeholder — real key is injected by GitHub Actions at deploy time');
assertIncludes(demoJs, "'X-API-Key': WORKER_API_KEY", 'X-API-Key header must be sent on all Worker requests');
assertIncludes(demoJs, "fetch(WORKER_URL + '/ndvi'", 'NDVI endpoint should be fetched');
assertIncludes(demoJs, "fetch(WORKER_URL + '/image'", 'Image endpoint should be fetched');
assertIncludes(demoJs, 'const SMALL_VIEWPORT_GRID_SIZE = 512;', 'Small viewport adaptive grid size changed');
assertIncludes(demoJs, 'const MEDIUM_VIEWPORT_GRID_SIZE = 256;', 'Medium viewport adaptive grid size changed');
assertIncludes(demoJs, 'const SMALL_VIEWPORT_AREA_KM2 = 0.1;', '10 hectare small-viewport threshold changed');
assertIncludes(demoJs, 'const MAX_LIVE_VIEWPORT_AREA_KM2 = 2;', '200 hectare live viewport guard changed');
assertIncludes(demoJs, 'const NDVI_RENDER_SMOOTHING_PASSES = 1;', 'Render-only NDVI smoothing pass count changed');
assertIncludes(demoJs, 'const NDVI_ENCODE_MIN = -1;', 'NDVI transport minimum should use full theoretical range');
assertIncludes(demoJs, 'const NDVI_ENCODE_MAX = 1;', 'NDVI transport maximum should use full theoretical range');
assertIncludes(demoJs, 'const NDVI_DISPLAY_MIN = -1;', 'NDVI display minimum should allow water-like negative values');
assertIncludes(demoJs, 'const NDVI_DISPLAY_MAX = 1;', 'NDVI display maximum should use full theoretical range');
assertIncludes(demoJs, 'const NDVI_BASE_PLANE_Z = -1.1;', 'Satellite base plane should sit below full NDVI range');
assertIncludes(demoJs, 'const INDEX_CONTOUR_STEP = 0.2;', 'Index contour interval changed');
assertIncludes(demoJs, 'const INDEX_CONTOUR_MAX_GRID_SIZE = 160;', 'Index contour sampling guard changed');
assertIncludes(demoJs, 'const INDEX_CONTOUR_TOP_OFFSET = 0.02;', 'Index contours should sit just above the positive z axis cap');
assertIncludes(demoJs, "const INDEX_CONTOUR_COLOR = '#4F8F45';", 'Index contours should use the green palette accent');
assertIncludes(demoJs, 'const zFlat = imageGrid.map(row => row.map(() => NDVI_BASE_PLANE_Z));', 'Satellite base plane should use named z offset below full NDVI range');
assertIncludes(demoJs, 'range: [NDVI_BASE_PLANE_Z, NDVI_DISPLAY_MAX + INDEX_CONTOUR_TOP_OFFSET]', 'Plotly z-axis should include the top NDVI contour plane');
assertIncludes(demoJs, 'function getViewportMetrics(bounds)', 'Viewport metrics helper missing');
assertIncludes(demoJs, 'function getAdaptiveGridSize(metrics)', 'Adaptive grid helper missing');
assertIncludes(demoJs, 'function buildLocalAxes(metrics, grid)', 'Local E/N axis helper missing');
assertIncludes(demoJs, 'function canRequestLive(metrics)', 'Live request guard helper missing');
assertIncludes(demoJs, 'return metrics.areaKm2 <= MAX_LIVE_VIEWPORT_AREA_KM2;', 'Live viewport guard should allow requests exactly at the configured area limit');
assertIncludes(demoJs, 'function updateViewportReadout()', 'Live viewport readout updater missing');
assertIncludes(demoJs, 'function formatArea(metrics)', 'Area formatting helper missing');
assertIncludes(demoJs, "const SENTINEL_SOURCE_RESOLUTION_LABEL = 'source 10-20 m';", 'Scene metadata should state Sentinel-2 source scale range');
assertIncludes(demoJs, 'function smoothNdviGridForRender(grid, passes)', 'Render-only NDVI smoothing helper missing');
assertIncludes(demoJs, 'function buildIndexContourTraces(grid, axes, minValue, maxValue, step)', 'Shared index contour trace helper missing');
assertIncludes(demoJs, "type: 'scatter3d'", 'Index isolines should be explicit scatter3d traces');
assertIncludes(demoJs, 'const contourPlaneZ = maxValue + INDEX_CONTOUR_TOP_OFFSET;', 'Index isolines should be projected to the top positive z plane');
assertIncludes(demoJs, 'z.push(contourPlaneZ, contourPlaneZ, null);', 'Index isolines should be drawn only on the top contour plane');
assertIncludes(demoJs, 'contours: { x: { show: false }, y: { show: false }, z: { show: false } }', 'Plotly surface contours should be disabled on the NDVI surface');
assertIncludes(demoJs, 'lastRenderNdviGrid = smoothNdviGridForRender(grid, NDVI_RENDER_SMOOTHING_PASSES);', 'NDVI render smoothing should be cached after raw grid capture');
assertIncludes(demoJs, 'byte / 255 * (NDVI_ENCODE_MAX - NDVI_ENCODE_MIN) + NDVI_ENCODE_MIN', 'NDVI PNG decode should use full-range transport scaling');
assertNotMatches(demoJs, /byte \/ 255 \* 1\.05 - 0\.2|Math\.max\(-0\.15, Math\.min\(0\.82|cmin: -0\.2|cmax: 0\.85|range: \[-0\.5, 0\.85\]/, 'Old clipped NDVI transport/display bounds should not return');
assertNotMatches(demoJs, /project: \{ z: true \}|usecolormap: false/, 'Plotly built-in surface contour projection should not return');
assertNotMatches(demoJs, /NDVI_CONTOUR_PLANE_Z|#8B3A2A|buildNdviContourTraces/, 'Old rust base-plane NDVI-only contours should not return');
assertIncludes(demoJs, 'const liveAllowed = canRequestLive(metrics);', 'Live request guard should be evaluated before fetch');
assertIncludes(demoJs, "btnEl.disabled = busy || !liveAllowed;", 'Analyze button should disable beyond live viewport limit');
assertIncludes(demoJs, "map.on('move', updateViewportReadout);", 'Viewport readout should update while the map moves');
assert(demoJs.indexOf('if (!liveAllowed)') < demoJs.indexOf("fetch(WORKER_URL + '/ndvi'"), 'Worker fetches must be guarded by the live viewport limit');
assertIncludes(demoJs, 'width: gridSize, height: gridSize', 'Worker request should use adaptive grid size');
assertNotMatches(demoJs, /lastLiveSkipped|fixture · live skipped/, 'Live-skipped fixture mode should not remain after disabling analysis above 200 ha');
assertIncludes(demoJs, 'function canUseMapLibre()', 'MapLibre dependency guard missing');
assertIncludes(demoJs, 'function canUsePlotly()', 'Plotly dependency guard missing');
assertIncludes(demoJs, 'setSurfacePlaceholder', 'Surface fallback state helper missing');
assertIncludes(demoJs, 'finally {\n    resetAnalysisButton();\n    updateViewportReadout();\n  }', 'Analysis must reset UI state and viewport readout in finally');
assertIncludes(demoJs, 'const date   = getAnalysisDate();', 'Demo should use an internal analysis date after removing the date picker');
assertIncludes(demoJs, 'let lastImageGrid = null;', 'Satellite base toggle should use cached image data');
assertIncludes(demoJs, 'renderSurface(lastRenderNdviGrid || lastNdviGrid, lastImageGrid, lastAxes, showSatelliteBase);', 'Satellite base toggle should re-render cached smoothed NDVI and cached base without refetching');
assertIncludes(demoJs, 'visible: showBase ? true : false', 'Satellite base toggle should use Plotly trace visibility instead of removing the base trace');
assertIncludes(demoJs, "btnEl.textContent = 'Analyse viewport →';", 'Primary action reset copy should use analyse viewport wording');
assertIncludes(demoJs, "btnEl.textContent = 'Analysing…';", 'Busy action copy should use analysing wording');
assertIncludes(demoJs, "viewportReadoutEl.textContent = liveAllowed\n    ? formatArea(metrics)", 'Request receipt should show area only for live-eligible viewports');
assertNotMatches(demoJs, /formatSourceAwareSpacing|formatMetricDistance|SENTINEL_SOURCE_PIXEL_SIZE_METERS|sourceAwareSpacing|' cm'|Math\.round\(meters \* 100\)/, 'Request readout should not expose render-grid or pseudo-resolution spacing');
assertNotMatches(demoJs, /formatArea\(metrics\) \+ ' \/ ' \+ gridSize \+ '×' \+ gridSize/, 'Request receipt should not show raw grid dimensions');
assertNotMatches(demoJs, /Current map|Analyse visible area|to analyse|Viewport ' \+ formatArea/, 'Old analysis/viewport copy should not return');
assertIncludes(demoJs, "baseToggleEl.getAttribute('aria-pressed') === 'true'", 'Satellite base toggle should initialize from aria-pressed');
assertIncludes(demoJs, "baseToggleEl.addEventListener('click'", 'Satellite base toggle should use button click handling');
assertIncludes(demoJs, "baseToggleEl.setAttribute('aria-pressed', String(showSatelliteBase));", 'Satellite base toggle should keep aria-pressed in sync');
assertNotMatches(demoJs, /CONTROL_STYLE_OPTIONS|initControlStyleSwitcher|setControlStyle|controlStyleRootEl|controlStyleOptionEls/, 'Temporary control style switcher JS should not remain');
assertNotMatches(demoJs, /META_STYLE|metaStyle|data-meta-style|localStorage/, 'Metadata style selector JS should be removed after choosing Bar');
assertNotMatches(demoJs, /buildPlotAnnotationText|annotations: annotationText/, 'Scene metadata should stay in the shared metadata readout, not repeated inside Plotly charts');
assertIncludes(demoJs, "scene.constellation + ' / ' + scene.date + ' / ' + SENTINEL_SOURCE_RESOLUTION_LABEL + ' / cloud ' + Math.round(scene.cloudCover) + '%'", 'Live acquisition should render scene source range and cloud in the receipt line');
assertIncludes(demoJs, "'fixture fallback / ' + (date || getAnalysisDate())", 'Fixture fallback should render as a receipt scene line');
assertIncludes(demoJs, "document.querySelector('[data-satellite-scene-meta]')", 'Acquisition metadata should render into its dedicated receipt line');
assert(!/label: 'area'[\s\S]*label: 'source'/.test(demoJs), 'Acquisition metadata should not duplicate viewport area/grid values');
assertIncludes(demoJs, 'lastAxes = buildLocalAxes(metrics, grid);', 'Plotly render should use local E/N metric axes');
assertIncludes(demoJs, 'x: surfaceAxes.x', 'Plotly surfaces should receive local easting values');
assertIncludes(demoJs, 'y: surfaceAxes.y', 'Plotly surfaces should receive local northing values');
assertIncludes(demoJs, "title: { text: 'E'", 'Plotly x-axis should be labelled E');
assertIncludes(demoJs, "title: { text: 'N'", 'Plotly y-axis should be labelled N');
assertNotMatches(demoJs, /buildNorthArrowTraces|name: 'North'/, '3D north arrow should not be present');
assertNotMatches(demoJs, /Surface rendered ·/, 'Normal success status should not expose technical render text');

assert(/if \(imageGrid\)[\s\S]*traces\.push\(\{[\s\S]*visible: showBase \? true : false[\s\S]*const ndviTrace[\s\S]*traces\.push\(ndviTrace\);/.test(demoJs), 'Plotly trace order should remain RGB base first, NDVI second when cached base exists');
for (const color of ['#B84F35', '#C98B2E', '#E1BA45', '#88B96B', '#4F8F45']) {
  assertIncludes(demoJs, color, 'NDVI palette color missing: ' + color);
}
assert((demoJs.match(/\.reverse\(\)/g) || []).length >= 2, 'Worker PNG grids should keep north-to-south orientation correction');

assertIncludes(selectorBlock(css, '.satellite-toggle-control'), 'min-height: 44px;', 'Satellite base toggle should meet mobile touch-target minimum');
assertIncludes(selectorBlock(css, '.satellite-toggle-control'), 'background: var(--experience-switch-surface);', 'Satellite base toggle should use the permanent Experience-inspired style');
assertIncludes(selectorBlock(css, '.satellite-toggle-track'), 'width: 2.1rem;', 'Satellite base toggle track should stay compact but legible');
assertIncludes(selectorBlock(css, '.satellite-analyse-btn'), 'min-height: 44px;', 'Analyze button should meet mobile touch-target minimum');
assertIncludes(css, 'box-shadow: 0.32rem 0.32rem 0 var(--experience-switch-shadow);', 'Experience control option should inherit the offset-shadow switch language');
assertNotMatches(css, /data-control-style|satellite-control-style|border-style: dashed|content: ">"|0\.28rem 0\.28rem 0 var\(--rust\)/, 'Temporary control style variants should not remain in CSS');
assertNotMatches(selectorBlock(css, '.satellite-meta'), /border: 2px solid var\(--ink\)|box-shadow:/, 'Metadata base block should be quieter than the old brutalist receipt');
assertIncludes(selectorBlock(css, '.satellite-meta'), 'padding: 0.2rem 0;', 'Permanent Bar metadata should keep only slim vertical breathing room');
assertIncludes(selectorBlock(css, '.satellite-meta'), 'display: flex;', 'Permanent metadata style should use the Bar layout');
assertNotMatches(css, /satellite-meta-style-switch|data-meta-style|ledger|soft|stamp/, 'Unused metadata selector and variant CSS should be removed');
assertIncludes(css, '.satellite-receipt-line', 'Receipt line styling missing');
assertIncludes(css, '.satellite-receipt-label', 'Receipt label styling missing');
assertIncludes(css, '.satellite-status--error', 'Error status style missing');
assertIncludes(css, '#satellite-map.satellite-map-fallback', 'Map dependency fallback style missing');
assertIncludes(selectorBlock(css, '.satellite-surface-wrap'), 'background: transparent;', 'Main Plotly surface should not sit in a framed surface box');
assertIncludes(selectorBlock(css, '.satellite-index-surface-wrap'), 'background: transparent;', 'Index Plotly surfaces should not sit in framed surface boxes');
assert(!selectorBlock(css, '.satellite-index-surface-wrap').includes('border:'), 'Index Plotly surfaces should not have a wrapper border');

assertIncludes(demoHtml, 'id="satellite-indices-grid"', 'Additional indices grid container missing');
assertIncludes(demoJs, 'const INDEX_DEFS = [', 'INDEX_DEFS config array missing');
for (const pair of ["ndre', label: 'NDRE', desc: 'Red-edge chlorophyll',\n    sourceResolution: '20 m'", "ndwi', label: 'NDWI', desc: 'Water content',\n    sourceResolution: '10 m'", "ndmi', label: 'NDMI', desc: 'Canopy moisture',\n    sourceResolution: '20 m'", "evi', label: 'EVI', desc: 'Enhanced vegetation',\n    sourceResolution: '10 m'", "savi', label: 'SAVI', desc: 'Soil-adjusted vegetation',\n    sourceResolution: '10 m'", "cire', label: 'CIre', desc: 'Chlorophyll index',\n    sourceResolution: '20 m'"]) {
  assertIncludes(demoJs, pair, 'Index source resolution metadata missing: ' + pair);
}
for (const id of ['ndre', 'ndwi', 'ndmi', 'evi', 'savi', 'cire']) {
  assertIncludes(demoJs, "endpoint: '/" + id + "'", 'Worker endpoint missing for index: ' + id);
}
assertIncludes(demoJs, "sourceEl.className = 'satellite-index-source';", 'Index panels should render source-resolution badges');
assertIncludes(demoJs, "sourceEl.textContent = def.sourceResolution + ' source';", 'Index source badges should identify source resolution');
assertIncludes(demoJs, 'function decodeIndexPng(base64, encMin, encMax)', 'General index PNG decoder missing');
assertIncludes(demoJs, 'function initIndexGrid()', 'Index grid initialiser missing');
assertIncludes(demoJs, 'function renderIndexSurface(def, renderGrid, axes)', 'Index surface renderer missing');
assert(/Plotly\.react\('satellite-surface'[\s\S]*const wrap = document\.getElementById\('satellite-surface-wrap'\);\n    if \(wrap\) wrap\.classList\.add\('has-surface'\);\n    Plotly\.newPlot\('satellite-surface'/.test(demoJs), 'Main Plotly surface should be visible before newPlot measures its container');
assertIncludes(demoJs, 'const contourTraces = buildIndexContourTraces(renderGrid, axes, def.displayMin, def.displayMax, INDEX_CONTOUR_STEP);', 'Index surfaces should build their own contour overlays');
assertIncludes(demoJs, 'range: [def.displayMin, def.displayMax + INDEX_CONTOUR_TOP_OFFSET]', 'Index z-axis should include the top contour plane');
assertIncludes(demoJs, 'Plotly.react(plotId, [trace, ...contourTraces], layout, config);', 'Index Plotly react should include contour overlays');
assert(/function renderIndexSurface\(def, renderGrid, axes\)[\s\S]*if \(wrap\) wrap\.classList\.add\('has-surface'\);\n    Plotly\.newPlot\(plotId, \[trace, \.\.\.contourTraces\], layout, config\);/.test(demoJs), 'Index Plotly surfaces should be visible before newPlot measures containers and include contour overlays');
assertIncludes(demoJs, 'function renderAllIndexSurfaces()', 'Bulk index renderer missing');
assertIncludes(demoJs, 'lastIndexGrids = indexGrids;', 'Index grids should be stored in state');
assertIncludes(demoJs, 'lastIndexRenderGrids = {};', 'Index render grids should be cached separately');
assertIncludes(demoJs, 'renderAllIndexSurfaces();', 'runAnalysis should call renderAllIndexSurfaces');
assertIncludes(demoJs, 'initIndexGrid();', 'initMap should call initIndexGrid');
assertIncludes(demoJs, "...INDEX_DEFS.map(def => fetch(WORKER_URL + def.endpoint", 'Index endpoints should be fetched in parallel');
assertIncludes(demoJs, 'rawIndexGrids[def.id] || def.generate(bounds, gridSize)', 'Index fixture fallback per def missing');
assertIncludes(css, '.satellite-indices-grid', 'Index grid CSS missing');
assertIncludes(css, '.satellite-index-surface-wrap', 'Index surface wrap CSS missing');
assertIncludes(css, '.satellite-index-source', 'Index source badge CSS missing');

console.log('PASS: satellite index case contract holds');
