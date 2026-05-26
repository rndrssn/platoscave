// Boundary-free monitoring Explorer: renders Sentinel-derived spectral surfaces with satellite basemap and optional MapTiler contours-v2 isolines.

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
const CONTOUR_TEXTURE_TIMEOUT_MS = 12000;
const CONTOUR_TEXTURE_SIZE = 2048;
// HEIGHT_SCALE and surface offset are computed per-render from scene span — see renderThreeSurface.

const INDEX_DEFS = [
  {
    id: 'ndvi', label: 'NDVI', desc: 'Vegetation density',
    encMin: -1, encMax: 1, displayMin: -1, displayMax: 1,
    colorStops: [
      { t: 0, color: new THREE.Color('#B84F35') },
      { t: 0.2, color: new THREE.Color('#C98B2E') },
      { t: 0.45, color: new THREE.Color('#E1BA45') },
      { t: 0.65, color: new THREE.Color('#88B96B') },
      { t: 1, color: new THREE.Color('#4F8F45') },
    ],
    generate(bounds, size) { return generateNdviGrid(bounds, size); },
  },
  {
    id: 'ndre', label: 'NDRE', desc: 'Red-edge chlorophyll',
    encMin: -1, encMax: 1, displayMin: -1, displayMax: 1,
    colorStops: [
      { t: 0, color: new THREE.Color('#6B7E7A') },
      { t: 0.35, color: new THREE.Color('#7EA898') },
      { t: 0.55, color: new THREE.Color('#88B96B') },
      { t: 0.75, color: new THREE.Color('#5A9A4A') },
      { t: 1, color: new THREE.Color('#2A6A28') },
    ],
    generate(bounds, size) {
      const { west, south, east, north } = bounds;
      const lonStep = (east - west) / (size - 1);
      const latStep = (north - south) / (size - 1);
      const grid = [];
      for (let row = 0; row < size; row++) {
        const rowArr = [];
        const lat = south + latStep * row;
        for (let col = 0; col < size; col++) {
          const lon = west + lonStep * col;
          const v = 0.18
            + 0.16 * Math.sin(lon * 85  + lat * 67)
            + 0.10 * Math.cos(lon * 160 - lat * 95)
            + 0.07 * Math.sin(lon * 240 + lat * 200)
            + 0.04 * Math.cos(lon * 380 - lat * 310)
            - 0.34 * Math.max(0, Math.sin(lon * 18 + lat * 13));
          rowArr.push(Math.round(clamp(v, -1, 1) * 1000) / 1000);
        }
        grid.push(rowArr);
      }
      return grid;
    },
  },
  {
    id: 'ndwi', label: 'NDWI', desc: 'Water content',
    encMin: -1, encMax: 1, displayMin: -1, displayMax: 1,
    colorStops: [
      { t: 0, color: new THREE.Color('#C98B2E') },
      { t: 0.4, color: new THREE.Color('#C4BAB0') },
      { t: 0.6, color: new THREE.Color('#7AAABF') },
      { t: 0.8, color: new THREE.Color('#3A7A9A') },
      { t: 1, color: new THREE.Color('#0A4A6A') },
    ],
    generate(bounds, size) {
      const { west, south, east, north } = bounds;
      const lonStep = (east - west) / (size - 1);
      const latStep = (north - south) / (size - 1);
      const grid = [];
      for (let row = 0; row < size; row++) {
        const rowArr = [];
        const lat = south + latStep * row;
        for (let col = 0; col < size; col++) {
          const lon = west + lonStep * col;
          const v = -0.12
            - 0.16 * Math.sin(lon * 85  + lat * 67)
            + 0.12 * Math.cos(lon * 110 + lat * 80)
            + 0.08 * Math.sin(lon * 200 - lat * 140)
            + 0.38 * Math.max(0, Math.sin(lon * 18 + lat * 13));
          rowArr.push(Math.round(clamp(v, -1, 1) * 1000) / 1000);
        }
        grid.push(rowArr);
      }
      return grid;
    },
  },
  {
    id: 'ndmi', label: 'NDMI', desc: 'Canopy moisture',
    encMin: -1, encMax: 1, displayMin: -1, displayMax: 1,
    colorStops: [
      { t: 0, color: new THREE.Color('#B84F35') },
      { t: 0.3, color: new THREE.Color('#C4BAB0') },
      { t: 0.55, color: new THREE.Color('#6ABAA0') },
      { t: 0.75, color: new THREE.Color('#3A8A78') },
      { t: 1, color: new THREE.Color('#0A5A50') },
    ],
    generate(bounds, size) {
      const { west, south, east, north } = bounds;
      const lonStep = (east - west) / (size - 1);
      const latStep = (north - south) / (size - 1);
      const grid = [];
      for (let row = 0; row < size; row++) {
        const rowArr = [];
        const lat = south + latStep * row;
        for (let col = 0; col < size; col++) {
          const lon = west + lonStep * col;
          const v = 0.10
            + 0.14 * Math.sin(lon * 85  + lat * 67)
            + 0.09 * Math.cos(lon * 130 - lat * 100)
            + 0.06 * Math.sin(lon * 270 + lat * 180)
            - 0.24 * Math.max(0, Math.sin(lon * 18 + lat * 13));
          rowArr.push(Math.round(clamp(v, -1, 1) * 1000) / 1000);
        }
        grid.push(rowArr);
      }
      return grid;
    },
  },
  {
    id: 'evi', label: 'EVI', desc: 'Enhanced vegetation',
    encMin: -1, encMax: 1, displayMin: -1, displayMax: 1,
    colorStops: [
      { t: 0, color: new THREE.Color('#7A5A4A') },
      { t: 0.2, color: new THREE.Color('#B88A5A') },
      { t: 0.45, color: new THREE.Color('#D4B86A') },
      { t: 0.65, color: new THREE.Color('#88B96B') },
      { t: 1, color: new THREE.Color('#2A6A28') },
    ],
    generate(bounds, size) {
      const { west, south, east, north } = bounds;
      const lonStep = (east - west) / (size - 1);
      const latStep = (north - south) / (size - 1);
      const grid = [];
      for (let row = 0; row < size; row++) {
        const rowArr = [];
        const lat = south + latStep * row;
        for (let col = 0; col < size; col++) {
          const lon = west + lonStep * col;
          const v = 0.30
            + 0.18 * Math.sin(lon * 85  + lat * 67)
            + 0.11 * Math.cos(lon * 155 - lat * 90)
            + 0.08 * Math.sin(lon * 230 + lat * 195)
            + 0.05 * Math.cos(lon * 370 - lat * 300)
            - 0.36 * Math.max(0, Math.sin(lon * 18 + lat * 13));
          rowArr.push(Math.round(clamp(v, -1, 1) * 1000) / 1000);
        }
        grid.push(rowArr);
      }
      return grid;
    },
  },
  {
    id: 'savi', label: 'SAVI', desc: 'Soil-adjusted vegetation',
    encMin: -1, encMax: 1, displayMin: -1, displayMax: 1,
    colorStops: [
      { t: 0, color: new THREE.Color('#8A5E3A') },
      { t: 0.35, color: new THREE.Color('#C4A060') },
      { t: 0.55, color: new THREE.Color('#C4C870') },
      { t: 0.72, color: new THREE.Color('#78A85A') },
      { t: 1, color: new THREE.Color('#2A5E28') },
    ],
    generate(bounds, size) {
      const { west, south, east, north } = bounds;
      const lonStep = (east - west) / (size - 1);
      const latStep = (north - south) / (size - 1);
      const grid = [];
      for (let row = 0; row < size; row++) {
        const rowArr = [];
        const lat = south + latStep * row;
        for (let col = 0; col < size; col++) {
          const lon = west + lonStep * col;
          const v = 0.24
            + 0.17 * Math.sin(lon * 85  + lat * 67)
            + 0.11 * Math.cos(lon * 160 - lat * 95)
            + 0.08 * Math.sin(lon * 240 + lat * 200)
            + 0.05 * Math.cos(lon * 375 - lat * 305)
            - 0.42 * Math.max(0, Math.sin(lon * 18 + lat * 13));
          rowArr.push(Math.round(clamp(v, -1, 1) * 1000) / 1000);
        }
        grid.push(rowArr);
      }
      return grid;
    },
  },
  {
    id: 'cire', label: 'CIre', desc: 'Chlorophyll index',
    encMin: 0, encMax: 6, displayMin: 0, displayMax: 6,
    colorStops: [
      { t: 0, color: new THREE.Color('#E8E4D0') },
      { t: 0.25, color: new THREE.Color('#B8D48A') },
      { t: 0.5, color: new THREE.Color('#78B45A') },
      { t: 0.75, color: new THREE.Color('#3A8A35') },
      { t: 1, color: new THREE.Color('#0A5A15') },
    ],
    generate(bounds, size) {
      const { west, south, east, north } = bounds;
      const lonStep = (east - west) / (size - 1);
      const latStep = (north - south) / (size - 1);
      const grid = [];
      for (let row = 0; row < size; row++) {
        const rowArr = [];
        const lat = south + latStep * row;
        for (let col = 0; col < size; col++) {
          const lon = west + lonStep * col;
          const v = 0.85
            + 0.55 * Math.sin(lon * 85  + lat * 67)
            + 0.35 * Math.cos(lon * 160 - lat * 95)
            + 0.25 * Math.sin(lon * 240 + lat * 200)
            - 0.90 * Math.max(0, Math.sin(lon * 18 + lat * 13));
          rowArr.push(Math.round(clamp(v, 0, 3) * 1000) / 1000);
        }
        grid.push(rowArr);
      }
      return grid;
    },
  },
];

