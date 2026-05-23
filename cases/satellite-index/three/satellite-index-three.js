// Satellite Index Three.js prototype: renders Worker NDVI as terrain over a high-resolution MapTiler satellite tile texture.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const WORKER_URL = 'https://satellite-worker.platoscave.workers.dev';
const WORKER_API_KEY = '__WORKER_API_KEY__';
const WORKER_API_KEY_PLACEHOLDER = '__WORKER_' + 'API_KEY__';
const MAPTILER_API_KEY = 'tkMgnElXUcAiA79ZmSAX';
const SMALL_VIEWPORT_GRID_SIZE = 512;
const MEDIUM_VIEWPORT_GRID_SIZE = 256;
const SMALL_VIEWPORT_AREA_KM2 = 0.1;
const MAX_LIVE_VIEWPORT_AREA_KM2 = 2;
const DEFAULT_CENTER = [10.5, 48.2];
const DEFAULT_ZOOM = 10;
const NDVI_ENCODE_MIN = -1;
const NDVI_ENCODE_MAX = 1;
const NDVI_DISPLAY_MIN = -1;
const NDVI_DISPLAY_MAX = 1;
const NDVI_BASE_PLANE_Z = -1.1;
const NDVI_RENDER_SMOOTHING_PASSES = 1;
const BASE_TEXTURE_SIZE = 1024;
const BASE_TILE_SIZE = 256;
const BASE_TILE_MIN_ZOOM = 10;
const BASE_TILE_MAX_ZOOM = 18;
// HEIGHT_SCALE and surface offset are computed per-render from scene span — see renderThreeSurface.

const NDVI_STOPS = [
  { t: 0, color: new THREE.Color('#B84F35') },
  { t: 0.2, color: new THREE.Color('#C98B2E') },
  { t: 0.45, color: new THREE.Color('#E1BA45') },
  { t: 0.65, color: new THREE.Color('#88B96B') },
  { t: 1, color: new THREE.Color('#4F8F45') },
];

let map = null;
let busy = false;
let btnEl = null;
let baseToggleEl = null;
let viewportReadoutEl = null;
let stageEl = null;
let northEl = null;
let showSatelliteBase = true;
let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let terrainMesh = null;
let baseMesh = null;
let resizeObserver = null;
let animationFrame = null;
let lastBounds = null;
let lastDate = null;
let lastScene = null;
let lastTextureLoaded = false;
let lastFallbackReason = '';

function canUseMapLibre() {
  return typeof maplibregl !== 'undefined' && typeof maplibregl.Map === 'function';
}

function isWorkerKeyConfigured() {
  return WORKER_API_KEY && WORKER_API_KEY !== WORKER_API_KEY_PLACEHOLDER;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function getAnalysisDate() {
  return new Date().toISOString().slice(0, 10);
}

function getViewportMetrics(bounds) {
  const centerLat = (bounds.north + bounds.south) / 2;
  const cosLat = Math.cos(centerLat * Math.PI / 180);
  const widthKm = Math.abs(bounds.east - bounds.west) * 111 * cosLat;
  const heightKm = Math.abs(bounds.north - bounds.south) * 111;
  return { widthKm, heightKm, areaKm2: widthKm * heightKm };
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
  return '200 ha';
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

function generateNdviGrid(bounds, size) {
  const { west, south, east, north } = bounds;
  const lonStep = (east - west) / (size - 1);
  const latStep = (north - south) / (size - 1);
  const grid = [];

  for (let row = 0; row < size; row++) {
    const rowArr = [];
    const lat = south + latStep * row;
    for (let col = 0; col < size; col++) {
      const lon = west + lonStep * col;
      const v = 0.38
        + 0.22 * Math.sin(lon * 85 + lat * 67)
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
            const sample = source[sampleRow][sampleCol];
            if (!isFiniteNumber(sample)) continue;
            const weight = (rowOffset === 0 ? 2 : 1) * (colOffset === 0 ? 2 : 1);
            weightedSum += sample * weight;
            weightTotal += weight;
          }
        }

        return weightTotal ? Math.round(weightedSum / weightTotal * 1000) / 1000 : null;
      })
    );
  }

  return source;
}

