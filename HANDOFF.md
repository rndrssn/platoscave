# HANDOFF.md

## Ready for Claude Code

### Task: Apply interactive element hierarchy across all pages
- Files: `css/main.css`, `modules/garbage-can/assess/index.html`, `modules/garbage-can/explorer/index.html`, `modules/garbage-can/index.html`, `modules/garbage-can/taxonomy/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md`, `docs/PRINCIPLE-coding-standards.md`, and `docs/PRINCIPLE-interactive-elements.md` before touching anything

---

## Context

A new principle has been added: `docs/PRINCIPLE-interactive-elements.md`. It defines four tiers of interactive elements. The current site uses them inconsistently. This handoff applies the hierarchy across all pages.

---

## Fix 1 — Update CSS classes in `css/main.css`

### 1a — Keep `.submit-btn` as the primary CTA (Tier 1)

No change needed — the current `.submit-btn` styling is correct for Tier 1. It stays as-is.

### 1b — Standardise secondary actions (Tier 2)

The `.replay-btn` and `.collapsible-toggle` should look identical — plain text, no border.

Find `.collapsible-toggle`:
```css
.collapsible-toggle {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-faint);
  background: none;
  border: 1px solid var(--ink-ghost);
  padding: 0.75rem 2rem;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
  margin-bottom: 1.5rem;
}

.collapsible-toggle:hover {
  border-color: var(--ink-mid);
  color: var(--ink);
}
```

Replace with:
```css
.collapsible-toggle {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-faint);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: color 0.2s ease;
  margin-bottom: 1.5rem;
}

.collapsible-toggle:hover {
  color: var(--rust);
}
```

This matches `.replay-btn` — plain text, no border, rust on hover.

### 1c — Add underline on hover to navigation links (Tier 3)

Find `.diagnosis-link`:
```css
.diagnosis-link {
  font-family: var(--mono);
  font-size: 0.6rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sage);
  text-decoration: none;
  transition: color 0.2s ease;
}

.diagnosis-link:hover {
  color: var(--sage-light);
}
```

Replace with:
```css
.diagnosis-link {
  font-family: var(--mono);
  font-size: 0.6rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sage);
  text-decoration: none;
  transition: color 0.2s ease;
}

.diagnosis-link:hover {
  color: var(--sage-light);
  text-decoration: underline;
}
```

Also update `.footer-nav-link`:

Find:
```css
.footer-nav-link:hover {
  color: var(--ink-mid);
}
```

Replace with:
```css
.footer-nav-link:hover {
  color: var(--ink-mid);
  text-decoration: underline;
}
```

### 1d — Remove border from tags (Tier 4)

Find `.module-tag`:
```css
.module-tag {
  font-family: var(--mono);
  font-size: 0.58rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  border: 1px solid var(--ink-ghost);
  padding: 0.2rem 0.5rem;
}
```

Replace with:
```css
.module-tag {
  font-family: var(--mono);
  font-size: 0.58rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  padding: 0;
}
```

Border removed, padding removed — tags are now plain text.

### 1e — Add separator between tags

Without borders, adjacent tags need a visual separator. Update `.module-tags`:

Find:
```css
.module-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
```

Replace with:
```css
.module-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.module-tag + .module-tag::before {
  content: '\00B7';
  margin-right: 0.25rem;
  color: var(--ink-ghost);
}
```

Tags now render as: `Garbage Can Model · Organisational theory · Decision science`

---

## Fix 2 — Update essay link cards on the narrative page

The essay link cards on `modules/garbage-can/index.html` should use sage for the label text to signal "this is a link."

Find in `css/main.css`:
```css
.essay-link-label {
  display: block;
  font-family: var(--serif-alt);
  font-weight: 300;
  font-style: italic;
  font-size: 1.15rem;
  color: var(--ink);
  margin-bottom: 0.25rem;
}
```

Replace with:
```css
.essay-link-label {
  display: block;
  font-family: var(--serif-alt);
  font-weight: 300;
  font-style: italic;
  font-size: 1.15rem;
  color: var(--sage);
  margin-bottom: 0.25rem;
  transition: color 0.2s ease;
}

.essay-link:hover .essay-link-label {
  color: var(--sage-light);
}
```

---

## Fix 3 — Verify across all pages

Check each page and confirm:

| Page | Primary CTAs (bordered) | Secondary actions (plain text) | Navigation links (sage + underline hover) | Tags (no border) |
|---|---|---|---|---|
| Narrative | none | none | Essay link cards (sage label) | Garbage Can Model, etc. |
| Taxonomy | none | none | Footer nav, Explore Further links | none |
| Explorer | Run simulation | Run again | Footer nav | none |
| Assess | Continue, Map this organisation, See how decisions play out | Run again, Retake assessment | Diagnosis links, Footer nav | Garbage Can Model, etc. |

Fix any elements that don't match their tier.

---

## Verification

1. **Tags** — should look like plain metadata text, not clickable boxes
2. **Diagnosis links** — sage text, underline appears on hover
3. **Retake assessment** — plain text like "Run again", no border
4. **Footer nav links** — underline on hover
5. **Essay link cards** — sage label text, sage-light on hover
6. **Primary CTAs** — only bordered buttons are Continue, Map this organisation, See how decisions play out, Run simulation

---

## Notes
- This is a CSS-only change for most fixes — HTML stays the same
- The `.module-tag` border removal affects all pages that use tags (narrative, assess, and any placeholder pages)
- The middot separator between tags uses a CSS `::before` pseudo-element — no HTML changes needed
- Follow `docs/PRINCIPLE-interactive-elements.md` for all future interactive elements
- Stay on `experiment/organised-anarchy-mapper`
