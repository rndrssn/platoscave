'use strict';

/**
 * gc-viz.js
 * Organised Anarchy — Shared Visualization
 *
 * D3 rendering for the Garbage Can Model simulation.
 * Source of truth: modules/garbage-can/assess/index.html
 *
 * Dependencies: d3.js, gc-simulation.js (for M, W, PERIODS constants)
 *
 * Exposes:
 *   C                - color tokens
 *   drawPositioning  - three-axis positioning diagram
 *   drawViz          - simulation animation with summary
 */

// ─── Color tokens ─────────────────────────────────────────────────────────────
// M (choices) and W (problems) are already defined by gc-simulation.js
const C = {
  ink:       '#2A2018',
  inkMid:    '#5C4F3A',
  inkFaint:  '#7A6E5F',
  inkGhost:  '#B0A490',
  rust:      '#8B3A2A',
  rustLight: '#B85C40',
  ochre:     '#9A7B3A',
  gold:      '#B8943A',
  slate:     '#3D4F5C',
  sage:      '#4A6741',
};

// ─── Positioning diagram ──────────────────────────────────────────────────────
function drawPositioning(raw) {
  const svgEl  = document.getElementById('positioning-svg');
  const svgW   = svgEl.clientWidth || 640;
  const PAD_L  = 100;
  const PAD_R  = 24;
  const TRACKW = svgW - PAD_L - PAD_R;
  const TRACKH = 48;
  const svgH   = TRACKH * 3 + 8;

  const svg = d3.select('#positioning-svg')
    .attr('viewBox', `0 0 ${svgW} ${svgH}`)
    .attr('height', svgH);

  svg.selectAll('*').remove();

  const tracks = [
    { label: 'Load',     score: raw.energyScore,   lo: 'Light',      hi: 'Heavy',  min: 1, max: 5 },
    { label: 'Decision', score: raw.decisionScore,  lo: 'Restricted', hi: 'Open',   min: 1, max: 5 },
    { label: 'Access',   score: raw.accessScore,    lo: 'Directed',   hi: 'Open',   min: 1, max: 5 },
  ];

  const g = svg.selectAll('g.track')
    .data(tracks)
    .join('g')
      .attr('class', 'track')
      .attr('transform', (d, i) => `translate(0, ${i * TRACKH + 4})`);

  g.append('text')
    .attr('x', 0)
    .attr('y', 22)
    .attr('font-family', "'DM Mono', monospace")
    .attr('font-size', '9')
    .attr('font-weight', '300')
    .attr('fill', C.inkFaint)
    .attr('letter-spacing', '0.1em')
    .text(d => d.label.toUpperCase());

  g.append('text')
    .attr('x', PAD_L)
    .attr('y', 13)
    .attr('font-family', "'DM Mono', monospace")
    .attr('font-size', '8')
    .attr('font-weight', '300')
    .attr('fill', C.inkGhost)
    .attr('text-anchor', 'start')
    .attr('letter-spacing', '0.08em')
    .text(d => d.lo.toUpperCase());

  g.append('text')
    .attr('x', PAD_L + TRACKW)
    .attr('y', 13)
    .attr('font-family', "'DM Mono', monospace")
    .attr('font-size', '8')
    .attr('font-weight', '300')
    .attr('fill', C.inkGhost)
    .attr('text-anchor', 'end')
    .attr('letter-spacing', '0.08em')
    .text(d => d.hi.toUpperCase());

  g.append('line')
    .attr('x1', PAD_L)
    .attr('x2', PAD_L + TRACKW)
    .attr('y1', 28)
    .attr('y2', 28)
    .attr('stroke', C.inkGhost)
    .attr('stroke-width', 0.75);

  g.append('circle')
    .attr('cx', d => PAD_L + ((d.score - d.min) / (d.max - d.min)) * TRACKW)
    .attr('cy', 28)
    .attr('r', 4)
    .attr('fill', C.inkMid)
    .attr('opacity', 0)
    .transition()
      .duration(600)
      .ease(d3.easeCubicInOut)
      .attr('opacity', 1);
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function drawEmptyState() {
  const SVG_W    = 900;
  const SVG_H    = 300;
  const CHOICE_Y = 140;
  const CHOICE_R = 22;
  const PROB_R   = 3.5;
  const PAD_H    = 55;
  const FLOAT_Y0 = 50;

  const svg = d3.select('#viz-svg')
    .attr('viewBox', `0 0 ${SVG_W} ${SVG_H}`);

  svg.selectAll('*').remove();

  const choiceX = d3.range(M).map(
    i => PAD_H + i * (SVG_W - PAD_H * 2) / (M - 1)
  );

  // Choice circles
  const choiceLayer = svg.append('g');
  choiceLayer.selectAll('circle.choice')
    .data(d3.range(M))
    .join('circle')
      .attr('class', 'choice')
      .attr('cx', i => choiceX[i])
      .attr('cy', CHOICE_Y)
      .attr('r', CHOICE_R)
      .attr('fill', 'none')
      .attr('stroke', C.inkGhost)
      .attr('stroke-width', 1);

  // Choice labels
  const labelLayer = svg.append('g');
  labelLayer.selectAll('text.choice-label')
    .data(d3.range(M))
    .join('text')
      .attr('class', 'choice-label')
      .attr('x', i => choiceX[i])
      .attr('y', CHOICE_Y + CHOICE_R + 13)
      .attr('text-anchor', 'middle')
      .attr('font-family', "'DM Mono', monospace")
      .attr('font-size', '0.75rem')
      .attr('font-weight', '300')
      .attr('letter-spacing', '0.1em')
      .attr('fill', C.inkFaint)
      .text(i => `C${i}`);

  // Cycle counter
  svg.append('text')
    .attr('class', 'viz-counter')
    .attr('x', 0)
    .attr('y', 16)
    .attr('font-family', "'DM Mono', monospace")
    .attr('font-size', '0.75rem')
    .attr('font-weight', '300')
    .attr('letter-spacing', '0.1em')
    .attr('fill', C.inkFaint)
    .text('Cycle 0 of 20');

  // Legend
  var LEGEND_Y = SVG_H - 12;
  var legendItems = [
    { label: 'Entering',  color: C.rust },
    { label: 'Searching', color: C.rustLight },
    { label: 'In forum',  color: C.gold },
  ];

  var legendG = svg.append('g').attr('transform', 'translate(0, ' + LEGEND_Y + ')');
  var legendX = 0;

  legendItems.forEach(function(item) {
    legendG.append('circle')
      .attr('cx', legendX + 4)
      .attr('cy', 0)
      .attr('r', 4)
      .attr('fill', item.color);

    legendG.append('text')
      .attr('x', legendX + 12)
      .attr('y', 4)
      .attr('font-family', "'DM Mono', monospace")
      .attr('font-size', '0.75rem')
      .attr('font-weight', '300')
      .attr('letter-spacing', '0.08em')
      .attr('fill', C.inkFaint)
      .text(item.label.toUpperCase());

    legendX += item.label.length * 7 + 30;
  });

  // Resolved legend item
  var resolvedCx = legendX + 5;
  var resolvedR  = 5;

  legendG.append('path')
    .attr('d', 'M ' + (resolvedCx - resolvedR) + ' 0' +
                ' A ' + resolvedR + ' ' + resolvedR + ' 0 0 0 ' + (resolvedCx + resolvedR) + ' 0' +
                ' Z')
    .attr('fill', C.sage)
    .attr('fill-opacity', 0.35);

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
    .attr('font-size', '0.75rem')
    .attr('font-weight', '300')
    .attr('letter-spacing', '0.08em')
    .attr('fill', C.inkFaint)
    .text('RESOLVED');

  // One problem dot in entering state
  svg.append('circle')
    .attr('class', 'problem')
    .attr('cx', choiceX[0])
    .attr('cy', FLOAT_Y0)
    .attr('r', PROB_R)
    .attr('fill', C.rust)
    .attr('opacity', 0.9);
}

// ─── End state summary ────────────────────────────────────────────────────────
function showEndState(
  pctRes, pctOver, pctFli,
  probResolved, probDisplaced, probAdrift, probInForum,
  lastTick
) {

  // Stop any pulsating on dots
  d3.select('#viz-svg').selectAll('circle.problem')
    .classed('problem-attached', false)
    .interrupt();

  document.getElementById('sim-summary').hidden = false;

  // Single-run end state from tick 20
  var runResolved = 0;
  var runInForum  = 0;
  var runAdrift   = 0;
  var runChoicesResolved = 0;
  var runChoicesOpen     = 0;

  if (lastTick) {
    lastTick.problems.forEach(function(p) {
      if (p.state === 'resolved') runResolved++;
      else if (p.state === 'attached') runInForum++;
      else if (p.state === 'floating') runAdrift++;
    });
    lastTick.choices.forEach(function(c) {
      if (c.state === 'resolved') runChoicesResolved++;
      else if (c.state === 'active') runChoicesOpen++;
    });
  }

  document.getElementById('sum-thisrun-label').textContent =
    'This run (cycle ' + PERIODS + ')';
  document.getElementById('sum-thisrun-resolved').innerHTML =
    '<span class="outcome-resolved">Resolved</span>: ' + runResolved + ' of ' + W + ' problems';
  document.getElementById('sum-thisrun-inforum').innerHTML =
    '<span class="outcome-unresolved">In forum</span>: ' + runInForum + ' of ' + W + ' problems';
  document.getElementById('sum-thisrun-adrift').innerHTML =
    '<span class="outcome-flight">Adrift</span>: ' + runAdrift + ' of ' + W + ' problems';
  document.getElementById('sum-thisrun-choices-resolved').innerHTML =
    '<span class="outcome-resolved">Choices resolved</span>: ' + runChoicesResolved + ' of ' + M;
  document.getElementById('sum-thisrun-choices-open').innerHTML =
    '<span class="outcome-unresolved">Choices still open</span>: ' + runChoicesOpen + ' of ' + M;

  // Primary: canonical GCM decision styles (choice-level)
  document.getElementById('sum-header').textContent =
    'Across 100 simulations, on average:';

  document.getElementById('sum-choices-label').textContent =
    `How the ${M} decision forums closed`;
  document.getElementById('sum-choice-resolution').innerHTML =
    `<span class="outcome-resolved">Deliberation</span>: ${pctRes}% \u2014 forum closed after sustained engagement`;
  document.getElementById('sum-choice-oversight').innerHTML =
    `<span class="outcome-oversight">Oversight</span>: ${pctOver}% \u2014 forum closed with no problem attached`;
  document.getElementById('sum-choice-flight').innerHTML =
    `<span class="outcome-flight">Flight</span>: ${pctFli}% \u2014 forum closed after problems fled`;

  // Supplementary: problem fates (interpretive extension)
  document.getElementById('sum-problems-label').textContent =
    `What happened to the ${W} problems`;
  document.getElementById('sum-prob-resolved').innerHTML =
    `<span class="outcome-resolved">Resolved</span>: ${probResolved} of ${W} \u2014 genuinely closed at a decision forum`;
  document.getElementById('sum-prob-displaced').innerHTML =
    `<span class="outcome-oversight">Displaced</span>: ${probDisplaced} of ${W} \u2014 forum closed without resolving this problem`;
  document.getElementById('sum-prob-adrift').innerHTML =
    `<span class="outcome-flight">Adrift</span>: ${probAdrift} of ${W} \u2014 detached from forum or never attached`;
  document.getElementById('sum-prob-inforum').innerHTML =
    `<span class="outcome-unresolved">In forum</span>: ${probInForum} of ${W} \u2014 still attached to an open forum at cycle ${PERIODS}`;

  document.getElementById('replay-btn').hidden      = false;
  document.getElementById('stochastic-note').hidden = false;
}

// ─── Visualization ────────────────────────────────────────────────────────────
function drawViz(simResult, energyLoad, decisionStructure, accessStructure) {
  const { ticks, resolution, oversight, flight } = simResult;

  // Choice-level percentages (canonical GCM decision styles)
  // Rounded to nearest 5% — at 100 Monte Carlo iterations, finer precision is noise
  const pctRes  = Math.round(simResult.resolution * 20) * 5;
  const pctOver = Math.round(simResult.oversight  * 20) * 5;
  const pctFli  = 100 - pctRes - pctOver;

  // Problem-level counts (out of W=20, interpretive extension)
  const probResolved  = Math.round(simResult.problemResolved);
  const probDisplaced = Math.round(simResult.problemDisplaced);
  const probAdrift    = Math.round(simResult.problemAdrift);
  const probInForum   = Math.max(0, W - probResolved - probDisplaced - probAdrift);

  // Reset summary state
  document.getElementById('sim-summary').hidden   = true;
  document.getElementById('replay-btn').hidden    = true;
  document.getElementById('stochastic-note').hidden = true;

  const SVG_W    = 900;
  const SVG_H    = 340;
  const CHOICE_Y = 140;
  const CHOICE_R = 30;
  const PROB_R   = 3.5;
  const PAD_H    = 35;
  const FLOAT_Y0 = 50;
  const FLOAT_Y1 = 75;

  const svg = d3.select('#viz-svg')
    .attr('viewBox', `0 0 ${SVG_W} ${SVG_H}`);

  svg.selectAll('*').remove();

  // M (choices) and W (problems) are defined by gc-simulation.js
  const choiceX = d3.range(M).map(
    i => PAD_H + i * (SVG_W - PAD_H * 2) / (M - 1)
  );

  function floatPos(id) {
    if (id < M) {
      return { x: choiceX[id], y: FLOAT_Y0 };
    }
    const col = id - M;
    return { x: choiceX[col] + (col % 2 === 0 ? 18 : -18), y: FLOAT_Y1 };
  }

  function attachedPos(choiceId, slot, total) {
    // Fibonacci spiral distribution — fixed dot size
    const goldenAngle = 2.399; // radians — golden angle
    const maxR        = CHOICE_R - PROB_R - 1; // keep dots within boundary
    const r           = maxR * Math.sqrt((slot + 0.5) / total);
    const angle       = slot * goldenAngle;

    return {
      x: choiceX[choiceId] + r * Math.cos(angle),
      y: CHOICE_Y          + r * Math.sin(angle),
    };
  }

  // ── clipPath defs — one per choice circle ──────────────────────────────────
  const defs = svg.append('defs');
  d3.range(M).forEach(i => {
    defs.append('clipPath')
      .attr('id', `clip-c${i}`)
      .append('circle')
        .attr('cx', choiceX[i])
        .attr('cy', CHOICE_Y)
        .attr('r', CHOICE_R);
  });

  // ── Layer 1: choice circle strokes ─────────────────────────────────────────
  const choiceLayer = svg.append('g');

  choiceLayer.selectAll('circle.choice')
    .data(d3.range(M))
    .join('circle')
      .attr('class', 'choice')
      .attr('cx', i => choiceX[i])
      .attr('cy', CHOICE_Y)
      .attr('r', CHOICE_R)
      .attr('fill', 'none')
      .attr('stroke', C.inkGhost)
      .attr('stroke-width', 1)
      .each(function() {
        d3.select(this).append('title');
      });

  // ── Layer 2: fill rects (clipped inside choice circles) ────────────────────
  const fillLayer = svg.append('g');

  fillLayer.selectAll('rect.choice-fill')
    .data(d3.range(M))
    .join('rect')
      .attr('class', 'choice-fill')
      .attr('x', i => choiceX[i] - CHOICE_R)
      .attr('y', CHOICE_Y + CHOICE_R)
      .attr('width', CHOICE_R * 2)
      .attr('height', 0)
      .attr('fill', C.sage)
      .attr('fill-opacity', 0.50)
      .attr('clip-path', i => `url(#clip-c${i})`);

  // ── Layer 3: choice labels (rendered above fill) ────────────────────────────
  const labelLayer = svg.append('g');

  labelLayer.selectAll('text.choice-label')
    .data(d3.range(M))
    .join('text')
      .attr('class', 'choice-label')
      .attr('x', i => choiceX[i])
      .attr('y', CHOICE_Y + CHOICE_R + 13)
      .attr('text-anchor', 'middle')
      .attr('font-family', "'DM Mono', monospace")
      .attr('font-size', '0.75rem')
      .attr('font-weight', '300')
      .attr('letter-spacing', '0.1em')
      .attr('fill', C.inkFaint)
      .text(i => `C${i}`);

  // ── Layer 5: cycle counter (top-left) ───────────────────────────────────────
  var counterText = svg.append('text')
    .attr('class', 'viz-counter')
    .attr('x', 0)
    .attr('y', 16)
    .attr('font-family', "'DM Mono', monospace")
    .attr('font-size', '0.75rem')
    .attr('font-weight', '300')
    .attr('letter-spacing', '0.1em')
    .attr('fill', C.inkFaint)
    .text('Cycle 0 of 20');

  // ── Phase label (top-right) ─────────────────────────────────────────────────
  var phaseText = svg.append('text')
    .attr('x', SVG_W)
    .attr('y', 16)
    .attr('text-anchor', 'end')
    .attr('font-family', "'DM Mono', monospace")
    .attr('font-size', '0.75rem')
    .attr('font-weight', '300')
    .attr('font-style', 'italic')
    .attr('letter-spacing', '0.08em')
    .attr('fill', C.inkFaint)
    .text('');

  // ── Layer 6: legend (bottom of SVG) ─────────────────────────────────────────
  var LEGEND_Y = SVG_H - 12;
  var legendItems = [
    { label: 'Entering',  color: C.rust },
    { label: 'Searching', color: C.rustLight },
    { label: 'In forum',  color: C.gold },
  ];

  var legendG = svg.append('g').attr('transform', 'translate(0, ' + LEGEND_Y + ')');
  var legendX = 0;

  legendItems.forEach(function(item) {
    legendG.append('circle')
      .attr('cx', legendX + 4)
      .attr('cy', 0)
      .attr('r', 4)
      .attr('fill', item.color);

    legendG.append('text')
      .attr('x', legendX + 12)
      .attr('y', 4)
      .attr('font-family', "'DM Mono', monospace")
      .attr('font-size', '0.75rem')
      .attr('font-weight', '300')
      .attr('letter-spacing', '0.08em')
      .attr('fill', C.inkFaint)
      .text(item.label.toUpperCase());

    legendX += item.label.length * 7 + 30;
  });

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
    .attr('font-size', '0.75rem')
    .attr('font-weight', '300')
    .attr('letter-spacing', '0.08em')
    .attr('fill', C.inkFaint)
    .text('RESOLVED');

  // ── Layer 4: problem dots ──────────────────────────────────────────────────
  const probLayer = svg.append('g');

  probLayer.selectAll('circle.problem')
    .data(d3.range(W), d => d)
    .join('circle')
      .attr('class', 'problem')
      .attr('cx', id => floatPos(id).x)
      .attr('cy', id => floatPos(id).y)
      .attr('r', PROB_R)
      .attr('fill', C.inkGhost)
      .attr('opacity', 0)
      .each(function() {
        d3.select(this).append('title');
      });

  function probAttrs(tick, id) {
    const p = tick.problems[id];

    if (p.state === 'inactive') {
      const fp = floatPos(id);
      return { x: fp.x, y: fp.y, opacity: 0, fill: C.inkGhost, r: PROB_R };
    }

    if (p.state === 'floating') {
      const fp = floatPos(id);
      return { x: fp.x, y: fp.y, opacity: 0.9, fill: C.rustLight, r: PROB_R };
    }

    if (p.state === 'resolved') {
      const cx = typeof p.attachedTo === 'number' ? choiceX[p.attachedTo] : choiceX[0];
      return { x: cx, y: CHOICE_Y, opacity: 0, fill: C.sage, r: PROB_R };
    }

    // attached — fibonacci packing inside choice circle
    const siblings = tick.problems
      .map((q, i) => ({ ...q, id: i }))
      .filter(q => q.state === 'attached' && q.attachedTo === p.attachedTo);
    const slot = siblings.findIndex(q => q.id === id);
    const pos  = attachedPos(p.attachedTo, slot, siblings.length);
    return { x: pos.x, y: pos.y, opacity: 1, fill: C.gold, r: PROB_R };
  }

  // Cumulative resolved-at-choice counts — one entry per choice, never decreases
  const resolvedAtChoice = Array(M).fill(0);

  // Problem IDs that have ever been active (for entrance animation)
  const everActive = new Set();

  function isDeadTick(tickIdx) {
    if (tickIdx === 0) return false;
    const prev = ticks[tickIdx - 1];
    const curr = ticks[tickIdx];
    for (let i = 0; i < M; i++) {
      if (prev.choices[i].state !== curr.choices[i].state) return false;
    }
    for (let i = 0; i < W; i++) {
      if (prev.problems[i].state !== curr.problems[i].state) return false;
      if (prev.problems[i].attachedTo !== curr.problems[i].attachedTo) return false;
    }
    return true;
  }

  function renderTick(tickIdx, prevTick) {
    const tick = ticks[tickIdx];

    svg.selectAll('circle.choice')
      .data(tick.choices)
      .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .attr('stroke', d => {
          if (d.state === 'resolved') return C.inkGhost;
          if (d.state === 'active')   return C.inkFaint;
          return C.inkGhost;
        })
        .attr('stroke-width', d => {
          if (d.state === 'resolved') return 0.5;
          return 1;
        })
        .attr('opacity', d => {
          if (d.state === 'resolved') return 0.4;
          return 1;
        });

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

    // Detect exit types by comparing previous and current tick
    const resolvedThisTick = new Set();
    const flightSet        = new Set();
    const oversightSet     = new Set();

    if (prevTick) {
      const choicesResolvedThisTick = new Set();
      for (let c = 0; c < M; c++) {
        if (prevTick.choices[c].state === 'active' && tick.choices[c].state === 'resolved') {
          choicesResolvedThisTick.add(c);
        }
      }
      for (let id = 0; id < W; id++) {
        const ps = prevTick.problems[id].state;
        const cs = tick.problems[id].state;
        if (ps === 'attached' && cs === 'resolved') {
          resolvedThisTick.add(id);
        } else if (ps === 'attached' && cs === 'floating') {
          const attachedTo = prevTick.problems[id].attachedTo;
          if (choicesResolvedThisTick.has(attachedTo)) {
            oversightSet.add(id);
          } else {
            flightSet.add(id);
          }
        }
      }
    }

    // Fill level — cumulative count of problems resolved at each choice
    if (prevTick) {
      for (let id = 0; id < W; id++) {
        if (tick.problems[id].state === 'resolved' && prevTick.problems[id].state !== 'resolved') {
          resolvedAtChoice[tick.problems[id].attachedTo]++;
        }
      }
    }
    svg.selectAll('rect.choice-fill')
      .data(d3.range(M))
      .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .attr('y',      i => CHOICE_Y + CHOICE_R - (resolvedAtChoice[i] / W) * (CHOICE_R * 2))
        .attr('height', i => (resolvedAtChoice[i] / W) * (CHOICE_R * 2));

    // Detect problems entering for the first time this tick
    const enteringThisTick = new Set();
    for (let id = 0; id < W; id++) {
      if (tick.problems[id].state !== 'inactive' && !everActive.has(id)) {
        enteringThisTick.add(id);
        everActive.add(id);
      }
    }

    const allProbs = svg.selectAll('circle.problem').data(d3.range(W), d => d);

    // Entrance fade-in: scale up from r:1, opacity 0 → target state
    allProbs.filter(id => enteringThisTick.has(id))
      .each(function(id) {
        const attrs = probAttrs(tick, id);
        d3.select(this).interrupt()
          .attr('cx', attrs.x).attr('cy', attrs.y).attr('r', 1).attr('opacity', 0)
          .transition().duration(400).ease(d3.easeCubicOut)
            .attr('r', attrs.r).attr('opacity', attrs.opacity).attr('fill', attrs.fill);
      });

    // Resolution exit: move to circle centre, shrink to r:1.5, fill sage, then fade
    allProbs.filter(id => resolvedThisTick.has(id))
      .each(function(id) {
        const cx = choiceX[prevTick.problems[id].attachedTo];
        d3.select(this).interrupt()
          .transition().duration(400).ease(d3.easeCubicInOut)
            .attr('cx', cx).attr('cy', CHOICE_Y).attr('r', 1.5).attr('fill', C.sage)
          .transition().duration(200)
            .attr('opacity', 0);
      });

    // Flight exit: flash rust, then move to float position
    allProbs.filter(id => flightSet.has(id))
      .each(function(id) {
        const fp = floatPos(id);
        d3.select(this).interrupt()
          .transition().duration(200)
            .attr('fill', C.rust)
          .transition().duration(400).ease(d3.easeCubicInOut)
            .attr('cx', fp.x).attr('cy', fp.y).attr('r', PROB_R)
            .attr('opacity', 0.85).attr('fill', C.inkFaint);
      });

    // Oversight exit: flash slate, then move to float position
    allProbs.filter(id => oversightSet.has(id))
      .each(function(id) {
        const fp = floatPos(id);
        d3.select(this).interrupt()
          .transition().duration(200)
            .attr('fill', C.slate)
          .transition().duration(400).ease(d3.easeCubicInOut)
            .attr('cx', fp.x).attr('cy', fp.y).attr('r', PROB_R)
            .attr('opacity', 0.85).attr('fill', C.inkFaint);
      });

    // All other problems: standard position transition (staggered for organic feel)
    allProbs.filter(id => !resolvedThisTick.has(id) && !flightSet.has(id) && !oversightSet.has(id) && !enteringThisTick.has(id))
      .interrupt()
      .transition()
        .delay(id => Math.random() * 150)
        .duration(id => 700 + Math.random() * 300)
        .ease(d3.easeCubicInOut)
        .attr('cx',      id => probAttrs(tick, id).x)
        .attr('cy',      id => probAttrs(tick, id).y)
        .attr('r',       id => probAttrs(tick, id).r)
        .attr('opacity', id => probAttrs(tick, id).opacity)
        .attr('fill',    id => probAttrs(tick, id).fill);

    // Sync pulse class — attached dots breathe, others do not
    allProbs.classed('problem-attached', id => tick.problems[id].state === 'attached');
    allProbs.classed('problem-searching', id => tick.problems[id].state === 'floating');

    counterText.text(`Cycle ${tick.tick} of 20`);

    // Phase label
    if (tick.tick <= 10) {
      phaseText.text('Problems entering');
    } else if (prevTick && !isDeadTick(tickIdx)) {
      phaseText.text('Energy accumulating');
    } else if (prevTick && isDeadTick(tickIdx)) {
      phaseText.transition().duration(400)
        .attr('fill', C.rust)
        .text('System locked');
    }

  }

  renderTick(0, null);

  let current = 0;

  function stepTick() {
    current++;
    if (current >= ticks.length) {
      counterText.text('Cycle 20 of 20 \u00B7 showing final run');
      phaseText.text('');
      showEndState(
        pctRes, pctOver, pctFli,
        probResolved, probDisplaced, probAdrift, probInForum,
        ticks[ticks.length - 1]
      );
      return;
    }
    renderTick(current, ticks[current - 1]);
    var delay;
    if (current <= 10) {
      delay = 1000;
    } else if (isDeadTick(current)) {
      delay = 600;
    } else {
      delay = 1200;
    }
    setTimeout(stepTick, delay);
  }

  setTimeout(stepTick, 800);
}