let map = null;
let busy = false;
let btnEl = null;
let terrainSwitchEl = null;
let viewportReadoutEl = null;
let stageEl = null;
let northEl = null;
let baseContextMode = 'satellite';
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
let lastMetrics = null;
let lastIndexGrids = {};
let lastBaseTextures = { satellite: null, terrain: null };
let lastBasePlaneY = 0;
let activeIndexId = 'ndvi';

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
  const hectares = metrics.areaKm2 * 100;
  if (hectares >= 100) return hectares.toFixed(0) + ' ha';
  if (hectares >= 10) return hectares.toFixed(1) + ' ha';
  return hectares.toFixed(2) + ' ha';
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

function buildSatelliteTileUrl(x, y, zoom) {
  return 'https://api.maptiler.com/tiles/satellite-v2/'
    + zoom
    + '/'
    + x
    + '/'
    + y
    + '.jpg?key='
    + MAPTILER_API_KEY;
}

function buildContourTileJsonUrl() {
  return 'https://api.maptiler.com/tiles/contours-v2/tiles.json?key=' + MAPTILER_API_KEY;
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

function makeThreeTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 1;
  texture.needsUpdate = true;
  return texture;
}

async function drawTileMosaic(bounds, zoom, buildUrl, drawTile) {
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

  const tasks = [];
  for (let tileY = tileMinY; tileY <= tileMaxY; tileY++) {
    for (let tileX = tileMinX; tileX <= tileMaxX; tileX++) {
      tasks.push(
        loadImageBlob(buildUrl(tileX, tileY, zoom))
          .then(img => {
            const tileLeft = tileX * BASE_TILE_SIZE;
            const tileTop = tileY * BASE_TILE_SIZE;
            const destX = (tileLeft - westPx) / sourceWidth * BASE_TEXTURE_SIZE;
            const destY = (tileTop - northPx) / sourceHeight * BASE_TEXTURE_SIZE;
            const destSizeX = BASE_TILE_SIZE / sourceWidth * BASE_TEXTURE_SIZE;
            const destSizeY = BASE_TILE_SIZE / sourceHeight * BASE_TEXTURE_SIZE;
            drawTile(ctx, img, destX, destY, destSizeX, destSizeY);
            loadedTiles += 1;
          })
          .catch(() => {})
      );
    }
  }

  await Promise.all(tasks);
  return loadedTiles ? canvas : null;
}

