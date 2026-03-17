---
id: PRINCIPLE-coding-standards
type: PRINCIPLE
title: To the Bedrock — Coding Standards
status: ACTIVE
created: 2026-03-15
updated: 2026-03-17
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

---

## File Naming

Follows `DOC-CONVENTIONS.md` for all docs. For code files:

- JS files: lowercase, hyphen-separated — `gc-simulation.js`, `gc-scoring.js`
- HTML files: always `index.html` inside a named directory
- No numbered prefixes on JS or HTML files

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

These rules apply to every task regardless of how the HANDOFF is worded. They are not optional constraints — they are the baseline.
