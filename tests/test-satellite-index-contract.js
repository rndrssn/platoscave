// Contract tests for satellite-index.js: constants, function exports, and structural requirements.
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
const threeHtml = read('cases/satellite-index/three/index.html');
const demoJs = read('cases/satellite-index/demo/satellite-index.js');
const threeJs = read('cases/satellite-index/three/satellite-index-three.js');
const css = read('css/pages/satellite-index.css');
const moduleRouteData = read('js/module-route-data.js');

const staleFixtureOnlyCopy = /No external API calls are made|not yet connected|synthetic fixture data seeded by the current viewport/i;
assertNotMatches(overviewHtml, staleFixtureOnlyCopy, 'Overview must not describe the demo as fixture-only');
assertNotMatches(demoHtml, staleFixtureOnlyCopy, 'Demo must not describe the pipeline as disconnected');

assertIncludes(overviewHtml, 'procedural fixture preserves the interaction model', 'Overview should state fixture fallback behavior');
assertIncludes(overviewHtml, 'Analyse viewport', 'Overview try-it copy should match demo action wording');
assertIncludes(overviewHtml, '<span class="module-sub-nav-number">02</span> Explorer', 'Overview sub-nav should link to Explorer as section 02');
assertIncludes(overviewHtml, 'Seven-index spectral terrain', 'Overview try-it link should describe the Explorer');
assertIncludes(overviewHtml, 'Three.js — terrain renderer and satellite tile base plane', 'Technical stack should mention the terrain renderer');
assertNotMatches(overviewHtml, /select a date|Analyse visible area/, 'Overview should not reference removed date picker or old action copy');
assertIncludes(demoHtml, 'Spectral Index Demo', 'Demo heading should describe the multi-index surface set');
assertIncludes(demoHtml, 'six companion spectral indices', 'Demo intro should not frame the page as NDVI-only');
assertIncludes(demoHtml, 'Each surface uses index value as analytical height', 'Demo intro should explain surface-height semantics across all indices');
assertNotMatches(demoHtml, /<h1 class="module-header-title">NDVI Demo<\/h1>|Surface height represents NDVI/, 'Demo intro should not use stale NDVI-only framing');
assertIncludes(demoHtml, 'first requests live Sentinel-derived NDVI', 'Demo note should state live data path');
assertIncludes(demoHtml, '<span class="module-sub-nav-number">03</span> Terrain renderer', 'Plotly demo should link to the terrain renderer section');
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

