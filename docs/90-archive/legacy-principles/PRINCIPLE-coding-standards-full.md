---
id: PRINCIPLE-coding-standards
type: PRINCIPLE
title: To the Bedrock — Coding Standards
status: ACTIVE
created: 2026-03-15
updated: 2026-03-19
owner: Robert Andersson
relates_to: [VISION-product, PRINCIPLE-design-system]
tags: [code, standards, css, javascript, separation-of-concerns]
---

# To the Bedrock — Coding Standards

## Philosophy

This project is built on plain HTML, CSS, and JavaScript. No framework. No build step. The simplicity is intentional — it keeps deployment trivial, dependencies minimal, and the codebase legible to anyone.

The guiding principle is **separation of concerns**. Each file has one job. Files do not reach into each other's domain. This makes the codebase predictable, maintainable, and safe to hand to Claude Code incrementally.

---

## The Single Responsibility Rule

Every file in this project has exactly one responsibility:

| File | Responsibility |
|------|---------------|
| `css/main.css` | CSS import entrypoint and cascade order |
| `css/tokens.css` + `css/themes.css` | Visual tokens and theme overrides |
| `theme.config.js` | Single source of truth for active site-wide theme |
| `js/theme-bootstrap.js` | Applies configured theme to `<html data-theme='...'>` at runtime |
| `gc-simulation.js` | Simulation logic only — no UI, no DOM |
| `gc-scoring.js` | Scoring logic only — no UI, no DOM |
| `modules/*/index.html` | Structure and wiring only — no logic, no inline styles |
| `docs/*.md` | Content, decisions, and specifications |

If a file is doing more than one job, it needs to be refactored.

---

## CSS Rules

### No inline styles
Inline styles are forbidden everywhere. No exceptions.

```html
<!-- Never do this -->
<p style="font-family: monospace; color: #9C8E78;">Label</p>

<!-- Always do this -->
<p class="section-label">Label</p>
```

### No CSS outside `css/`
All CSS lives in the layered files under `css/` (`tokens`, `base`, `layout`, `components`, `utilities`, `themes`, `pages`). No `<style>` blocks in HTML files.

### Use existing tokens
All colors, fonts, and spacing must reference CSS custom properties defined in `tokens.css` and overridden in `themes.css`. Never hardcode values that have a token equivalent.

```css
/* Never do this */
color: #8B3A2A;

/* Always do this */
color: var(--rust);
```

### Use existing classes
Before writing any new CSS, check whether an existing class already covers the need. The design system provides classes for all common patterns — section labels, module numbers, descriptors, status badges, contact items, and so on.

### One source of truth per layer
Do not duplicate foundational selectors across CSS layers. `layout.css` owns layout primitives (`main`, `section`, core spacing). `components.css` owns reusable components. `pages.css` owns module/page overrides.

If a selector exists in one layer, changes must be made there rather than duplicated elsewhere.

### Accessibility-first interaction states
All interactive controls must support `:focus-visible` with a clear visible outline. Never remove outlines without replacing them with an equally visible focus treatment.

Hover-only affordances are insufficient; keyboard users must get equivalent state cues.

### Reduced-motion support is required
Any new animation/transition must be compatible with `prefers-reduced-motion`. Prefer targeted motion overrides over broad global disabling unless explicitly required.

---

## JavaScript Rules

### No logic in HTML files
HTML files wire components together — they do not contain business logic. Logic belongs in dedicated `.js` files.

```html
<!-- Never do this -->
<script>
  function scoreResponses(responses) {
    // scoring logic here
  }
</script>

<!-- Always do this -->
<script src="/gc-scoring.js"></script>
<script>
  const result = scoreResponses(responses);
</script>
```

### Each JS file exposes a documented public API
Every `.js` file must have a comment block at the top documenting its public functions — what they accept, what they return. Internal helper functions are not part of the public API and should not be called from outside the file.

### No DOM manipulation in logic files
`gc-simulation.js` and `gc-scoring.js` must have zero knowledge of the DOM. They accept inputs and return outputs. The HTML file is responsible for reading from and writing to the DOM.

```js
// Never do this in gc-scoring.js
document.getElementById('result').textContent = score;

// Always do this — return the value, let the HTML file handle the DOM
return { energyLoad, decisionStructure, accessStructure, raw };
```

### No unsafe HTML injection
Avoid `innerHTML` when rendering computed values. Prefer `textContent` and explicit DOM node creation.

Use `innerHTML` only when rendering trusted static template fragments that cannot include user or computed content.

### Keep the main thread responsive
Computationally heavy work (for example Monte Carlo loops) must not block UI interactions. Use async chunking or Web Workers for long-running tasks.

UI handlers should update affordances during async work (disabled buttons, progress labels).

### Progressive enhancement required
Core navigation and content access must work without JavaScript. JS may enhance behavior (collapsible nav, smooth scrolling, dynamic highlighting), but must not be required for baseline access.

### No external dependencies without explicit approval
The project uses d3.js (loaded from CDN) and the Google Fonts API. No other external dependencies may be added without an ADR documenting the decision.

---

## HTML Rules

### Clean directory-style URLs
Never reference `index.html` explicitly in any link. Always use clean directory URLs. This is documented in `EPIC-navigation.md` and applies everywhere.

