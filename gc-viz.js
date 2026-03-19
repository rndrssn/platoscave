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
function readCssVar(name, fallback) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const root = document.documentElement;
  const raw = window.getComputedStyle(root).getPropertyValue(name);
  return raw && raw.trim() ? raw.trim() : fallback;
}

const C = {
  ink:       readCssVar('--viz-ink', '#2A2018'),
  inkMid:    readCssVar('--viz-ink-mid', '#5C4F3A'),
  inkFaint:  readCssVar('--viz-ink-faint', '#7A6E5F'),
  inkGhost:  readCssVar('--viz-ink-ghost', '#B0A490'),
  rust:      readCssVar('--viz-rust', '#8B3A2A'),
  rustLight: readCssVar('--viz-rust-light', '#B85C40'),
  ochre:     readCssVar('--viz-ochre', '#9A7B3A'),
  gold:      readCssVar('--viz-gold', '#B8943A'),
  slate:     readCssVar('--viz-slate', '#3D4F5C'),
  sage:      readCssVar('--viz-sage', '#4A6741'),
};

const VIZ_FONT = {
  mono: readCssVar('--viz-font-mono', readCssVar('--mono', "'DM Mono', monospace")),
};

const VIZ_FONT_SIZE = {
  trackLabel: readCssVar('--viz-fs-track-label', '9px'),
  trackEnd: readCssVar('--viz-fs-track-end', '8px'),
  label: readCssVar('--viz-fs-label', '0.75rem'),
};

function formatChoiceOpportunityLabel(idxZeroBased) {
  return `CO${idxZeroBased + 1}`;
}

function formatChoiceOpportunityList(ids, limit) {
  var max = typeof limit === 'number' ? limit : 3;
  var labels = ids.slice(0, max).map(formatChoiceOpportunityLabel);
  var text = labels.join(', ');
  if (ids.length > max) text += ` · +${ids.length - max} more`;
  return text;
}

function ensureVizEventTicker() {
  if (typeof document === 'undefined') return null;
  var svgEl = document.getElementById('viz-svg');
  if (!svgEl) return null;

  var tickerEl = document.getElementById('viz-event-ticker');
  if (!tickerEl) {
    tickerEl = document.createElement('p');
    tickerEl.id = 'viz-event-ticker';
    tickerEl.className = 'viz-event-ticker';
  }

  if (svgEl.nextElementSibling !== tickerEl) {
    svgEl.insertAdjacentElement('afterend', tickerEl);
  }

  return tickerEl;
}

const CHOICE_RADIUS = 30;

const VIZ_LAYOUT = {
  empty: {
    svgW: 900,
    svgH: 300,
    choiceY: 140,
    choiceRadius: CHOICE_RADIUS,
    padH: 55,
    floatY0: 50,
  },
  live: {
    svgW: 900,
    svgH: 340,
    choiceY: 140,
    choiceRadius: CHOICE_RADIUS,
    padH: 35,
    floatY0: 50,
    floatY1: 75,
  },
};

function getVizSizing() {
  var svgEl = typeof document !== 'undefined' ? document.getElementById('viz-svg') : null;
  var viewportW = svgEl && svgEl.clientWidth ? svgEl.clientWidth : 0;
  if (!viewportW && typeof window !== 'undefined') viewportW = window.innerWidth || 0;
  var isMobile = viewportW > 0 && viewportW <= 640;

  return {
    isMobile: isMobile,
    labelFontSize: isMobile ? '0.9rem' : '0.8rem',
    problemRadius: isMobile ? 4.6 : 4.0,
    legendMarkerRadius: isMobile ? 6.4 : 5.8,
    resolveExitRadius: isMobile ? 2.0 : 1.7,
  };
}