async function loadSatelliteBaseTexture(bounds) {
  const zoom = chooseBaseTileZoom(bounds);
  const canvas = await drawTileMosaic(bounds, zoom, buildSatelliteTileUrl, (ctx, img, destX, destY, destSizeX, destSizeY) => {
    ctx.drawImage(img, destX, destY, destSizeX, destSizeY);
  });
  return canvas ? makeThreeTexture(canvas) : null;
}

function buildContourStyle() {
  return {
    version: 8,
    sources: {
      contours: {
        type: 'vector',
        url: buildContourTileJsonUrl(),
      },
    },
    layers: [
      {
        id: 'contour-background',
        type: 'background',
        paint: { 'background-color': '#FAFCFF' },
      },
      {
        id: 'contour-lines',
        type: 'line',
        source: 'contours',
        'source-layer': 'contour',
        filter: ['any', ['!', ['has', 'glacier']], ['!=', ['get', 'glacier'], 1]],
        paint: {
          'line-color': [
            'match',
            ['get', 'nth_line'],
            10, '#071F17',
            5, '#0D3028',
            2, '#1A4A3E',
            '#2D6458',
          ],
          'line-opacity': 1.0,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9,
            ['match', ['get', 'nth_line'], 10, 1.8, 5, 1.3, 2, 0.9, 0.6],
            14,
            ['match', ['get', 'nth_line'], 10, 3.2, 5, 2.2, 2, 1.4, 0.9],
            16,
            ['match', ['get', 'nth_line'], 10, 5.0, 5, 3.5, 2, 2.2, 1.4],
            19,
            ['match', ['get', 'nth_line'], 10, 60, 5, 44, 2, 28, 16],
          ],
        },
      },
    ],
  };
}

