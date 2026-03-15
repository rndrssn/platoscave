---
id: SPIKE-organised-anarchy-scoring
type: SPIKE
title: Organised Anarchy — Scoring Implementation
status: VALIDATED
created: 2026-03-13
updated: 2026-03-15
owner: Robert Andersson
relates_to: [SPIKE-organised-anarchy-questions, SPIKE-organised-anarchy-sim]
tags: [garbage-can, scoring, javascript]
---

# Organised Anarchy — Scoring Implementation

## Dependency

**Requires `SPIKE-organised-anarchy-questions` — VALIDATED.**

The scoring spec from that spike is the sole input to this one. Do not begin until the spec document `docs/SPEC-organised-anarchy-questions.md` exists and is complete.

---

## Purpose

Implement the scoring logic from the question spec as a JavaScript function. Validate that different organisation archetypes produce meaningfully different parameter sets when scored.

---

## What to Build

A single file: `gc-scoring.js`

It must expose one function:

```js
scoreResponses(responses)
```

Where `responses` is an array of integers (1–5), one per question in the order defined in the spec. Returns:

```js
{
  energyLoad:        'light' | 'moderate' | 'heavy',
  decisionStructure: 'unsegmented' | 'hierarchical' | 'specialized',
  accessStructure:   'unsegmented' | 'hierarchical' | 'specialized',
  raw: {
    energyScore:    Number,  // intermediate score before thresholding
    decisionScore:  Number,
    accessScore:    Number,
  }
}
```

The `raw` scores are included for the positioning diagram in a later spike — they allow continuous positioning rather than snapping to three discrete values.

---

## Validation Approach

Using the three archetypes defined in the question spec, manually construct their expected response arrays and run them through `scoreResponses()`. Confirm output matches the predicted parameters.

A small test script `tests/test-gc-scoring.js` should run in Node:

```bash
node tests/test-gc-scoring.js
```

And print PASS/FAIL for each archetype.

---

## Success Criteria

This spike is **VALIDATED** if:

- [x] `gc-scoring.js` runs without errors
- [x] University archetype → heavy load, unsegmented structures
- [x] Startup archetype → moderate load, unsegmented structures
- [x] Traditional manufacturer → light/moderate load, hierarchical structures
- [x] `raw` scores vary continuously and meaningfully between archetypes

This spike is **ABANDONED** if:

- Different org types collapse to the same parameter set
- The scoring logic requires so many edge cases it becomes unmaintainable

---

## Out of Scope

- Any UI or form rendering
- Visualization
- Diagnosis text

---

## Branch

All work on `experiment/organised-anarchy-mapper`.

---

## Next Spike

When validated, `gc-scoring.js` feeds into `SPIKE-organised-anarchy-mapper` (integration). The `raw` scores feed into `SPIKE-organised-anarchy-viz` (positioning diagram).
