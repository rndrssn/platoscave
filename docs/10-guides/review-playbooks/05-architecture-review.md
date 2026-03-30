---
id: GUIDE-05-architecture-review
type: GUIDE
title: Architecture Review Playbook
status: ACTIVE
created: 2026-03-25
updated: 2026-03-30
owner: Robert Andersson
relates_to: [GUIDE-llm-review-playbooks-index, CORE-quality-gates, GUIDE-architecture]
tags: [llm, review, playbook, architecture]
load_when: [when-running-reviews, architecture_changes]
do_not_load_when: []
token_cost_estimate: low
---

# Architecture Review Playbook

## Purpose

A repeatable, skeptical review of actual architecture — not idealised docs. Grounds every finding in a concrete file and line. Separates high-confidence observations from assumptions.

Use this playbook when:
- Onboarding a new agent session to the codebase
- Handing off between agents (Codex → Claude, or session → session)
- Evaluating scope or risk before a large change
- Auditing drift between docs and code

---

## Files to Read

Read ALL of these before forming opinions.

### Simulation core
- `gc-simulation-config.js` — constants and configurable tables
- `gc-simulation-core.js` — the actual algorithm
- `gc-simulation.js` — public API wrapper; dependency resolution logic
- `gc-scoring.js` — survey → parameter mapping
- `gc-diagnosis.js` — structure pairs → cluster text + getDiagnosisPreview()
- `gc-viz-config.js`, `gc-viz-helpers.js`, `gc-viz-timing.js` — viz support

### Page wiring
- `modules/garbage-can/assess/assess.js`
- `modules/garbage-can/explorer/explorer.js`
- `modules/garbage-can/assess/index.html` — script load order (bottom of file)
- `modules/garbage-can/explorer/index.html` — script load order (bottom of file)

### Narrative
- `js/gc-pressure-narrative.js`

### Theme system
- `theme.config.js`
- `js/theme-bootstrap.js`

### Tests (sample minimum)
- `tests/run-all.js` — full test list
- `tests/test-gc-simulation-invariants.js`
- `tests/test-gc-scoring.js`
- `tests/test-gc-diagnosis.js`
- `tests/test-explorer-integration.js`
- `tests/test-assess-integration.js`

### Docs
- `CLAUDE.md`
- `docs/10-guides/GUIDE-architecture.md`
- `docs/50-vision/VISION-product.md`

---

## What to Inspect (checklist)

### 1. Dependency model
- [ ] How does each file receive its dependencies? (globals? require? import?)
- [ ] Is the pattern consistent? Where does it break down?
- [ ] Are there multi-fallback require() chains? Do they fail fast or silently?
- [ ] What is the script load order in each HTML entry point?
- [ ] Are any globals called before they are guaranteed to be set?

### 2. Simulation pipeline trace
- [ ] Trace the full path: user input → scoring → context build → simulation → diagnosis → viz
- [ ] Note the exact parameter names at each boundary — are they consistent?
- [ ] Note any aliasing or fallback (e.g. `energyLoad → problemIntensity`)
- [ ] Note any hardcoded values at any stage (not just magic numbers, but design choices too)

### 3. Hardcoded vs configurable
- [ ] List every constant. Is it configurable, and should it be?
- [ ] Identify design decisions encoded as constants without comments
- [ ] Check that `simResult.meta.*` is used for proportions rather than re-declaring model constants

### 4. Test coverage gaps
- [ ] What is NOT tested? (compare test files to production files)
- [ ] Do tests use real DOM, JSDOM, or a fake DOM? What does this miss?
- [ ] Is async behaviour actually exercised, or is `setTimeout` mocked synchronous?
- [ ] Are any design constraints asserted in tests, or only assumed?

### 5. CSS / theme architecture
- [ ] Are tokens used consistently? Are any hardcoded values outside the token system?
- [ ] Is the theme loading mechanism fragile (e.g. depends on file path regex)?
- [ ] Are theme files complete and consistent with each other?

