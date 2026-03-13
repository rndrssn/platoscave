---
id: PRINCIPLE-responsive
type: PRINCIPLE
title: To the Bedrock — Responsive Design Specification
status: ACTIVE
created: 2026-03-13
updated: 2026-03-13
owner: Robert Andersson
relates_to: [VISION-product, PRINCIPLE-design-system, EPIC-navigation]
tags: [responsive, mobile, ux, css, breakpoints]
---

# To the Bedrock — Responsive Design Specification

## Principle

The site must work well on all screen sizes. Mobile is not a degraded fallback — it is a first-class reading and interaction context. Given the content is intellectually dense, the mobile experience should prioritise **legibility and calm** over feature parity with desktop.

All interactive modules must be usable on touch devices. Visualizations must adapt gracefully — simplified where necessary, never broken.

---

## Breakpoints

Three breakpoints, mobile-first:

```css
/* Base styles: mobile — up to 640px */

/* Tablet */
@media (min-width: 640px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }
```

No breakpoints beyond `1024px` — the `1140px` max-width container handles large screens naturally.

---

## Layout Behaviour by Breakpoint

### Navigation Bar

| Breakpoint | Behaviour |
|---|---|
| Mobile | Site name left. Right side: `MENU` text toggle in DM Mono. Links hidden until toggled. |
| Tablet+ | Full nav bar — site name left, links right. No toggle. |

Mobile menu when open: links stack vertically below the bar in a simple dropdown panel. Background `var(--paper-dark)`, full width, `1px` bottom border in `var(--ink-ghost)`. No animation required — a simple show/hide is sufficient.

### Hero Section (`index.html`)

| Breakpoint | Behaviour |
|---|---|
| Mobile | Single column. Visualization moves **below** the text. Visualization height reduced to `280px`. |
| Tablet | Single column. Visualization at `340px`. |
| Desktop | Two-column grid `1fr 420px`. Visualization at `420px`. |

### Module Index Page

Single column at all breakpoints — no change needed. The list layout is naturally responsive.

Adjust font sizes slightly on mobile:

| Element | Desktop | Mobile |
|---|---|---|
| Module title | `1.5rem` | `1.25rem` |
| Descriptor | `0.95rem` | `0.9rem` |
| Number | `0.7rem` | `0.7rem` (unchanged) |

### Module Cards (if used on landing)

| Breakpoint | Behaviour |
|---|---|
| Mobile | Single column stack |
| Tablet | Two column grid |
| Desktop | Three column grid |

### Individual Module Pages

| Breakpoint | Behaviour |
|---|---|
| Mobile | Single column. Full width visualization. Module header stacks vertically. |
| Tablet+ | As designed. |

---

## Typography on Mobile

- Base font size remains `18px` — do not reduce on mobile, legibility is paramount
- Max line length (`62ch`) naturally constrains itself on small screens — no change needed
- Heading sizes scale down using `clamp()`:

```css
/* Example */
font-size: clamp(1.8rem, 5vw, 4.2rem);
```

- Use `clamp()` for all display headings so they scale fluidly without breakpoint-specific overrides

---

## Visualizations on Mobile

This is the most critical responsive concern. All d3.js and Three.js visualizations must:

1. **Read their container width** at render time — never use hardcoded pixel widths
2. **Re-render on resize** — listen to `window.resize` with a debounce of `~150ms`
3. **Simplify on small screens** where appropriate — fewer nodes, reduced complexity, larger touch targets
4. **Never overflow** their container — `overflow: hidden` on the visualization wrapper

```js
// Pattern to follow for all d3 visualizations
const container = document.getElementById('vis-container');
const width = container.clientWidth;
const height = /* calculated from width or fixed ratio */;
```

Touch interactions replace mouse interactions:
- Hover tooltips become tap-to-reveal
- Drag interactions must support touch events (`touchstart`, `touchmove`, `touchend`)
- Minimum touch target size: `44px × 44px` (Apple HIG standard)

---

## Forms & Diagnostics on Mobile

For the Complexity Maturity Diagnostic and any other form-based modules:

- Single column layout at all times — no side-by-side form fields
- Input labels always above their input, never inline
- Submit/action buttons full width on mobile
- Sufficient padding on interactive elements for comfortable touch use

---

## General Rules

- No horizontal scrolling at any breakpoint — ever
- No fixed-width elements that could cause overflow
- Images and SVGs: `max-width: 100%` always
- Test at `375px` width (iPhone SE) as the minimum viable screen size
- Avoid `hover`-only interactions — any hover state must have a touch/focus equivalent

---

## References

- PRINCIPLE-design-system.md — color, typography, and layout tokens
- EPIC-navigation.md — mobile nav toggle behaviour (noted above)
