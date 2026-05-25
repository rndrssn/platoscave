# Design System Consolidation Backlog

This backlog separates design debt from intentional contextual variation. Use it to decide what the next iteration of the design-system page should make canonical, what should remain module-specific, and what should be retired.

The live design-system page is the current reference for what to use. When a backlog item is resolved, update `design-system/index.html` to show the new canonical pattern and update or remove the item here.

## High Priority

### Action and control hierarchy

**Status:** Partially resolved in `design-system/index.html` as a simplified target model. The page now shows fewer canonical control primitives and has removed duplicate peer specimens for switches, chips, and contextual module controls. Production CSS and component consolidation remain open.

**Current variants:** `.submit-btn`, `.satellite-analyse-btn`, Flow presets, Document Map anchors, Products Over Projects risk chips, ghost text toggles.

**Problem:** The design-system page shows several controls that look like actions, filters, mode switches, or chips without defining their hierarchy. A contributor cannot infer what style means "primary action" versus "choose a mode" versus "filter a visualisation."

**Direction:** Keep the canonical roles visible in the design-system page: primary action, secondary action, segmented mode switch, filter chip, binary toggle, and text disclosure. Next, map production classes to these roles with shared naming or explicit contextual exceptions.

**Do not break:** Flow preset reseeding, Document Map `aria-pressed` anchor switching, risk assessment radio semantics, and Satellite viewport-analysis state changes.

### Yellow switch/action family

**Status:** Open. The simplified control model names the roles, but yellow still needs a semantic owner before production styles are changed.

**Current variants:** CV/Skills switch, Satellite Basemap/Terrain switch, Satellite Analyse viewport action, Satellite Base map toggle.

**Problem:** Yellow currently signals both a strong primary action and a mode-switch surface. That makes the accent memorable, but semantically blurry.

**Direction:** Choose one semantic owner for yellow: either experience-mode controls or high-emphasis actions. If both remain yellow, document a shared "high-attention control" family with size/state variants.

**Do not break:** Satellite HUD contrast over imagery and the CV/Skills shell identity.

## Medium Priority

### Card and row taxonomy

**Current variants:** Simulation summary cards, field notes, note index cards, essay link cards, questionnaire cards, risk cards, catalogue rows, satellite PoC cards.

**Problem:** Most share card tokens, but the system does not say when something should be a card, a row, a callout, or a navigation tile.

**Direction:** Create a card taxonomy: informational card, action card, assessment card, callout, catalogue row, and metric/result card. Keep accent colors semantic, not decorative.

**Do not break:** Existing card token primitives and compact academic tone on Products Over Projects.

### Visualisation chrome

**Current variants:** Force graph legend/helper/detail, Mix Mapper legend, Document Map legend/tooltip, Flow mini legend/readouts, Satellite status and surface controls.

**Problem:** These patterns are visually related through mono microtype and subdued ink, but they are not named as one chrome system.

**Direction:** Define a visualisation chrome layer: helper text, legend item, legend filter button, tooltip, transient detail, status, and metric readout. Preserve module-specific color semantics underneath.

**Do not break:** Force graph shared interaction classes, Mix Mapper legend order, Flow chart token policy, and Satellite HUD constraints.

### Specimen state model

**Current variants:** Some states use real classes, some use inline snapshots, some are clickable but inert, and some expose static `aria-pressed` state.

**Problem:** The design-system page does not say whether examples are interactive components, inert specimens, or forced state snapshots. That makes accessibility and state guidance ambiguous.

**Direction:** Adopt one specimen convention: static state snapshots by default, with labels for Default, Hover, Focus, Active, Disabled, Working, and Error. Only add behavior where the design-system page is explicitly testing interaction.

**Do not break:** Keyboard visibility and testable static markup for navigation/link checks.

## Low Priority

### Page IA and governance

**Current variants:** Foundations, components, and module surfaces are all presented in one long numbered stream.

**Problem:** The page is complete enough to audit the site, but not yet shaped like a maintainable system reference.

**Direction:** Restructure next: Foundations, Canonical components, Visualisation patterns, Module-specific exceptions, Known drift/backlog. Each pattern should have one canonical specimen and optional contextual references.

**Do not break:** The current exhaustive coverage. The IA should clarify the inventory, not shrink it back into a narrow style guide.