function decodeNdviPng(base64) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
      const grid = [];

      for (let row = 0; row < img.height; row++) {
        const rowArr = [];
        for (let col = 0; col < img.width; col++) {
          const pixelIndex = (row * img.width + col) * 4;
          const byte = pixels[pixelIndex];
          const alpha = pixels[pixelIndex + 3];
          if (alpha === 0) {
            rowArr.push(null);
            continue;
          }
          const ndvi = byte / 255 * (NDVI_ENCODE_MAX - NDVI_ENCODE_MIN) + NDVI_ENCODE_MIN;
          rowArr.push(Math.round(clamp(ndvi, NDVI_ENCODE_MIN, NDVI_ENCODE_MAX) * 1000) / 1000);
        }
        grid.push(rowArr);
      }

      resolve(grid.reverse());
    };
    img.onerror = reject;
    img.src = 'data:image/png;base64,' + base64;
  });
}

function lonToTileX(lon, zoom) {
  return (lon + 180) / 360 * Math.pow(2, zoom);
}

function latToTileY(lat, zoom) {
  const latRad = lat * Math.PI / 180;
  const mercator = Math.log(Math.tan(latRad) + 1 / Math.cos(latRad));
  return (1 - mercator / Math.PI) / 2 * Math.pow(2, zoom);
}

function chooseBaseTileZoom(bounds) {
  const lonSpan = Math.max(0.000001, Math.abs(bounds.east - bounds.west));
  const centerLat = (bounds.north + bounds.south) / 2;
  const latScale = Math.max(0.15, Math.cos(centerLat * Math.PI / 180));
  const desiredZoom = Math.round(Math.log2(BASE_TEXTURE_SIZE * 360 / (lonSpan * BASE_TILE_SIZE * latScale)));
  return clamp(desiredZoom, BASE_TILE_MIN_ZOOM, BASE_TILE_MAX_ZOOM);
}

function buildTileUrl(x, y, zoom) {
  return 'https://api.maptiler.com/tiles/satellite-v2/'
    + zoom
    + '/'
    + x
    + '/'
    + y
    + '.jpg?key='
    + MAPTILER_API_KEY;
}

function loadImageBlob(url) {
  return fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Tile request failed');
      return response.blob();
    })
    .then(blob => new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Tile image decode failed'));
      };
      img.src = objectUrl;
    }));
}

async function loadBaseTexture(bounds) {
  const zoom = chooseBaseTileZoom(bounds);
  const westPx = lonToTileX(bounds.west, zoom) * BASE_TILE_SIZE;
  const eastPx = lonToTileX(bounds.east, zoom) * BASE_TILE_SIZE;
  const northPx = latToTileY(bounds.north, zoom) * BASE_TILE_SIZE;
  const southPx = latToTileY(bounds.south, zoom) * BASE_TILE_SIZE;
  const tileMinX = Math.floor(westPx / BASE_TILE_SIZE);
  const tileMaxX = Math.floor((eastPx - 1) / BASE_TILE_SIZE);
  const tileMinY = Math.floor(northPx / BASE_TILE_SIZE);
  const tileMaxY = Math.floor((southPx - 1) / BASE_TILE_SIZE);
  const sourceWidth = Math.max(1, eastPx - westPx);
  const sourceHeight = Math.max(1, southPx - northPx);
  const canvas = document.createElement('canvas');
  canvas.width = BASE_TEXTURE_SIZE;
  canvas.height = BASE_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  let loadedTiles = 0;

  ctx.fillStyle = '#C4BAB0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tasks = [];
  for (let tileY = tileMinY; tileY <= tileMaxY; tileY++) {
    for (let tileX = tileMinX; tileX <= tileMaxX; tileX++) {
      tasks.push(
        loadImageBlob(buildTileUrl(tileX, tileY, zoom))
          .then(img => {
            const tileLeft = tileX * BASE_TILE_SIZE;
            const tileTop = tileY * BASE_TILE_SIZE;
            const destX = (tileLeft - westPx) / sourceWidth * BASE_TEXTURE_SIZE;
            const destY = (tileTop - northPx) / sourceHeight * BASE_TEXTURE_SIZE;
            const destSizeX = BASE_TILE_SIZE / sourceWidth * BASE_TEXTURE_SIZE;
            const destSizeY = BASE_TILE_SIZE / sourceHeight * BASE_TEXTURE_SIZE;
            ctx.drawImage(img, destX, destY, destSizeX, destSizeY);
            loadedTiles += 1;
          })
          .catch(() => {})
      );
    }
  }

  await Promise.all(tasks);
  if (!loadedTiles) return null;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 1;
  texture.needsUpdate = true;
  return texture;
}

