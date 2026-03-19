---
id: GUIDE-contributing
type: GUIDE
title: Contributing Guide
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [GUIDE-docs-index, DOC-CONVENTIONS, PRINCIPLE-coding-standards]
tags: [contributing, workflow, quality]
---

# Contributing Guide

## Contribution Flow

1. Clarify scope and affected modules.
2. Implement code changes.
3. Add or update tests.
4. Update affected docs.
5. Run required checks.
6. Submit PR with explicit change summary.

## Minimum PR Expectations

- Clear statement of what changed and why.
- List of affected files.
- Test evidence (`node tests/run-all.js` at minimum).
- Documentation updates for any changed behavior, naming, or rules.

## Documentation Update Rule

Update docs in the same PR when you change:

- terminology shown to users
- simulation/scoring/diagnosis semantics
- architecture boundaries
- testing/release procedure

## Standards to Apply

- `PRINCIPLE-coding-standards.md`
- `PRINCIPLE-design-system.md`
- `PRINCIPLE-responsive.md`
- `REFERENCE-gc-model-semantics.md`

## Avoid

- changing model semantics without tests
- changing UI labels without semantics docs update
- adding dependencies without explicit approval and decision record
