# Testing and Release Guide

## Required checks

1. `node tests/run-all.js`
2. Optional browser smoke when Playwright is installed: `node tests/test-browser-smoke-optional.js`

Nav theming guardrails included in `run-all`:
- `tests/test-nav-theme-contract.js` ensures nav surfaces stay token-driven and prevents direct `.main-nav` theme overrides for the active theme.

## Writing release path

When the change is only notes/articles/tag generation, run from `sandbox`:

```bash
scripts/publish-note.sh -m "Publish writing: notes:<slug>" --only notes:<slug>
```

For articles:

```bash
scripts/publish-note.sh -m "Publish writing: articles:<slug>" --only articles:<slug>
```

Optional quick mode (writing-focused checks):

```bash
scripts/publish-note.sh -m "Publish writing: notes:<slug>" --quick --only notes:<slug>
```

Optional spelling/punctuation polish before publish:

```bash
OPENAI_API_KEY=... scripts/publish-note.sh -m "Publish writing: notes:<slug>" --quick --polish notes:<slug> --only notes:<slug>
```

Status-driven lifecycle in frontmatter:
- `published`: rendered to notes/articles output (and included in tags when tagged).
- `draft`: excluded from generated output.
- `unpublished`: excluded from generated output (intentional takedown).

Safety:
- Script requires a clean staged index before running.
- `--only` blocks unexpected changed source notes under `content/notes/published/`.

## Release gate

- Required checks pass.
- Behavior and documentation semantics are aligned.
- Accessibility baseline remains intact.
- Runtime dependency sourcing is consistent (no mixed local/CDN imports for the same library).

## Scope checks

- If scoring/diagnosis changed: verify semantics docs and tests were updated.
- If simulation/viz changed: verify summary consistency tests still pass.
