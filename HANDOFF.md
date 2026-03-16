# HANDOFF.md

## Ready for Claude Code

### Cleanup and remaining work: simplify deadlock, field notes, tooltips, punctuation, CSS extraction
- Files: `modules/garbage-can/index.html`, `css/main.css`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md`, `docs/PRINCIPLE-coding-standards.md`, and `docs/PRINCIPLE-punctuation.md` before touching anything

---

## What has already been applied — do NOT revert

Everything listed in previous handoffs is done. Phase labels and dimming are kept. This handoff removes the noisy deadlock features and adds the missing pieces.

---

## Fix 1 — Remove dashed stroke, problem count, and energy arc (simplify deadlock viz)

The deadlock visualization is too busy. Keep only phase labels and dimmed resolved circles. Remove the dashed stroke, problem count below circles, and energy progress arc.

### 1a — Delete the `deficitLayer` declaration

Find (~line 1239):
```js
      // ── Layer 7: energy deficit indicators ──────────────────────────────────────
      var deficitLayer = svg.append('g');
```

Delete these two lines.

### 1b — Delete the `choiceUnchangedTicks` declaration

Find (~line 1275):
```js
      // Track consecutive unchanged ticks per choice (for deadlock detection)
      var choiceUnchangedTicks = Array(M).fill(0);
```

Delete these two lines.

### 1c — Delete the deadlock detection, dashed stroke, and deficit indicator blocks from `renderTick()`

Find the entire block (~lines 1444–1523):
```js
        // Deadlock detection per choice
        for (var ci = 0; ci < M; ci++) {
          if (prevTick &&
              tick.choices[ci].state === 'active' &&
              prevTick.choices[ci].state === 'active' &&
              tick.choices[ci].energyRequired === prevTick.choices[ci].energyRequired) {
            choiceUnchangedTicks[ci]++;
          } else {
            choiceUnchangedTicks[ci] = 0;
          }
        }

        // Apply dashed stroke to deadlocked choices
        svg.selectAll('circle.choice')
          .attr('stroke-dasharray', function(d, i) {
            if (d.state === 'active' && choiceUnchangedTicks[i] >= 2) {
              return '3,3';
            }
            return 'none';
          });

        // Energy deficit indicators on deadlocked choices
        deficitLayer.selectAll('*').remove();

        for (var di = 0; di < M; di++) {
          if (tick.choices[di].state !== 'active' || choiceUnchangedTicks[di] < 2) continue;

          var cx = choiceX[di];
          var problemCount = 0;
          tick.problems.forEach(function(p) {
            if (p.state === 'attached' && p.attachedTo === di) problemCount++;
          });

          if (problemCount === 0) continue;

          // Problem count below the circle
          deficitLayer.append('text')
            .attr('x', cx)
            .attr('y', CHOICE_Y + CHOICE_R + 28)
            .attr('text-anchor', 'middle')
            .attr('font-family', "'DM Mono', monospace")
            .attr('font-size', '0.5rem')
            .attr('font-weight', '300')
            .attr('fill', C.rust)
            .attr('letter-spacing', '0.05em')
            .text('\u00D7' + problemCount);

          // Progress arc — energy spent / energy required
          var required = tick.choices[di].energyRequired;
          var spent    = tick.choices[di].energySpent;
          var progress = required > 0 ? Math.min(spent / required, 1) : 0;
          var arcR     = CHOICE_R + 4;

          if (progress > 0 && progress < 1) {
            var arcPath = d3.arc()
              .innerRadius(arcR - 1.5)
              .outerRadius(arcR)
              .startAngle(0)
              .endAngle(progress * 2 * Math.PI);

            deficitLayer.append('path')
              .attr('transform', 'translate(' + cx + ',' + CHOICE_Y + ')')
              .attr('d', arcPath)
              .attr('fill', C.rust)
              .attr('opacity', 0.6);

            // Background arc (full circle, very faint)
            var bgArc = d3.arc()
              .innerRadius(arcR - 1.5)
              .outerRadius(arcR)
              .startAngle(0)
              .endAngle(2 * Math.PI);

            deficitLayer.append('path')
              .attr('transform', 'translate(' + cx + ',' + CHOICE_Y + ')')
              .attr('d', bgArc)
              .attr('fill', C.inkGhost)
              .attr('opacity', 0.2);
          }
        }
```

Delete this entire block.

### 1d — Delete `deficitLayer` cleanup at end of animation

Find in `stepTick()` (~line 1535):
```js
          deficitLayer.selectAll('*').remove();
```

Delete this line.

---

## Fix 2 — Add field notes card

The field notes card is missing from the HTML.

Find in the Simulation section (~line 639):
```html
          <p class="figure-caption" id="viz-caption"></p>

          <!-- Trigger button -->
```

Replace with:
```html
          <p class="figure-caption" id="viz-caption"></p>

          <!-- Field notes — model explanation -->
          <div class="field-notes-card">
            <p class="field-notes-title">The Garbage Can Model</p>
            <p class="field-notes-body">
              <strong>Choice opportunities</strong> (circles) are forums where decisions could be made:
              meetings, reviews, committees. <strong>Problems</strong> (dots) seek resolution by attaching
              to a choice opportunity. <strong>Decision makers</strong> (invisible) allocate
              <strong>energy</strong> to the choices they can access each cycle. When cumulative energy
              meets the demand, a choice <strong>resolves</strong> and closes its attached problems.
            </p>
            <p class="field-notes-body">
              The model&#8217;s insight: when problems outnumber capacity, decisions happen by
              <strong>oversight</strong> (the forum closes while problems are elsewhere) or
              <strong>flight</strong> (problems leave before the forum closes).
              <strong>Resolution</strong> &#8212; genuinely closing the problem &#8212; becomes rare.
            </p>
          </div>

          <!-- Trigger button -->