function snapshotMapCanvas(mapInstance, size) {
  const outputSize = size || BASE_TEXTURE_SIZE;
  const sourceCanvas = mapInstance.getCanvas();
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0, outputSize, outputSize);
  return makeThreeTexture(canvas);
}

function loadContourBaseTexture(bounds) {
  if (!window.maplibregl || !document.body) return Promise.resolve(null);
  return new Promise(resolve => {
    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    container.style.position = 'fixed';
    container.style.left = '-200vw';
    container.style.top = '0';
    container.style.width = CONTOUR_TEXTURE_SIZE + 'px';
    container.style.height = CONTOUR_TEXTURE_SIZE + 'px';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    let contourMap = null;
    let settled = false;
    let timeoutId = null;

    function cleanup(texture) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (contourMap) contourMap.remove();
      container.remove();
      resolve(texture || null);
    }

    try {
      contourMap = new maplibregl.Map({
        container,
        style: buildContourStyle(),
        interactive: false,
        attributionControl: false,
        preserveDrawingBuffer: true,
        fadeDuration: 0,
        pixelRatio: 1,
      });

      timeoutId = window.setTimeout(() => cleanup(null), CONTOUR_TEXTURE_TIMEOUT_MS);
      contourMap.on('load', () => {
        contourMap.fitBounds(
          [[bounds.west, bounds.south], [bounds.east, bounds.north]],
          { padding: 0, duration: 0 }
        );
        // Primary: full idle means both contour and hillshade tiles rendered.
        contourMap.once('idle', () => cleanup(snapshotMapCanvas(contourMap, CONTOUR_TEXTURE_SIZE)));
        // Fallback: snapshot as soon as contour tiles are ready without waiting for any slow source.
        const onSourceData = (e) => {
          if (e.sourceId === 'contours' && e.isSourceLoaded) {
            contourMap.off('sourcedata', onSourceData);
            window.requestAnimationFrame(() => cleanup(snapshotMapCanvas(contourMap, CONTOUR_TEXTURE_SIZE)));
          }
        };
        contourMap.on('sourcedata', onSourceData);
      });
    } catch (_) {
      cleanup(null);
    }
  });
}

