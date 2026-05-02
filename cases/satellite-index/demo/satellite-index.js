// ─── Config ───────────────────────────────────────────────
const WORKER_URL     = 'https://satellite-worker.platoscave.workers.dev';
const MAPTILER_API_KEY = 'tkMgnElXUcAiA79ZmSAX';
const GRID_SIZE      = 64;
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
let dateEl    = null;

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

// ─── Plotly surface ───────────────────────────────────────
function renderSurface(ndviGrid, imageGrid) {
  const traces = [];

  if (imageGrid) {
    const zFlat = imageGrid.map(row => row.map(() => -0.5));
    traces.push({
      type: 'surface',
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
    margin: { t: 0, r: 60, b: 0, l: 0 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      bgcolor: 'rgba(0,0,0,0)',
      xaxis: { visible: false, showgrid: false, zeroline: false, showline: false, showspikes: false },
      yaxis: { visible: false, showgrid: false, zeroline: false, showline: false, showspikes: false },
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

// ─── UI helpers ───────────────────────────────────────────
function setStatus(msg, variant) {
  const el = document.getElementById('satellite-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'satellite-status' + (variant ? ' satellite-status--' + variant : '');
}

function setMeta(bounds, date, scene) {
  const el = document.getElementById('satellite-meta');
  if (!el) return;

  const cosLat   = Math.cos(((bounds.north + bounds.south) / 2) * Math.PI / 180);
  const widthKm  = Math.abs(bounds.east - bounds.west) * 111 * cosLat;
  const heightKm = Math.abs(bounds.north - bounds.south) * 111;

  const items = scene
    ? [
        { label: 'date',   value: scene.date },
        { label: 'cloud',  value: Math.round(scene.cloudCover) + '%' },
        { label: 'area',   value: Math.round(widthKm * heightKm) + ' km²' },
        { label: 'index',  value: 'NDVI' },
        { label: 'grid',   value: GRID_SIZE + '×' + GRID_SIZE },
        { label: 'source', value: scene.constellation },
      ]
    : [
        { label: 'date',  value: date || '—' },
        { label: 'area',  value: Math.round(widthKm * heightKm) + ' km²' },
        { label: 'index', value: 'NDVI' },
        { label: 'grid',  value: GRID_SIZE + '×' + GRID_SIZE },
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

// ─── Analysis ─────────────────────────────────────────────
async function runAnalysis() {
  if (busy) return;
  busy = true;

  btnEl.textContent = 'Analysing…';
  btnEl.disabled    = true;

  const b      = map.getBounds();
  const bounds = { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() };
  const date   = dateEl.value;

  let grid      = null;
  let imageGrid = null;
  let scene     = null;

  setStatus('Fetching satellite data…', 'working');

  try {
    const payload = JSON.stringify({ bounds, date, width: GRID_SIZE, height: GRID_SIZE });
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
    // fall through to fixture
  }

  if (!grid) {
    setStatus('Generating NDVI surface…', 'working');
    // Yield so status text paints before synchronous grid computation
    await new Promise(r => setTimeout(r, 0));
    grid = generateNdviGrid(bounds, GRID_SIZE);
  }

  renderSurface(grid, imageGrid);
  setMeta(bounds, date, scene);

  const statusMsg = scene
    ? 'Surface rendered · z = NDVI · ' + scene.date + ' · ' + Math.round(scene.cloudCover) + '% cloud'
    : 'Surface rendered · z = NDVI · not elevation · demo fixture';

  setStatus(statusMsg, 'ready');
  btnEl.textContent = 'Analyse visible area';
  btnEl.disabled    = false;
  busy = false;
}

// ─── Map initialisation ───────────────────────────────────
function initMap() {
  btnEl  = document.getElementById('satellite-analyse-btn');
  dateEl = document.getElementById('satellite-date');

  map = new maplibregl.Map({
    container: 'satellite-map',
    style: 'https://api.maptiler.com/maps/hybrid/style.json?key=' + MAPTILER_API_KEY,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  btnEl.addEventListener('click', runAnalysis);

  if (!dateEl.value) {
    dateEl.value = new Date().toISOString().slice(0, 10);
  }
}

// ─── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initMap);
