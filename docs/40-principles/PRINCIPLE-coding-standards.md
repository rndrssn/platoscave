---
id: PRINCIPLE-coding-standards
type: PRINCIPLE
title: To the Bedrock — Coding Standards (Runtime)
status: ACTIVE
created: 2026-03-15
updated: 2026-03-19
owner: Robert Andersson
relates_to: [CORE, GUIDE-testing-and-release, REFERENCE-gc-model-semantics]
tags: [code, standards, runtime]
load_when: [code_changes]
do_not_load_when: [archive_research_only]
token_cost_estimate: medium
---

# To the Bedrock — Coding Standards (Runtime)

This is the concise enforceable version for agents and contributors.

Full historical rationale/examples:
- `docs/90-archive/legacy-principles/PRINCIPLE-coding-standards-full.md`

## Non-negotiables

1. No inline styles and no `<style>` blocks in HTML pages.
2. No business logic embedded in HTML pages.
3. Logic files (`gc-simulation.js`, `gc-scoring.js`, `gc-diagnosis.js`) must remain DOM-free.
4. Use tokenized CSS variables; avoid hardcoded design values when token equivalents exist.
5. Keep choice-level and problem-level metrics clearly separated in labels and summaries.
6. Use clean directory URLs; do not link directly to `index.html`.
7. Keep navigation and core content usable without JavaScript (progressive enhancement).
8. Preserve accessibility baselines (focus-visible, semantic forms, ARIA state updates where applicable).
9. Keep long-running simulation work responsive (async chunking or equivalent).
10. No new external dependencies without explicit decision approval.

## Required checks

- `node tests/run-all.js`
- plus navigation link check when nav links are modified

## Change coupling rule

If behavior or semantics changes:
1. update tests
2. update affected docs
3. verify terminology against `docs/20-reference/REFERENCE-gc-model-semantics.md`