function setStatus(msg, variant) {
  const el = document.getElementById('satellite-three-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'satellite-status' + (variant ? ' satellite-status--' + variant : '');
}

function setSurfacePlaceholder(msg) {
  const wrap = document.getElementById('satellite-three-surface-wrap');
  const placeholder = wrap ? wrap.querySelector('.satellite-surface-placeholder') : null;
  if (wrap) wrap.classList.remove('has-surface');
  if (placeholder) placeholder.textContent = msg;
}

function resetAnalysisButton() {
  if (btnEl) {
    const rendered = stageEl && stageEl.dataset.view === 'rendered';
    btnEl.textContent = rendered ? 'Clear / reset' : 'Analyse viewport →';
    btnEl.disabled = false;
  }
  busy = false;
}

function resetToSelection() {
  setViewerMode('selecting');
  setStatus('', null);
}

function setViewerMode(mode) {
  if (!stageEl) return;
  stageEl.dataset.view = mode;
  if (btnEl) btnEl.textContent = mode === 'rendered' ? 'Clear / reset' : 'Analyse viewport →';
  if (map && mode === 'selecting') {
    window.setTimeout(() => {
      map.resize();
      updateViewportReadout();
    }, 0);
  }
}

function setMeta(date, sceneData, textureLoaded, fallbackReason) {
  const sceneEl = document.querySelector('[data-satellite-three-scene-meta]');
  if (!sceneEl) return;

  const validPixelText = sceneData && isFiniteNumber(sceneData.validPixelPct)
    ? ' / valid pixels ' + Math.round(sceneData.validPixelPct) + '%'
    : '';
  const sourceText = sceneData
    ? 'most recent valid biomass map / ' + sceneData.date + ' / cloud ' + Math.round(sceneData.cloudCover) + '%' + validPixelText
    : 'fixture fallback / ' + (date || getAnalysisDate()) + (fallbackReason ? ' / ' + fallbackReason : '');

  sceneEl.textContent = '';
  const label = document.createElement('span');
  const value = document.createElement('span');
  label.className = 'satellite-receipt-label';
  value.className = 'satellite-receipt-value' + (sceneData ? '' : ' satellite-receipt-value--demo');
  label.textContent = 'Scene';
  value.textContent = sourceText;
  sceneEl.appendChild(label);
  sceneEl.appendChild(value);
}

function updateViewportReadout() {
  if (!map || !viewportReadoutEl || !btnEl) return;

  const b = map.getBounds();
  const bounds = { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() };
  const metrics = getViewportMetrics(bounds);
  const liveAllowed = canRequestLive(metrics);

  viewportReadoutEl.textContent = liveAllowed
    ? formatArea(metrics)
    : formatArea(metrics) + ' / zoom in below ' + getLiveLimitLabel();
  viewportReadoutEl.classList.toggle('satellite-viewport-readout--blocked', !liveAllowed);
  btnEl.disabled = busy || !liveAllowed;
  btnEl.setAttribute('aria-disabled', String(!liveAllowed));
}

function colorForNdvi(value) {
  const t = clamp((value - NDVI_DISPLAY_MIN) / (NDVI_DISPLAY_MAX - NDVI_DISPLAY_MIN), 0, 1);
  for (let i = 1; i < NDVI_STOPS.length; i++) {
    const previous = NDVI_STOPS[i - 1];
    const next = NDVI_STOPS[i];
    if (t <= next.t) {
      const localT = (t - previous.t) / (next.t - previous.t || 1);
      return previous.color.clone().lerp(next.color, localT);
    }
  }
  return NDVI_STOPS[NDVI_STOPS.length - 1].color.clone();
}

function buildTerrainGeometry(grid, metrics, heightScale, surfaceOffset) {
  const rows = grid.length;
  const cols = grid[0] ? grid[0].length : 0;
  const width = metrics.widthKm * 1000;
  const depth = metrics.heightKm * 1000;
  const vertices = [];
  const colors = [];
  const uvs = [];
  const indices = [];

  for (let row = 0; row < rows; row++) {
    const z = (row / Math.max(1, rows - 1) - 0.5) * depth;
    for (let col = 0; col < cols; col++) {
      const x = (col / Math.max(1, cols - 1) - 0.5) * width;
      const value = grid[row][col];
      const y = isFiniteNumber(value) ? value * heightScale + surfaceOffset : NDVI_BASE_PLANE_Z * heightScale;
      const color = isFiniteNumber(value) ? colorForNdvi(value) : new THREE.Color('#C4BAB0');
      vertices.push(x, y, z);
      colors.push(color.r, color.g, color.b);
      uvs.push(col / Math.max(1, cols - 1), row / Math.max(1, rows - 1));
    }
  }

  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const a = row * cols + col;
      const b = row * cols + col + 1;
      const c = (row + 1) * cols + col;
      const d = (row + 1) * cols + col + 1;
      if (isFiniteNumber(grid[row][col]) && isFiniteNumber(grid[row][col + 1]) && isFiniteNumber(grid[row + 1][col])) {
        indices.push(a, b, c);
      }
      if (isFiniteNumber(grid[row][col + 1]) && isFiniteNumber(grid[row + 1][col + 1]) && isFiniteNumber(grid[row + 1][col])) {
        indices.push(b, d, c);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function clearSceneMeshes() {
  for (const mesh of [terrainMesh, baseMesh]) {
    if (!mesh) continue;
    scene.remove(mesh);
    mesh.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
  }
  terrainMesh = null;
  baseMesh = null;
}

function updateRendererSize() {
  const wrap = document.getElementById('satellite-three-surface-wrap');
  if (!wrap || !renderer || !camera) return;
  const rect = wrap.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function renderOnce(force) {
  if (!renderer || !scene || !camera) return;
  if (force || !animationFrame) {
    updateNorthIndicator();
    renderer.render(scene, camera);
  }
}

function startRenderLoop() {
  if (animationFrame) return;
  const tick = () => {
    animationFrame = requestAnimationFrame(tick);
    if (controls) controls.update();
    updateNorthIndicator();
    if (renderer && scene && camera) renderer.render(scene, camera);
  };
  tick();
}

function updateNorthIndicator() {
  if (!northEl || !camera || !renderer) return;
  const origin = new THREE.Vector3(0, 0, 0).project(camera);
  const north = new THREE.Vector3(0, 0, 100).project(camera);
  const dx = north.x - origin.x;
  const dy = north.y - origin.y;
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || (Math.abs(dx) + Math.abs(dy) < 0.0001)) return;
  const angle = Math.atan2(dx, dy);
  northEl.style.setProperty('--north-angle', angle + 'rad');
}

function initThreeScene() {
  const canvas = document.getElementById('satellite-three-surface');
  const wrap = document.getElementById('satellite-three-surface-wrap');
  if (!canvas || !wrap) return false;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 1, 10000);
  camera.position.set(520, 500, -760);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !prefersReducedMotion();
  controls.dampingFactor = 0.08;
  controls.addEventListener('change', () => renderOnce(true));
  controls.target.set(0, 0, 0);
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 160;
  controls.maxDistance = 2500;

  scene.add(new THREE.HemisphereLight(0xf4efe5, 0x6d604c, 2.2));
  const directional = new THREE.DirectionalLight(0xffffff, 2.4);
  directional.position.set(-350, -500, 800);
  scene.add(directional);

  resizeObserver = new ResizeObserver(updateRendererSize);
  resizeObserver.observe(wrap);
  window.addEventListener('resize', updateRendererSize);
  updateRendererSize();
  startRenderLoop();
  return true;
}

function frameCamera(metrics, heightScale, surfaceOffset) {
  const width = metrics.widthKm * 1000;
  const depth = metrics.heightKm * 1000;
  const span = Math.max(width, depth, 1);
  const verticalMax = NDVI_DISPLAY_MAX * heightScale + surfaceOffset;
  const verticalCenter = (NDVI_BASE_PLANE_Z * heightScale + verticalMax) / 2;
  const verticalSpan = verticalMax - NDVI_BASE_PLANE_Z * heightScale;
  const radius = Math.sqrt(width * width + depth * depth + verticalSpan * verticalSpan) / 2;
  const fov = camera.fov * Math.PI / 180;
  const fitDistance = radius / Math.sin(fov / 2) * 0.86;
  const direction = new THREE.Vector3(0.58, 0.52, -0.62).normalize();
  camera.position.copy(direction.multiplyScalar(fitDistance).add(new THREE.Vector3(0, verticalCenter, 0)));
  camera.near = Math.max(0.1, span / 1000);
  camera.far = Math.max(5000, fitDistance * 4);
  camera.updateProjectionMatrix();
  controls.target.set(0, verticalCenter, 0);
  controls.minDistance = Math.max(50, radius * 0.35);
  controls.maxDistance = Math.max(1200, fitDistance * 2.5);
  controls.update();
}

async function renderThreeSurface(grid, metrics, bounds) {
  if (!renderer && !initThreeScene()) {
    throw new Error('Three.js surface unavailable');
  }

  const wrap = document.getElementById('satellite-three-surface-wrap');
  let texture = null;
  try {
    texture = await loadBaseTexture(bounds);
  } catch (_) {
    texture = null;
  }

  clearSceneMeshes();

  const width = metrics.widthKm * 1000;
  const depth = metrics.heightKm * 1000;
  const span = Math.max(width, depth);
  const heightScale = span * 0.035;
  const surfaceOffset = span * 0.25;
  const baseGeometry = new THREE.PlaneGeometry(width, depth);
  const baseMaterial = texture
    ? new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
    : new THREE.MeshBasicMaterial({ color: '#C4BAB0', transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
  baseMesh.rotation.x = Math.PI / 2;
  baseMesh.position.y = NDVI_BASE_PLANE_Z * heightScale;
  baseMesh.visible = showSatelliteBase;
  scene.add(baseMesh);

  const terrainGeometry = buildTerrainGeometry(grid, metrics, heightScale, surfaceOffset);
  const terrainMaterial = new THREE.MeshPhongMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    shininess: 8,
    side: THREE.DoubleSide,
  });
  terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
  scene.add(terrainMesh);

  frameCamera(metrics, heightScale, surfaceOffset);
  updateRendererSize();
  if (wrap) wrap.classList.add('has-surface');
  return Boolean(texture);
}

async function runAnalysis() {
  if (busy) return;
  busy = true;

  if (btnEl) {
    btnEl.textContent = 'Analysing…';
    btnEl.disabled = true;
  }

  try {
    if (!map) throw new Error('Map is unavailable');

    const b = map.getBounds();
    const bounds = { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() };
    const date = getAnalysisDate();
    const metrics = getViewportMetrics(bounds);
    const gridSize = getAdaptiveGridSize(metrics);
    const liveAllowed = canRequestLive(metrics);

    if (!liveAllowed) {
      setStatus('Zoom in below ' + getLiveLimitLabel() + ' to get NDVI', 'working');
      updateViewportReadout();
      return;
    }

    let grid = null;
    let sceneData = null;

    let fallbackReason = '';

    if (isWorkerKeyConfigured()) {
      setStatus('Fetching satellite data…', 'working');

      try {
        const payload = JSON.stringify({ bounds, date, width: gridSize, height: gridSize });
        const headers = { 'Content-Type': 'application/json', 'X-API-Key': WORKER_API_KEY };
        const analysisRes = await fetch(WORKER_URL + '/analysis', { method: 'POST', headers, body: payload });

        if (analysisRes.ok) {
          const data = await analysisRes.json();
          grid = await decodeNdviPng(data.ndvi);
          sceneData = data.scene;
        } else {
          fallbackReason = 'Worker HTTP ' + analysisRes.status;
        }
      } catch (_) {
        fallbackReason = 'Worker request failed';
      }
    } else {
      fallbackReason = 'Worker key not injected';
    }

    if (!grid) {
      setStatus('Generating fixture surface…', 'working');
      await new Promise(resolve => setTimeout(resolve, 0));
      grid = generateNdviGrid(bounds, gridSize);
    }

    setStatus('Rendering Three.js surface…', 'working');
    const renderGrid = smoothNdviGridForRender(grid, NDVI_RENDER_SMOOTHING_PASSES);
    const textureLoaded = await renderThreeSurface(renderGrid, metrics, bounds);
    lastBounds = bounds;
    lastDate = date;
    lastScene = sceneData;
    lastTextureLoaded = textureLoaded;
    lastFallbackReason = fallbackReason;
    setMeta(date, sceneData, textureLoaded, fallbackReason);
    setViewerMode('rendered');
    setStatus(sceneData ? '' : 'Using fixture surface · ' + fallbackReason, sceneData ? null : 'working');
  } catch (_) {
    setSurfacePlaceholder('Surface unavailable');
    setStatus('Unable to render Three.js surface · refresh and try again', 'error');
  } finally {
    resetAnalysisButton();
    updateViewportReadout();
  }
}

function initMap() {
  btnEl = document.getElementById('satellite-three-analyse-btn');
  baseToggleEl = document.getElementById('satellite-three-base-toggle');
  viewportReadoutEl = document.getElementById('satellite-three-viewport-readout');
  stageEl = document.getElementById('satellite-three-stage');
  northEl = document.getElementById('satellite-three-north');

  if (!btnEl || !baseToggleEl || !viewportReadoutEl || !stageEl) return;

  showSatelliteBase = baseToggleEl.getAttribute('aria-pressed') === 'true';

  if (!canUseMapLibre()) {
    const mapEl = document.getElementById('satellite-three-map');
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
    container: 'satellite-three-map',
    style: 'https://api.maptiler.com/maps/hybrid/style.json?key=' + MAPTILER_API_KEY,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.on('load', updateViewportReadout);
  map.on('move', updateViewportReadout);
  updateViewportReadout();

  baseToggleEl.addEventListener('click', () => {
    showSatelliteBase = !showSatelliteBase;
    baseToggleEl.setAttribute('aria-pressed', String(showSatelliteBase));
    if (baseMesh) baseMesh.visible = showSatelliteBase;
    if (lastBounds) setMeta(lastDate, lastScene, lastTextureLoaded, lastFallbackReason);
  });

  btnEl.addEventListener('click', () => {
    if (stageEl && stageEl.dataset.view === 'rendered') {
      resetToSelection();
    } else {
      runAnalysis();
    }
  });
}

document.addEventListener('DOMContentLoaded', initMap);