```html
<!-- Never do this -->
<a href="modules/garbage-can/index.html">Garbage Can</a>

<!-- Always do this -->
<a href="/modules/garbage-can/">Garbage Can</a>
```

### Theme bootstrap in head
Every HTML page loads `theme.config.js` and `js/theme-bootstrap.js` in `<head>` before `css/main.css`. This ensures a single config controls theme selection across all pages.

```html
<!-- Root page -->
<script src="theme.config.js"></script>
<script src="js/theme-bootstrap.js"></script>
<link rel="stylesheet" href="css/main.css" />

<!-- Module page at /modules/garbage-can/ -->
<script src="../../theme.config.js"></script>
<script src="../../js/theme-bootstrap.js"></script>
<link rel="stylesheet" href="../../css/main.css" />
```

Never hardcode `data-theme` on individual HTML pages unless explicitly required for a temporary experiment.

### Scripts at end of body
All page/application scripts go at the end of `<body>`, after all content.
Exception: theme bootstrapping (`theme.config.js` + `js/theme-bootstrap.js`) runs in `<head>` to avoid flash of wrong theme.

### Semantic structure is mandatory
Use semantic elements for interaction and form structure:
- Use `<a>` only for real navigation.
- Do not simulate links with `div role="link"` for normal UI states.
- Group radio questions with `<fieldset>` and `<legend>`.
- Keep heading levels and landmark usage (`<main>`, `<nav>`, `<header>`, `<footer>`) consistent.

### Accessibility metadata baseline
Every page must include:
- Skip link to main content
- `id` on `<main>` target
- Mobile nav toggle `aria-controls` + `aria-expanded` updates
- `meta name="description"` for discoverability and preview quality

---

## File Naming

Follows `DOC-CONVENTIONS.md` for all docs. For code files:

- JS files: lowercase, hyphen-separated — `gc-simulation.js`, `gc-scoring.js`
- HTML files: always `index.html` inside a named directory
- No numbered prefixes on JS or HTML files

---

## Content and Interaction Semantics

### Preserve ontology and taxonomy terms
For theory-driven modules (for example Garbage Can), labels and copy must use canonical model terms consistently across:
- Narrative
- Taxonomy
- Controls
- Simulation legends/readouts
- Diagnosis text

Do not drift between synonymous terms if the model distinguishes them (for example choice-level outcomes vs problem-level outcomes).

### Pair metrics with the right unit of analysis
UI labels must match what is computed:
- Choice-level metrics must be labeled as choice opportunities/choice styles
- Problem-level metrics must be labeled as problem outcomes

Any mixed-unit summary is a bug unless explicitly and clearly separated.

### Use neutral system-state language
Avoid loaded status labels in live simulations. Prefer descriptive neutral states (for example “System stalled”) over judgmental phrasing.

---

## Instructions for Claude Code

When working on any file in this project, Claude Code must:

1. **Read this file first** before writing any code
2. **Read `css/main.css` and `docs/CSS-ARCHITECTURE.md`** before adding styles — use existing layers, tokens, and classes
3. **Never add inline styles** — use CSS classes only
4. **Never add `<style>` blocks** to HTML files
5. **Never add logic to HTML files** — logic belongs in `.js` files
6. **Never hardcode color or font values** — use CSS custom properties
7. **Switch global theme only via `theme.config.js`** — do not edit every HTML file
8. **Never add external dependencies** without explicit instruction
9. **Always use clean directory-style URLs** — never reference `index.html` explicitly
10. **Check existing classes before writing new CSS** — the design system covers most cases
11. **Keep JS files DOM-free** — logic files accept inputs and return outputs only
12. **Treat accessibility as a release gate** — focus-visible, keyboard access, semantic forms, and ARIA state updates are mandatory
13. **Do not use `innerHTML` for computed output** — use safe DOM/text APIs
14. **Keep heavy computation off blocking interaction paths** — use async chunking/worker patterns
15. **Preserve model ontology in UI copy** — labels must match taxonomy and computed metric units

These rules apply to every task regardless of how the HANDOFF is worded. They are not optional constraints — they are the baseline.

---

## PR Checklist

Every production PR must confirm the following before merge:

- [ ] No inline styles, no `<style>` blocks, and no hardcoded token-equivalent colors/fonts
- [ ] CSS changes are in the correct layer (`layout`, `components`, `pages`) with no duplicated foundational selectors
- [ ] All interactive controls have visible keyboard focus (`:focus-visible`) and non-hover state parity
- [ ] Reduced-motion behavior has been considered for any new animation/transition
- [ ] Navigation and core content remain usable without JavaScript (progressive enhancement preserved)
- [ ] No simulated links (`div role="link"`) for normal navigation UI
- [ ] Form controls are semantically grouped (`fieldset`/`legend` for radio groups)
- [ ] Accessibility metadata present where applicable (skip link, main target id, nav ARIA state updates, page description)
- [ ] No `innerHTML` for computed/dynamic values; safe DOM APIs used
- [ ] Heavy computation does not block interaction paths (async chunking or worker strategy)
- [ ] Labels/copy preserve module ontology and taxonomy semantics
- [ ] Metric labels match computed unit of analysis (choice-level vs problem-level)
- [ ] Any external dependency change is documented via ADR and explicitly approved
- [ ] Relevant automated checks/tests have been run and pass
