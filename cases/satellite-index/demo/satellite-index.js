// ─── Config ───────────────────────────────────────────────
const WORKER_URL     = 'https://satellite-worker.platoscave.workers.dev';
const MAPTILER_API_KEY = 'tkMgnElXUcAiA79ZmSAX';
const MIN_GRID_SIZE  = 64;
const SMALL_VIEWPORT_GRID_SIZE = 128;
const MAX_GRID_SIZE  = 192;
const TARGET_METERS_PER_SAMPLE = 10;
const SMALL_VIEWPORT_AREA_KM2 = 0.1; // 10 hectares
const MAX_LIVE_VIEWPORT_KM = 2;
const DEFAULT_CENTER = [10.5, 48.2];  // Bavaria — varied forest/farmland
const DEFAULT_ZOOM   = 10;
const MONO_FONT      = "'DM Mono', monospace";

// Platoscave palette — rust → ochre → gold → sage-light → sage
const NDVI_COLORSCALE = [
  [0,    '#8B3A2A'],
  [0.2,  '#9A7B3A'],
  [0.45, '#B8943A'],
  [0.65, '#6B8F62'],
  [1,    '#4A6741'],
];

// ─── State ────────────────────────────────────────────────
let map       = null;
let busy      = false;
let plotReady = false;
let btnEl     = null;
let baseToggleEl = null;
let showSatelliteBase = true;
let lastNdviGrid = null;
let lastImageGrid = null;
let lastBounds = null;
let lastDate = null;
let lastScene = null;
let lastGridLabel = '—';
let lastLiveSkipped = false;
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
  const nativeishSize = Math.ceil(Math.max(metrics.widthKm, metrics.heightKm) * 1000 / TARGET_METERS_PER_SAMPLE);
  const smallViewportSize = metrics.areaKm2 <= SMALL_VIEWPORT_AREA_KM2
    ? SMALL_VIEWPORT_GRID_SIZE
    : MIN_GRID_SIZE;
  return clamp(Math.max(nativeishSize, smallViewportSize), MIN_GRID_SIZE, MAX_GRID_SIZE);
}

function canRequestLive(metrics) {
  return metrics.widthKm <= MAX_LIVE_VIEWPORT_KM && metrics.heightKm <= MAX_LIVE_VIEWPORT_KM;
}

function getLiveLimitLabel() {
  return MAX_LIVE_VIEWPORT_KM + '×' + MAX_LIVE_VIEWPORT_KM + ' km';
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
// Values are in the realistic NDVI range [-0.15, 0.82] for mixed landscapes.
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
        + 0.06 * Math.cos(lon * 380 - lat * 310);
      rowArr.push(Math.round(Math.max(-0.15, Math.min(0.82, v)) * 1000) / 1000);
    }
    grid.push(rowArr);
  }
  return grid;
}

// ─── PNG decoders ─────────────────────────────────────────
// Decodes a base64 grayscale NDVI PNG (Worker format) into a 2-D numeric grid.
// Encoding: uint8 = (ndvi + 0.2) / 1.05 * 255  →  ndvi = byte / 255 * 1.05 - 0.2
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
          row.push(Math.round((byte / 255 * 1.05 - 0.2) * 1000) / 1000);
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

  if (lastLiveSkipped) {
    return (lastDate || getAnalysisDate()) + ' · live skipped';
  }

  return (lastDate || getAnalysisDate()) + ' · fixture fallback';
}

// ─── Plotly surface ───────────────────────────────────────
function renderSurface(ndviGrid, imageGrid, axes, annotationText) {
  if (!canUsePlotly()) {
    throw new Error('Plotly is unavailable');
  }

  const traces = [];
  const surfaceAxes = axes || buildLocalAxes({ widthKm: 1, heightKm: 1 }, ndviGrid);

  if (imageGrid) {
    const zFlat = imageGrid.map(row => row.map(() => -0.5));
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
    cmin: -0.2,
    cmax: 0.85,
    contours: {
      z: {
        show: true,
        usecolormap: false,
        color: '#8B3A2A',
        width: 3,
        start: -0.2,
        end: 0.85,
        size: 0.1,
        project: { z: true },
      },
    },
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
        range: [-0.5, 0.85],
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
  const imageGrid = showSatelliteBase ? lastImageGrid : null;
  renderSurface(lastNdviGrid, imageGrid, lastAxes, buildPlotAnnotationText());
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
    btnEl.textContent = 'Analyse visible area';
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
        { label: 'mode',  value: lastLiveSkipped ? 'fixture · live skipped' : 'demo fixture', demo: true },
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

// ─── Analysis ─────────────────────────────────────────────
async function runAnalysis() {
  if (busy) return;
  busy = true;

  if (btnEl) {
    btnEl.textContent = 'Analysing…';
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

    let grid      = null;
    let imageGrid = null;
    let scene     = null;

    lastLiveSkipped = !liveAllowed;
    setStatus(
      liveAllowed
        ? 'Fetching satellite data…'
        : 'Live request skipped · zoom in below ' + getLiveLimitLabel() + ' · fixture shown',
      'working'
    );

    if (liveAllowed) {
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
    }

    if (!grid) {
      setStatus('Generating fixture NDVI surface…', 'working');
      // Yield so status text paints before synchronous grid computation.
      await new Promise(r => setTimeout(r, 0));
      grid = generateNdviGrid(bounds, gridSize);
    }

    lastNdviGrid = grid;
    lastImageGrid = imageGrid;
    lastBounds = bounds;
    lastDate = date;
    lastScene = scene;
    lastGridLabel = getGridLabel(grid, gridSize);
    lastAxes = buildLocalAxes(metrics, grid);

    renderCurrentSurface();
    setMeta(bounds, date, scene);

    setStatus(
      liveAllowed ? '' : 'Live request skipped · zoom in below ' + getLiveLimitLabel(),
      liveAllowed ? null : 'working'
    );
  } catch (_) {
    setSurfacePlaceholder('Surface unavailable');
    setStatus('Unable to render NDVI surface · refresh and try again', 'error');
  } finally {
    resetAnalysisButton();
  }
}

// ─── Map initialisation ───────────────────────────────────
function initMap() {
  btnEl = document.getElementById('satellite-analyse-btn');
  baseToggleEl = document.getElementById('satellite-base-toggle');

  if (!btnEl || !baseToggleEl) return;

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
