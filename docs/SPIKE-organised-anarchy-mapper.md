---
id: SPIKE-organised-anarchy-mapper
type: SPIKE
title: Organised Anarchy Mapper — Integration
status: DRAFT
created: 2026-03-13
updated: 2026-03-13
owner: Robert Andersson
relates_to: [SPIKE-organised-anarchy-scoring, SPIKE-organised-anarchy-viz, SPIKE-organised-anarchy-diagnosis, EPIC-navigation, PRINCIPLE-design-system, PRINCIPLE-responsive]
tags: [garbage-can, integration, form, visualization, diagnostic]
---

# Organised Anarchy Mapper — Integration

## Dependencies

**All of the following must be VALIDATED before this spike begins:**

| Spike | Delivers |
|-------|---------|
| `SPIKE-organised-anarchy-scoring` | `gc-scoring.js` — question-to-parameter translation |
| `SPIKE-organised-anarchy-viz` | `tests/test-gc-viz.html` — styled d3 animation |
| `SPIKE-organised-anarchy-diagnosis` | `docs/SPEC-organised-anarchy-diagnosis.md` — diagnosis lookup |

`gc-simulation.js` is also required (already validated).

---

## Purpose

Wire all validated components into a single working page — the Organised Anarchy Mapper module. This spike is integration work. It does not redesign any component — it connects them.

---

## What to Build

A single page: `modules/garbage-can/index.html`

This is the actual module page, living at `/modules/garbage-can/` in the site structure defined in `EPIC-navigation.md`.

---

## Page Structure

Following `EPIC-navigation.md` — every module page has:
- Global nav bar at top
- Module header: number, title, one-paragraph framing, topic tags
- Interactive content
- Footer nav: `— Previous` / `Next —` in DM Mono

### Interactive content — three stages, revealed progressively

**Stage 1 — The form**
The questions from `gc-scoring.js`, rendered as a typographic questionnaire. One question at a time or all visible — decide during implementation based on what feels less like a survey. A single submit action at the end.

**Stage 2 — Positioning**
After submission: a spare field diagram showing where the organisation sits on the three structural axes, derived from the `raw` scores. Labels in DM Mono. No radar chart. Think annotated field sketch.

**Stage 3 — Diagnosis + simulation**
The diagnosis text from the lookup, rendered in the site's typographic voice. Below it, the d3 animation running with the visitor's parameters. The animation runs once — it does not loop.

Each stage fades in after the previous. No page reload — all client-side.

---

## Design Constraints

Full compliance with `PRINCIPLE-design-system.md` and `PRINCIPLE-responsive.md`:

- Form feels like a field notebook questionnaire — not a SaaS survey
- No progress bars, no gamification, no rounded inputs
- Positioning diagram: spare, typographic, ink-on-paper
- Diagnosis text: `EB Garamond`, `--ink-mid`, generous line-height
- Animation: from `test-gc-viz.html` — do not restyle
- Mobile: single column throughout, visualization adapts to container width

---

## Success Criteria

This spike is **VALIDATED** if:

- [ ] The page loads and renders correctly at `/modules/garbage-can/`
- [ ] The form collects all answers and submits without error
- [ ] Scoring produces the correct parameter set
- [ ] The positioning diagram renders and is legible
- [ ] The correct diagnosis text appears
- [ ] The simulation runs with the visitor's parameters
- [ ] The progressive reveal works — each stage appears after the previous
- [ ] The page passes `tests/test-navigation-links.js`
- [ ] Desktop layout is correct — mobile is acceptable but not required to be perfect

This spike is **ABANDONED** if:

- The three components cannot be integrated without breaking any of them
- The progressive reveal feels technically correct but experientially wrong

---

## Out of Scope

- Final production copy for questions or diagnosis text
- Full mobile polish (acceptable on mobile, not perfect)
- Saving or sharing results
- Any backend

---

## Branch

All work on `experiment/organised-anarchy-mapper`. When validated, this branch is a candidate for merge to `develop`.

---

## After Validation

When this spike is validated:
1. Create `STORY-garbage-can-module.md` relating back to this spike
2. Update `EPIC-navigation.md` — mark the Garbage Can module as `IN-PROGRESS`
3. Open a merge request from `experiment/organised-anarchy-mapper` to `develop`
4. Do not merge to `main` until mobile polish and final copy are complete

---

## References

- `gc-simulation.js` — simulation engine
- `gc-scoring.js` — question-to-parameter translation
- `docs/SPEC-organised-anarchy-questions.md` — question copy and scoring rules
- `docs/SPEC-organised-anarchy-diagnosis.md` — diagnosis lookup
- `tests/test-gc-viz.html` — styled visualization to lift into the module
- EPIC-navigation.md — module page structure and URL conventions
- PRINCIPLE-design-system.md — all visual constraints
- PRINCIPLE-responsive.md — responsive behaviour
