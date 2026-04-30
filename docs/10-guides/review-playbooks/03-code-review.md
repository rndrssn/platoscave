# Code and Test Review Playbook

## Code Quality

### Scope

HTML, CSS, JS implementation quality, safety, and maintainability.

### Check

- Correctness and edge-case handling.
- Readability, cohesion, and duplication.
- Security-sensitive DOM usage and data handling.
- Performance pitfalls and unnecessary complexity.
- Standards adherence and consistency with project patterns.

### Report

- Functional bugs/regressions (Must).
- Unsafe patterns (Must).
- Fragile logic / hidden coupling (Should).
- Refactor opportunities with measurable payoff (Could).

### Verify

- Provide file/function-level evidence.
- Require tests or smoke checks for each Must/Should fix.

---

## Test Coverage

### Scope

Adequacy of unit/integration/e2e coverage and regression protection.

### Check

- High-risk logic coverage.
- Contract/boundary/error-path tests.
- Accessibility and navigation baseline checks.
- CI gating alignment with required tests.

### Report

- Untested critical paths (Must).
- Missing regressions for previously fixed bugs (Should).
- Weak assertions/false-confidence tests (Should).
- Flaky or redundant tests (Could).

### Verify

- Map risks to specific test files.
- Propose exact new tests with expected assertions.
