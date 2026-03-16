---
id: TECH-DEBT-tracker
type: TECH-DEBT
title: Technical Debt Tracker
status: IN-PROGRESS
created: 2026-03-16
updated: 2026-03-16
owner: Robert Andersson
relates_to: [PRINCIPLE-coding-standards, EPIC-garbage-can-restructure]
tags: [tech-debt, maintenance, refactoring]
---

# Technical Debt Tracker

## Active Debt

### TD-001 — Extract inline JS from assess and explorer into dedicated files
**Severity:** Moderate
**Effort:** Medium
**Files:** `modules/garbage-can/assess/index.html`, `modules/garbage-can/explorer/index.html`
**Principle violated:** PRINCIPLE-coding-standards: "No logic in HTML files"

The assess page has ~400 lines of inline JS (visualization, form handling, step navigation). The explorer page has similar inline viz code. Both should be extracted.

**Proposed fix:** Create `modules/garbage-can/assess/assess.js` and `modules/garbage-can/explorer/explorer.js`. Move all page-specific logic there. HTML files load the scripts and wire components only. Keep behaviour identical — code move only.

**Depends on:** TD-002, TD-003 (extract shared modules first, so page-specific files import from them)

**Created:** 2026-03-16

---

### TD-004 — Add tests for diagnosis, scoring, and extracted modules
**Severity:** Low
**Effort:** Medium
**Files:** `tests/` directory
**Principle violated:** None (preventive measure)

No tests exist for the diagnosis mapping or the 12-question scoring. The viz code has no DOM-free unit tests. Regressions are caught manually.

**Proposed tests:**
- Diagnosis mapping: all 9 decision×access combinations produce expected cluster
- Scoring contract: 12 inputs, threshold edges, three archetype fixture tests
- Lightweight DOM-free unit tests for any extracted modules (gc-diagnosis.js, gc-scoring.js)

**Depends on:** TD-002, TD-003 (test the extracted modules, not the inline code)

**Created:** 2026-03-16

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

## Instructions for Claude Code

When encountering tech debt during any task:
1. Do not fix it unless the current HANDOFF.md explicitly asks for it
2. Note it in this file if it is not already tracked
3. Reference the relevant principle that is being violated
4. Suggest a severity (Critical / Moderate / Low) and effort (Trivial / Small / Medium / Large)
