---
id: CORE-loading-rules
type: CORE
title: Deterministic Context Loading Rules
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [CORE, GUIDE-testing-and-release, GUIDE-docs-index]
tags: [core, loading, context]
load_when: [always]
do_not_load_when: []
token_cost_estimate: low
---

# Deterministic Context Loading Rules

## Default Context Pack

Always load first:
1. `docs/00-core/CORE.md`
2. `docs/00-core/CORE-loading-rules.md`
3. `docs/00-core/CORE-quality-gates.md`
4. `HANDOFF.md` (if present)

## Conditional Loading

- If editing docs: load `docs/10-guides/DOC-CONVENTIONS.md`.
- If editing GC simulation/scoring/diagnosis/viz: load
  - `docs/20-reference/REFERENCE-gc-model-semantics.md`
  - `docs/10-guides/GUIDE-architecture.md`
- If editing workflow/testing/onboarding docs: load
  - `docs/10-guides/GUIDE-getting-started.md`
  - `docs/10-guides/GUIDE-contributing.md`
- If investigating history: load from `docs/90-archive/*` only when explicitly required.

## Constraints

- Max docs per run: 6
- Docs token budget per run: 8k
- Never default-load archive docs.
- If file is long, load relevant sections first and summarize before expanding.
