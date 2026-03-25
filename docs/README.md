---
id: GUIDE-docs-index
type: GUIDE
title: Documentation Index
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [CORE, CORE-loading-rules, DOC-CONVENTIONS]
tags: [docs, index, retrieval]
load_when: [always]
do_not_load_when: []
token_cost_estimate: low
---

# Documentation Index

## Active architecture

- `docs/00-core/` — enforceable runtime rules and loading contract
- `docs/10-guides/` — operational runbooks
- `docs/20-reference/` — domain/source-of-truth references
- `docs/30-tasks/` — active task retrieval targets
- `docs/40-principles/` — principle-level policy and narrative contracts
- `docs/50-vision/` — product vision and framing
- `docs/90-archive/` — historical docs (opt-in only)

## Agent default pack

1. `docs/00-core/CORE.md`
2. `docs/00-core/CORE-loading-rules.md`
3. `docs/00-core/CORE-quality-gates.md`
4. `docs/30-tasks/TASK-current-work.md`
5. `HANDOFF.md` (if present)

## Human quick start

1. `docs/10-guides/GUIDE-getting-started.md`
2. `docs/10-guides/GUIDE-architecture.md`
3. `docs/10-guides/GUIDE-testing-and-release.md`

## LLM review playbooks

- `docs/10-guides/review-playbooks/README.md`
- Domain playbooks under `docs/10-guides/review-playbooks/` for:
  - documentation, content design, code review, test coverage
  - architecture, UX, interaction design, UI/design-system
  - DevOps/CI/CD, security, performance, accessibility
  - observability/reliability, API/schema contracts
  - release readiness and post-merge validation