function buildChoiceCenters(svgW, padH, choiceY, choiceRadius) {
  var goldenAngle = Math.PI * (3 - Math.sqrt(5));
  var trackW = svgW - padH * 2;
  var squareSide = trackW;
  var squareLeft = padH;
  var squareTop = choiceY - squareSide / 2;
  var inset = choiceRadius + 4;
  var usableSide = Math.max(0, squareSide - inset * 2);

  var points = d3.range(M).map(function(i) {
    var idx = i + 1;
    var t = (idx - 0.5) / M;
    var r = 0.5 * Math.sqrt(t);
    var theta = idx * goldenAngle;
    return {
      x: 0.5 + r * Math.cos(theta),
      y: 0.5 + r * Math.sin(theta),
    };
  });

  // Keep CO labels in stable reading order: left-to-right, top-to-bottom.
  points.sort(function(a, b) {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  return points.map(function(p) {
    return {
      x: squareLeft + inset + p.x * usableSide,
      y: squareTop + inset + p.y * usableSide,
    };
  });
}

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
    { label: 'Pressure', score: raw.energyScore,   lo: 'Light',       hi: 'Heavy',        min: 1, max: 5 },
    { label: 'Decision', score: raw.decisionScore, lo: 'Unsegmented', hi: 'Specialized',  min: 1, max: 5 },
    { label: 'Access',   score: raw.accessScore,   lo: 'Unsegmented', hi: 'Specialized',  min: 1, max: 5 },
  ];

  const g = svg.selectAll('g.track')
    .data(tracks)
    .join('g')
      .attr('class', 'track')
      .attr('transform', (d, i) => `translate(0, ${i * TRACKH + 4})`);

  g.append('text')
    .attr('x', 0)
    .attr('y', 22)
    .attr('font-family', VIZ_FONT.mono)
    .attr('font-size', VIZ_FONT_SIZE.trackLabel)
    .attr('font-weight', '300')
    .attr('fill', C.inkFaint)
    .attr('letter-spacing', '0.1em')
    .text(d => d.label);

  g.append('text')
    .attr('x', PAD_L)
    .attr('y', 13)
    .attr('font-family', VIZ_FONT.mono)
    .attr('font-size', VIZ_FONT_SIZE.trackEnd)
    .attr('font-weight', '300')
    .attr('fill', C.inkGhost)
    .attr('text-anchor', 'start')
    .attr('letter-spacing', '0.08em')
    .text(d => d.lo);

  g.append('text')
    .attr('x', PAD_L + TRACKW)
    .attr('y', 13)
    .attr('font-family', VIZ_FONT.mono)
    .attr('font-size', VIZ_FONT_SIZE.trackEnd)
    .attr('font-weight', '300')
    .attr('fill', C.inkGhost)
    .attr('text-anchor', 'end')
    .attr('letter-spacing', '0.08em')
    .text(d => d.hi);

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
  var sizing = getVizSizing();
  const {
    svgW: SVG_W,
    choiceRadius: CHOICE_R,
    padH: PAD_H,
  } = VIZ_LAYOUT.empty;
  var squareSide = SVG_W - PAD_H * 2;
  var squareTop = 92;
  var SVG_H = squareTop + squareSide + 86;
  var CHOICE_Y = squareTop + squareSide / 2;
  var FLOAT_Y0 = squareTop - 32;
  const PROB_R = sizing.problemRadius;

  const svg = d3.select('#viz-svg')
    .attr('viewBox', `0 0 ${SVG_W} ${SVG_H}`);

  svg.selectAll('*').remove();
  var eventTickerEl = ensureVizEventTicker();
  if (eventTickerEl) eventTickerEl.textContent = '';

  const choiceCenters = buildChoiceCenters(SVG_W, PAD_H, CHOICE_Y, CHOICE_R);

  // Choice circles
  const choiceLayer = svg.append('g');
  choiceLayer.selectAll('circle.choice')
    .data(d3.range(M))
    .join('circle')
      .attr('class', 'choice')
      .attr('cx', i => choiceCenters[i].x)
      .attr('cy', i => choiceCenters[i].y)
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
      .attr('x', i => choiceCenters[i].x)
      .attr('y', i => choiceCenters[i].y + CHOICE_R + 13)
      .attr('text-anchor', 'middle')
      .attr('font-family', VIZ_FONT.mono)
      .attr('font-size', sizing.labelFontSize)
      .attr('font-weight', '300')
      .attr('letter-spacing', '0.1em')
      .attr('fill', C.inkFaint)
      .text(i => formatChoiceOpportunityLabel(i));

  // Organizational iteration counter
  svg.append('text')
    .attr('class', 'viz-counter')
    .attr('x', 0)
    .attr('y', 16)
    .attr('font-family', VIZ_FONT.mono)
    .attr('font-size', sizing.labelFontSize)
    .attr('font-weight', '300')
    .attr('letter-spacing', '0.1em')
    .attr('fill', C.inkFaint)
    .text('Organizational Iteration 0 of 20');

  // Legend
  var LEGEND_Y = SVG_H - 12;
  var legendItems = [
    { label: 'Entering',  color: C.rust },
    { label: 'Searching CO',          color: C.rustLight },
    { label: 'In choice opportunity', color: C.gold },
  ];

  var legendG = svg.append('g').attr('transform', 'translate(0, ' + LEGEND_Y + ')');
  var legendX = 0;
  var LEGEND_MARKER_R = sizing.legendMarkerRadius;
  var LEGEND_TEXT_GAP = 9;

  legendItems.forEach(function(item) {
    legendG.append('circle')
      .attr('cx', legendX + LEGEND_MARKER_R)
      .attr('cy', 0)
      .attr('r', LEGEND_MARKER_R)
      .attr('fill', item.color);

    legendG.append('text')
      .attr('x', legendX + LEGEND_MARKER_R * 2 + LEGEND_TEXT_GAP)
      .attr('y', 4)
      .attr('font-family', VIZ_FONT.mono)
      .attr('font-size', sizing.labelFontSize)
      .attr('font-weight', '300')
      .attr('letter-spacing', '0.08em')
      .attr('fill', C.inkFaint)
      .text(item.label);

    legendX += item.label.length * 10 + 55;
  });

  // Resolved legend item
  var resolvedCx = legendX + LEGEND_MARKER_R + 0.5;
  var resolvedR  = LEGEND_MARKER_R + 0.5;

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
    .attr('x', legendX + resolvedR * 2 + LEGEND_TEXT_GAP)
    .attr('y', 4)
    .attr('font-family', VIZ_FONT.mono)
    .attr('font-size', sizing.labelFontSize)
    .attr('font-weight', '300')
    .attr('letter-spacing', '0.08em')
    .attr('fill', C.inkFaint)
    .text('RESOLVED PROBLEMS (CUM.)');

  // One problem dot in entering state
  svg.append('circle')
    .attr('class', 'problem')
    .attr('cx', choiceCenters[0].x)
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
  function setReadout(id, toneClass, label, text) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = '';
    var span = document.createElement('span');
    span.className = toneClass;
    span.textContent = label;
    el.appendChild(span);
    el.appendChild(document.createTextNode(': ' + text));
  }

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
    'Single run snapshot (organizational iteration ' + PERIODS + ')';
  setReadout('sum-thisrun-resolved', 'outcome-resolved', 'Resolved', runResolved + ' of ' + W + ' problems');
  setReadout('sum-thisrun-inforum', 'outcome-unresolved', 'In choice opportunity', runInForum + ' of ' + W + ' problems');
  setReadout('sum-thisrun-adrift', 'outcome-flight', 'Adrift', runAdrift + ' of ' + W + ' problems');
  setReadout('sum-thisrun-choices-resolved', 'outcome-resolved', 'Choice opportunities concluded', runChoicesResolved + ' of ' + M);
  setReadout('sum-thisrun-choices-open', 'outcome-unresolved', 'Choice opportunities active', runChoicesOpen + ' of ' + M);

  // Primary: canonical GCM decision styles (choice-level)
  document.getElementById('sum-header').textContent =
    'Across 100 simulations (Monte Carlo average):';

  document.getElementById('sum-choices-label').textContent =
    'Choice closure style shares';
  setReadout('sum-choice-resolution', 'outcome-resolved', 'Deliberation', `${pctRes}% \u2014 choice opportunity closed after sustained engagement`);
  setReadout('sum-choice-oversight', 'outcome-oversight', 'Oversight', `${pctOver}% \u2014 choice opportunity closed with no problem attached`);
  setReadout('sum-choice-flight', 'outcome-flight', 'Flight', `${pctFli}% \u2014 choice opportunity closed after problems fled`);

  // Supplementary: problem fates (interpretive extension)
  document.getElementById('sum-problems-label').textContent =
    `What happened to the ${W} problems`;
  setReadout('sum-prob-resolved', 'outcome-resolved', 'Resolved', `${probResolved} of ${W} \u2014 genuinely closed at a choice opportunity`);
  setReadout('sum-prob-displaced', 'outcome-oversight', 'Displaced', `${probDisplaced} of ${W} \u2014 choice opportunity closed without resolving this problem`);
  setReadout('sum-prob-adrift', 'outcome-flight', 'Adrift', `${probAdrift} of ${W} \u2014 detached from choice opportunity or never attached`);
  setReadout('sum-prob-inforum', 'outcome-unresolved', 'In choice opportunity', `${probInForum} of ${W} \u2014 still attached to an open choice opportunity at organizational iteration ${PERIODS}`);

  document.getElementById('replay-btn').hidden      = false;
  document.getElementById('stochastic-note').hidden = false;
}

