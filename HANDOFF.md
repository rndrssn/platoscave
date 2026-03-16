# HANDOFF.md

## Ready for Claude Code

### STORY 6: Navigation and integration — cross-link all pages, update module index
- Files: `modules/index.html`, `modules/garbage-can/index.html`, `modules/garbage-can/taxonomy/index.html`, `modules/garbage-can/explorer/index.html`, `modules/garbage-can/assess/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Epic: `docs/EPIC-garbage-can-restructure.md`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context

All four garbage-can sub-pages now exist. This final story ensures they are properly cross-linked and the module index reflects the new structure.

---

## Fix 1 — Update the module index page

The module index (`modules/index.html`) currently shows module 03 as "Coming". Update it to "Live" with a working link. Optionally show the four sub-pages.

Find in `modules/index.html` the module 03 entry:

```html
        <li class="module-entry module-entry--coming">
          <div class="module-entry-main">
            <div class="module-entry-title-row">
              <span class="module-number">03 &middot;</span>
              <span class="module-title">The Garbage Can Model</span>
            </div>
            <p class="module-descriptor">Organisational choice under ambiguity.</p>
          </div>
          <span class="module-status status-coming">Coming</span>
        </li>
```

Replace with:

```html
        <li class="module-entry module-entry--live">
          <a href="garbage-can/" style="text-decoration:none;color:inherit;display:contents;">
            <div class="module-entry-main">
              <div class="module-entry-title-row">
                <span class="module-number">03 &middot;</span>
                <span class="module-title">The Garbage Can Model</span>
              </div>
              <p class="module-descriptor">Organisational choice under ambiguity.</p>
            </div>
            <span class="module-status status-live">Live</span>
          </a>
        </li>
```

Note: the inline style on the `<a>` is a pragmatic workaround. If there's already a pattern in the CSS for clickable module entries, use that instead. Otherwise, add a class:

```css
.module-entry-link {
  text-decoration: none;
  color: inherit;
  display: contents;
}
```

And use `<a class="module-entry-link" href="garbage-can/">`.

---

## Fix 2 — Verify all footer nav links across sub-pages

Check each sub-page has correct footer nav. The pattern is:

| Page | Left link | Right link |
|------|-----------|------------|
| `/modules/garbage-can/` (narrative) | `← Previous` → `../maturity/` | `Next →` → `../mix-mapper/` |
| `/modules/garbage-can/taxonomy/` | `← The Garbage Can Model` → `../` | `Explorer →` → `../explorer/` |
| `/modules/garbage-can/explorer/` | `← The Garbage Can Model` → `../` | `Self-Assessment →` → `../assess/` |
| `/modules/garbage-can/assess/` | `← The Garbage Can Model` → `../` | `Explorer →` → `../explorer/` |

The narrative page links to sibling modules (maturity, mix-mapper) because it's the module root. The sub-pages link back to the narrative and to each other.

Verify each file matches this table. Fix any that don't.

---

## Fix 3 — Verify the narrative page's "Explore the Model" links

In `modules/garbage-can/index.html`, the essay links section should point to:

```html
            <a class="essay-link" href="taxonomy/">
            <a class="essay-link" href="explorer/">
            <a class="essay-link" href="assess/">
```

These are relative to the narrative page's location. Verify they work.

---

## Fix 4 — Verify the assess page's contextual diagnosis links

In `modules/garbage-can/assess/index.html`, after the diagnosis:

```html
            <a class="diagnosis-link" href="../taxonomy/">Read more about the organisation types</a>
            <a class="diagnosis-link" href="../">Understand the model</a>
```

Verify these link correctly.

---

## Fix 5 — Add scroll restoration to all sub-pages

Each sub-page should have scroll restoration at the top of its script block. Verify all four sub-pages have:

```js
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
```

---

## Fix 6 — Test all navigation paths

Verify these paths work by clicking through:

1. Module index → click module 03 → narrative page
2. Narrative → "Taxonomy" link → taxonomy page
3. Narrative → "Simulation Explorer" link → explorer page
4. Narrative → "Self-Assessment" link → assess page
5. Taxonomy → "← The Garbage Can Model" → narrative
6. Taxonomy → "Explorer →" → explorer
7. Explorer → "← The Garbage Can Model" → narrative
8. Explorer → "Self-Assessment →" → assess
9. Assess → "← The Garbage Can Model" → narrative
10. Assess → "Explorer →" → explorer
11. Assess → diagnosis link "Read more about the organisation types" → taxonomy
12. Assess → diagnosis link "Understand the model" → narrative

Report any broken links. Do not create placeholder pages for maturity or mix-mapper — those are future modules.

---

## Notes
- This is a verification and wiring story — minimal code changes, mostly checking and fixing links
- Use clean directory URLs everywhere — never reference `index.html` explicitly
- The narrative page keeps its sibling module links (maturity, mix-mapper) in the footer nav — these will 404 until those modules are built, which is expected
- Do not change any simulation, scoring, or visualization logic
- Stay on `experiment/organised-anarchy-mapper`
