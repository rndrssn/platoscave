---
id: GUIDE-getting-started
type: GUIDE
title: Getting Started
status: ACTIVE
created: 2026-03-19
updated: 2026-03-24
owner: Robert Andersson
relates_to: [GUIDE-docs-index, CORE, GUIDE-testing-and-release]
tags: [onboarding, setup, runbook]
load_when: [onboarding, new_task]
do_not_load_when: []
token_cost_estimate: low
---

# Getting Started

## Prerequisites

- Node.js

## First Commands

1. `node tests/run-all.js`
2. Optional browser smoke when Playwright is installed: `node tests/test-browser-smoke-optional.js`
3. Notes publish shortcut (from `sandbox`): `scripts/publish-note.sh -m "Publish note: <slug>"`

## Read order

1. `docs/00-core/CORE.md`
2. `docs/00-core/CORE-loading-rules.md`
3. `docs/10-guides/GUIDE-architecture.md`
4. `docs/10-guides/GUIDE-testing-and-release.md`
