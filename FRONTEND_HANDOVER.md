# Frontend Handover — satellite-worker API

## Architecture overview

```
Browser (GitHub Pages: rndrssn.github.io)
    │  POST /ndvi, /image, etc.
    │  X-API-Key: <secret>
    ▼
Cloudflare Worker (satellite-worker)
    │  OAuth2 client_credentials token (cached per isolate)
    │  POST /process or /catalog
    ▼
Copernicus Sentinel Hub API (sh.dataspace.copernicus.eu)
    │  Sentinel-2 L2A satellite imagery
    ▼
Worker returns base64-encoded PNG + scene metadata
```

**Why a worker instead of calling Sentinel Hub directly from the browser?**
- Sentinel Hub credentials (`SENTINEL_CLIENT_ID` / `SENTINEL_CLIENT_SECRET`) must stay server-side — they are billable API credentials
- The worker also enforces its own `X-API-Key` auth so only the known frontend can trigger Sentinel Hub requests
- CORS is handled centrally in the worker

**What is Sentinel-2?**
Sentinel-2 is an ESA satellite constellation that images the Earth's land surface every 5 days at 10–20 m resolution. The worker queries for the least-cloudy scene within a configurable date window, then requests a processed image tile for a geographic bounding box.

**What are the spectral indices?**
The index endpoints (NDVI, NDRE, NDWI, NDMI, EVI, SAVI, CIre) compute band-ratio formulas over the raw satellite reflectance data. Each result is a greyscale PNG where each pixel byte encodes the index value linearly over a fixed range — see the decoding table below. The frontend is responsible for applying a colour map to make the values visually meaningful.

## Context

This is a Cloudflare Worker that proxies Sentinel-2 satellite imagery from the Copernicus Sentinel Hub API. The frontend is a static site hosted on GitHub Pages at `https://rndrssn.github.io`. Your job is to integrate the frontend with this worker API.

## Worker URL

The worker is deployed at:
```
https://satellite-worker.<robert-subdomain>.workers.dev
```
Confirm the exact URL from the Cloudflare dashboard (Workers & Pages → satellite-worker → the URL shown at the top).

## Authentication

Every request (except `/health`) must include:
```
X-API-Key: <API_KEY>
```
Robert has the API_KEY value. It should be stored as an environment variable or build-time secret in the frontend — **never hardcoded in source**.

## Endpoints

All data endpoints are `POST` with `Content-Type: application/json`.

---

### `GET /health`
No auth required. Returns `{ ok: true, ts: <unix ms> }`. Use for connectivity checks.

---

### `POST /scene`
Find the best (lowest cloud cover) Sentinel-2 scene for an area and date.

**Request:**
```json
{
  "bounds": { "west": 18.0, "south": 59.0, "east": 18.1, "north": 59.1 },
  "date": "2024-06-01",
  "windowDays": 14
}
```
- `bounds`: geographic bounding box (longitude/latitude, WGS84)
- `date`: target date in `YYYY-MM-DD`
- `windowDays`: how many days before `date` to search (default 14, max 90)

**Response:**
```json
{
  "scene": {
    "id": "S2B_...",
    "date": "2024-05-28",
    "cloudCover": 3.2,
    "constellation": "sentinel-2"
  }
}
```
`scene` is `null` if nothing was found.

---

### `POST /ndvi` — Normalised Difference Vegetation Index
### `POST /ndre` — Normalised Difference Red Edge
### `POST /ndwi` — Normalised Difference Water Index
### `POST /ndmi` — Normalised Difference Moisture Index
### `POST /evi`  — Enhanced Vegetation Index
### `POST /savi` — Soil-Adjusted Vegetation Index
### `POST /cire` — Chlorophyll Index Red Edge
### `POST /image` — True-colour RGB

All index and image endpoints share the same request shape:
```json
{
  "bounds": { "west": 18.0, "south": 59.0, "east": 18.1, "north": 59.1 },
  "date": "2024-06-01",
  "width": 256,
  "height": 256
}
```
- `width` / `height`: output image size in pixels (default 256, max 2048)
- The worker picks the best scene within a 14-day window before `date`

**Response:**
```json
{
  "png": "<base64-encoded PNG string>",
  "scene": { "id": "...", "date": "...", "cloudCover": 3.2, "constellation": "sentinel-2" }
}
```
Render with: `<img src="data:image/png;base64,${png}" />`

---

## Pixel value decoding (index endpoints)

The index PNGs are single-band UINT8. Each pixel byte encodes the real index value using a fixed linear range per index. To decode:

```
realValue = (byte / 255) * (encMax - encMin) + encMin
```

| Endpoint | encMin | encMax |
|----------|--------|--------|
| /ndvi    | -1     | 1      |
| /ndre    | -1     | 1      |
| /ndwi    | -1     | 1      |
| /ndmi    | -1     | 1      |
| /evi     | -0.2   | 1      |
| /savi    | -1     | 1      |
| /cire    | 0      | 3      |

The `/image` endpoint returns a standard 3-band RGB PNG — no decoding needed.

---

## Validation rules (enforce on the frontend to avoid 400s)

- `bounds`: all four values must be numbers; `west < east`; `south < north`; longitude in [-180, 180]; latitude in [-90, 90]
- `date`: must match `YYYY-MM-DD` and be a real calendar date
- `width` / `height`: positive integers, max 2048
- `windowDays`: positive integer, max 90

---

## Error responses

```json
{ "error": "message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (invalid bounds, date, or JSON) |
| 401 | Missing or wrong X-API-Key |
| 404 | No scene found for area/date |
| 500 | Internal server error |

---

## CORS

The worker allows requests from `https://rndrssn.github.io` in production. Localhost origins (`localhost:3000`, `localhost:5500`, `localhost:8080`, `127.0.0.1:5500`, `127.0.0.1:8080`) are allowed in the dev/staging deployment. No changes needed to the worker for standard browser fetches from the GitHub Pages origin.
