// ─── Config ───────────────────────────────────────────────
const WORKER_URL     = 'https://satellite-worker.platoscave.workers.dev';
const MAPTILER_API_KEY = 'tkMgnElXUcAiA79ZmSAX';
const SMALL_VIEWPORT_GRID_SIZE = 512;
const MEDIUM_VIEWPORT_GRID_SIZE = 256;
const SMALL_VIEWPORT_AREA_KM2 = 0.1; // 10 hectares
const MAX_LIVE_VIEWPORT_AREA_KM2 = 1; // 100 hectares
const DEFAULT_CENTER = [10.5, 48.2];  // Bavaria — varied forest/farmland
const DEFAULT_ZOOM   = 10;
const MONO_FONT      = "'DM Mono', monospace";
const NDVI_RENDER_SMOOTHING_PASSES = 1;
const NDVI_ENCODE_MIN = -1;
const NDVI_ENCODE_MAX = 1;
const NDVI_DISPLAY_MIN = -1;
const NDVI_DISPLAY_MAX = 1;
const NDVI_BASE_PLANE_Z = -1.1;
const NDVI_CONTOUR_PLANE_Z = NDVI_BASE_PLANE_Z + 0.01;
const NDVI_CONTOUR_STEP = 0.2;
const NDVI_CONTOUR_MAX_GRID_SIZE = 160;

// Brightened Platoscave palette — copper → ochre → gold → fresh sage → green
const NDVI_COLORSCALE = [
  [0,    '#B84F35'],
  [0.2,  '#C98B2E'],
  [0.45, '#E1BA45'],
  [0.65, '#88B96B'],
  [1,    '#4F8F45'],
];

// ─── State ────────────────────────────────────────────────
let map       = null;
let busy      = false;
let plotReady = false;
let btnEl     = null;
let baseToggleEl = null;
let viewportReadoutEl = null;
let showSatelliteBase = true;
let lastNdviGrid = null;
let lastRenderNdviGrid = null;
let lastImageGrid = null;
let lastBounds = null;
let lastDate = null;
let lastScene = null;
let lastGridLabel = '—';
let lastAxes = null;

function canUseMapLibre() {
  return typeof maplibregl !== 'undefined' && typeof maplibregl.Map === 'function';
}

function canUsePlotly() {
  return typeof Plotly !== 'undefined'
    && typeof Plotly.newPlot === 'function'
    && typeof Plotly.react === 'function';
}

function getAnalysisDate() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getViewportMetrics(bounds) {
  const centerLat = (bounds.north + bounds.south) / 2;
  const cosLat = Math.cos(centerLat * Math.PI / 180);
  const widthKm = Math.abs(bounds.east - bounds.west) * 111 * cosLat;
  const heightKm = Math.abs(bounds.north - bounds.south) * 111;
  return {
    widthKm,
    heightKm,
    areaKm2: widthKm * heightKm,
  };
}

function getAdaptiveGridSize(metrics) {
  return metrics.areaKm2 <= SMALL_VIEWPORT_AREA_KM2
    ? SMALL_VIEWPORT_GRID_SIZE
    : MEDIUM_VIEWPORT_GRID_SIZE;
}

function canRequestLive(metrics) {
  return metrics.areaKm2 <= MAX_LIVE_VIEWPORT_AREA_KM2;
}

function getLiveLimitLabel() {
  return '100 ha';
}

function formatArea(metrics) {
  if (metrics.areaKm2 >= 1) {
    return metrics.areaKm2.toFixed(metrics.areaKm2 >= 10 ? 0 : 1) + ' km²';
  }

  const hectares = metrics.areaKm2 * 100;
  if (hectares >= 0.1) {
    return hectares.toFixed(hectares >= 10 ? 0 : 1) + ' ha';
  }

  return Math.max(1, Math.round(metrics.areaKm2 * 1000000)) + ' m²';
}

