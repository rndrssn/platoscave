---
id: REFERENCE-gc-viz-timing
type: REFERENCE
title: GC Viz Timing Model
status: ACTIVE
created: 2026-03-20
updated: 2026-03-20
owner: Robert Andersson
relates_to: [TASK-feature-garbage-can, REFERENCE-gc-model-semantics, REFERENCE-gc-viz-typography]
tags: [gc-viz, timing, motion, ux]
load_when: [gc_feature_work]
do_not_load_when: [unrelated_tasks]
token_cost_estimate: low
---

# GC Viz Timing Model

## Purpose

Document how simulation pacing works in `gc-viz.js`, what each timing constant controls, and how to tune for usability.

## Source of truth

Timing and motion behavior is defined in `gc-viz.js`:

- `MOTION` object: per-transition animation durations and amplitudes
- `TIMING` object: per-tick pacing and pause logic
- `analyzeTickChange(...)`: event detection and tick-level flags
- `computeTickTiming(...)`: adaptive tick duration computation
- `stepTick(...)`: sequencing (legend lead, opening lead, render, next tick)

## Runtime flow

For each iteration transition (`tick N-1 -> tick N`):

1. Analyze changes:
   - choice opening/closing
   - problem entering/searching
   - flights/oversights/resolutions
   - overall change density
2. Compute adaptive `tickMs` and `motionMs`.
3. Update top legend first.
4. Wait lead delay(s): `legendLeadMs` and optional `openingLeadMs`.
5. Run D3 transitions in `renderTick(...)`.
6. Schedule next tick after `tickMs`.

## Adaptive timing model

`computeTickTiming(iterTick, analysis)` uses:

- Base phase timing:
  - `baseEarlyMs` for iterations 1-5
  - `baseMidMs` for iterations 6-10
  - `baseLateMs` for iterations 11-20
- Additive modifiers:
  - `densitySlowMs` / `densityFastMs`
  - `eventPauseMs`
  - `resolvePauseMs`
  - `enteringPauseMs`
  - `searchingPauseMs`
  - `deadTickFastMs`
- Clamp:
  - `tickMs = clamp(minTickMs, maxTickMs, adjusted)`
- Motion budget:
  - `motionMs = max(360, round(tickMs * motionFraction))`

## Current usability-biased profile (slow)

### Tick pacing (`TIMING`)

- `legendLeadMs: 220`
- `openingLeadMs: 220`
- `finalPauseMs: 1100`
- `minTickMs: 1400`
- `maxTickMs: 3600`
- `motionFraction: 0.62`
- `eventPauseMs: 460`
- `densitySlowMs: 340`
- `densityFastMs: -140`
- `deadTickFastMs: -120`
- `resolvePauseMs: 820`
- `enteringPauseMs: 360`
- `searchingPauseMs: 320`
- `baseEarlyMs: 2600`
- `baseMidMs: 2250`
- `baseLateMs: 1850`

### Motion (`MOTION`) relevant to readability

- Open cue:
  - `open.pulseMs: 400`
- Enter/search/adrift:
  - `enter.popInMs: 260`
  - `enter.searchShiftMs: 300`
  - `enter.settleMs: 520`
  - `search.driftMs: 1040`
  - `search.pulseMs: 620`
  - `adrift.swayMs: 520`
  - `adrift.pulseMs: 420`
- Migration exits:
  - `flight.ejectMs: 980`
  - `oversight.ejectMs: 980`
- Resolve:
  - `resolve.convergeMs: 520`
  - `resolve.holdMs: 170`
  - `resolve.fadeMs: 260`

## UX tuning guidance

### To slow the whole simulation

Increase:

- `baseEarlyMs`, `baseMidMs`, `baseLateMs`
- `minTickMs`
- `eventPauseMs`

Decrease:

- `motionFraction` (to leave more non-motion reading time)

### To slow migrating problems specifically

Increase:

- `search.driftMs`
- `search.pulseMs`
- `flight.ejectMs`
- `oversight.ejectMs`
- optionally `attach.pullMs`

### To make events more legible

Increase:

- `legendLeadMs`
- `openingLeadMs`
- `resolvePauseMs`
- `enteringPauseMs`
- `searchingPauseMs`

## Semantic note

Choice opportunities use state label `closed`.  
Problems use state label `resolved`.

Do not reuse `resolved` for choice-state text or logic.

## Verification checklist

After timing changes, run:

```bash
node tests/test-gc-viz-contract.js
node tests/test-gc-viz-typography-contract.js
node tests/test-assess-integration.js
node tests/test-explorer-integration.js
node tests/test-gc-summary-consistency.js
```

