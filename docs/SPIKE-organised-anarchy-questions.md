---
id: SPIKE-organised-anarchy-questions
type: SPIKE
title: Organised Anarchy — Question Design
status: VALIDATED
created: 2026-03-13
updated: 2026-03-13
owner: Robert Andersson
relates_to: [SPIKE-organised-anarchy-sim, VISION-product]
tags: [garbage-can, questions, scoring, content]
---

# Organised Anarchy — Question Design

## Dependency

**Requires `SPIKE-organised-anarchy-sim` — VALIDATED.**

No code required for this spike. The output is a written specification document.

---

## Purpose

Design the questions a visitor answers and define precisely how each answer maps to the three simulation parameters. This is intellectual and design work — not coding. The output must be specific enough that a developer (or Claude Code) can implement the scoring in the next spike without ambiguity.

---

## The Three Parameters to Score Into

| Parameter | Values | What it represents |
|-----------|--------|--------------------|
| `energyLoad` | `light` / `moderate` / `heavy` | Total problem-energy relative to organisational capacity |
| `decisionStructure` | `unsegmented` / `hierarchical` / `specialized` | Who can attend which choice opportunities |
| `accessStructure` | `unsegmented` / `hierarchical` / `specialized` | Which problems reach which choice opportunities |

---

## What to Produce

A markdown document: `docs/SPEC-organised-anarchy-questions.md`

It must contain:

### 1. The questions (8–12 total)
Each question is a statement the visitor rates on a 1–5 scale. The language must feel like a thoughtful colleague asking — not a corporate survey. Plain, direct, a little uncomfortable if the answer is honest.

Question areas to cover:
- Clarity and consistency of organisational goals → `energyLoad` (problematic preferences)
- How well understood are internal processes → `energyLoad` (unclear technology)
- Consistency of who attends and participates in decisions → `energyLoad` (fluid participation)
- Whether decision forums match the problems brought to them → `accessStructure`
- Whether seniority or role determines access to decisions → `decisionStructure`

### 2. The scoring logic
For each question, specify:
- Which parameter it scores into
- How a low answer (1–2) vs high answer (4–5) moves that parameter
- Whether the question is inverted (high score = low anarchy, or vice versa)

### 3. The parameter derivation rules
How raw scores aggregate into final parameter values. For example:
- Sum of questions 1–4 → `energyLoad` threshold (below X = light, X–Y = moderate, above Y = heavy)
- Pattern of answers to questions 5–8 → `decisionStructure` category

### 4. Archetype validation
Define three organisation archetypes and predict what parameters they should produce:
- A university department → high anarchy, unsegmented, heavy load
- A small product startup → moderate anarchy, unsegmented, moderate load
- A traditional manufacturing firm → low anarchy, hierarchical, light-moderate load

These become the test cases for `SPIKE-organised-anarchy-scoring`.

---

## Success Criteria

This spike is **VALIDATED** if:

- [ ] 8–12 questions are written and feel human, not corporate
- [ ] Every question has a clear, unambiguous scoring rule
- [ ] The three archetypes produce the predicted parameter sets when scored manually
- [ ] The spec is precise enough to implement without further clarification

This spike is **ABANDONED** if:

- The questions cannot be made to feel natural without losing precision
- The scoring logic produces indistinguishable results across different org types

---

## Out of Scope

- Any code or implementation
- UI or form design
- Diagnosis text

---

## Branch

All work on `experiment/organised-anarchy-mapper`. No new branch needed.

---

## Next Spike

When validated, hand the spec to `SPIKE-organised-anarchy-scoring` for implementation.