function getGridLabel(grid, fallbackSize) {
  if (grid && grid.length && grid[0]) {
    return grid[0].length + '×' + grid.length;
  }
  return fallbackSize + '×' + fallbackSize;
}

function buildLocalAxes(metrics, grid) {
  const rowCount = grid.length;
  const colCount = grid[0] ? grid[0].length : rowCount;
  const widthMeters = metrics.widthKm * 1000;
  const heightMeters = metrics.heightKm * 1000;
  const x = [];
  const y = [];

  for (let col = 0; col < colCount; col++) {
    const denom = Math.max(1, colCount - 1);
    x.push(Math.round((widthMeters * col / denom) * 10) / 10);
  }

  for (let row = 0; row < rowCount; row++) {
    const denom = Math.max(1, rowCount - 1);
    y.push(Math.round((heightMeters * row / denom) * 10) / 10);
  }

  return { x, y };
}

// ─── Fixture NDVI generator ───────────────────────────────
// Produces spatially coherent synthetic NDVI values seeded by viewport bounds.
// Values span the full theoretical NDVI domain so fixture views can represent water-like negatives too.
function generateNdviGrid(bounds, size) {
  const { west, south, east, north } = bounds;
  const lonStep = (east  - west)  / (size - 1);
  const latStep = (north - south) / (size - 1);
  const grid = [];
  for (let row = 0; row < size; row++) {
    const rowArr = [];
    const lat = south + latStep * row;
    for (let col = 0; col < size; col++) {
      const lon = west + lonStep * col;
      const v = 0.38
        + 0.22 * Math.sin(lon * 85  + lat * 67)
        + 0.14 * Math.cos(lon * 160 - lat * 95)
        + 0.10 * Math.sin(lon * 240 + lat * 200)
        + 0.06 * Math.cos(lon * 380 - lat * 310)
        - 0.48 * Math.max(0, Math.sin(lon * 18 + lat * 13));
      rowArr.push(Math.round(clamp(v, NDVI_ENCODE_MIN, NDVI_ENCODE_MAX) * 1000) / 1000);
    }
    grid.push(rowArr);
  }
  return grid;
}

function smoothNdviGridForRender(grid, passes) {
  let source = grid;

  for (let pass = 0; pass < passes; pass++) {
    source = source.map((row, rowIndex) =>
      row.map((_, colIndex) => {
        let weightedSum = 0;
        let weightTotal = 0;

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
          for (let colOffset = -1; colOffset <= 1; colOffset++) {
            const sampleRow = clamp(rowIndex + rowOffset, 0, source.length - 1);
            const sampleCol = clamp(colIndex + colOffset, 0, row.length - 1);
            const weight = (rowOffset === 0 ? 2 : 1) * (colOffset === 0 ? 2 : 1);
            weightedSum += source[sampleRow][sampleCol] * weight;
            weightTotal += weight;
          }
        }

        return Math.round(weightedSum / weightTotal * 1000) / 1000;
      })
    );
  }

  return source;
}

function addContourIntersection(points, a, b, level) {
  if (a.value === b.value) return;

  const crosses = (a.value < level && b.value >= level) || (b.value < level && a.value >= level);
  if (!crosses) return;

  const t = (level - a.value) / (b.value - a.value);
  points.push({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });
}

