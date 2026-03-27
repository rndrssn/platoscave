---
title: Pages and Navigation
slug: pages-and-navigation
date: 2026-03-27
status: draft
summary: High-level map of the page structure and shared navigation behavior.
tags:
  - architecture
  - navigation
related_modules:
  - 03-garbage-can
  - 05-experience-skill-graph
---

# Pages and Navigation

This note explains where the main pages live and what is shared across them.

Back to: [[architecture-overview]]

## Main page groups

- `index.html` About / home
- `modules/` interactive modules
- `notes/` generated notes index and detail pages
- `tags/` generated tag index and tag pages
- `colophon/` site notes

## Shared shell pattern

Most pages include the same top-level pattern:
- top navigation bar
- main content area
- footer
- `js/nav-controller.js` for mobile nav behavior (and global footer social links)

## Page map

```mermaid
flowchart LR
  A[index.html About] --> B[notes/index.html]
  A --> C[modules/index.html]
  A --> D[colophon/index.html]
  C --> E[module 03 garbage can]
  C --> F[module 05 experience-skill-graph]
  F --> G[module 05.02 CV]
  B --> H[notes/<slug>/index.html]
  B --> I[tags/index.html]
  I --> J[tags/<tag>/index.html]
```

## Important implementation detail

Some pages are generated (notes/tags) while others are hand-authored (modules/home/colophon). This mixed model is intentional and keeps authored content flexible.
