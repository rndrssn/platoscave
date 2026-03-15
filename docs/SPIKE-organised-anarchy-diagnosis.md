---
id: SPIKE-organised-anarchy-diagnosis
type: SPIKE
title: Organised Anarchy — Diagnosis Text
status: DRAFT
created: 2026-03-13
updated: 2026-03-13
owner: Robert Andersson
relates_to: [SPIKE-organised-anarchy-scoring, VISION-product]
tags: [garbage-can, diagnosis, content, copy]
---

# Organised Anarchy — Diagnosis Text

## Dependency

**Requires `SPIKE-organised-anarchy-scoring` — VALIDATED.**

The parameter combinations that scoring can produce define the space of diagnoses that need to be written.

---

## Purpose

Write the interpretation text — the plain-language description a visitor receives after their organisation is scored. This is the moment of recognition the site exists to produce: a reader who works in The Mix reads their diagnosis and thinks *"yes, that is exactly what happens here."*

This spike is content and logic work. No UI, no code beyond a simple lookup structure.

---

## What to Produce

A markdown document: `docs/SPEC-organised-anarchy-diagnosis.md`

It must contain:

### 1. Diagnosis texts

One short diagnosis per meaningful parameter combination. Not all 27 permutations need unique text — some combinations are functionally similar and can share a diagnosis with minor variation.

Each diagnosis is 3–5 sentences. It must:
- Name what the organisation experiences, not what the parameters are called
- Use the language of the site — precise, direct, not self-help
- Reference at least one recognisable pattern (e.g. "solutions arrive before problems are named", "the same issues reappear in every meeting")
- Include the simulation output proportions as a single sentence: *"In organisations like yours, roughly X% of decisions are made without the underlying problem being resolved."*

### 2. The lookup structure

A JS-compatible object mapping parameter combinations to diagnosis keys:

```js
const DIAGNOSES = {
  'heavy/unsegmented/unsegmented': {
    key: 'deep-anarchy',
    title: '...',
    body: '...',
  },
  // etc.
}
```

### 3. Edge case handling

What does the visitor see if their raw scores sit exactly on a threshold? Define a tiebreaker rule.

---

## Tone Reference

From `VISION-product.md`: *"Foundational, not procedural. Philosophical, not self-help. Precise, not academic for its own sake. Willing to be direct."*

The diagnosis should not console or reassure. It should name what is happening with clarity. If an organisation is deeply anarchic, say so — and explain what that means for how decisions actually get made there.

---

## Success Criteria

This spike is **VALIDATED** if:

- [ ] All meaningful parameter combinations have a diagnosis
- [ ] Each diagnosis is 3–5 sentences and uses the correct tone
- [ ] The lookup structure is implemented and parseable as JS
- [ ] Robert reads each diagnosis and finds at least one that produces the recognition moment for an organisation he has worked in

This spike is **ABANDONED** if:

- The diagnosis text cannot avoid sounding like management consulting boilerplate
- The combinations are too similar to produce meaningfully different diagnoses

---

## Out of Scope

- Any UI rendering of the diagnosis
- Animation or visualization
- Form design

---

## Branch

All work on `experiment/organised-anarchy-mapper`.

---

## Next Spike

When validated, the diagnosis lookup feeds directly into `SPIKE-organised-anarchy-mapper` (integration).