function buildNdviContourTraces(grid, axes) {
  const rowCount = grid.length;
  const colCount = grid[0] ? grid[0].length : 0;
  if (rowCount < 2 || colCount < 2) return [];

  const maxGridSize = Math.max(rowCount, colCount);
  const sampleStep = Math.max(1, Math.ceil(maxGridSize / NDVI_CONTOUR_MAX_GRID_SIZE));
  const x = [];
  const y = [];
  const z = [];

  for (
    let level = NDVI_DISPLAY_MIN + NDVI_CONTOUR_STEP;
    level < NDVI_DISPLAY_MAX;
    level = Math.round((level + NDVI_CONTOUR_STEP) * 1000) / 1000
  ) {
    for (let row = 0; row < rowCount - 1; row += sampleStep) {
      const nextRow = Math.min(row + sampleStep, rowCount - 1);

      for (let col = 0; col < colCount - 1; col += sampleStep) {
        const nextCol = Math.min(col + sampleStep, colCount - 1);
        const topLeft = { x: axes.x[col], y: axes.y[row], value: grid[row][col] };
        const topRight = { x: axes.x[nextCol], y: axes.y[row], value: grid[row][nextCol] };
        const bottomRight = { x: axes.x[nextCol], y: axes.y[nextRow], value: grid[nextRow][nextCol] };
        const bottomLeft = { x: axes.x[col], y: axes.y[nextRow], value: grid[nextRow][col] };
        const points = [];

        addContourIntersection(points, topLeft, topRight, level);
        addContourIntersection(points, topRight, bottomRight, level);
        addContourIntersection(points, bottomRight, bottomLeft, level);
        addContourIntersection(points, bottomLeft, topLeft, level);

        for (let i = 0; i + 1 < points.length; i += 2) {
          x.push(points[i].x, points[i + 1].x, null);
          y.push(points[i].y, points[i + 1].y, null);
          z.push(NDVI_CONTOUR_PLANE_Z, NDVI_CONTOUR_PLANE_Z, null);
        }
      }
    }
  }

  if (!x.length) return [];

  return [
    {
      type: 'scatter3d',
      mode: 'lines',
      x,
      y,
      z,
      line: { color: '#8B3A2A', width: 2 },
      opacity: 0.72,
      hoverinfo: 'skip',
      showlegend: false,
    },
  ];
}

// ─── PNG decoders ─────────────────────────────────────────
// Decodes a base64 grayscale NDVI PNG (Worker format) into a 2-D numeric grid.
// Encoding: uint8 = (ndvi + 1) / 2 * 255  →  ndvi = byte / 255 * 2 - 1
function decodeNdviPng(base64) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
      const grid = [];
      for (let r = 0; r < img.height; r++) {
        const row = [];
        for (let c = 0; c < img.width; c++) {
          const byte = pixels[(r * img.width + c) * 4]; // R channel = grayscale value
          const ndvi = byte / 255 * (NDVI_ENCODE_MAX - NDVI_ENCODE_MIN) + NDVI_ENCODE_MIN;
          row.push(Math.round(clamp(ndvi, NDVI_ENCODE_MIN, NDVI_ENCODE_MAX) * 1000) / 1000);
        }
        grid.push(row);
      }
      resolve(grid.reverse()); // PNG row 0 = north; Plotly expects row 0 = south
    };
    img.onerror = reject;
    img.src = 'data:image/png;base64,' + base64;
  });
}

// Decodes a base64 RGB PNG into a 2-D luminance grid (0–1), percentile-stretched.
// Used as the flat base surface beneath the NDVI surface.
function decodeRgbToLuminance(base64) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
      const grid = [];
      for (let r = 0; r < img.height; r++) {
        const row = [];
        for (let c = 0; c < img.width; c++) {
          const i = (r * img.width + c) * 4;
          row.push((0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) / 255);
        }
        grid.push(row);
      }

      // Percentile stretch: clip 2nd–98th, expand to full 0–1 range
      const flat  = grid.flat().sort((a, b) => a - b);
      const p2    = flat[Math.floor(flat.length * 0.02)];
      const p98   = flat[Math.floor(flat.length * 0.98)];
      const range = p98 - p2 || 1;
      const stretched = grid.map(row =>
        row.map(v => Math.round(Math.max(0, Math.min(1, (v - p2) / range)) * 1000) / 1000)
      );

      resolve(stretched.reverse()); // PNG row 0 = north; Plotly expects row 0 = south
    };
    img.onerror = reject;
    img.src = 'data:image/png;base64,' + base64;
  });
}