```

---

## Fix 3 — Add field notes card styles to `css/main.css`

```css
/* ─── Field notes card ───────────────────────────────── */
.field-notes-card {
  background: var(--paper-dark);
  border: 2px solid var(--paper-deep);
  border-top: 2px solid var(--ink-ghost);
  padding: 1.75rem 1.5rem;
  margin: 1.5rem 0;
  max-width: 560px;
}

@media (min-width: 640px) {
  .field-notes-card {
    padding: 1.75rem 2.5rem;
  }
}

.field-notes-title {
  font-family: var(--mono);
  font-size: 0.62rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin-bottom: 1rem;
}

.field-notes-body {
  font-family: var(--serif);
  font-size: 0.9rem;
  color: var(--ink-mid);
  line-height: 1.75;
  margin-bottom: 0.75rem;
}

.field-notes-body:last-child {
  margin-bottom: 0;
}

.field-notes-body strong {
  font-weight: 500;
  color: var(--ink);
}
```

---

## Fix 4 — Add native SVG tooltips

### 4a — Add title elements to choice circles

Find where choice circles are created (~line 1091):
```js
          .attr('stroke-width', 1);
```

Add after it:
```js

      choiceLayer.selectAll('circle.choice').each(function() {
        d3.select(this).append('title');
      });
```

### 4b — Update choice tooltips in `renderTick()`

Add after the choice circle stroke transition block:

```js
        // Update choice tooltips
        svg.selectAll('circle.choice').each(function(d, i) {
          var state = tick.choices[i].state;
          var text;
          if (state === 'inactive') {
            text = 'Choice opportunity: not yet entered';
          } else if (state === 'resolved') {
            text = 'Resolved: this forum has closed';
          } else {
            text = 'Choice opportunity: a forum where decisions could be made';
          }
          d3.select(this).select('title').text(text);
        });
```

### 4c — Add title elements to problem dots

Find where problem dots are created (~line 1237):
```js
          .attr('opacity', 0);
```

Add after it:
```js

      probLayer.selectAll('circle.problem').each(function() {
        d3.select(this).append('title');
      });
```

### 4d — Update problem tooltips in `renderTick()`

Add after the choice tooltip update:

```js
        // Update problem tooltips
        svg.selectAll('circle.problem').each(function(d) {
          var p = tick.problems[d];
          var text;
          if (p.state === 'inactive') {
            text = '';
          } else if (p.state === 'floating') {
            text = 'Problem searching for a forum';
          } else if (p.state === 'attached') {
            text = 'Problem attached to forum C' + p.attachedTo;
          } else if (p.state === 'resolved') {
            text = 'Problem resolved at forum C' + p.attachedTo;
          }
          d3.select(this).select('title').text(text);
        });
```

---

## Fix 5 — Remaining punctuation

### 5a — Title tag

Find:
```html
  <title>The Garbage Can Model — To the Bedrock</title>
```

Replace with:
```html
  <title>The Garbage Can Model · To the Bedrock</title>
```

### 5b — Caption text

Find:
```js
        `Problems (dots) search for choice opportunities (circles) each cycle \u2014 ` +
```

Replace with:
```js
        `Problems (dots) search for choice opportunities (circles) each cycle, ` +
```

### 5c — Diagnosis body text

Review each diagnosis in the `DIAGNOSES` object for the one-emdash-per-paragraph limit. Count `\u2014` in each body string. If more than one, convert the least impactful to a colon, semicolon, or period. Do NOT rewrite meaning or tone.

---

## Fix 6 — Move `<style>` block to `css/main.css`

**Coding standards compliance.** `docs/PRINCIPLE-coding-standards.md` states: "No `<style>` blocks in HTML files. All CSS lives in `css/main.css`."

The garbage-can `index.html` has a `<style>` block (~lines 11–351) containing all module-page styles.

1. Cut the entire contents of the `<style>...</style>` block
2. Add them to `css/main.css` under a new section header:

```css
/* ─── Module page ────────────────────────────────────── */
```

3. Remove the empty `<style></style>` tags from the HTML
4. Check for duplicates between the moved styles and existing `main.css` content. If a class appears in both, keep the version from the `<style>` block (more current) and remove the duplicate from `main.css`. Known overlaps to check:
   - `.submit-btn` — exists in both the `<style>` block and potentially in `main.css`
   - `.replay-btn` — `#replay-btn` exists in `main.css`, `.replay-btn` in the `<style>` block
   - `.period-readout` — check for duplicates
5. After moving, the `<head>` should contain only: `<meta>`, `<title>`, font `<link>` tags, and the CSS `<link>` tag

---

## Notes
- Phase labels and dimmed resolved circles stay — they're clean and useful
- The `choiceUnchangedTicks` tracker is fully removed — no tooltip references it anymore (the simplified tooltip in Fix 4b just checks active/resolved/inactive)
- Native SVG `<title>` tooltips are browser-styled — no custom CSS
- Fix 6 is the largest change but purely mechanical — no logic changes
- Do not change `gc-simulation.js`, `gc-scoring.js`, scoring, or question text
- Stay on `experiment/organised-anarchy-mapper`
