---
id: CORE
type: CORE
title: Core Runtime Rules
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [CORE-loading-rules, CORE-quality-gates, REFERENCE-gc-model-semantics]
tags: [core, runtime, rules]
load_when: [always]
do_not_load_when: []
token_cost_estimate: low
---

# Core Runtime Rules

These rules are enforceable and always in scope.

1. Keep HTML, CSS, and JavaScript responsibilities separated.
2. Do not add inline CSS or inline business logic in HTML pages.
3. Keep simulation/scoring/diagnosis logic DOM-free.
4. Use taxonomy-accurate language for Garbage Can metrics.
5. Keep choice-level and problem-level metrics clearly separated.
6. Use clean directory URLs; do not link to `index.html` explicitly.
7. For behavior changes, update tests and relevant docs in the same change.
8. Treat accessibility and responsiveness as release gates.

Canonical deep standards live in:
- `docs/PRINCIPLE-coding-standards.md`
- `docs/PRINCIPLE-design-system.md`
