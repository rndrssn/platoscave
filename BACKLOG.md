# Backlog

Pending items that are worth preserving but are not part of the active implementation slice.

## Cases / Satellite Index

- Pending: Collapse the public Worker fan-out into a single `/analysis` endpoint.
  - Replace browser-side parallel calls to `/ndvi`, `/image`, `/ndre`, `/ndwi`, `/ndmi`, `/evi`, `/savi`, and `/cire` with one frontend request.
  - Worker should return scene metadata, RGB base imagery, NDVI, and the six additional index grids as one coherent bundle.
  - Preferred later version: fetch the needed Sentinel-2 source bands in fewer upstream calls, then derive all indices Worker-side from the shared band set.
  - Motivation: simpler throttling, one cache key per viewport/date/grid request, cleaner failure handling, and lower risk of consuming Sentinel Hub request quota during traffic spikes.
