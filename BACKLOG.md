# Backlog

Pending items that are worth preserving but are not part of the active implementation slice.

## Cases / Satellite Index

- Pending: Reduce upstream Sentinel Hub calls behind the `/analysis` endpoint.
  - The public browser fan-out has been collapsed into one Worker `/analysis` request.
  - Preferred later version: fetch the needed Sentinel-2 source bands in fewer upstream calls, then derive all indices Worker-side from the shared band set.
  - Motivation: lower Sentinel Hub request usage, fewer upstream round trips, one cache key per viewport/date/grid request, and lower risk of consuming Sentinel Hub quota during traffic spikes.
