---
id: TECH-DEBT-tracker
type: TECH-DEBT
title: Technical Debt Tracker
status: IN-PROGRESS
created: 2026-03-16
updated: 2026-03-19
owner: Robert Andersson
relates_to: [PRINCIPLE-coding-standards, EPIC-garbage-can-restructure]
tags: [tech-debt, maintenance, refactoring]
load_when: [debt_work]
do_not_load_when: [unrelated_feature_work]
token_cost_estimate: medium
---

# Technical Debt Tracker

## Active Debt

_(none)_

---

## Recommended Execution Order

| Order | Item | Effort | Why this order |
|-------|------|--------|----------------|
| 1 | TD-007 | Trivial | Resolve principle conflict first — 5 min |
| 2 | TD-002 | Small | Extract gc-diagnosis.js — unblocks TD-001 |
| 3 | TD-003 | Small | Update gc-scoring.js — unblocks TD-001 |
| 4 | TD-001 | Medium | Extract page JS — depends on TD-002, TD-003 |
| 5 | TD-004 | Medium | Add tests — test the extracted modules |
| 6 | TD-005 | Small | CSS class aliases — anytime |
| 7 | TD-006 | Small | Touch targets — anytime, needs mobile testing |

---

## Resolved Debt

### TD-007 — Resolve principle conflict on tag borders
**Resolved:** 2026-03-16
`PRINCIPLE-design-system.md` updated: tags are plain text with no border. Cross-reference to `PRINCIPLE-interactive-elements.md` added.

---

### TD-002 — Centralise diagnosis mapping and text into gc-diagnosis.js
**Resolved:** 2026-03-16
Created `gc-diagnosis.js` at repo root with `DIAGNOSIS_CLUSTERS`, `DIAGNOSES`, and `getDiagnosis`. Removed inline copies from `assess/index.html` and `explorer/index.html`. Both pages load the shared file via `<script src="../../../gc-diagnosis.js">`.

---

### TD-003 — Update gc-scoring.js to 12-question spec
**Resolved:** 2026-03-16
`gc-scoring.js` rewritten with 12-question `scoreResponses` function. Inline `computeScoring`, `classifyEnergy`, and `classifyStructure12` removed from `assess/index.html`. Call site updated to `scoreResponses(responses)`. Validated against all three archetypes in `tests/test-gc-scoring-12.js` — 9/9 assertions pass.

---

### TD-005 — Normalise interactive element CSS classes as aliases
**Resolved:** 2026-03-16
Added `.cta-primary`, `.cta-secondary`, `.nav-link-contextual`, `.tag-label` alias classes to `css/main.css`. Existing HTML markup unchanged; both old and new class names work.

---

### TD-006 — Radio button touch targets too small for mobile
**Resolved:** 2026-03-16
Added `padding: 0.6rem; box-sizing: content-box` to `.scale-option input[type="radio"]`. Tappable area expanded to ~43px without changing visible dot size.

---

### TD-001 — Extract inline JS from assess and explorer into dedicated files
**Resolved:** 2026-03-17
Created `gc-viz.js` (shared visualization), `modules/garbage-can/assess/assess.js`, and `modules/garbage-can/explorer/explorer.js`. All inline `<script>` blocks removed from both HTML files. Both pages now load only `<script src="...">` tags. Explorer visualization drift eliminated — both pages use the same `drawViz` from `gc-viz.js`.

---

### TD-004 — Add tests for diagnosis, scoring, and extracted modules
**Resolved:** 2026-03-17
Created `tests/test-gc-diagnosis.js` (9 assertions — all 9 decision×access combinations) and replaced `tests/test-gc-scoring.js` with a 12-question version (3 assertions). Both files pass: 12/12 assertions.

---

## Instructions for Claude Code

When encountering tech debt during any task:
1. Do not fix it unless the current HANDOFF.md explicitly asks for it
2. Note it in this file if it is not already tracked
3. Reference the relevant principle that is being violated
4. Suggest a severity (Critical / Moderate / Low) and effort (Trivial / Small / Medium / Large)
