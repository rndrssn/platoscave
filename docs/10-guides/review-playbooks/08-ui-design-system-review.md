---
id: GUIDE-08-ui-design-system-review
type: GUIDE
title: UI Design System Review Playbook
status: ACTIVE
created: 2026-03-25
updated: 2026-04-25
owner: Robert Andersson
relates_to: [GUIDE-llm-review-playbooks-index, CORE-quality-gates]
tags: [llm, review, playbook]
load_when: [when-running-reviews]
do_not_load_when: []
token_cost_estimate: low
---

# UI Design System Review Playbook

## Scope

Visual consistency, token usage, component reuse, and style drift control.

## Review order (do not skip the first three)

When comparing a new component or page against the rest of the site, work outside-in. Skipping early steps and going straight to component diffs misses the issues that drive everything else.

1. **Container / layout context.** Does the new section sit in the same outer container as comparable sections elsewhere? `main--narrow` (720px) vs `main` (1140px) vs viewport-edge full-bleed produces wildly different effective canvas widths for the same SVG markup. Two visualizations look like they came from different sites mostly because one was given room and the other wasn't.
2. **Token tier.** Compare which token *family* the new code reaches for, not just whether tokens are used. Saturated `--viz-*` data-viz tokens, light/pastel accents (`--rust-light`, `--gold`, `--sage-light`), neutral UI tokens (`--ink`, `--ink-mid`, `--ink-ghost`), and chrome microtype tokens (`--mono`) each signal a different role. Mixing tiers across precedent components fragments the palette even when each individual colour is "from the system."
3. **Pattern reuse vs invention.** Before authoring a new component, search for existing precedent. If the site already has a force graph, a legend, a metric scoreboard, a story panel, a controls form — adopt or extend them. New CSS blocks only when no precedent exists *and* the divergence is intentional.
4. Color, typography, spacing consistency against tokens (within-component).
5. Icon style/size alignment and rendering approach.
6. Component variants and repeated custom one-offs.
7. Page-to-page visual drift and ad-hoc overrides.

## Check

### Container and width

- [ ] New section sits in the same `main--narrow` / `main` / full-bleed context as comparable sections.
- [ ] Visualizations that need width use the established full-bleed pattern (`width: 100vw; margin-left: calc(50% - 50vw)` with an inner max-width), not the default narrow column.
- [ ] No phantom containment: bordered "card" wrappers around a viz are absent unless every comparable surface in the site uses them.

### Token tier

- [ ] Palette tier matches the closest precedent (e.g. force graph → light accents like `--rust-light`/`--gold`/`--sage-light`; in-simulation viz → `--viz-*`; UI chrome → `--ink*`).
- [ ] Same component family across the site shares colour tokens, not just "any token from the system."
- [ ] Background fills don't accidentally use `--paper` (the page background) where a transparent or accent fill is meant.

### Pattern reuse

- [ ] Identified the existing precedent component before writing a new one (force graph, legend, scoreboard, controls form, status line, story panel, etc.).
- [ ] Reused the precedent's class names where behaviour overlaps; new classes only for genuinely new affordances.
- [ ] Did not introduce a third dialect of an already-doubled pattern (e.g. a third style of legend, a third microtype scale).

### Visual encoding

- [ ] Number of visual dimensions (size, fill, stroke colour, stroke style, dash, opacity) is justified by the number of categories. More than ~3 simultaneous encodings is usually a signal that the category model is wrong, not that the styling needs more variety.
- [ ] Legend swatches share inline-size, block-size, and stroke unless variation is itself encoded.

### Microtype convention

- [ ] Viz chrome (legend microcopy, helper text, axis labels) uses the site's mono-uppercase tier (e.g. `font-family: var(--mono); font-size: 0.6–0.75rem; letter-spacing: 0.04–0.08em; text-transform: uppercase`), not body sans-serif sentence case.
- [ ] Captions on visualizations are instruction-level ("Hover or tap a node to explore connections") not category-restating ("Larger rust nodes are surprises").

## Report

- Token bypasses or wrong-tier choices that fragment the visual system (Should).
- Layout-context mismatches that make a section feel like it's from a different site (Must when on a primary surface).
- Accessibility-threatening contrast/state issues (Must).
- Component consolidation opportunities (Could).

## Verify

- Side-by-side page comparison at multiple viewport widths (320, 720, 1180, 1440).
- Token-level diff for hardcoded values *and* tier mismatches.
- For each new CSS class, confirm no equivalent existing class was overlooked.
- For visualizations, compare against the *closest existing visualization* (not the closest text page).

## Anti-patterns to flag explicitly

- A visualization sitting in `main--narrow` when an equivalent visualization elsewhere uses full-bleed.
- A component using `--viz-*` saturated tokens when comparable site components use `--rust-light`/`--gold`/`--sage-light` pastel tier.
- A legend, detail panel, or scoreboard implemented as a new pattern when the site already has 1–2 dialects.
- A bordered/padded "stage" wrapper around a viz when comparable visualizations are flush with the page.
- Body-sans sentence-case microcopy for viz chrome instead of the site's mono-uppercase convention.
