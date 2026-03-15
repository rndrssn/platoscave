---
id: PRINCIPLE-organised-anarchy-questions
type: PRINCIPLE
title: Organised Anarchy Mapper — Question Spec & Scoring Rules
status: ACTIVE
created: 2026-03-13
updated: 2026-03-13
owner: Robert Andersson
relates_to: [SPIKE-organised-anarchy-questions, SPIKE-organised-anarchy-scoring, VISION-product]
tags: [garbage-can, questions, scoring, diagnostic]
---

# Organised Anarchy Mapper — Question Spec & Scoring Rules

## Purpose

This document defines the questions presented to a visitor and the rules for translating their answers into the three parameters required by `runGarbageCanSimulation()`.

The questions serve two simultaneous goals:
1. **Diagnostic accuracy** — produce meaningfully different parameter sets for different organisation types
2. **Portfolio voice** — demonstrate the intellectual stance of the site; someone reading the questions should understand how Robert thinks about organisations before seeing any output

Questions satisfying only one goal are not acceptable.

---

## The Twelve Questions

Visitors rate each statement on a 1–5 scale:
`1 = Strongly disagree` / `2 = Disagree` / `3 = Neither` / `4 = Agree` / `5 = Strongly agree`

### Energy Load (Questions 1–5)
*Maps to `energyLoad` parameter — total problem-energy relative to organisational capacity*

| # | Statement |
|---|-----------|
| 1 | Your organisation's goals shift often enough that work started under one priority gets abandoned for another. |
| 2 | If you asked three colleagues how a decision typically gets made in your organisation, you would get three different answers. |
| 3 | Your organisation carries a backlog of unresolved issues that everyone knows about but no one has the mandate to close. |
| 4 | Institutional memory in your organisation lives in people's heads rather than anywhere it can be reliably accessed. |
| 5 | It is difficult to point to a decision your organisation made this year that definitively closed a problem. |

### Access Structure (Questions 6–8)
*Maps to `accessStructure` parameter — which problems reach which decision forums*

| # | Statement |
|---|-----------|
| 6 | Problems in your organisation tend to find their way to the right people and the right forum. *(inverted)* |
| 7 | In your organisation, who hears about a problem depends more on who raised it than on who should deal with it. |
| 8 | Your organisation has forums for making decisions but it is rarely clear which forum owns which type of problem. |

### Decision Structure (Questions 9–12)
*Maps to `decisionStructure` parameter — who gets access to which choice opportunities*

| # | Statement |
|---|-----------|
| 9  | In your organisation, seniority determines who gets a seat at the table more than relevance to the problem. |
| 10 | The people closest to a problem are rarely the ones who decide how it gets resolved. |
| 11 | The people with the most relevant expertise are often not the ones with the final say. |
| 12 | Decisions in your organisation are often announced rather than made — the real decision happened somewhere else. |

---

## Scoring Rules

### Step 1 — Invert question 6

Question 6 is positively framed. Before scoring, invert it:

```
invertedScore = 6 - rawScore
```

A visitor who strongly agrees (5) that problems find the right forum has a low access-anarchy score (1 after inversion).

### Step 2 — Calculate mean scores per parameter

| Parameter | Questions used | Method |
|-----------|---------------|--------|
| `energyLoad` | 1, 2, 3, 4, 5 | Mean of five raw scores |
| `accessStructure` | 6 (inverted), 7, 8 | Mean of three scores |
| `decisionStructure` | 9, 10, 11, 12 | Mean of four raw scores |

### Step 3 — Apply thresholds

Thresholds are calibrated for Mix organisations, where honest answers cluster in the 3–4 range. The `moderate` band is intentionally wide to preserve resolution where most visitors land.

| Mean score | `energyLoad` | Structure parameter |
|------------|-------------|-------------------|
| 1.0 – 2.0 | `light` | `unsegmented` |
| 2.1 – 3.5 | `moderate` | `hierarchical` |
| 3.6 – 5.0 | `heavy` | `specialized` |

The same threshold table applies to both `accessStructure` and `decisionStructure`.

### Step 4 — Preserve raw scores

In addition to the thresholded parameter values, preserve the continuous mean scores as `raw`:

