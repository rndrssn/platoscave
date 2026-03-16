# HANDOFF.md

## Ready for Claude Code

### Fix: Resolved legend icon not rendering on both assess and explorer pages
- Files: `modules/garbage-can/assess/index.html`, `modules/garbage-can/explorer/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context

The resolved legend item in the SVG should show a small circle outline with sage fill in the bottom third — matching how resolved choices look in the simulation. Currently it renders as an empty circle with no visible fill.

**Root cause:** The clipPath is defined in the SVG `<defs>` element using absolute SVG coordinates, but the rect it clips is inside a `<g>` element with a `translate(0, LEGEND_Y)` transform. The interaction between the clipPath coordinate space and the transform causes the clip region to misalign with the rect.

**Fix:** Abandon the clipPath approach. Instead, draw the resolved icon using a simple layered approach with no clipping: a sage semicircle (half-circle arc path) at the bottom, then a circle outline on top. This is reliable across all browsers and unaffected by transforms.

---

## Fix — Replace the resolved legend rendering on BOTH pages

The same code exists in both `assess/index.html` and `explorer/index.html`. Apply the identical fix to both.

Find the resolved legend block (search for `legend-clip-resolved`):

```js
      var resolvedClipId = 'legend-clip-resolved-' + suffix;
      svg.select('defs').append('clipPath')
        .attr('id', resolvedClipId)
        .append('circle')
          .attr('cx', legendX + 5)
          .attr('cy', LEGEND_Y)
          .attr('r', 5);

      legendG.append('circle')
        .attr('cx', legendX + 5)
        .attr('cy', 0)
        .attr('r', 5)
        .attr('fill', 'none')
        .attr('stroke', C.inkMid)
        .attr('stroke-width', 0.75);

      legendG.append('rect')
        .attr('x', legendX)
        .attr('y', 2)
        .attr('width', 10)
        .attr('height', 5)
        .attr('fill', C.sage)
        .attr('fill-opacity', 0.35)
        .attr('clip-path', 'url(#' + resolvedClipId + ')');

      legendG.append('text')
        .attr('x', legendX + 14)
        .attr('y', 4)
        .attr('font-family', "'DM Mono', monospace")
        .attr('font-size', '0.5rem')
        .attr('font-weight', '300')
        .attr('letter-spacing', '0.08em')
        .attr('fill', C.inkFaint)
        .text('RESOLVED');
```

Replace with:

```js
      // Resolved legend item — semicircle fill at bottom + circle outline
      // Uses an arc path instead of clipping to avoid transform/coordinate issues
      var resolvedCx = legendX + 5;
      var resolvedR  = 5;

      // Bottom-half fill (semicircle arc)
      legendG.append('path')
        .attr('d', 'M ' + (resolvedCx - resolvedR) + ' 0' +
                    ' A ' + resolvedR + ' ' + resolvedR + ' 0 0 0 ' + (resolvedCx + resolvedR) + ' 0' +
                    ' Z')
        .attr('fill', C.sage)
        .attr('fill-opacity', 0.35);

      // Circle outline on top
      legendG.append('circle')
        .attr('cx', resolvedCx)
        .attr('cy', 0)
        .attr('r', resolvedR)
        .attr('fill', 'none')
        .attr('stroke', C.inkMid)
        .attr('stroke-width', 0.75);

      legendG.append('text')
        .attr('x', legendX + 14)
        .attr('y', 4)
        .attr('font-family', "'DM Mono', monospace")
        .attr('font-size', '0.5rem')
        .attr('font-weight', '300')
        .attr('letter-spacing', '0.08em')
        .attr('fill', C.inkFaint)
        .text('RESOLVED');
```

The arc path draws a bottom semicircle: starts at the left edge of the circle (cx - r, 0), arcs clockwise to the right edge (cx + r, 0), then closes back to start. This creates a half-moon shape filled with sage at 35% opacity — matching the fill-level visual in the simulation circles.

**Note on the `suffix` variable:** In the assess page, there may be no suffix (the function might be `drawViz` not `drawVizPanel`). Check which version each page uses. The resolved legend code itself does not reference the suffix — only the old clipPath ID did. The replacement has no suffix dependency.

---

## Also remove the orphaned clipPath

If the old `resolvedClipId` clipPath is still being appended to defs, remove that code too. Search both files for `legend-clip-resolved` and delete any remaining references. The new approach uses no clipPath.

---

## Verification

1. Open `/modules/garbage-can/assess/` — run through the questionnaire, check the legend below the simulation SVG. The "Resolved" item should show a circle with the bottom half filled in sage.
2. Open `/modules/garbage-can/explorer/` — run a simulation, check the legend. Same icon.
3. Compare with the actual resolved choice circles in the simulation — the fill should look the same (sage at bottom).

---

## Notes
- The arc approach is simpler and more reliable than clipPath — no coordinate space issues
- The semicircle fill matches the bottom-half look of the choice circle fills in the simulation
- Apply the identical fix to both files
- Do not change any other legend items or simulation logic
- Stay on `experiment/organised-anarchy-mapper`