function buildPlotAnnotationText() {
  if (lastScene) {
    return lastScene.date + ' · cloud ' + Math.round(lastScene.cloudCover) + '%';
  }

  return (lastDate || getAnalysisDate()) + ' · fixture fallback';
}

// ─── Plotly surface ───────────────────────────────────────
function renderSurface(ndviGrid, imageGrid, axes, annotationText, showBase) {
  if (!canUsePlotly()) {
    throw new Error('Plotly is unavailable');
  }

  const traces = [];
  const surfaceAxes = axes || buildLocalAxes({ widthKm: 1, heightKm: 1 }, ndviGrid);

  if (imageGrid) {
    const zFlat = imageGrid.map(row => row.map(() => NDVI_BASE_PLANE_Z));
    traces.push({
      type: 'surface',
      x: surfaceAxes.x,
      y: surfaceAxes.y,
      z: zFlat,
      surfacecolor: imageGrid,
      colorscale: [[0, '#1A1208'], [1, '#C4BAB0']],
      cmin: 0,
      cmax: 1,
      opacity: 0.7,
      visible: showBase ? true : false,
      showscale: false,
      hoverinfo: 'skip',
      lighting: { diffuse: 0, specular: 0, ambient: 1 },
      contours: { x: { show: false }, y: { show: false }, z: { show: false } },
    });
  }

  const ndviTrace = {
    type: 'surface',
    x: surfaceAxes.x,
    y: surfaceAxes.y,
    z: ndviGrid,
    colorscale: NDVI_COLORSCALE,
    cmin: NDVI_DISPLAY_MIN,
    cmax: NDVI_DISPLAY_MAX,
    contours: { x: { show: false }, y: { show: false }, z: { show: false } },
    colorbar: {
      thickness: 10,
      len: 0.55,
      tickformat: '.2f',
      tickfont: { family: MONO_FONT, size: 12, color: '#5C4F3A' },
      title: {
        text: 'NDVI',
        font: { family: MONO_FONT, size: 12, color: '#5C4F3A' },
        side: 'right',
      },
    },
    opacity: 0.96,
    showscale: true,
  };
  traces.push(ndviTrace);
  traces.push(...buildNdviContourTraces(ndviGrid, surfaceAxes));

  const layout = {
    margin: { t: 34, r: 60, b: 0, l: 0 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    annotations: annotationText
      ? [
          {
            text: annotationText,
            xref: 'paper',
            yref: 'paper',
            x: 0,
            y: 1.08,
            xanchor: 'left',
            yanchor: 'top',
            showarrow: false,
            font: { family: MONO_FONT, size: 12, color: '#5C4F3A' },
            align: 'left',
          },
        ]
      : [],
    scene: {
      bgcolor: 'rgba(0,0,0,0)',
      xaxis: {
        title: { text: 'E', font: { family: MONO_FONT, size: 12, color: '#5C4F3A' } },
        tickfont: { family: MONO_FONT, size: 10, color: '#5C4F3A' },
        ticksuffix: ' m',
        gridcolor: '#C4BAB0',
        zeroline: false,
        showline: false,
        showspikes: false,
        showbackground: false,
      },
      yaxis: {
        title: { text: 'N', font: { family: MONO_FONT, size: 12, color: '#5C4F3A' } },
        tickfont: { family: MONO_FONT, size: 10, color: '#5C4F3A' },
        ticksuffix: ' m',
        gridcolor: '#C4BAB0',
        zeroline: false,
        showline: false,
        showspikes: false,
        showbackground: false,
      },
      zaxis: {
        title: { text: 'NDVI', font: { family: MONO_FONT, size: 12, color: '#5C4F3A' } },
        tickfont: { family: MONO_FONT, size: 11, color: '#5C4F3A' },
        range: [NDVI_BASE_PLANE_Z, NDVI_DISPLAY_MAX],
        gridcolor: '#9C8E78',
        showbackground: false,
        showline: false,
        showspikes: false,
      },
      camera: { eye: { x: 1.5, y: -1.5, z: 1.1 } },
    },
    font: { family: MONO_FONT, size: 12 },
  };

  const config = { displayModeBar: false, responsive: true };

  if (plotReady) {
    Plotly.react('satellite-surface', traces, layout, config);
  } else {
    Plotly.newPlot('satellite-surface', traces, layout, config);
    document.getElementById('satellite-surface-wrap').classList.add('has-surface');
    plotReady = true;
  }
}

function renderCurrentSurface() {
  if (!lastNdviGrid) return;
  renderSurface(lastRenderNdviGrid || lastNdviGrid, lastImageGrid, lastAxes, buildPlotAnnotationText(), showSatelliteBase);
}

// ─── UI helpers ───────────────────────────────────────────
function setStatus(msg, variant) {
  const el = document.getElementById('satellite-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'satellite-status' + (variant ? ' satellite-status--' + variant : '');
}

function setSurfacePlaceholder(msg) {
  const wrap = document.getElementById('satellite-surface-wrap');
  const placeholder = document.querySelector('.satellite-surface-placeholder');
  if (wrap) wrap.classList.remove('has-surface');
  if (placeholder) placeholder.textContent = msg;
  plotReady = false;
}

function resetAnalysisButton() {
  if (btnEl) {
    btnEl.textContent = 'Get NDVI for current map';
    btnEl.disabled = false;
  }
  busy = false;
}

function setMeta(bounds, date, scene) {
  const el = document.getElementById('satellite-meta');
  if (!el) return;

  const metrics = getViewportMetrics(bounds);

  const items = scene
    ? [
        { label: 'area',   value: formatArea(metrics) },
        { label: 'grid',   value: lastGridLabel },
        { label: 'source', value: scene.constellation },
      ]
    : [
        { label: 'area',  value: formatArea(metrics) },
        { label: 'grid',  value: lastGridLabel },
        { label: 'mode',  value: 'demo fixture', demo: true },
      ];

  el.textContent = '';
  for (const item of items) {
    const wrap  = document.createElement('span');
    const label = document.createElement('span');
    const value = document.createElement('span');
    wrap.className  = 'sat-meta-item' + (item.demo ? ' sat-meta-demo' : '');
    label.className = 'sat-meta-label';
    value.className = 'sat-meta-value';
    label.textContent = item.label;
    value.textContent = item.value;
    wrap.appendChild(label);
    wrap.appendChild(value);
    el.appendChild(wrap);
  }
}

function updateViewportReadout() {
  if (!map || !viewportReadoutEl || !btnEl) return;

  const b = map.getBounds();
  const bounds = { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() };
  const metrics = getViewportMetrics(bounds);
  const liveAllowed = canRequestLive(metrics);
  const gridSize = getAdaptiveGridSize(metrics);

  viewportReadoutEl.textContent = liveAllowed
    ? 'Current map ' + formatArea(metrics) + ' · ' + gridSize + '×' + gridSize
    : 'Current map ' + formatArea(metrics) + ' · zoom in below ' + getLiveLimitLabel();
  viewportReadoutEl.classList.toggle('satellite-viewport-readout--blocked', !liveAllowed);
  btnEl.disabled = busy || !liveAllowed;
  btnEl.setAttribute('aria-disabled', String(!liveAllowed));
}

// ─── Analysis ─────────────────────────────────────────────
async function runAnalysis() {
  if (busy) return;
  busy = true;

  if (btnEl) {
    btnEl.textContent = 'Getting NDVI…';
    btnEl.disabled = true;
  }

  try {
    if (!map) {
      throw new Error('Map is unavailable');
    }

    const b      = map.getBounds();
    const bounds = { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() };
    const date   = getAnalysisDate();
    const metrics = getViewportMetrics(bounds);
    const gridSize = getAdaptiveGridSize(metrics);
    const liveAllowed = canRequestLive(metrics);

    if (!liveAllowed) {
      setStatus('Zoom in below ' + getLiveLimitLabel() + ' to get NDVI', 'working');
      updateViewportReadout();
      return;
    }

    let grid      = null;
    let imageGrid = null;
    let scene     = null;

    setStatus('Fetching satellite data…', 'working');

    try {
      const payload = JSON.stringify({ bounds, date, width: gridSize, height: gridSize });
      const headers = { 'Content-Type': 'application/json' };

      const [ndviRes, imageRes] = await Promise.all([
        fetch(WORKER_URL + '/ndvi',  { method: 'POST', headers, body: payload }),
        fetch(WORKER_URL + '/image', { method: 'POST', headers, body: payload }),
      ]);

      if (ndviRes.ok) {
        const data = await ndviRes.json();
        grid  = await decodeNdviPng(data.png);
        scene = data.scene;
      }

      if (imageRes.ok) {
        const data = await imageRes.json();
        imageGrid = await decodeRgbToLuminance(data.png);
      }
    } catch (_) {
      // Fall through to fixture.
    }

    if (!grid) {
      setStatus('Generating fixture NDVI surface…', 'working');
      // Yield so status text paints before synchronous grid computation.
      await new Promise(r => setTimeout(r, 0));
      grid = generateNdviGrid(bounds, gridSize);
    }

    lastNdviGrid = grid;
    lastRenderNdviGrid = smoothNdviGridForRender(grid, NDVI_RENDER_SMOOTHING_PASSES);
    lastImageGrid = imageGrid;
    lastBounds = bounds;
    lastDate = date;
    lastScene = scene;
    lastGridLabel = getGridLabel(grid, gridSize);
    lastAxes = buildLocalAxes(metrics, grid);

    renderCurrentSurface();
    setMeta(bounds, date, scene);

    setStatus('', null);
  } catch (_) {
    setSurfacePlaceholder('Surface unavailable');
    setStatus('Unable to render NDVI surface · refresh and try again', 'error');
  } finally {
    resetAnalysisButton();
    updateViewportReadout();
  }
}

// ─── Map initialisation ───────────────────────────────────
function initMap() {
  btnEl = document.getElementById('satellite-analyse-btn');
  baseToggleEl = document.getElementById('satellite-base-toggle');
  viewportReadoutEl = document.getElementById('satellite-viewport-readout');

  if (!btnEl || !baseToggleEl || !viewportReadoutEl) return;

  showSatelliteBase = baseToggleEl.getAttribute('aria-pressed') === 'true';

  if (!canUseMapLibre()) {
    const mapEl = document.getElementById('satellite-map');
    if (mapEl) {
      mapEl.classList.add('satellite-map-fallback');
      mapEl.textContent = 'Map unavailable';
    }
    btnEl.disabled = true;
    baseToggleEl.disabled = true;
    setStatus('Map library unavailable · refresh and try again', 'error');
    return;
  }

  map = new maplibregl.Map({
    container: 'satellite-map',
    style: 'https://api.maptiler.com/maps/hybrid/style.json?key=' + MAPTILER_API_KEY,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.on('load', updateViewportReadout);
  map.on('move', updateViewportReadout);
  updateViewportReadout();

  if (!canUsePlotly()) {
    setSurfacePlaceholder('Surface library unavailable');
    btnEl.disabled = true;
    baseToggleEl.disabled = true;
    setStatus('Surface library unavailable · refresh and try again', 'error');
    return;
  }

  baseToggleEl.addEventListener('click', () => {
    showSatelliteBase = !showSatelliteBase;
    baseToggleEl.setAttribute('aria-pressed', String(showSatelliteBase));
    try {
      renderCurrentSurface();
      if (lastBounds) setMeta(lastBounds, lastDate, lastScene);
    } catch (_) {
      setSurfacePlaceholder('Surface unavailable');
      setStatus('Unable to render NDVI surface · refresh and try again', 'error');
    }
  });

  btnEl.addEventListener('click', runAnalysis);
}

// ─── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initMap);
