# Information Architecture Review Playbook

## Scope

Site and module structure clarity: labels, hierarchy, wayfinding, and path predictability.

## Check

- Module numbering and hierarchy consistency (local section numbering like `01`, `02` within each module).
- Canonical path rules (root section at `/modules/<slug>/`, no reverse redirects).
- Navigation label clarity (global nav, module context line, local section nav, footer progression).
- Path discoverability across entry points (`README.md`, modules index, nav controller, module pages).
- Terminology consistency across IA surfaces (module names, section names, menu labels).

## Report

- IA mismatches that break discoverability or navigation truth (Must).
- Label/hierarchy drift that increases cognitive overhead (Should).
- Taxonomy and wayfinding polish opportunities (Could).

## Verify

- Cross-check against:
  - `docs/20-reference/navigation-patterns.md`
  - `docs/20-reference/REFERENCE-content-taxonomy.md`
  - module IA contract in `CLAUDE.md` / `AGENTS.md`
- Run navigation contracts/smoke:
  - `node tests/test-nav-modules-menu-contract.js`
  - `node tests/test-module-landing-pattern-contract.js`
  - `node tests/test-navigation-links.js`