function setStatus(msg, variant) {
  const el = document.getElementById('satellite-three-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'satellite-status' + (variant ? ' satellite-status--' + variant : '');
  if (variant === 'loading') {
    el.setAttribute('aria-label', 'Loading');
  } else {
    el.removeAttribute('aria-label');
  }
}

function setSurfacePlaceholder(msg) {
  const wrap = document.getElementById('satellite-three-surface-wrap');
  const placeholder = wrap ? wrap.querySelector('.satellite-surface-placeholder') : null;
  if (wrap) wrap.classList.remove('has-surface');
  if (placeholder) placeholder.textContent = msg;
}

function updateAnalysisButtonLabel(liveAllowed) {
  if (!btnEl) return;
  const rendered = stageEl && stageEl.dataset.view === 'rendered';
  if (rendered) {
    btnEl.textContent = 'New viewport';
    return;
  }
  btnEl.textContent = liveAllowed === false ? 'Zoom in' : 'Analyse viewport →';
}

function resetAnalysisButton() {
  if (btnEl) {
    btnEl.disabled = false;
    updateAnalysisButtonLabel();
  }
  busy = false;
}

function resetToSelection() {
  setViewerMode('selecting');
  setStatus('', null);
  const sceneMetaWrap = document.querySelector('.satellite-three-scene-meta');
  if (sceneMetaWrap) sceneMetaWrap.hidden = true;
  if (terrainSwitchEl) terrainSwitchEl.hidden = true;
}

function setViewerMode(mode) {
  if (!stageEl) return;
  stageEl.dataset.view = mode;
  updateAnalysisButtonLabel();
  const guideEl = document.getElementById('satellite-three-index-guide');
  if (guideEl) guideEl.hidden = mode !== 'rendered';
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
  const sceneMetaWrap = sceneEl.closest('.satellite-three-scene-meta');
  if (sceneMetaWrap) sceneMetaWrap.hidden = false;

  const validPixelText = sceneData && isFiniteNumber(sceneData.validPixelPct)
    ? ' / valid pixels ' + Math.round(sceneData.validPixelPct) + '%'
    : '';
  const sourceText = sceneData
    ? 'most recent valid biomass map / ' + sceneData.date + ' / cloud ' + Math.round(sceneData.cloudCover) + '%' + validPixelText
    : 'fixture fallback / ' + (date || getAnalysisDate()) + (fallbackReason ? ' / ' + fallbackReason : '');

  sceneEl.textContent = '';
  const value = document.createElement('span');
  value.className = 'satellite-receipt-value' + (sceneData ? '' : ' satellite-receipt-value--demo');
  value.textContent = sourceText;
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
  updateAnalysisButtonLabel(liveAllowed);
  btnEl.disabled = busy || !liveAllowed;
  btnEl.setAttribute('aria-disabled', String(!liveAllowed));
}

function colorForIndex(value, def) {
  const t = clamp((value - def.displayMin) / (def.displayMax - def.displayMin), 0, 1);
  const stops = def.colorStops;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i].t) {
      const localT = (t - stops[i - 1].t) / (stops[i].t - stops[i - 1].t || 1);
      return stops[i - 1].color.clone().lerp(stops[i].color, localT);
    }
  }
  return stops[stops.length - 1].color.clone();
}

