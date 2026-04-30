# Release Review Playbook

## Release Readiness

### Scope

Final quality gate before shipping.

### Check

- Required automated tests pass (`node tests/run-all.js`).
- Must/Should findings resolved or explicitly accepted.
- User-facing change notes and documentation updated.

### Report

- Any unresolved Must items (block release).
- Unresolved Should items (document risk acceptance).
- Deferred Could items (tracked follow-up).

### Verify

- Produce a ship/no-ship decision with explicit rationale.

---

## Post-Merge Validation

### Scope

Quick confidence checks immediately after merge/deploy.

### Check

- Critical paths load and function on target environment.
- No console/runtime errors on key flows.
- No regressions in navigation, forms, and primary interactions.

### Report

- Confirmed checks passed.
- Any regressions with owner and mitigation timeline.

### Verify

- Run a small deterministic smoke matrix (desktop/mobile + key pages).
