# Design System Consolidation Backlog

This backlog separates design debt from intentional contextual variation. Use it to decide what the next iteration of the design-system page should make canonical, what should remain module-specific, and what should be retired.

The live design-system page is the current reference for what to use. When a backlog item is resolved, update `design-system/index.html` to show the new canonical pattern and update or remove the item here.

## Acceptance Principle

Design-system consolidation should preserve the same overall site feel while reducing ambiguous pattern meanings. A resolved item should leave buttons, chips, switches, toggles, disclosures, and visualisation controls with intact default, hover, focus, active/selected, disabled, keyboard, and mobile wrapping states.

## Medium Priority Implementation Plan

Work the medium-priority items in this order: visualisation chrome, specimen state model, then card and row taxonomy. This sequence consolidates the most interaction-heavy surfaces first, then clarifies how the design-system page represents states, and only then tackles broader content containers.

1. **Visualisation chrome**
   - Plan status: Resolved.
   - Last touched: 2026-05-26.
   - Validation: `node tests/run-all.js` passed on 2026-05-26 after introducing the shared chrome vocabulary and first production mappings; manual smoke test passed on 2026-05-26.
   - Goal: name the shared layer for helper text, legends, legend filters, tooltips, transient detail, status, and metric readouts.
   - Implementation: add canonical chrome roles to `design-system/index.html`; introduce shared class vocabulary only where production surfaces already behave similarly; keep module-specific color semantics under the shared chrome layer.
   - Production impact: modest visual consolidation across force graphs, Mix Mapper, Document Map, Flow readouts, and Satellite HUD/status surfaces.
   - Validation focus: graph filters, tooltip/detail visibility, status/readout legibility, keyboard focus, mobile overlays, and Satellite Three HUD readability over dynamic map/canvas imagery.

2. **Specimen state model**
   - Plan status: Resolved.
   - Last touched: 2026-05-26.
   - Validation: `node tests/run-all.js` passed on 2026-05-26 after adding specimen-state guidance and visible state labels.
   - Goal: make design-system examples clearly either static snapshots, forced states, or intentionally interactive specimens.
   - Implementation: define a specimen convention in `design-system/index.html`; label state examples as Default, Hover, Focus, Active, Disabled, Working, and Error where relevant; avoid adding behavior unless the page is explicitly testing interaction.
   - Production impact: mostly design-system-page clarity, with little or no production CSS change.
   - Validation focus: link integrity, accessible labels, keyboard-visible focus examples, and no misleading inert controls.

3. **Card and row taxonomy**
   - Plan status: Resolved.
   - Last touched: 2026-05-26.
   - Validation: `node tests/run-all.js` passed on 2026-05-26 after adding the shared card/row vocabulary and canonical design-system mappings.
   - Goal: clarify when to use informational cards, action cards, assessment cards, callouts, catalogue rows, and metric/result cards.
   - Implementation: define the taxonomy in `design-system/index.html`; map current surfaces to the taxonomy; consolidate shared card anatomy only where existing cards already use the same token structure.
   - Production impact: potentially broader visual cleanup, so keep changes conservative and preserve academic/product tones by module.
   - Validation focus: catalogue rows, note/article cards, assessment cards, simulation summaries, metric cards, responsive wrapping, and hover/focus states.

## High Priority

### Action and control hierarchy

**Status:** Resolved. The design-system page shows fewer canonical control primitives, duplicate peer specimens have been removed, and production markup carries shared role classes for actions, segmented controls, chips, toggles, and disclosures. Shared role classes now own the common visual anatomy; page-specific classes keep contextual sizing, active states, and module-specific color semantics.

**Current variants:** `.submit-btn`, `.satellite-analyse-btn`, Flow presets, Document Map anchors, Products Over Projects risk chips, ghost text toggles.

**Problem:** The design-system page shows several controls that look like actions, filters, mode switches, or chips without defining their hierarchy. A contributor cannot infer what style means "primary action" versus "choose a mode" versus "filter a visualisation."

**Direction:** Keep the canonical roles visible in the design-system page: primary action, secondary action, segmented mode switch, filter chip, binary toggle, and text disclosure. Use the shared role classes for common anatomy, and keep page-specific classes for contextual exceptions.

