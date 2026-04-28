---
id: GUIDE-01-documentation-review
type: GUIDE
title: Documentation Review Playbook
status: ACTIVE
created: 2026-03-25
updated: 2026-04-28
owner: Robert Andersson
relates_to: [GUIDE-llm-review-playbooks-index, CORE-quality-gates]
tags: [llm, review, playbook]
load_when: [when-running-reviews]
do_not_load_when: []
token_cost_estimate: low
---

# Documentation Review Playbook

## Scope

Repository docs quality, correctness, freshness, and developer usability.

## Review order

Run this sequence to avoid shallow "spellcheck-only" reviews.

1. **Source-of-truth alignment first.**
   Compare docs to code/tests for the system under review. In this repo, implementation and tests are canonical.
2. **Execution realism second.**
   Verify documented commands, paths, and branch flow are runnable as written.
3. **Cross-doc consistency third.**
   Check that docs describing the same area (README, CLAUDE/AGENTS, guides, playbooks) tell one coherent story.
4. **Contributor usability last.**
   Confirm a new contributor could complete the documented task without private context.

## Check

### Source-of-truth alignment

- [ ] IA/section numbering in docs matches live module nav and canonical roots.
- [ ] Runtime descriptions match current file ownership boundaries (what lives in HTML vs JS vs CSS).
- [ ] Any formula/semantics language is consistent with implementation labels and test contracts.
- [ ] Decision records exist for non-obvious architecture choices (for example shared layers, intentional non-refactors).

### Command and path validity

- [ ] Every referenced file path exists and matches current case/spelling.
- [ ] Documented commands run as written in current repo shape.
- [ ] Branch/release workflow text matches actual required flow (`sandbox` -> `develop` -> `main`).
- [ ] Any "run before commit" requirements match current quality gates.

### Cross-document consistency

- [ ] `README.md` and module-local docs agree on section names/order.
- [ ] `CLAUDE.md` and `AGENTS.md` remain byte-identical when contract content changes.
- [ ] Guides and playbooks avoid contradicting each other on conventions.
- [ ] Terms are stable across docs (for example "Narrative" vs legacy names such as "Utilization Trap" if renamed).

### Contributor usability

- [ ] Prerequisites are explicit (tools/runtime/test requirements).
- [ ] Steps are deterministic and ordered (no hidden dependency on "knowing the repo").
- [ ] Ambiguous verbs ("fix", "release", "update docs") are tied to concrete commands or file targets.
- [ ] Known caveats are stated (for example optional tests that auto-skip; ignored local handoff files).

## Report

- **Must**
  - Instructions that break setup, release flow, or required test gates.
  - Path/command errors that make docs non-runnable.
  - Contract mismatches that violate enforced checks (for example CLAUDE/AGENTS divergence).
- **Should**
  - Stale IA labels/section names after module restructures.
  - Redundant or conflicting explanations across multiple docs.
  - Missing rationale on high-impact architecture decisions.
- **Could**
  - Style/tone tightening, readability improvements, and minor structure polish.
  - Metadata freshness improvements when behavior is unchanged.

For each finding include:
- file path
- severity (`Must`/`Should`/`Could`)
- what is wrong
- exact replacement text or command

## Verify

- Execute documented commands for the reviewed area.
- Validate links and referenced files exist.
- Run docs integrity checks where relevant.
- Ask: could a new contributor succeed from docs alone?
