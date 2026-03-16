# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — form validation and navigation UX
- File: `modules/garbage-can/index.html`, `css/main.css`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context

Three issues with the grouped card questionnaire flow:

1. "Map this organisation" button is clickable before all questions are answered
2. No error message when "Continue" is clicked with unanswered questions in the current group
3. After clicking "Continue", the page doesn't scroll to the top of the next card — the user may not realise a new group appeared

---

## Fix 1 — Disable "Map this organisation" until all questions answered

The submit button in group 3 should start disabled and only enable when all four questions in that group are answered.

### 1a — Add `disabled` attribute to the submit button HTML

Find in group 3's submit row:
```html
              <button type="submit" class="submit-btn">Map this organisation</button>
```

Replace with:
```html
              <button type="submit" class="submit-btn" id="submit-btn" disabled>Map this organisation</button>
```

### 1b — Add a listener that enables the button when group 3 is complete

Add to the questionnaire step navigation script (after the `advanceGroup` function):

```js
    // Enable submit button when all group 3 questions are answered
    Q_GROUPS[2].questions.forEach(function(qName) {
      document.querySelectorAll('input[name="' + qName + '"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
          if (validateGroup(2)) {
            document.getElementById('submit-btn').disabled = false;
          }
        });
      });
    });
```

### 1c — Add disabled button style to `css/main.css`

Add after the existing `.submit-btn:hover` block:

```css
.submit-btn:disabled {
  color: var(--ink-ghost);
  border-color: var(--ink-ghost);
  cursor: not-allowed;
}

.submit-btn:disabled:hover {
  color: var(--ink-ghost);
  border-color: var(--ink-ghost);
}
```

---

## Fix 2 — Show error message when Continue is clicked with unanswered questions

The per-group error elements (`form-error-1`, `form-error-2`) already exist in the HTML from the grouped cards handoff. The `advanceGroup` function already shows them. But the error text needs to be visible — ensure the error elements use the right style and are not hidden by CSS.

### 2a — Verify the error elements use `hidden` attribute (not `display: none`)

The grouped cards handoff added:
```html
              <p class="form-error" id="form-error-1" hidden>Please answer all questions in this section.</p>
```

This is correct. The `advanceGroup` function toggles `hidden`. No change needed if the grouped cards handoff has been applied.

### 2b — Update `advanceGroup` to ensure error visibility

Find in `advanceGroup`:
```js
      if (!validateGroup(fromIdx)) {
        if (group.errorId) document.getElementById(group.errorId).hidden = false;
        return;
      }
      if (group.errorId) document.getElementById(group.errorId).hidden = true;
```

This is correct as written. No change needed — just confirming the logic is in place.

If the grouped cards handoff has NOT been applied yet, Claude Code should apply it first — this fix depends on the `form-error-1` and `form-error-2` elements and the `advanceGroup` function existing.

---

## Fix 3 — Scroll to top of next card after clicking Continue

The `advanceGroup` function already scrolls, but it scrolls to the card element which may not be at the top of the viewport. Use `block: 'start'` and add an offset for the fixed nav.

Find in `advanceGroup`:
```js
      // Scroll to top of form area
      document.getElementById(Q_GROUPS[currentGroup].id).scrollIntoView({ behavior: 'smooth', block: 'start' });
```

Replace with:
```js
      // Scroll to top of next card — offset for fixed nav
      setTimeout(function() {
        var el = document.getElementById(Q_GROUPS[currentGroup].id);
        var navHeight = 56; // 3.5rem nav bar
        var y = el.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 50);
```

The 50ms delay ensures the hidden/show toggle has rendered before measuring position. The 16px extra offset gives breathing room below the nav.

---

## Notes
- Fix 2 depends on the grouped cards handoff being applied first — the `form-error-1`, `form-error-2` elements and `advanceGroup` function must exist
- The existing `form-error` element (the fallback for the full form) stays as-is
- Do not change scoring, diagnosis, simulation, or question text
- Stay on `experiment/organised-anarchy-mapper`