function decodeIndexPng(base64, encMin, encMax) {
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
      for (let r = 0; r < img.height; r++) {
        const row = [];
        for (let c = 0; c < img.width; c++) {
          const pixelIndex = (r * img.width + c) * 4;
          const byte = pixels[pixelIndex];
          const alpha = pixels[pixelIndex + 3];
          if (alpha === 0) { row.push(null); continue; }
          const val = byte / 255 * (encMax - encMin) + encMin;
          row.push(Math.round(clamp(val, encMin, encMax) * 1000) / 1000);
        }
        grid.push(row);
      }
      resolve(grid.reverse());
    };
    img.onerror = reject;
    img.src = 'data:image/png;base64,' + base64;
  });
}

function buildTerrainGeometry(grid, metrics, heightScale, surfaceOffset, colorFn, heightFn) {
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
      const y = isFiniteNumber(value) ? heightFn(value) : NDVI_BASE_PLANE_Z * heightScale;
      const color = isFiniteNumber(value) ? colorFn(value) : new THREE.Color('#C4BAB0');
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

function updateTerrainContextVisibility() {
  const terrainActive = baseContextMode === 'terrain';
  if (!terrainSwitchEl) return;
  terrainSwitchEl.setAttribute('aria-pressed', String(terrainActive));
  terrainSwitchEl.disabled = !lastBaseTextures.terrain;
}

function applyBaseContextMode(mode) {
  const requestedMode = mode === 'terrain' && lastBaseTextures.terrain ? 'terrain' : 'satellite';
  baseContextMode = requestedMode;
  if (terrainSwitchEl) terrainSwitchEl.hidden = !lastBaseTextures.satellite && !lastBaseTextures.terrain;
  if (!baseMesh || !baseMesh.material) {
    updateTerrainContextVisibility();
    return;
  }
  const nextTexture = requestedMode === 'terrain' ? lastBaseTextures.terrain : lastBaseTextures.satellite;
  if (nextTexture) {
    baseMesh.material.map = nextTexture;
    baseMesh.material.color.set('#ffffff');
    baseMesh.material.opacity = 0.95;
  } else {
    baseMesh.material.map = null;
    baseMesh.material.color.set(requestedMode === 'terrain' ? '#FAFCFF' : '#C4BAB0');
    baseMesh.material.opacity = requestedMode === 'terrain' ? 0.96 : 0.5;
  }
  baseMesh.material.needsUpdate = true;
  updateTerrainContextVisibility();
  renderOnce();
}

function clearSceneMeshes() {
  for (const mesh of [terrainMesh, baseMesh]) {
    if (!mesh) continue;
    scene.remove(mesh);
    mesh.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
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

async function renderThreeSurface(grid, metrics, bounds, colorFn, heightFn) {
  if (!renderer && !initThreeScene()) {
    throw new Error('Three.js surface unavailable');
  }

  const wrap = document.getElementById('satellite-three-surface-wrap');
  let satelliteTexture = null;
  let contourTexture = null;
  try {
    const results = await Promise.allSettled([
      loadSatelliteBaseTexture(bounds),
      loadContourBaseTexture(bounds),
    ]);
    satelliteTexture = results[0].status === 'fulfilled' ? results[0].value : null;
    contourTexture = results[1].status === 'fulfilled' ? results[1].value : null;
  } catch (_) {
    satelliteTexture = null;
    contourTexture = null;
  }
  lastBaseTextures.satellite?.dispose();
  lastBaseTextures.terrain?.dispose();
  lastBaseTextures = {
    satellite: satelliteTexture,
    terrain: contourTexture,
  };

  clearSceneMeshes();

  const width = metrics.widthKm * 1000;
  const depth = metrics.heightKm * 1000;
  const span = Math.max(width, depth);
  const heightScale = span * 0.4;
  const surfaceOffset = span * 0.02;
  const baseGeometry = new THREE.PlaneGeometry(width, depth);
  const baseMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });
  baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
  baseMesh.rotation.x = Math.PI / 2;
  lastBasePlaneY = NDVI_BASE_PLANE_Z * heightScale;
  baseMesh.position.y = lastBasePlaneY;
  baseMesh.visible = true;
  scene.add(baseMesh);
  if (terrainSwitchEl) terrainSwitchEl.hidden = false;
  applyBaseContextMode(baseContextMode);

  const terrainGeometry = buildTerrainGeometry(grid, metrics, heightScale, surfaceOffset, colorFn, heightFn);
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
  return Boolean(lastBaseTextures.satellite);
}

function updateIndexLegend(def) {
  const labelEl = document.getElementById('satellite-three-legend-label');
  const rampEl = document.getElementById('satellite-three-legend-ramp');
  const scaleEl = document.getElementById('satellite-three-legend-scale');
  if (labelEl) labelEl.textContent = def.label;
  if (rampEl) {
    const stops = def.colorStops.map(s => '#' + s.color.getHexString() + ' ' + Math.round(s.t * 100) + '%').join(', ');
    rampEl.style.background = 'linear-gradient(to top, ' + stops + ')';
  }
  if (scaleEl) {
    const lo = def.displayMin;
    const hi = def.displayMax;
    const mid = Math.round((lo + hi) / 2 * 10) / 10;
    const spans = scaleEl.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = lo;
    if (spans[1]) spans[1].textContent = mid;
    if (spans[2]) spans[2].textContent = '+' + hi;
  }
}

function updateIndexGuide(indexId) {
  const guideEl = document.getElementById('satellite-three-index-guide');
  if (!guideEl) return;
  guideEl.querySelectorAll('.satellite-three-index-link').forEach(link => {
    link.classList.toggle('satellite-three-index-link--active', link.dataset.index === indexId);
  });
  guideEl.querySelectorAll('.satellite-three-index-note').forEach(note => {
    note.classList.toggle('satellite-three-index-note--active', note.dataset.indexNote === indexId);
  });
}

async function rebuildTerrain(indexId) {
  if (!lastMetrics || !lastIndexGrids[indexId]) return;
  const def = INDEX_DEFS.find(d => d.id === indexId);
  if (!def) return;
  activeIndexId = indexId;

  if (terrainMesh) {
    scene.remove(terrainMesh);
    terrainMesh.geometry.dispose();
    terrainMesh.material.dispose();
    terrainMesh = null;
  }

  const width = lastMetrics.widthKm * 1000;
  const depth = lastMetrics.heightKm * 1000;
  const span = Math.max(width, depth);
  const heightScale = span * 0.4;
  const surfaceOffset = span * 0.02;
  const colorFn = v => colorForIndex(v, def);
  const heightFn = v => {
    const t = clamp((v - def.displayMin) / (def.displayMax - def.displayMin), 0, 1);
    return (t * 2 - 1) * heightScale + surfaceOffset;
  };
  const renderGrid = smoothNdviGridForRender(lastIndexGrids[indexId], NDVI_RENDER_SMOOTHING_PASSES);
  const terrainGeometry = buildTerrainGeometry(renderGrid, lastMetrics, heightScale, surfaceOffset, colorFn, heightFn);
  const terrainMaterial = new THREE.MeshPhongMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    shininess: 8,
    side: THREE.DoubleSide,
  });
  terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
  scene.add(terrainMesh);
  updateIndexGuide(indexId);
  updateIndexLegend(def);
  renderOnce(true);
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

    setStatus('', 'loading');
    let sceneData = null;
    let fallbackReason = '';
    const rawIndexGrids = {};

    if (isWorkerKeyConfigured()) {
      try {
        const payload = JSON.stringify({ bounds, date, width: gridSize, height: gridSize });
        const headers = { 'Content-Type': 'application/json', 'X-API-Key': WORKER_API_KEY };
        const analysisRes = await fetch(WORKER_URL + '/analysis', { method: 'POST', headers, body: payload });

        if (analysisRes.ok) {
          const data = await analysisRes.json();
          rawIndexGrids['ndvi'] = await decodeNdviPng(data.ndvi);
          sceneData = data.scene;
          for (const def of INDEX_DEFS) {
            if (def.id === 'ndvi') continue;
            if (data.indices && data.indices[def.id]) {
              rawIndexGrids[def.id] = await decodeIndexPng(data.indices[def.id], def.encMin, def.encMax);
            }
          }
        } else {
          fallbackReason = 'Worker HTTP ' + analysisRes.status;
        }
      } catch (_) {
        fallbackReason = 'Worker request failed';
      }
    } else {
      fallbackReason = 'live imagery unavailable';
    }

    await new Promise(resolve => setTimeout(resolve, 0));
    for (const def of INDEX_DEFS) {
      if (!rawIndexGrids[def.id]) {
        rawIndexGrids[def.id] = def.generate(bounds, gridSize);
      }
    }

    lastIndexGrids = rawIndexGrids;
    lastMetrics = metrics;
    activeIndexId = 'ndvi';

    const activeDef = INDEX_DEFS[0];
    const colorFn = v => colorForIndex(v, activeDef);
    const span = Math.max(metrics.widthKm * 1000, metrics.heightKm * 1000);
    const heightScale = span * 0.4;
    const surfaceOffset = span * 0.02;
    const heightFn = v => {
      const t = clamp((v - activeDef.displayMin) / (activeDef.displayMax - activeDef.displayMin), 0, 1);
      return (t * 2 - 1) * heightScale + surfaceOffset;
    };
    const renderGrid = smoothNdviGridForRender(rawIndexGrids['ndvi'], NDVI_RENDER_SMOOTHING_PASSES);
    const textureLoaded = await renderThreeSurface(renderGrid, metrics, bounds, colorFn, heightFn);
    lastBounds = bounds;
    lastDate = date;
    lastScene = sceneData;
    lastTextureLoaded = textureLoaded;
    lastFallbackReason = fallbackReason;
    setMeta(date, sceneData, textureLoaded, fallbackReason);
    updateIndexGuide('ndvi');
    updateIndexLegend(activeDef);
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
  terrainSwitchEl = document.getElementById('satellite-three-terrain-switch');
  viewportReadoutEl = document.getElementById('satellite-three-viewport-readout');
  stageEl = document.getElementById('satellite-three-stage');
  northEl = document.getElementById('satellite-three-north');

  if (!btnEl || !terrainSwitchEl || !viewportReadoutEl || !stageEl) return;

  baseContextMode = terrainSwitchEl.getAttribute('aria-pressed') === 'true' ? 'terrain' : 'satellite';

  if (!canUseMapLibre()) {
    const mapEl = document.getElementById('satellite-three-map');
    if (mapEl) {
      mapEl.classList.add('satellite-map-fallback');
      mapEl.textContent = 'Map unavailable';
    }
    btnEl.disabled = true;
    terrainSwitchEl.disabled = true;
    setStatus('Map library unavailable · refresh and try again', 'error');
    return;
  }

  map = new maplibregl.Map({
    container: 'satellite-three-map',
    style: 'https://api.maptiler.com/maps/hybrid/style.json?key=' + MAPTILER_API_KEY,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  map.on('load', updateViewportReadout);
  map.on('move', updateViewportReadout);
  updateViewportReadout();

  terrainSwitchEl.addEventListener('click', () => {
    const nextMode = terrainSwitchEl.getAttribute('aria-pressed') === 'true' ? 'satellite' : 'terrain';
    applyBaseContextMode(nextMode);
  });

  btnEl.addEventListener('click', () => {
    if (stageEl && stageEl.dataset.view === 'rendered') {
      resetToSelection();
    } else {
      runAnalysis();
    }
  });

  const guideEl = document.getElementById('satellite-three-index-guide');
  if (guideEl) {
    guideEl.addEventListener('click', e => {
      const link = e.target.closest('[data-index]');
      if (!link) return;
      e.preventDefault();
      rebuildTerrain(link.dataset.index);
      if (stageEl) stageEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }

}

document.addEventListener('DOMContentLoaded', initMap);