**Do not break:** Flow preset reseeding, Document Map `aria-pressed` anchor switching, risk assessment radio semantics, and Satellite viewport-analysis state changes.

### Attention control accent family

**Status:** Resolved. The high-attention control accent now belongs to mode/context controls, not ordinary primary actions. The current theme renders this accent as yellow/gold, but the rule is token-driven and may render differently in another theme.

**Current variants:** CV/Skills switch, Satellite Basemap/Terrain switch, Satellite Analyse viewport action, Satellite Base map toggle.

**Problem:** The same accent previously signalled both a strong primary action and a mode-switch surface. That made the accent memorable, but semantically blurry.

**Direction:** Use `--control-attention-*` tokens for high-attention mode/context controls, including segmented switches, active toggles, and compact HUD context readouts. Primary actions should use the primary action language for their surface and state, not the attention-control accent by default.

**Do not break:** Satellite HUD contrast over imagery and the CV/Skills shell identity.

## Medium Priority

### Visualisation chrome

**Status:** Resolved. Shared vocabulary lives in `css/components/viz-chrome.css`, the design-system page names the chrome roles, and first production mappings are in place for helper, legend, legend filter, tooltip/detail, status, and readout surfaces.

**Current variants:** Force graph legend/helper/detail, Mix Mapper legend, Document Map legend/tooltip, Flow mini legend/readouts, Satellite status and surface controls.

**Problem:** These patterns are visually related through mono microtype and subdued ink, but they are not named as one chrome system.

**Direction:** Define a visualisation chrome layer: helper text, legend item, legend filter button, tooltip, transient detail, status, and metric readout. Preserve module-specific color semantics underneath. Overlay chrome, especially the Satellite Three HUD, may keep page-specific contrast and backing rules so it stays readable on top of dynamic canvases.

**Do not break:** Force graph shared interaction classes, Mix Mapper legend order, Flow chart token policy, Satellite HUD constraints, and Satellite Three HUD readability over dynamic map/canvas imagery.

### Specimen state model

**Status:** Resolved. `design-system/index.html` now defines static snapshots, forced states, and interactive specimens; key control, status, legend, detail, and tooltip examples are labelled with visible state markers.

**Current variants:** Some states use real classes, some use inline snapshots, some are clickable but inert, and some expose static `aria-pressed` state.

**Problem:** The design-system page does not say whether examples are interactive components, inert specimens, or forced state snapshots. That makes accessibility and state guidance ambiguous.

**Direction:** Adopt one specimen convention: static state snapshots by default, with labels for Default, Hover, Focus, Active, Disabled, Working, and Error. Only add behavior where the design-system page is explicitly testing interaction.

**Do not break:** Keyboard visibility and testable static markup for navigation/link checks.

### Card and row taxonomy

**Status:** Resolved. Shared taxonomy classes live in `css/components/cards.css`, the design-system page maps canonical card and row roles to current surfaces, and production markup remains conservative where existing tests depend on exact class strings.

**Current variants:** Simulation summary cards, field notes, note index cards, essay link cards, questionnaire cards, risk cards, catalogue rows, satellite PoC cards.

**Problem:** Most share card tokens, but the system does not say when something should be a card, a row, a callout, or a navigation tile.

**Direction:** Create a card taxonomy: informational card, action card, assessment card, callout, catalogue row, and metric/result card. Keep accent colors semantic, not decorative.

**Do not break:** Existing card token primitives and compact academic tone on Products Over Projects.

## Low Priority

### Page IA and governance

**Status:** Resolved. `design-system/index.html` now starts with a system map that groups the exhaustive inventory into foundations, canonical components, visualisation patterns, module exceptions, and governance. The maintenance section records the update loop for production changes, canonical shared CSS, and unresolved drift.

**Current variants:** Foundations, components, and module surfaces are all presented in one long numbered stream.

**Problem:** The page is complete enough to audit the site, but not yet shaped like a maintainable system reference.

**Direction:** Restructure next: Foundations, Canonical components, Visualisation patterns, Module-specific exceptions, Known drift/backlog. Each pattern should have one canonical specimen and optional contextual references.

**Do not break:** The current exhaustive coverage. The IA should clarify the inventory, not shrink it back into a narrow style guide.