### 6. Documentation vs reality
- [ ] Does `CLAUDE.md` critical paths match actual files and load order?
- [ ] Does `GUIDE-architecture.md` describe what the code actually does?
- [ ] Are any documented patterns contradicted by the code?
- [ ] Does `AGENTS.md` mirror `CLAUDE.md` exactly?

### 7. Duplication and inconsistency
- [ ] Is the same logic defined in more than one place?
- [ ] If a function is duplicated, do the two copies behave identically?
- [ ] Are any regex patterns or string templates repeated across files?

---

## Risk Register Format

For each finding, record:

| Priority | Risk | File:line | Impact | Confidence |
|----------|------|-----------|--------|------------|
| 🔴 HIGH | Description | `file.js:42` | What breaks | High / Assumed |
| 🟠 MEDIUM | ... | | | |
| 🟡 LOW | ... | | | |

Priority thresholds:
- **HIGH**: Silent failure, data loss, or production-invisible breakage
- **MEDIUM**: Divergent behaviour, maintenance hazard, or untested design constraint
- **LOW**: Duplication, style inconsistency, or minor drift

---

## Output Structure

Return findings in this order:

1. **Dependency map** — actual dependency graph with file references
2. **Pipeline trace** — parameter names at each stage boundary
3. **Hardcoded vs configurable table**
4. **Test coverage gaps** — what exists, what is missing, quality concerns
5. **Docs vs reality gaps** — concrete discrepancies with file:line
6. **Duplication register** — duplicated code with diffs where they differ
7. **Risk register** — ranked by priority
8. **High-confidence findings** vs **assumptions** — clearly separated

At the end, summarise:
- What was inspected
- Key findings (3–5 bullets)
- Highest-priority improvements (numbered, actionable)
- Uncertainties requiring clarification

---

## Improvement Scope

Do NOT suggest:
- New frameworks, build tools, or bundlers
- Major architectural rewrites
- Abstractions for single-use patterns

DO suggest:
- Surgical fixes grounded in actual file and line
- Documentation that reflects real behaviour
- Tests for untested constraints
- Consolidation of duplicated logic where both copies exist and differ

---

## Known Baseline (as of 2026-03-30)

The following findings have already been addressed. Do not re-report them as open issues.

| Fixed | Description |
|-------|-------------|
| ✅ | `getDiagnosisPreview()` added to `gc-diagnosis.js`; duplicate regex removed from `assess.js` and `explorer.js` |
| ✅ | `buildAssessPressureNarrative()` and `buildExplorerNarrative()` simplified to direct `window.buildGcPressureNarrative` passthroughs; divergent fallback logic removed |
| ✅ | `titleCase()` duplicate removed from `explorer.js` |
| ✅ | `problemInflow = 'moderate'` documented inline in `assess.js` and in `GUIDE-architecture.md` |
| ✅ | `TOTAL_PROBLEMS` hardcoded constant replaced with `simResult.meta.problems` in `assess.js` |
| ✅ | `GUIDE-architecture.md` updated to reflect full pipeline including `gc-pressure-narrative.js`, script load order, and Assess/Explorer parameter differences |
| ✅ | `CLAUDE.md` critical paths updated to include `gc-simulation-core.js` and `gc-pressure-narrative.js` |

Open items (not yet addressed):

| Open | Description |
|------|-------------|
| 🟠 | Multi-fallback `require()` in `gc-simulation.js:8–42` — not tested; silent catch blocks swallow errors before final throw |
| 🟠 | `theme-bootstrap.js:47` — regex match on script src is fragile; breaks if file path changes |
| 🟡 | Viz radius (`problemRadius`, `choiceRadius`) hardcoded in `gc-viz-helpers.js:84–86` — outside CSS token system |
| 🟡 | `AGENTS.md` — verify it mirrors `CLAUDE.md`; currently assumed hand-synced |
