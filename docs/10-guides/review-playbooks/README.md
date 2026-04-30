# LLM Review Playbooks Index

Use these playbooks when an agent is asked to perform a review. They are optimized for concrete findings, severity prioritization, and actionable refactor plans.

## Required output contract for every review

1. Findings first, ordered by severity (`Must`, `Should`, then `Could`).
2. Every finding includes:
   - file/selector/function/location
   - issue description
   - why it matters
   - exact fix recommendation
   - verification method
3. No coding unless explicitly requested.
4. If user asks to discuss/plan/confirm understanding, return analysis only and wait for explicit proceed.

## Severity mapping (MoSCoW)

- Critical → `Must`
- High → `Must`
- Medium → `Should`
- Low → `Could`
- Explicitly deferred/non-goal → `Won't` (with rationale and review date)

## Playbooks

- `03-code-review.md` — code quality and test coverage
- `05-architecture-review.md` — dependency model, pipeline trace, docs vs reality
- `06-design-review.md` — UX, interaction design, and UI design system
- `10-security-review.md` — security
- `11-performance-review.md` — performance
- `12-accessibility-review.md` — accessibility
- `15-release-review.md` — release readiness and post-merge validation
- `17-information-architecture-review.md` — IA and navigation

## Shared finding template

```md
### <Short finding title>
- Priority: Must | Should | Could | Won't
- Location: <path:line | selector | function>
- Issue: <what is wrong>
- Impact: <risk / UX / reliability / maintenance cost>
- Fix: <specific change>
- Verify: <test/smoke check>
```

## Shared review checklist

- Scope is explicit and bounded.
- Assumptions are listed.
- Findings are evidence-backed (no speculation).
- Refactor plan has sequence, owner, and rollback notes.
