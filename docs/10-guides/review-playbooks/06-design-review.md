# Design Review Playbook

## UX Review

### Scope

Task success, cognitive load, feedback loops, and usability quality.

### Check

- Key user journeys and dead ends.
- Friction in forms, navigation, and content discovery.
- Feedback quality for loading/success/error states.
- Mobile usability and touch target safety.

#### Explanation-of-explanation redundancy

A symptom that the design isn't self-explanatory: the page contains a legend *and* a caption restating the legend *and* an essay section explaining the legend. Each layer compensates for the previous one not landing. Flag when:

- [ ] A caption immediately below a legend restates category names or category visual encodings.
- [ ] An essay section after a viz spends its first paragraph re-explaining the legend swatches.
- [ ] A detail panel duplicates information already on the SVG (the node label is visible — repeating it as a heading is redundant).

The fix is usually upstream: the visualization's category model is too detailed, or the encoding is unclear. Don't paper over with prose.

#### Microcopy role discipline

- [ ] Body copy in `<header>` regions describes content, not interactions ("Drag a node, hover to focus" belongs in viz chrome, not page header).
- [ ] Interaction instructions live in the viz chrome microtype tier (mono uppercase, ~0.6rem).

### Report

- Flows that block task completion (Must).
- Friction that materially slows users (Should).
- Redundant or contradictory information layers around a single artifact (Should).
- Delight/polish opportunities (Could).

### Verify

- Task-based walkthrough for primary journeys.
- Include desktop + mobile observations.
- For pages with visualizations: cover the legend, the SVG, the detail/scoreboard panel, and any caption — confirm each says something the others don't.

---

## Interaction Design Review

### Scope

Behavioral consistency of controls, states, transitions, and affordances.

### Check

- Consistent hover/focus/active/disabled/error states.
- Control semantics (button vs link) and affordance clarity.
- Motion purpose, timing consistency, reduced-motion support.
- Predictable keyboard interaction and focus management.

#### Repeat-pattern behaviour parity

When the codebase already has one instance of a pattern (force graph, animation, simulation, slider-driven viz), a new instance must replicate the behavioural conventions of the precedent — not just its visual style.

For force-directed graphs, check the precedent ([modules/experience-skill-graph/index.html](modules/experience-skill-graph/index.html)) for these behaviours:

- [ ] **Stable layout via banded forces.** `forceX` / `forceY` per category produces predictable layouts across loads. Centre + collide alone produces a different blob each time.
- [ ] **Position preservation across resize.** State saved by node id, rescaled to new dimensions, restored on rerender.
- [ ] **Ambient nudge.** Low-amplitude periodic alpha kick keeps the graph "alive". Skipped under `prefers-reduced-motion`.
- [ ] **Mobile label compaction.** Long labels mapped to short forms below ~760px; layout aspect-ratio shifted.
- [ ] **Coarse-pointer hit areas.** Larger invisible circles overlaid for touch; drag-vs-tap distinguished by movement threshold.
- [ ] **Fallback messaging.** Visible fallback paragraph when D3 fails to load.
- [ ] **Reduced-motion path.** Run the simulation synchronously then stop; do not animate.

For animations driven by `d3.timer` or `requestAnimationFrame`:

- [ ] Active timer is held in a variable and stopped before re-running, to avoid duplicate timers stacking on resize.
- [ ] Reduced-motion fallback renders a single representative static frame.

### Report

- Inconsistent behavior causing errors/confusion (Must).
- Behavioural parity gaps with established precedent for the same pattern (Should).
- State/motion inconsistencies across components (Should).
- Micro-interaction polish improvements (Could).

### Verify

- Keyboard-only traversal.
- Reduced-motion and small-screen interaction pass.
- For repeat patterns: open the precedent and the new instance side by side, exercise the same gestures, confirm parity.

---

## UI Design System Review

### Scope

Visual consistency, token usage, component reuse, and style drift control.

### Review order (do not skip the first three)

1. **Container / layout context.** Does the new section sit in the same outer container as comparable sections? `main--narrow` (720px) vs `main` (1140px) vs full-bleed produces wildly different effective canvas widths.
2. **Token tier.** Saturated `--viz-*` data-viz tokens, light/pastel accents (`--rust-light`, `--gold`, `--sage-light`), neutral UI tokens (`--ink*`), and chrome microtype tokens (`--mono`) each signal a different role. Mixing tiers fragments the palette.
3. **Pattern reuse vs invention.** Before authoring a new component, search for existing precedent. New CSS blocks only when no precedent exists and the divergence is intentional.
4. Color, typography, spacing consistency against tokens.
5. Component variants and repeated custom one-offs.
6. Page-to-page visual drift and ad-hoc overrides.

### Check

#### Container and width

- [ ] New section sits in the same `main--narrow` / `main` / full-bleed context as comparable sections.
- [ ] Visualizations that need width use the established full-bleed pattern (`width: 100vw; margin-left: calc(50% - 50vw)` with an inner max-width).
- [ ] No phantom containment: bordered "card" wrappers around a viz are absent unless every comparable surface uses them.

#### Token tier

- [ ] Palette tier matches the closest precedent (force graph → `--rust-light`/`--gold`/`--sage-light`; in-simulation viz → `--viz-*`; UI chrome → `--ink*`).
- [ ] Same component family across the site shares colour tokens, not just "any token from the system."
- [ ] Background fills don't accidentally use `--paper` where transparent or accent fill is meant.

#### Pattern reuse

- [ ] Identified the existing precedent before writing a new component (force graph, legend, scoreboard, controls form, status line, story panel).
- [ ] Reused the precedent's class names where behaviour overlaps; new classes only for genuinely new affordances.
- [ ] Did not introduce a third dialect of an already-doubled pattern.

#### Visual encoding

- [ ] Number of visual dimensions (size, fill, stroke colour, stroke style, dash, opacity) is justified by the number of categories. More than ~3 simultaneous encodings usually signals the category model is wrong.
- [ ] Legend swatches share inline-size, block-size, and stroke unless variation is itself encoded.

#### Microtype convention

- [ ] Viz chrome (legend microcopy, helper text, axis labels) uses the mono-uppercase tier (`font-family: var(--mono); font-size: 0.6–0.75rem; letter-spacing: 0.04–0.08em; text-transform: uppercase`), not body sans-serif sentence case.
- [ ] Captions on visualizations are instruction-level, not category-restating.

### Report

- Token bypasses or wrong-tier choices that fragment the visual system (Should).
- Layout-context mismatches on primary surfaces (Must).
- Accessibility-threatening contrast/state issues (Must).
- Component consolidation opportunities (Could).

### Verify

- Side-by-side page comparison at multiple viewport widths (320, 720, 1180, 1440).
- Token-level diff for hardcoded values and tier mismatches.
- For each new CSS class, confirm no equivalent existing class was overlooked.
- For visualizations, compare against the closest existing visualization.

### Anti-patterns to flag

- A visualization in `main--narrow` when an equivalent uses full-bleed.
- A component using saturated `--viz-*` tokens when comparables use the pastel tier.
- A legend, detail panel, or scoreboard as a new pattern when 1–2 dialects already exist.
- A bordered/padded "stage" wrapper when comparable visualizations are flush with the page.
- Body-sans sentence-case microcopy for viz chrome instead of mono-uppercase.