```js
{
  energyLoad:        'moderate',     // thresholded
  decisionStructure: 'hierarchical', // thresholded
  accessStructure:   'specialized',  // thresholded
  raw: {
    energyScore:    3.2,  // continuous — for positioning diagram
    decisionScore:  3.8,
    accessScore:    2.6,
  }
}
```

Raw scores feed the positioning diagram in `SPIKE-organised-anarchy-viz`, allowing continuous placement rather than snapping to three discrete positions.

---

## Archetype Validation

Three reference archetypes used to validate the scoring logic. Score each manually and confirm output matches expected parameters.

### University department
High anarchy — goals contested, processes opaque, participation fluid.

| Q | Expected score |
|---|---------------|
| 1 | 4 — priorities shift with funding cycles and academic politics |
| 2 | 5 — no two people describe governance the same way |
| 3 | 5 — longstanding issues never reach resolution |
| 4 | 5 — knowledge lives with individuals, not systems |
| 5 | 4 — decisions rarely close problems definitively |
| 6 | 2 → inverted: 4 — problems rarely find the right forum |
| 7 | 4 — who hears about a problem depends on relationships |
| 8 | 4 — forum ownership is unclear |
| 9 | 3 — seniority matters but collegial norms complicate it |
| 10 | 4 — those closest to problems rarely decide |
| 11 | 4 — expertise and authority are misaligned |
| 12 | 4 — decisions are announced, not made in the room |

**Expected output:** `energyLoad: heavy`, `accessStructure: specialized`, `decisionStructure: specialized`
**Mean scores:** energy 4.6, access 4.0, decision 3.75 → all `heavy` / `specialized` ✓

---

### Small product startup
Moderate anarchy — goals reasonably clear, processes informal, participation fluid but intentional.

| Q | Expected score |
|---|---------------|
| 1 | 3 — pivots happen but goals are broadly shared |
| 2 | 3 — process is informal but roughly consistent |
| 3 | 3 — backlog exists but gets addressed more regularly |
| 4 | 3 — memory is informal but accessible |
| 5 | 3 — some decisions close problems, many don't |
| 6 | 3 → inverted: 3 — problems sometimes find the right forum |
| 7 | 3 — access is informal, not purely relationship-driven |
| 8 | 2 — small enough that forum ownership is clearer |
| 9 | 2 — seniority less dominant than in larger orgs |
| 10 | 3 — proximity to problem and decision partially aligned |
| 11 | 3 — expertise and authority partially aligned |
| 12 | 3 — some decisions are made in the room |

**Expected output:** `energyLoad: moderate`, `accessStructure: hierarchical`, `decisionStructure: hierarchical`
**Mean scores:** energy 3.0, access 2.67, decision 2.75 → all `moderate` / `hierarchical` ✓

---

### Traditional manufacturing firm
Low-moderate anarchy — goals clear, processes defined, participation structured.

| Q | Expected score |
|---|---------------|
| 1 | 2 — goals are stable, strategy changes slowly |
| 2 | 2 — process is documented and broadly understood |
| 3 | 2 — backlog is managed through formal systems |
| 4 | 2 — memory lives in systems and procedures |
| 5 | 2 — decisions are tracked and closed formally |
| 6 | 4 → inverted: 2 — problems generally find the right forum |
| 7 | 2 — access is structured, not relationship-driven |
| 8 | 2 — forum ownership is defined |
| 9 | 4 — seniority strongly determines access |
| 10 | 3 — proximity and decision partially aligned |
| 11 | 3 — expertise matters but hierarchy dominates |
| 12 | 2 — decisions are made where they are supposed to be made |

**Expected output:** `energyLoad: light`, `accessStructure: unsegmented`, `decisionStructure: hierarchical`
**Mean scores:** energy 2.0, access 2.0, decision 3.0 → light/unsegmented, light/unsegmented, moderate/hierarchical ✓

---

## Quality Bar

The questions are good enough when:
- Someone embedded in The Mix reads them and feels seen
- Someone outside The Mix finds them thought-provoking but slightly foreign
- None of them could appear in a generic employee engagement survey

---

## References

- `gc-simulation.js` — consumes the parameter output of this scoring spec
- `SPIKE-organised-anarchy-scoring` — implements this spec in JavaScript
- VISION-product.md — the intellectual intent and voice these questions must reflect
