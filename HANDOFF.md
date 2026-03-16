# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — rename choice-level "Resolution" to "Deliberation"
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context

The summary shows "Resolution: 10%" at the choice level and "Resolved: 0 of 20" at the problem level. These use nearly identical words but measure different things. Users see a contradiction. Rename the choice-level term to "Deliberation" to avoid confusion.

---

## Fix 1 — Rename in `showEndState()`

Find:
```js
        `<span class="outcome-resolved">Resolution</span>: ${pctRes}% \u2014 forum closed after genuine problem-solving`;
```

Replace with:
```js
        `<span class="outcome-resolved">Deliberation</span>: ${pctRes}% \u2014 forum closed after sustained engagement`;
```

---

## Fix 2 — Update the section label

Find:
```js
        `How the ${M} decision forums resolved`;
```

Replace with:
```js
        `How the ${M} decision forums closed`;
```

---

## Notes
- Only two lines changed
- The `outcome-resolved` CSS class stays — it controls the sage color, which is still correct for deliberation
- The diagnosis body text uses `{flight}`, not `{resolution}` — no changes needed there
- Do not change `gc-simulation.js` or the return value property names (`resolution` stays as `resolution` in the API)
- Stay on `experiment/organised-anarchy-mapper`
