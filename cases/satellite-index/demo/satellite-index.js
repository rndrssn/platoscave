// ─── Config ───────────────────────────────────────────────
const MAPTILER_API_KEY = 'tkMgnElXUcAiA79ZmSAX';
const GRID_SIZE      = 64;
const DEFAULT_CENTER = [10.5, 48.2];  // Bavaria — varied forest/farmland
const DEFAULT_ZOOM   = 10;

// Platoscave palette — rust → ochre → gold → sage-light → sage
const NDVI_COLORSCALE = [
  [0,    '#8B3A2A'],
  [0.2,  '#9A7B3A'],
  [0.45, '#B8943A'],
  [0.65, '#6B8F62'],
  [1,    '#4A6741'],
];

// ─── State ────────────────────────────────────────────────
let map          = null;
let busy         = false;

// ─── Fixture NDVI generator ───────────────────────────────
// Produces spatially coherent synthetic NDVI values seeded by viewport bounds.
// Values are in the realistic NDVI range [-0.15, 0.82] for mixed landscapes.
function generateNdviGrid(bounds, size) {
  const { west, south, east, north } = bounds;
  const grid = [];
  for (let row = 0; row < size; row++) {
    const rowArr = [];
    for (let col = 0; col < size; col++) {
      const lon = west  + (east  - west)  * (col / (size - 1));
      const lat = south + (north - south) * (row / (size - 1));
      const v = 0.38
        + 0.22 * Math.sin(lon * 85  + lat * 67)
        + 0.14 * Math.cos(lon * 160 - lat * 95)
        + 0.10 * Math.sin(lon * 240 + lat * 200)
        + 0.06 * Math.cos(lon * 380 - lat * 310);
      rowArr.push(+Math.max(-0.15, Math.min(0.82, v)).toFixed(3));
    }
    grid.push(rowArr);
  }
  return grid;
}

// ─── Plotly surface ───────────────────────────────────────
function renderSurface(ndviGrid) {
  const trace = {
    type: 'surface',
    z: ndviGrid,
    colorscale: NDVI_COLORSCALE,
    cmin: -0.2,
    cmax: 0.85,
    contours: {
      z: {
        show: true,
        usecolormap: true,
        highlightcolor: '#2A2018',
        project: { z: false },
      },
    },
    colorbar: {
      thickness: 10,
      len: 0.55,
      tickformat: '.2f',
      tickfont: { family: "'DM Mono', monospace", size: 12, color: '#5C4F3A' },
      title: {
        text: 'NDVI',
        font: { family: "'DM Mono', monospace", size: 12, color: '#5C4F3A' },
        side: 'right',
      },
    },
    opacity: 0.96,
    showscale: true,
  };

  const layout = {
    margin: { t: 0, r: 60, b: 0, l: 0 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      bgcolor: 'rgba(0,0,0,0)',
      xaxis: { visible: false, showgrid: false, zeroline: false, showline: false, showspikes: false },
      yaxis: { visible: false, showgrid: false, zeroline: false, showline: false, showspikes: false },
      zaxis: {
        title: {
          text: 'NDVI',
          font: { family: "'DM Mono', monospace", size: 12, color: '#5C4F3A' },
        },
        tickfont: { family: "'DM Mono', monospace", size: 11, color: '#5C4F3A' },
        range: [-0.2, 0.85],
        gridcolor: '#9C8E78',
        showbackground: false,
        showline: false,
        showspikes: false,
      },
      camera: { eye: { x: 1.5, y: -1.5, z: 1.1 } },
    },
    font: { family: "'DM Mono', monospace", size: 12 },
  };

  const config = { displayModeBar: false, responsive: true };

  Plotly.newPlot('satellite-surface', [trace], layout, config);
  document.getElementById('satellite-surface-wrap').classList.add('has-surface');
}

// ─── UI helpers ───────────────────────────────────────────
function setStatus(msg, variant) {
  const el = document.getElementById('satellite-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'satellite-status' + (variant ? ' satellite-status--' + variant : '');
}

function setMeta(bounds, date) {
  const el = document.getElementById('satellite-meta');
  if (!el) return;

  const cosLat = Math.cos(((bounds.north + bounds.south) / 2) * Math.PI / 180);
  const widthKm  = Math.abs(bounds.east - bounds.west) * 111 * cosLat;
  const heightKm = Math.abs(bounds.north - bounds.south) * 111;
  const areaKm2  = (widthKm * heightKm).toFixed(0);

  const items = [
    { label: 'date',  value: date || '—' },
    { label: 'area',  value: areaKm2 + ' km²' },
    { label: 'index', value: 'NDVI' },
    { label: 'grid',  value: GRID_SIZE + '×' + GRID_SIZE },
    { label: 'mode',  value: 'demo fixture', demo: true },
  ];

  el.innerHTML = items.map(item =>
    '<span class="sat-meta-item' + (item.demo ? ' sat-meta-demo' : '') + '">' +
    '<span class="sat-meta-label">' + item.label + '</span>' +
    '<span class="sat-meta-value">'  + item.value + '</span>' +
    '</span>'
  ).join('');
}

// ─── Analysis ─────────────────────────────────────────────
function runAnalysis() {
  if (busy) return;
  busy = true;

  const btn    = document.getElementById('satellite-analyse-btn');
  const dateEl = document.getElementById('satellite-date');
  const date   = dateEl ? dateEl.value : '';

  if (btn) { btn.textContent = 'Analysing…'; btn.disabled = true; }
  setStatus('Generating NDVI surface…', 'working');

  const b      = map.getBounds();
  const bounds = { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() };

  // Defer grid computation one tick so the status text renders first
  setTimeout(() => {
    const grid = generateNdviGrid(bounds, GRID_SIZE);
    renderSurface(grid);
    setMeta(bounds, date);
    setStatus('Surface rendered · z = NDVI · not elevation', 'ready');
    if (btn) { btn.textContent = 'Analyse visible area'; btn.disabled = false; }
    busy = false;
  }, 80);
}

// ─── Map initialisation ───────────────────────────────────
function initMap() {
  map = new maplibregl.Map({
    container: 'satellite-map',
    style: 'https://api.maptiler.com/maps/hybrid/style.json?key=' + MAPTILER_API_KEY,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  const btn    = document.getElementById('satellite-analyse-btn');
  const dateEl = document.getElementById('satellite-date');

  if (btn) btn.addEventListener('click', runAnalysis);

  if (dateEl && !dateEl.value) {
    dateEl.value = new Date().toISOString().slice(0, 10);
  }
}

// ─── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initMap);
