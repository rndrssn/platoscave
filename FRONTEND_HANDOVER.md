# Frontend Handover — Boundary-free Monitoring

## Current Status

The Boundary-free monitoring frontend is already integrated with the deployed `satellite-worker` Cloudflare Worker. Treat this file as an operational handover for maintaining the integration, not as a pending integration brief.

Live frontend paths:
- Overview: `modules/satellite-index/`
- Explorer: `modules/satellite-index/three/`
- Archived Plotly demo: `modules/satellite-index/demo/`

Worker:
- URL: `https://satellite-worker.platoscave.workers.dev`
- Source project: separate repository/project named `satellite-worker`
- Browser authentication: `X-API-Key: WORKER_API_KEY`

## Architecture Overview

```
Browser (GitHub Pages: rndrssn.github.io)
    │  POST /analysis
    │  X-API-Key: <build-time injected key>
    ▼
Cloudflare Worker (satellite-worker)
    │  OAuth2 client_credentials token (cached per isolate)
    │  Sentinel Hub catalog/process requests
    ▼
Copernicus Sentinel Hub API (sh.dataspace.copernicus.eu)
    │  Sentinel-2 L2A imagery
    ▼
Worker returns encoded spectral-index PNGs, RGB image PNG, and scene metadata
```

Map context in the Explorer uses MapTiler client-side tiles:
- Satellite basemap: MapTiler `satellite-v2`
- Terrain context: MapTiler `contours-v2`, rendered by MapLibre into a clean contour texture

The MapTiler key is client-side, domain-restricted, and safe to commit. The Worker API key is not committed.

## Why a Worker

- Sentinel Hub credentials (`SENTINEL_CLIENT_ID` / `SENTINEL_CLIENT_SECRET`) are billable backend credentials and must stay server-side.
- The Worker enforces a frontend API key through `X-API-Key`.
- CORS and request validation are centralized at the Worker boundary.
- The frontend can stay a static GitHub Pages site.

## Authentication and Secret Injection

Source files must keep:

```js
const WORKER_API_KEY = '__WORKER_API_KEY__';
```

The GitHub Pages deploy workflow injects the real key from the `WORKER_API_KEY` GitHub Actions secret before uploading the Pages artifact:

- `.github/workflows/deploy.yml`
- `modules/satellite-index/demo/satellite-index.js`
- `modules/satellite-index/three/satellite-index-three.js`

For local testing:

```bash
scripts/dev-satellite.sh inject
```

This reads `WORKER_API_KEY=<value>` from `.env` and substitutes the placeholder locally. Restore before committing:

```bash
scripts/dev-satellite.sh restore
```

`scripts/release-all.sh` runs the restore step before tests and commit staging.

## Endpoint Used by the Frontend

### `POST /analysis`

All live frontend analysis requests use the combined endpoint. Do not reintroduce browser fan-out to `/ndvi`, `/image`, or per-index endpoints.

Request:

```json
{
  "bounds": { "west": 18.0, "south": 59.0, "east": 18.1, "north": 59.1 },
  "date": "2026-05-24",
  "width": 256,
  "height": 256
}
```

Response shape expected by the frontend:

```json
{
  "ndvi": "<base64 NDVI PNG>",
  "indices": {
    "ndre": "<base64 NDRE PNG>",
    "ndwi": "<base64 NDWI PNG>",
    "ndmi": "<base64 NDMI PNG>",
    "evi": "<base64 EVI PNG>",
    "savi": "<base64 SAVI PNG>",
    "cire": "<base64 CIre PNG>"
  },
  "image": "<base64 RGB PNG>",
  "scene": { "id": "...", "date": "...", "cloudCover": 3.2 },
  "timings": {}
}
```

The frontend decodes index PNGs by the encoding range stored in each local `INDEX_DEFS` entry and applies its own color ramps and height mapping. Transparent PNG pixels are treated as masked gaps.

## Frontend Request Guards

Live Worker calls are viewport-area guarded:
- Maximum live viewport: `MAX_LIVE_VIEWPORT_AREA_KM2 = 2` (200 hectares)
- At or below 10 hectares: request grid size 512
- Above 10 and up to 200 hectares: request grid size 256
- Above 200 hectares: the primary action switches to zoom-in state and no Worker request is made

The fallback procedural fixture preserves the interaction model when live imagery is unavailable. It is not real crop data.

## Validation and Contracts

Relevant files:
- `modules/satellite-index/three/satellite-index-three.js`
- `modules/satellite-index/demo/satellite-index.js`
- `modules/satellite-index/three/index.html`
- `css/pages/satellite-index.css`
- `tests/test-satellite-index-contract.js`

Run:

```bash
node tests/test-satellite-index-contract.js
node tests/run-all.js
```

Key invariants:
- `WORKER_API_KEY` remains the placeholder in source.
- Worker requests include `X-API-Key`.
- Frontend fetches `/analysis`, not separate `/ndvi` or `/image`.
- Explorer primary button reads `Analyse viewport ->` before analysis and `New viewport` after rendering.
- Explorer terrain context is a Basemap/Terrain switch; Terrain uses MapTiler `contours-v2` isolines rendered into a clean base texture, not shaded Terrain RGB imagery.
