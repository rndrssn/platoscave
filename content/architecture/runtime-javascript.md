---
title: Runtime JavaScript Map
slug: runtime-javascript
date: 2026-03-27
status: draft
summary: Plain-language map of shared JavaScript and module-specific JavaScript runtime pieces.
tags:
  - architecture
  - javascript
related_modules:
  - 03-garbage-can
  - 05-experience-skill-graph
---

# Runtime JavaScript Map

Back to: [[architecture-overview]]

## Shared runtime scripts

- `js/theme-bootstrap.js` applies the selected theme early.
- `js/nav-controller.js` handles mobile nav and site-wide footer social links.
- `js/doodle-background.js` adds decorative background doodles on selected pages.

## Module 03 runtime (Garbage Can)

Core model and visualization logic live in `modules/garbage-can/runtime/`:
- `modules/garbage-can/runtime/gc-simulation-config.js`
- `modules/garbage-can/runtime/gc-simulation-core.js`
- `modules/garbage-can/runtime/gc-simulation.js`
- `modules/garbage-can/runtime/gc-scoring.js`
- `modules/garbage-can/runtime/gc-diagnosis.js`
- `modules/garbage-can/runtime/gc-viz-config.js`
- `modules/garbage-can/runtime/gc-viz-timing.js`
- `modules/garbage-can/runtime/gc-viz-helpers.js`
- `modules/garbage-can/runtime/gc-viz.js`
- `modules/garbage-can/runtime/gc-pressure-narrative.js`

Module-specific wiring:
- `modules/garbage-can/explorer/explorer.js`
- `modules/garbage-can/assess/assess.js`
- `modules/garbage-can/can-explainer/can-explainer.js`

## Module 05 runtime (Experience-Skill Graph)

- `modules/experience-skill-graph/index.html` hosts the D3 force graph.
- `modules/experience-skill-graph/graph-data-loader.js` loads and parses graph CMS markdown.

## Runtime relationship map

```mermaid
flowchart TD
  A[Browser Loads Page] --> B[Shared JS]
  B --> C[Theme]
  B --> D[Navigation + Footer Actions]
  B --> E[Doodle Background]

  A --> F[Module 03 Page]
  F --> G[GC Model JS]
  F --> H[Explorer/Assess/Explainer Wiring]

  A --> I[Module 05 Page]
  I --> J[Graph Data Loader]
  J --> K[D3 Graph Rendering]
```