// ─── Visualization ────────────────────────────────────────────────────────────
function drawViz(simResult) {
  const { ticks, resolution, oversight, flight } = simResult;
  var eventTickerEl = ensureVizEventTicker();
  if (eventTickerEl) eventTickerEl.textContent = '';
  var sizing = getVizSizing();

  // Choice-level percentages (canonical GCM decision styles)
  // Rounded to nearest 5% — at 100 Monte Carlo iterations, finer precision is noise
  const pctRes  = Math.round(simResult.resolution * 20) * 5;
  const pctOver = Math.round(simResult.oversight  * 20) * 5;
  const pctFli  = 100 - pctRes - pctOver;

  // Problem-level counts (out of W=20, interpretive extension)
  const probResolved  = Math.round(simResult.problemResolved);
  const probDisplaced = Math.round(simResult.problemDisplaced);
  const probAdrift    = Math.round(simResult.problemAdrift);
  const probInForum   = Math.round(simResult.problemInForum);

  // Reset summary state
  document.getElementById('sim-summary').hidden   = true;
  document.getElementById('replay-btn').hidden    = true;
  document.getElementById('stochastic-note').hidden = true;

  const {
    svgW: SVG_W,
    choiceRadius: CHOICE_R,
    padH: PAD_H,
  } = VIZ_LAYOUT.live;
  var squareSide = SVG_W - PAD_H * 2;
  var squareTop = 102;
  var SVG_H = squareTop + squareSide + 96;
  var CHOICE_Y = squareTop + squareSide / 2;
  var FLOAT_Y0 = squareTop - 44;
  var FLOAT_Y1 = squareTop - 18;
  const PROB_R = sizing.problemRadius;

  const svg = d3.select('#viz-svg')
    .attr('viewBox', `0 0 ${SVG_W} ${SVG_H}`);

  svg.selectAll('*').remove();

  // M (choices) and W (problems) are defined by gc-simulation.js
  const choiceCenters = buildChoiceCenters(SVG_W, PAD_H, CHOICE_Y, CHOICE_R);
  const floatTracks = choiceCenters.map(function(c) { return c.x; }).sort(function(a, b) { return a - b; });
  const choiceXFallback = floatTracks.length ? floatTracks : [PAD_H];

  function floatPos(id) {
    if (id < M) {
      return { x: choiceCenters[id].x, y: FLOAT_Y0 };
    }
    const col = (id - M) % choiceXFallback.length;
    return { x: choiceXFallback[col], y: FLOAT_Y1 };
  }

  function attachedPos(choiceId, slot, total) {
    // Fibonacci spiral distribution — fixed dot size
    const goldenAngle = 2.399; // radians — golden angle
    const maxR        = CHOICE_R - PROB_R - 1; // keep dots within boundary
    const r           = maxR * Math.sqrt((slot + 0.5) / total);
    const angle       = slot * goldenAngle;
    const center      = choiceCenters[choiceId];

    return {
      x: center.x + r * Math.cos(angle),
      y: center.y + r * Math.sin(angle),
    };
  }

  // ── clipPath defs — one per choice circle ──────────────────────────────────
  const defs = svg.append('defs');
  d3.range(M).forEach(i => {
    defs.append('clipPath')
      .attr('id', `clip-c${i}`)
      .append('circle')
        .attr('cx', choiceCenters[i].x)
        .attr('cy', choiceCenters[i].y)
        .attr('r', CHOICE_R);
  });

  // ── Layer 1: choice circle strokes ─────────────────────────────────────────
  const choiceLayer = svg.append('g');

  choiceLayer.selectAll('circle.choice')
    .data(d3.range(M))
    .join('circle')
      .attr('class', 'choice')
      .attr('cx', i => choiceCenters[i].x)
      .attr('cy', i => choiceCenters[i].y)
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
      .attr('x', i => choiceCenters[i].x - CHOICE_R)
      .attr('y', i => choiceCenters[i].y + CHOICE_R)
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
      .attr('x', i => choiceCenters[i].x)
      .attr('y', i => choiceCenters[i].y + CHOICE_R + 13)
      .attr('text-anchor', 'middle')
      .attr('font-family', VIZ_FONT.mono)
      .attr('font-size', sizing.labelFontSize)
      .attr('font-weight', '300')
      .attr('letter-spacing', '0.1em')
      .attr('fill', C.inkFaint)
      .text(i => formatChoiceOpportunityLabel(i));

  // ── Layer 5: organizational iteration counter (top-left) ────────────────────
  var counterText = svg.append('text')
    .attr('class', 'viz-counter')
    .attr('x', 0)
    .attr('y', 16)
    .attr('font-family', VIZ_FONT.mono)
    .attr('font-size', sizing.labelFontSize)
    .attr('font-weight', '300')
    .attr('letter-spacing', '0.1em')
    .attr('fill', C.inkFaint)
    .text('Organizational Iteration 0 of 20');

  // ── Phase label (top-right) ─────────────────────────────────────────────────
  var phaseText = svg.append('text')
    .attr('x', SVG_W)
    .attr('y', 16)
    .attr('text-anchor', 'end')
    .attr('font-family', VIZ_FONT.mono)
    .attr('font-size', sizing.labelFontSize)
    .attr('font-weight', '300')
    .attr('font-style', 'italic')
    .attr('letter-spacing', '0.08em')
    .attr('fill', C.inkFaint)
    .text('');

  // ── Layer 6: legend (bottom of SVG) ─────────────────────────────────────────
  var LEGEND_Y = SVG_H - 12;
  var legendItems = [
    { label: 'Entering',  color: C.rust },
    { label: 'Searching CO',          color: C.rustLight },
    { label: 'In choice opportunity', color: C.gold },
  ];

  var legendG = svg.append('g').attr('transform', 'translate(0, ' + LEGEND_Y + ')');
  var legendX = 0;
  var LEGEND_MARKER_R = sizing.legendMarkerRadius;
  var LEGEND_TEXT_GAP = 9;

  legendItems.forEach(function(item) {
    legendG.append('circle')
      .attr('cx', legendX + LEGEND_MARKER_R)
      .attr('cy', 0)
      .attr('r', LEGEND_MARKER_R)
      .attr('fill', item.color);

    legendG.append('text')
      .attr('x', legendX + LEGEND_MARKER_R * 2 + LEGEND_TEXT_GAP)
      .attr('y', 4)
      .attr('font-family', VIZ_FONT.mono)
      .attr('font-size', sizing.labelFontSize)
      .attr('font-weight', '300')
      .attr('letter-spacing', '0.08em')
      .attr('fill', C.inkFaint)
      .text(item.label);

    legendX += item.label.length * 10 + 55;
  });

  // Resolved legend item — semicircle fill at bottom + circle outline
  // Uses an arc path instead of clipping to avoid transform/coordinate issues
  var resolvedCx = legendX + LEGEND_MARKER_R + 0.5;
  var resolvedR  = LEGEND_MARKER_R + 0.5;

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
    .attr('x', legendX + resolvedR * 2 + LEGEND_TEXT_GAP)
    .attr('y', 4)
    .attr('font-family', VIZ_FONT.mono)
    .attr('font-size', sizing.labelFontSize)
    .attr('font-weight', '300')
    .attr('letter-spacing', '0.08em')
    .attr('fill', C.inkFaint)
    .text('RESOLVED PROBLEMS (CUM.)');

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
      var resolvedIndex = typeof p.attachedTo === 'number' ? p.attachedTo : 0;
      var resolvedCenter = choiceCenters[resolvedIndex] || choiceCenters[0];
      return { x: resolvedCenter.x, y: resolvedCenter.y, opacity: 0, fill: C.sage, r: PROB_R };
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
    const choicesOpenedThisTick = [];
    const choicesResolvedThisTick = new Set();

    svg.selectAll('circle.choice')
      .data(tick.choices)
      .transition()
        .duration(750)
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
        text = 'Resolved: this choice opportunity has closed';
      } else {
        text = 'Choice opportunity: where decisions could be made';
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
        text = 'Problem searching for a choice opportunity';
      } else if (p.state === 'attached') {
        text = 'Problem attached to choice opportunity ' + formatChoiceOpportunityLabel(p.attachedTo);
      } else if (p.state === 'resolved') {
        text = 'Problem resolved at choice opportunity ' + formatChoiceOpportunityLabel(p.attachedTo);
      }
      d3.select(this).select('title').text(text);
    });

    // Detect exit types by comparing previous and current tick
    const resolvedThisTick = new Set();
    const flightSet        = new Set();
    const oversightSet     = new Set();

    if (prevTick) {
      for (let c = 0; c < M; c++) {
        if (prevTick.choices[c].state === 'inactive' && tick.choices[c].state === 'active') {
          choicesOpenedThisTick.push(c);
        }
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
        .duration(750)
        .ease(d3.easeCubicInOut)
        .attr('y',      i => choiceCenters[i].y + CHOICE_R - (resolvedAtChoice[i] / W) * (CHOICE_R * 2))
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
          .transition().duration(500).ease(d3.easeCubicOut)
            .attr('r', attrs.r).attr('opacity', attrs.opacity).attr('fill', attrs.fill);
      });

    // Resolution exit: move to circle centre, shrink to r:1.5, fill sage, then fade
    allProbs.filter(id => resolvedThisTick.has(id))
      .each(function(id) {
        var centerIdx = prevTick.problems[id].attachedTo;
        var center = choiceCenters[centerIdx] || choiceCenters[0];
        d3.select(this).interrupt()
          .transition().duration(500).ease(d3.easeCubicInOut)
            .attr('cx', center.x).attr('cy', center.y).attr('r', sizing.resolveExitRadius).attr('fill', C.sage)
          .transition().duration(250)
            .attr('opacity', 0);
      });

    // Flight exit: flash rust, then move to float position
    allProbs.filter(id => flightSet.has(id))
      .each(function(id) {
        const fp = floatPos(id);
        d3.select(this).interrupt()
          .transition().duration(250)
            .attr('fill', C.rust)
          .transition().duration(500).ease(d3.easeCubicInOut)
            .attr('cx', fp.x).attr('cy', fp.y).attr('r', PROB_R)
            .attr('opacity', 0.85).attr('fill', C.inkFaint);
      });

    // Oversight exit: flash slate, then move to float position
    allProbs.filter(id => oversightSet.has(id))
      .each(function(id) {
        const fp = floatPos(id);
        d3.select(this).interrupt()
          .transition().duration(250)
            .attr('fill', C.slate)
          .transition().duration(500).ease(d3.easeCubicInOut)
            .attr('cx', fp.x).attr('cy', fp.y).attr('r', PROB_R)
            .attr('opacity', 0.85).attr('fill', C.inkFaint);
      });

    // All other problems: deterministic position transition
    allProbs.filter(id => !resolvedThisTick.has(id) && !flightSet.has(id) && !oversightSet.has(id) && !enteringThisTick.has(id))
      .interrupt()
      .transition()
        .delay(0)
        .duration(900)
        .ease(d3.easeCubicInOut)
        .attr('cx',      id => probAttrs(tick, id).x)
        .attr('cy',      id => probAttrs(tick, id).y)
        .attr('r',       id => probAttrs(tick, id).r)
        .attr('opacity', id => probAttrs(tick, id).opacity)
        .attr('fill',    id => probAttrs(tick, id).fill);

    // Sync pulse class — attached dots breathe, others do not
    allProbs.classed('problem-attached', id => tick.problems[id].state === 'attached');
    allProbs.classed('problem-searching', id => tick.problems[id].state === 'floating');

    counterText.text(`Organizational Iteration ${tick.tick} of 20`);

    // Event ticker
    var tickerMsg = '';
    if (choicesResolvedThisTick.size > 0) {
      const choiceIds = Array.from(choicesResolvedThisTick).sort((a, b) => a - b);
      if (choiceIds.length === 1) {
        const c = choiceIds[0];
        var resolvedCount = 0;
        var displacedCount = 0;
        for (let id = 0; id < W; id++) {
          if (prevTick.problems[id].state === 'attached' && prevTick.problems[id].attachedTo === c) {
            if (tick.problems[id].state === 'resolved') resolvedCount++;
            if (tick.problems[id].state === 'floating') displacedCount++;
          }
        }
        var outcomeText;
        if (resolvedCount > 0) {
          outcomeText = `${resolvedCount} problem${resolvedCount === 1 ? '' : 's'} resolved`;
        } else if (displacedCount > 0) {
          outcomeText = 'no problem resolved';
        } else {
          outcomeText = 'closed';
        }
        tickerMsg = `${formatChoiceOpportunityLabel(c)} closed (energy threshold reached; ${outcomeText})`;
      } else {
        tickerMsg = `${formatChoiceOpportunityList(choiceIds, 3)} closed this iteration`;
      }
    } else if (choicesOpenedThisTick.length > 0) {
      const opened = choicesOpenedThisTick.sort((a, b) => a - b);
      if (opened.length === 1) {
        tickerMsg = `${formatChoiceOpportunityLabel(opened[0])} opened`;
      } else {
        tickerMsg = `${formatChoiceOpportunityList(opened, 3)} opened this iteration`;
      }
    }
    if (eventTickerEl) eventTickerEl.textContent = tickerMsg;

    // Phase label
    if (enteringThisTick.size > 0) {
      phaseText
        .attr('fill', C.inkFaint)
        .text('Problems entering');
    } else if (prevTick && !isDeadTick(tickIdx)) {
      phaseText
        .attr('fill', C.inkFaint)
        .text('Energy accumulating');
    } else if (prevTick && isDeadTick(tickIdx)) {
      phaseText.transition().duration(400)
        .attr('fill', C.rust)
        .text('System stalled');
    }

  }

  renderTick(0, null);

  let current = 0;

  function stepTick() {
    current++;
    if (current >= ticks.length) {
      counterText.text('Organizational Iteration 20 of 20 \u00B7 showing final run');
      phaseText.text('');
      if (eventTickerEl) eventTickerEl.textContent = '';
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
      delay = 1200;
    } else if (isDeadTick(current)) {
      delay = 800;
    } else {
      delay = 1450;
    }
    setTimeout(stepTick, delay);
  }

  setTimeout(stepTick, 1000);
}