assertIncludes(threeHtml, 'Explorer', 'Explorer page heading missing');
assertIncludes(threeHtml, 'id="satellite-three-map"', 'Three.js prototype should keep its own map container');
assertIncludes(threeHtml, 'id="satellite-three-surface"', 'Three.js prototype should keep its own canvas');
assertIncludes(threeHtml, 'id="satellite-three-stage" data-view="selecting"', 'Three.js prototype should start in map-selection mode');
assertIncludes(threeHtml, 'id="satellite-three-base-toggle" type="button" aria-pressed="true" aria-label="Toggle satellite base map" hidden', 'Three.js base toggle should stay hidden until a surface exists');
assertIncludes(threeHtml, '<canvas id="satellite-three-surface" tabindex="0" aria-label="Interactive NDVI terrain surface"></canvas>', 'Three.js surface canvas should be keyboard focusable');
assertNotMatches(threeHtml, /satellite-three-select-btn|Select new area/, 'Three.js prototype should use one analyse/reset button instead of a separate select-new-area action');
assertIncludes(threeHtml, 'class="satellite-three-legend"', 'Three.js prototype should expose an NDVI color legend overlay');
assertIncludes(threeHtml, 'class="satellite-three-north"', 'Three.js prototype should expose a north indicator overlay');
assertNotMatches(threeHtml, /satellite-three-north-label|>N<\/span>/, 'Three.js north indicator should not include a text label');
assertIncludes(selectorBlock(css, '.satellite-three-stage'), 'margin-bottom: 1.75rem;', 'Three.js viewer should leave room before following text');
assertIncludes(selectorBlock(css, '.satellite-three-viewer'), 'width: 100%;', 'Three.js viewer should use the available case width');
assertIncludes(selectorBlock(css, '.satellite-three-viewer'), 'max-width: 1120px;', 'Three.js viewer width should remain bounded on wide screens');
assertIncludes(selectorBlock(css, '.satellite-three-viewer'), 'height: clamp(420px, 66vw, 680px);', 'Three.js viewer should reserve explicit height to avoid overlapping following text');
assertIncludes(selectorBlock(css, '#satellite-three-surface:focus-visible'), 'outline: 3px solid var(--ink);', 'Three.js canvas should expose a visible keyboard focus state');
assertIncludes(selectorBlock(css, '.satellite-three-surface-wrap'), 'position: absolute;', 'Three.js surface layer should remain contained inside the fixed viewer');
assertIncludes(selectorBlock(css, '.satellite-three-surface-wrap'), 'inset: 0;', 'Three.js surface layer should not escape the viewer box');
assertIncludes(selectorBlock(css, '.satellite-three-legend'), 'background: transparent;', 'Three.js NDVI legend should be transparent');
assertIncludes(selectorBlock(css, '.satellite-three-legend'), 'border: 0;', 'Three.js NDVI legend should not have a bounding box');
assertIncludes(selectorBlock(css, '.satellite-three-legend'), 'top: 3.5rem;', 'Three.js NDVI legend should sit below the north arrow');
assertIncludes(selectorBlock(css, '.satellite-three-legend'), 'right: 0.85rem;', 'Three.js NDVI legend should sit at the right edge');
assertIncludes(selectorBlock(css, '.satellite-three-legend'), 'color: var(--ink-mid);', 'Three.js NDVI legend should use site ink tokens instead of white overlay text');
assertIncludes(selectorBlock(css, '.satellite-three-legend'), 'text-shadow: none;', 'Three.js NDVI legend should not rely on shadowed text for legibility');
assertNotMatches(selectorBlock(css, '.satellite-three-legend'), /rgba\(255,\s*255,\s*255/, 'Three.js NDVI legend should not use white translucent text');
assertIncludes(selectorBlock(css, '.satellite-three-north'), 'background: transparent;', 'Three.js north indicator should be transparent');
assertIncludes(selectorBlock(css, '.satellite-three-north'), 'border: 0;', 'Three.js north indicator should not have a bounding box');
assertIncludes(selectorBlock(css, '.satellite-three-north'), 'color: var(--ink-mid);', 'Three.js north indicator should share the legend ink treatment');
assertIncludes(selectorBlock(css, '.satellite-three-north'), 'filter: none;', 'Three.js north indicator should not rely on a glow/drop-shadow treatment');
assertIncludes(selectorBlock(css, '.satellite-three-legend-label'), 'writing-mode: vertical-rl;', 'Three.js NDVI legend label should be vertical');
assertIncludes(selectorBlock(css, '.satellite-three-legend-ramp'), 'height: 7.8rem;', 'Three.js NDVI legend ramp should be vertical');
assertIncludes(selectorBlock(css, '.satellite-three-legend-scale'), 'flex-direction: column-reverse;', 'Three.js NDVI legend values should follow the vertical ramp');
assertIncludes(threeHtml, 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js', 'Three.js module must be exact-pinned');
assertIncludes(threeHtml, 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/', 'Three.js add-ons import path must be exact-pinned');
assertIncludes(threeHtml, 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js', 'Three.js prototype should use the same exact-pinned MapLibre runtime');
assertIncludes(threeHtml, '<script type="module" src="./satellite-index-three.js?v=20260523-1"></script>', 'Three.js prototype should load its separate implementation with a cache-busting query');
assertIncludes(threeJs, "const WORKER_URL = 'https://satellite-worker.platoscave.workers.dev';", 'Three.js prototype should use the deployed Worker');
assertIncludes(threeJs, "const WORKER_API_KEY = '__WORKER_API_KEY__';", 'Three.js prototype must keep the API key placeholder in source');
assertNotMatches(threeJs, /const WORKER_API_KEY = '[0-9a-f]{64}';/, 'Three.js prototype source must not contain an injected Worker key');
assertIncludes(threeJs, "const WORKER_API_KEY_PLACEHOLDER = '__WORKER_' + 'API_KEY__';", 'Three.js prototype should keep placeholder detection injection-proof');
assertIncludes(threeJs, "'X-API-Key': WORKER_API_KEY", 'Three.js prototype Worker requests must include X-API-Key');
assertIncludes(threeJs, 'function isWorkerKeyConfigured()', 'Three.js prototype should explicitly detect local Worker-key injection');
assertIncludes(threeJs, "fallbackReason = 'live imagery unavailable';", 'Three.js prototype should explain fixture fallback when the live data path is unavailable');
assertIncludes(threeJs, "fallbackReason = 'Worker HTTP ' + analysisRes.status;", 'Three.js prototype should expose Worker HTTP fallback status');
assertIncludes(threeJs, "fetch(WORKER_URL + '/analysis'", 'Three.js prototype should use the combined analysis endpoint');
assertIncludes(threeJs, "return 'https://api.maptiler.com/tiles/satellite-v2/'", 'Three.js prototype should compose a base texture from satellite raster tiles');
assertIncludes(threeJs, 'const texture = new THREE.CanvasTexture(canvas);', 'Three.js prototype should convert the tile mosaic canvas to a texture');
assertIncludes(threeJs, 'if (!response.ok) throw new Error', 'Three.js prototype should reject MapTiler error responses instead of rendering error images');
assertIncludes(threeJs, 'new THREE.MeshBasicMaterial({ map: texture', 'Three.js prototype should map the satellite texture onto the base plane');
assertIncludes(threeJs, 'const terrainGeometry = buildTerrainGeometry(grid, metrics, heightScale, surfaceOffset, colorFn, heightFn);', 'Three.js prototype should pass height scale, surface offset, colorFn, and heightFn into terrain geometry builder');
assertIncludes(threeJs, 'const t = clamp((v - def.displayMin) / (def.displayMax - def.displayMin), 0, 1);', 'Three.js heightFn should normalise each index value within its own display range');
assertIncludes(threeJs, 'const INDEX_DEFS = [', 'Three.js prototype should define INDEX_DEFS for all seven indices');
assertIncludes(threeJs, "id: 'ndvi'", 'Three.js INDEX_DEFS should include the NDVI entry');
assertIncludes(threeJs, "id: 'cire'", 'Three.js INDEX_DEFS should include the CIre entry');
assertIncludes(threeJs, 'function colorForIndex(value, def)', 'Three.js prototype should use a shared colorForIndex function');
assertIncludes(threeJs, 'function decodeIndexPng(base64, encMin, encMax)', 'Three.js prototype should decode index PNGs with parameterised range');
assertIncludes(threeJs, 'function rebuildTerrain(indexId)', 'Three.js prototype should rebuild terrain without refetching on index switch');
assertIncludes(threeJs, 'function updateIndexLegend(def)', 'Three.js prototype should update the legend when switching indices');
assertIncludes(threeHtml, 'data-index="ndvi"', 'Terrain renderer HTML should have an NDVI tab button');
assertIncludes(threeHtml, 'data-index="cire"', 'Terrain renderer HTML should have a CIre tab button');
assertIncludes(threeHtml, 'satellite-three-index-tabs', 'Terrain renderer HTML should have the index tab strip');
assertIncludes(threeHtml, 'satellite-three-index-tab', 'Terrain renderer HTML should have index tab buttons');
assertIncludes(threeHtml, 'id="satellite-three-legend-label"', 'Terrain renderer legend label must be addressable for dynamic updates');
assertIncludes(threeHtml, 'id="satellite-three-legend-ramp"', 'Terrain renderer legend ramp must be addressable for dynamic gradient updates');
assertIncludes(threeJs, 'const z = (row / Math.max(1, rows - 1) - 0.5) * depth;', 'Three.js prototype should use local northing on the ground-plane z axis');
assertIncludes(threeJs, 'const heightScale = span * 0.4;', 'Three.js prototype should derive height scale proportionally from scene span');
assertIncludes(threeJs, 'const surfaceOffset = span * 0.02;', 'Three.js prototype should derive surface offset proportionally from scene span');
assertIncludes(threeJs, 'return (t * 2 - 1) * heightScale + surfaceOffset;', 'Three.js heightFn should map normalised index value to the full vertical stage');
assertIncludes(threeJs, 'const verticalMax = NDVI_DISPLAY_MAX * heightScale + surfaceOffset;', 'Three.js camera framing should include the proportionally scaled NDVI domain');
assertIncludes(threeJs, 'controls.target.set(0, verticalCenter, 0);', 'Three.js camera should orbit around the lifted scene volume');
assertIncludes(threeJs, 'baseMesh.rotation.x = Math.PI / 2;', 'Three.js base plane should be rotated from XY into the X/Z ground plane');
assertIncludes(threeJs, "setViewerMode('rendered');", 'Three.js prototype should replace the selection map with the rendered surface after analysis');
assertIncludes(threeJs, "setViewerMode('selecting');", 'Three.js prototype should allow returning to map-selection mode');
assertIncludes(threeJs, "btnEl.textContent = rendered ? 'New viewport' : 'Analyse viewport →';", 'Three.js primary button should switch to new-viewport semantics after rendering');
assertIncludes(threeJs, 'function resetToSelection()', 'Three.js prototype should reset the rendered view through the primary button');
assertIncludes(threeJs, 'function prefersReducedMotion()', 'Three.js prototype should respect reduced-motion preferences');
assertIncludes(threeJs, "controls.enableDamping = !prefersReducedMotion();", 'Three.js controls should disable damping for reduced motion');
assertIncludes(threeJs, "controls.addEventListener('change', () => renderOnce(true));", 'Three.js reduced-motion path should still render user-driven camera changes');
assertIncludes(threeJs, 'function updateNorthIndicator()', 'Three.js prototype should keep the north indicator aligned to the camera');
assertIncludes(threeJs, 'const radius = Math.sqrt(width * width + depth * depth + verticalSpan * verticalSpan) / 2;', 'Three.js prototype should frame the full surface bounds');
assertIncludes(threeJs, 'const fitDistance = radius / Math.sin(fov / 2) * 0.86;', 'Three.js prototype should default to a tighter fit distance');
assertNotMatches(threeJs, /createAxisLabel|createAxisLine|buildAxisGroup|axisGroup/, 'Three.js prototype should not render axis lines or labels');
assertIncludes(threeJs, 'baseMesh.visible = showSatelliteBase;', 'Three.js base toggle should control the cached base mesh without refetching');
assertNotMatches(threeJs, /base texture MapTiler satellite tiles|base texture unavailable|SENTINEL_SOURCE_RESOLUTION_LABEL|sceneData\.constellation/, 'Three.js metadata should stay compact and avoid source/base-texture telemetry');
assertNotMatches(threeJs, /Plotly\./, 'Three.js prototype must not use Plotly');

assertIncludes(demoJs, "const WORKER_URL     = 'https://satellite-worker.platoscave.workers.dev';", 'Worker URL contract changed');
assertIncludes(demoJs, "const WORKER_API_KEY = '__WORKER_API_KEY__';", 'WORKER_API_KEY must use placeholder — real key is injected by GitHub Actions at deploy time');
assertNotMatches(demoJs, /const WORKER_API_KEY = '[0-9a-f]{64}';/, 'Demo source must not contain an injected Worker key');
assertIncludes(demoJs, "'X-API-Key': WORKER_API_KEY", 'X-API-Key header must be sent on all Worker requests');
assertIncludes(demoJs, "fetch(WORKER_URL + '/analysis'", 'Combined analysis endpoint should be fetched');
assertNotMatches(demoJs, /fetch\(WORKER_URL \+ '\/ndvi'|fetch\(WORKER_URL \+ '\/image'|\.\.\.INDEX_DEFS\.map\(def => fetch/, 'Frontend should not fan out separate Worker requests for one analysis');
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
assertIncludes(demoJs, "const INDEX_CONTOUR_COLOR = '#123D1E';", 'Index contours should use a dark high-contrast green');
assertIncludes(demoJs, 'const zFlat = imageGrid.map(row => row.map(v => isFiniteNumber(v) ? NDVI_BASE_PLANE_Z : null));', 'Satellite base plane should preserve masked pixels as gaps');
assertIncludes(demoJs, 'range: [NDVI_BASE_PLANE_Z, NDVI_DISPLAY_MAX + INDEX_CONTOUR_TOP_OFFSET]', 'Plotly z-axis should include the top NDVI contour plane');
assertIncludes(demoJs, 'function getViewportMetrics(bounds)', 'Viewport metrics helper missing');
assertIncludes(demoJs, 'function getAdaptiveGridSize(metrics)', 'Adaptive grid helper missing');
assertIncludes(demoJs, 'function buildLocalAxes(metrics, grid)', 'Local E/N axis helper missing');
assertIncludes(demoJs, 'function isFiniteNumber(value)', 'Masked pixel helper missing');
assertIncludes(demoJs, 'function canRequestLive(metrics)', 'Live request guard helper missing');
assertIncludes(demoJs, 'return metrics.areaKm2 <= MAX_LIVE_VIEWPORT_AREA_KM2;', 'Live viewport guard should allow requests exactly at the configured area limit');
assertIncludes(demoJs, 'function updateViewportReadout()', 'Live viewport readout updater missing');
assertIncludes(demoJs, 'function formatArea(metrics)', 'Area formatting helper missing');
assertIncludes(demoJs, "const SENTINEL_SOURCE_RESOLUTION_LABEL = 'source 10-20 m';", 'Scene metadata should state Sentinel-2 source scale range');
assertIncludes(demoJs, 'function smoothNdviGridForRender(grid, passes)', 'Render-only NDVI smoothing helper missing');
assertIncludes(demoJs, 'if (!isFiniteNumber(sample)) continue;', 'NDVI smoothing should preserve Worker mask gaps');
assertIncludes(demoJs, 'function buildIndexContourTraces(grid, axes, minValue, maxValue, step)', 'Shared index contour trace helper missing');
assertIncludes(demoJs, 'if (!isFiniteNumber(a.value) || !isFiniteNumber(b.value)) return;', 'Index contours should skip masked pixels');
assertIncludes(demoJs, "type: 'scatter3d'", 'Index isolines should be explicit scatter3d traces');
assertIncludes(demoJs, 'const contourPlaneZ = maxValue + INDEX_CONTOUR_TOP_OFFSET;', 'Index isolines should be projected to the top positive z plane');
assertIncludes(demoJs, 'z.push(contourPlaneZ, contourPlaneZ, null);', 'Index isolines should be drawn only on the top contour plane');
assertIncludes(demoJs, 'contours: { x: { show: false }, y: { show: false }, z: { show: false } }', 'Plotly surface contours should be disabled on the NDVI surface');
assertIncludes(demoJs, 'lastRenderNdviGrid = smoothNdviGridForRender(grid, NDVI_RENDER_SMOOTHING_PASSES);', 'NDVI render smoothing should be cached after raw grid capture');
assertIncludes(demoJs, 'byte / 255 * (NDVI_ENCODE_MAX - NDVI_ENCODE_MIN) + NDVI_ENCODE_MIN', 'NDVI PNG decode should use full-range transport scaling');
assertIncludes(demoJs, 'const alpha = pixels[pixelIndex + 3];', 'PNG decoders should read Worker alpha masks');
assertIncludes(demoJs, 'if (alpha === 0) {\n            row.push(null);', 'Masked Worker pixels should decode to null gaps');
assertNotMatches(demoJs, /byte \/ 255 \* 1\.05 - 0\.2|Math\.max\(-0\.15, Math\.min\(0\.82|cmin: -0\.2|cmax: 0\.85|range: \[-0\.5, 0\.85\]/, 'Old clipped NDVI transport/display bounds should not return');
assertNotMatches(demoJs, /project: \{ z: true \}|usecolormap: false/, 'Plotly built-in surface contour projection should not return');
assertNotMatches(demoJs, /NDVI_CONTOUR_PLANE_Z|#8B3A2A|buildNdviContourTraces/, 'Old rust base-plane NDVI-only contours should not return');
assertIncludes(demoJs, 'const liveAllowed = canRequestLive(metrics);', 'Live request guard should be evaluated before fetch');
assertIncludes(demoJs, "btnEl.disabled = busy || !liveAllowed;", 'Analyze button should disable beyond live viewport limit');
assertIncludes(demoJs, "map.on('move', updateViewportReadout);", 'Viewport readout should update while the map moves');
assert(demoJs.indexOf('if (!liveAllowed)') < demoJs.indexOf("fetch(WORKER_URL + '/analysis'"), 'Worker fetches must be guarded by the live viewport limit');
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
assertIncludes(demoJs, "const validPixelText = scene && isFiniteNumber(scene.validPixelPct)", 'Live acquisition should expose valid-pixel metadata when provided by the Worker');
assertIncludes(demoJs, "'most recent valid biomass map / ' + scene.constellation + ' / ' + scene.date + ' / ' + SENTINEL_SOURCE_RESOLUTION_LABEL + ' / cloud ' + Math.round(scene.cloudCover) + '%' + validPixelText", 'Live acquisition should render as the most recent valid biomass map with source, date, cloud, and valid-pixel context');
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
assertIncludes(selectorBlock(css, '.satellite-three-hud'), 'background: rgba(250, 248, 241, 0.94);', 'Three.js HUD should have a paper backing over map imagery');
assertIncludes(css, '.satellite-three-hud .satellite-analyse-btn,\n.satellite-three-hud .satellite-toggle-control {\n  border: 1px solid var(--sage);\n  background: var(--sage);', 'Three.js HUD controls should use sage for inactive or untoggled state');
assertIncludes(css, '.satellite-three-hud .satellite-analyse-btn:not(:disabled),\n.satellite-three-hud .satellite-toggle-control[aria-pressed="true"] {\n  border-color: var(--gold);\n  background: var(--gold);', 'Three.js HUD controls should use gold for active or toggled state');
assertIncludes(selectorBlock(css, '.satellite-three-hud .satellite-viewport-readout'), 'background: var(--sage);', 'Three.js viewport readout should use sage for blocked/inactive state');
assertIncludes(selectorBlock(css, '.satellite-three-hud .satellite-viewport-readout:not(.satellite-viewport-readout--blocked)'), 'background: var(--gold);', 'Three.js viewport readout should use gold for live/active state');
assertNotMatches(css, /\.satellite-three-hud \.satellite-analyse-btn[\s\S]*?rgba\(255,\s*255,\s*255/, 'Three.js analyze button should not use translucent white overlay styling');
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
assertIncludes(demoJs, "endpoint: '/evi', encMin: -1, encMax: 1, displayMin: -1, displayMax: 1", 'EVI should use the full encoded index range');
assertIncludes(demoJs, "endpoint: '/cire', encMin: 0, encMax: 6, displayMin: 0, displayMax: 6", 'CIre should avoid the old low analytical cap');
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
assertIncludes(demoJs, "rawIndexGrids[def.id] = await decodeIndexPng(data.indices[def.id], def.encMin, def.encMax);", 'Index grids should decode from the combined analysis payload');
assertIncludes(demoJs, 'rawIndexGrids[def.id] || def.generate(bounds, gridSize)', 'Index fixture fallback per def missing');
assertIncludes(css, '.satellite-indices-grid', 'Index grid CSS missing');
assertIncludes(css, '.satellite-index-surface-wrap', 'Index surface wrap CSS missing');
assertIncludes(css, '.satellite-index-source', 'Index source badge CSS missing');

console.log('PASS: satellite index case contract holds');
