'use strict';

/**
 * gc-viz.js
 * Organised Anarchy — Shared Visualization
 *
 * D3 rendering for the Garbage Can Model simulation.
 * Source of truth: modules/garbage-can/assess/index.html
 *
 * Dependencies: d3.js, gc-viz-config.js
 *
 * Exposes:
 *   C                - color tokens
 *   drawPositioning  - three-axis positioning diagram
 *   drawViz          - simulation animation with summary
 */

// ─── Color tokens ─────────────────────────────────────────────────────────────
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
  slateLight: readCssVar('--viz-slate-light', '#5A7080'),
  sage:      readCssVar('--viz-sage', '#4A6741'),
  sageLight: readCssVar('--viz-sage-light', '#6B8F62'),
};

function readCssNumber(name, fallback) {
  const parsed = parseFloat(readCssVar(name, String(fallback)));
  return Number.isFinite(parsed) ? parsed : fallback;
}

const CHOICE_RADIUS = 34;
const DESKTOP_CO_FIELD_HEIGHT_SCALE = 0.78;

const GC_VIZ_DEFAULTS = (typeof window !== 'undefined' && window.GC_VIZ_CONFIG)
  ? window.GC_VIZ_CONFIG
  : {
      defaults: { choices: 10, problems: 20, periods: 20, textScale: 'default' },
      textScale: { compact: 0.9, default: 1, large: 1.12 },
      layout: {
        empty: { svgW: 900, choiceRadius: CHOICE_RADIUS, padH: 55, squareTop: 102, bottomLegendPad: 66, bottomLegendOffset: 56, enteringOffset: -32 },
        live: { svgW: 900, choiceRadius: CHOICE_RADIUS, padH: 35, squareTop: 108, bottomLegendPad: 74, bottomLegendOffset: 56, floatY0Offset: -36, floatY1Offset: -14 },
      },
    };
const VIZ_LAYOUT = {
  empty: {
    svgW: (GC_VIZ_DEFAULTS.layout.empty && GC_VIZ_DEFAULTS.layout.empty.svgW) || 900,
    choiceRadius: CHOICE_RADIUS,
    padH: (GC_VIZ_DEFAULTS.layout.empty && GC_VIZ_DEFAULTS.layout.empty.padH) || 55,
    squareTop: (GC_VIZ_DEFAULTS.layout.empty && GC_VIZ_DEFAULTS.layout.empty.squareTop) || 102,
    bottomLegendPad: (GC_VIZ_DEFAULTS.layout.empty && GC_VIZ_DEFAULTS.layout.empty.bottomLegendPad) || 66,
    bottomLegendOffset: (GC_VIZ_DEFAULTS.layout.empty && GC_VIZ_DEFAULTS.layout.empty.bottomLegendOffset) || 56,
    enteringOffset: (GC_VIZ_DEFAULTS.layout.empty && GC_VIZ_DEFAULTS.layout.empty.enteringOffset) || -32,
  },
  live: {
    svgW: (GC_VIZ_DEFAULTS.layout.live && GC_VIZ_DEFAULTS.layout.live.svgW) || 900,
    choiceRadius: CHOICE_RADIUS,
    padH: (GC_VIZ_DEFAULTS.layout.live && GC_VIZ_DEFAULTS.layout.live.padH) || 35,
    squareTop: (GC_VIZ_DEFAULTS.layout.live && GC_VIZ_DEFAULTS.layout.live.squareTop) || 108,
    bottomLegendPad: (GC_VIZ_DEFAULTS.layout.live && GC_VIZ_DEFAULTS.layout.live.bottomLegendPad) || 74,
    bottomLegendOffset: (GC_VIZ_DEFAULTS.layout.live && GC_VIZ_DEFAULTS.layout.live.bottomLegendOffset) || 56,
    floatY0Offset: (GC_VIZ_DEFAULTS.layout.live && GC_VIZ_DEFAULTS.layout.live.floatY0Offset) || -36,
    floatY1Offset: (GC_VIZ_DEFAULTS.layout.live && GC_VIZ_DEFAULTS.layout.live.floatY1Offset) || -14,
  },
};
const CHOICE_STROKE_WIDTH = 1.8;
const CHOICE_STROKE_WIDTH_RESOLVED = 1.2;
const LEGEND_RESOLVED_STROKE_WIDTH = 1.2;
const MOTION = {
  enter: { popInMs: 180, searchShiftMs: 220, settleMs: 460, overshootRadius: 1.35 },
  attach: { pullMs: 520, holdMs: 140, settleMs: 320, overshootRadius: 1.22 },
  search: { driftMs: 420, pulseMs: 230, jitterAmp: 2.4 },
  resolve: { convergeMs: 520, fadeMs: 260, overshootRadius: 1.45 },
  flight: { flashMs: 200, ejectMs: 560, overshootRadius: 1.3 },
  oversight: { flashMs: 220, ejectMs: 560, overshootRadius: 1.3 },
};
const TIMING = {
  legendLeadMs: 110,
  finalPauseMs: 520,
  minTickMs: 850,
  maxTickMs: 2200,
  motionFraction: 0.76,
  eventPauseMs: 280,
  densitySlowMs: 240,
  densityFastMs: -140,
  deadTickFastMs: -120,
  resolvePauseMs: 340,
  baseEarlyMs: 1850, // iter 1-5
  baseMidMs: 1450,   // iter 6-10
  baseLateMs: 1080,  // iter 11-20
};
const TOP_LEGEND_LINE_GAP_EM = readCssNumber('--viz-lh-top', 1.55);
const BOTTOM_LEGEND_LINE_STEP = readCssNumber('--viz-fs-legend', 13) * readCssNumber('--viz-lh-legend', 1.7);

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

function setMultilineLegendText(textSel, lines, lineGapEm) {
  textSel.selectAll('tspan').remove();
  lines.forEach(function(line, idx) {
    textSel.append('tspan')
      .attr('x', textSel.attr('x'))
      .attr('dy', idx === 0 ? 0 : `${lineGapEm}em`)
      .text(line);
  });
}

const GC_LEGEND_ITEMS = [
  { label: 'Problem entering org',  color: C.rust },
  { label: 'Problem searching for CO', color: C.gold },
  { label: 'Problem in CO', color: C.sageLight },
  { label: 'RESOLVED PROBLEMS (CUM.)', color: C.sage, resolved: true },
];
function getSimulationDefaultsFromWindow() {
  if (typeof window !== 'undefined' && typeof window.getGarbageCanDefaults === 'function') {
    return window.getGarbageCanDefaults();
  }
  return null;
}

function resolveVizDimensions(simResult, options) {
  var defaults = GC_VIZ_DEFAULTS.defaults || {};
  var fromSimMeta = simResult && simResult.meta ? simResult.meta : {};
  var fromSimulation = getSimulationDefaultsFromWindow() || {};
  var opts = options || {};
  var svgEl = typeof document !== 'undefined' ? document.getElementById('viz-svg') : null;
  var domScale = svgEl ? svgEl.getAttribute('data-viz-scale') : null;
  var choices = fromSimMeta.choices || fromSimulation.choices || opts.choices || defaults.choices || 10;
  var problems = fromSimMeta.problems || fromSimulation.problems || opts.problems || defaults.problems || 20;
  var periods = fromSimMeta.periods || fromSimulation.periods || opts.periods || defaults.periods || 20;
  var textScale = opts.textScale || domScale || fromSimMeta.textScale || defaults.textScale || 'default';
  return { choices: choices, problems: problems, periods: periods, textScale: textScale };
}

function resolveTextScale(scalePresetOrNumber) {
  if (typeof scalePresetOrNumber === 'number') return scalePresetOrNumber;
  var scales = GC_VIZ_DEFAULTS.textScale || {};
  return scales[scalePresetOrNumber] || scales.default || 1;
}

function drawBottomLegend(svg, legendY, sizing) {
  var legendG = svg.append('g').attr('transform', 'translate(0, ' + legendY + ')');
  var LEGEND_MARKER_R = sizing.legendMarkerRadius;
  var LEGEND_TEXT_GAP = 9;
  var LEGEND_LINE_H = BOTTOM_LEGEND_LINE_STEP;

  GC_LEGEND_ITEMS.forEach(function(item, rowIdx) {
    var rowY = rowIdx * LEGEND_LINE_H;
    var markerX = LEGEND_MARKER_R;

    if (item.resolved) {
      var resolvedR = LEGEND_MARKER_R + 0.5;
      var resolvedCx = markerX;
      legendG.append('path')
        .attr('d', 'M ' + (resolvedCx - resolvedR) + ' ' + rowY +
                    ' A ' + resolvedR + ' ' + resolvedR + ' 0 0 0 ' + (resolvedCx + resolvedR) + ' ' + rowY +
                    ' Z')
        .attr('fill', C.sage)
        .attr('fill-opacity', 0.35);

      legendG.append('circle')
        .attr('cx', resolvedCx)
        .attr('cy', rowY)
        .attr('r', resolvedR)
        .attr('fill', 'none')
        .attr('stroke', C.inkMid)
        .attr('stroke-width', LEGEND_RESOLVED_STROKE_WIDTH);
    } else {
      legendG.append('circle')
        .attr('cx', markerX)
        .attr('cy', rowY)
        .attr('r', LEGEND_MARKER_R)
        .attr('fill', item.color);
    }

    legendG.append('text')
      .attr('class', 'gc-viz__legend-text')
      .attr('x', LEGEND_MARKER_R * 2 + LEGEND_TEXT_GAP)
      .attr('y', rowY + 4)
      .attr('text-anchor', 'start')
      .text(item.label);
  });
}

function createTopLegend(svg) {
  var topLegend = svg.append('text')
    .attr('class', 'viz-counter gc-viz__top-legend')
    .attr('x', 0)
    .attr('y', 16);

  return function setTopLegend(iterText, eventText) {
    setMultilineLegendText(topLegend, [iterText, eventText || 'No event'], TOP_LEGEND_LINE_GAP_EM);
  };
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

function getVizSizing() {
  var viewportW = 0;
  if (typeof window !== 'undefined') {
    viewportW = window.innerWidth || 0;
  }
  if (!viewportW && typeof document !== 'undefined' && document.documentElement) {
    viewportW = document.documentElement.clientWidth || 0;
  }
  var isMobile = viewportW > 0 && viewportW <= 640;

  return {
    isMobile: isMobile,
    problemRadius: isMobile ? 4.6 : 4.0,
    legendMarkerRadius: isMobile ? 6.4 : 5.8,
    resolveExitRadius: isMobile ? 2.0 : 1.7,
  };
}

function resolveVizLayout(mode, sizing) {
  var base = VIZ_LAYOUT[mode] || {};
  return Object.assign({}, base);
}

function resolveChoiceFieldBox(layout, sizing) {
  var fieldW = layout.svgW - layout.padH * 2;
  var fieldH = sizing.isMobile ? fieldW : Math.round(fieldW * DESKTOP_CO_FIELD_HEIGHT_SCALE);
  return {
    left: layout.padH,
    top: layout.squareTop,
    width: fieldW,
    height: fieldH,
  };
}

function buildChoiceCenters(fieldBox, choiceRadius, choiceCount) {
  var goldenAngle = Math.PI * (3 - Math.sqrt(5));
  var inset = choiceRadius + 4;
  var usableW = Math.max(0, fieldBox.width - inset * 2);
  var usableH = Math.max(0, fieldBox.height - inset * 2);

  var points = d3.range(choiceCount).map(function(i) {
    var idx = i + 1;
    var t = (idx - 0.5) / choiceCount;
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
      x: fieldBox.left + inset + p.x * usableW,
      y: fieldBox.top + inset + p.y * usableH,
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
    .attr('class', 'gc-viz__track-label')
    .attr('x', 0)
    .attr('y', 22)
    .text(d => d.label);

  g.append('text')
    .attr('class', 'gc-viz__track-end')
    .attr('x', PAD_L)
    .attr('y', 13)
    .attr('text-anchor', 'start')
    .text(d => d.lo);

  g.append('text')
    .attr('class', 'gc-viz__track-end')
    .attr('x', PAD_L + TRACKW)
    .attr('y', 13)
    .attr('text-anchor', 'end')
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
function drawEmptyState(options) {
  var dims = resolveVizDimensions(null, options);
  var sizing = getVizSizing();
  var layout = resolveVizLayout('empty', sizing);
  const {
    svgW: SVG_W,
    choiceRadius: CHOICE_R,
    bottomLegendPad,
    bottomLegendOffset,
    enteringOffset,
  } = layout;
  var fieldBox = resolveChoiceFieldBox(layout, sizing);
  var SVG_H = fieldBox.top + fieldBox.height + bottomLegendPad;
  var CHOICE_Y = fieldBox.top + fieldBox.height / 2;
  var FLOAT_Y0 = fieldBox.top + enteringOffset;
  const PROB_R = sizing.problemRadius;

  const svg = d3.select('#viz-svg')
    .attr('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.style('--viz-scale', String(resolveTextScale(dims.textScale)));

  svg.selectAll('*').remove();
  var eventTickerEl = ensureVizEventTicker();
  if (eventTickerEl) eventTickerEl.textContent = '';

  const choiceCenters = buildChoiceCenters(fieldBox, CHOICE_R, dims.choices);

  // Choice circles
  const choiceLayer = svg.append('g');
  choiceLayer.selectAll('circle.choice')
    .data(d3.range(dims.choices))
    .join('circle')
      .attr('class', 'choice')
      .attr('cx', i => choiceCenters[i].x)
      .attr('cy', i => choiceCenters[i].y)
      .attr('r', CHOICE_R)
      .attr('fill', 'none')
      .attr('stroke', C.inkGhost)
      .attr('stroke-width', CHOICE_STROKE_WIDTH);

  // Choice labels
  const labelLayer = svg.append('g');
  labelLayer.selectAll('text.choice-label')
    .data(d3.range(dims.choices))
    .join('text')
      .attr('class', 'choice-label gc-viz__choice-label')
      .attr('x', i => choiceCenters[i].x)
      .attr('y', i => choiceCenters[i].y + CHOICE_R + 13)
      .attr('text-anchor', 'middle')
      .text(i => formatChoiceOpportunityLabel(i));

  // Top legend (left-aligned, multiline)
  var setTopLegend = createTopLegend(svg);
  setTopLegend(`Iter 0/${dims.periods}`, 'No event');

  // Bottom legend (left-aligned, multiline)
  var LEGEND_Y = SVG_H - bottomLegendOffset;
  drawBottomLegend(svg, LEGEND_Y, sizing);

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
  probResolved, probDisplaced, probAdrift, probInForum, probNeverEntered,
  lastTick,
  dims
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
  var runNeverEntered = 0;
  var runChoicesResolved = 0;
  var runChoicesOpen     = 0;

  if (lastTick) {
    lastTick.problems.forEach(function(p) {
      if (p.state === 'resolved') runResolved++;
      else if (p.state === 'attached') runInForum++;
      else if (p.state === 'floating') runAdrift++;
      else if (p.state === 'inactive') runNeverEntered++;
    });
    lastTick.choices.forEach(function(c) {
      if (c.state === 'resolved') runChoicesResolved++;
      else if (c.state === 'active') runChoicesOpen++;
    });
  }

  document.getElementById('sum-thisrun-label').textContent =
    'Single run snapshot (organisational iteration ' + dims.periods + ')';
  setReadout('sum-thisrun-resolved', 'outcome-resolved', 'Resolved', runResolved + ' of ' + dims.problems + ' problems');
  setReadout('sum-thisrun-inforum', 'outcome-unresolved', 'In choice opportunity', runInForum + ' of ' + dims.problems + ' problems');
  setReadout('sum-thisrun-adrift', 'outcome-flight', 'Adrift', runAdrift + ' of ' + dims.problems + ' problems');
  setReadout('sum-thisrun-never-entered', 'outcome-unresolved', 'Never entered', runNeverEntered + ' of ' + dims.problems + ' problems');
  setReadout('sum-thisrun-choices-resolved', 'outcome-resolved', 'Choice opportunities concluded', runChoicesResolved + ' of ' + dims.choices);
  setReadout('sum-thisrun-choices-open', 'outcome-unresolved', 'Choice opportunities active', runChoicesOpen + ' of ' + dims.choices);

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
    `What happened to the ${dims.problems} problems`;
  setReadout('sum-prob-resolved', 'outcome-resolved', 'Resolved', `${probResolved} of ${dims.problems} \u2014 genuinely closed at a choice opportunity`);
  setReadout('sum-prob-displaced', 'outcome-oversight', 'Displaced', `${probDisplaced} of ${dims.problems} \u2014 choice opportunity closed without resolving this problem`);
  setReadout('sum-prob-adrift', 'outcome-flight', 'Adrift', `${probAdrift} of ${dims.problems} \u2014 detached from a choice opportunity after entry`);
  setReadout('sum-prob-never-entered', 'outcome-unresolved', 'Never entered', `${probNeverEntered} of ${dims.problems} \u2014 never attached to any choice opportunity by organisational iteration ${dims.periods}`);
  setReadout('sum-prob-inforum', 'outcome-unresolved', 'In choice opportunity', `${probInForum} of ${dims.problems} \u2014 still attached to an open choice opportunity at organisational iteration ${dims.periods}`);

  document.getElementById('replay-btn').hidden      = false;
  document.getElementById('stochastic-note').hidden = false;
}

// ─── Visualization ────────────────────────────────────────────────────────────
function drawViz(simResult, options) {
  const { ticks, resolution, oversight, flight } = simResult;
  var dims = resolveVizDimensions(simResult, options);
  var eventTickerEl = ensureVizEventTicker();
  if (eventTickerEl) eventTickerEl.textContent = '';
  var sizing = getVizSizing();
  var layout = resolveVizLayout('live', sizing);

  // Choice-level percentages (canonical GCM decision styles)
  // Rounded to nearest 5% — at 100 Monte Carlo iterations, finer precision is noise
  const pctRes  = Math.round(simResult.resolution * 20) * 5;
  const pctOver = Math.round(simResult.oversight  * 20) * 5;
  const pctFli  = 100 - pctRes - pctOver;

  // Problem-level counts (out of configured problem count, interpretive extension)
  const probResolved  = Math.round(simResult.problemResolved);
  const probDisplaced = Math.round(simResult.problemDisplaced);
  const probAdrift    = Math.round(simResult.problemAdrift);
  const probInForum   = Math.round(simResult.problemInForum);
  const probNeverEntered = Math.round(simResult.problemNeverEntered);

  // Reset summary state
  document.getElementById('sim-summary').hidden   = true;
  document.getElementById('replay-btn').hidden    = true;
  document.getElementById('stochastic-note').hidden = true;

  const {
    svgW: SVG_W,
    choiceRadius: CHOICE_R,
    bottomLegendPad,
    bottomLegendOffset,
    floatY0Offset,
    floatY1Offset,
  } = layout;
  var fieldBox = resolveChoiceFieldBox(layout, sizing);
  var SVG_H = fieldBox.top + fieldBox.height + bottomLegendPad;
  var CHOICE_Y = fieldBox.top + fieldBox.height / 2;
  var FLOAT_Y0 = fieldBox.top + floatY0Offset;
  var FLOAT_Y1 = fieldBox.top + floatY1Offset;
  const PROB_R = sizing.problemRadius;

  const svg = d3.select('#viz-svg')
    .attr('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.style('--viz-scale', String(resolveTextScale(dims.textScale)));

  svg.selectAll('*').remove();

  const choiceCenters = buildChoiceCenters(fieldBox, CHOICE_R, dims.choices);
  const floatTracks = choiceCenters.map(function(c) { return c.x; }).sort(function(a, b) { return a - b; });
  const choiceXFallback = floatTracks.length ? floatTracks : [layout.padH];

  function floatPos(id) {
    if (id < dims.choices) {
      return { x: choiceCenters[id].x, y: FLOAT_Y0 };
    }
    const col = (id - dims.choices) % choiceXFallback.length;
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
  d3.range(dims.choices).forEach(i => {
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
    .data(d3.range(dims.choices))
    .join('circle')
      .attr('class', 'choice')
      .attr('cx', i => choiceCenters[i].x)
      .attr('cy', i => choiceCenters[i].y)
      .attr('r', CHOICE_R)
      .attr('fill', 'none')
      .attr('stroke', C.inkGhost)
      .attr('stroke-width', CHOICE_STROKE_WIDTH)
      .each(function() {
        d3.select(this).append('title');
      });

  // ── Layer 2: fill rects (clipped inside choice circles) ────────────────────
  const fillLayer = svg.append('g');

  fillLayer.selectAll('rect.choice-fill')
    .data(d3.range(dims.choices))
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
    .data(d3.range(dims.choices))
    .join('text')
      .attr('class', 'choice-label gc-viz__choice-label')
      .attr('x', i => choiceCenters[i].x)
      .attr('y', i => choiceCenters[i].y + CHOICE_R + 13)
      .attr('text-anchor', 'middle')
      .text(i => formatChoiceOpportunityLabel(i));

  // ── Top legend (left-aligned, multiline) ───────────────────────────────────
  var setTopLegend = createTopLegend(svg);
  setTopLegend(`Iter 0/${dims.periods}`, 'No event');

  // ── Bottom legend (left-aligned, multiline) ────────────────────────────────
  var LEGEND_Y = SVG_H - bottomLegendOffset;
  drawBottomLegend(svg, LEGEND_Y, sizing);

  // ── Layer 4: problem dots ──────────────────────────────────────────────────
  const probLayer = svg.append('g');

  probLayer.selectAll('circle.problem')
    .data(d3.range(dims.problems), d => d)
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
      return { x: fp.x, y: fp.y, opacity: 0.9, fill: C.gold, r: PROB_R };
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
    return { x: pos.x, y: pos.y, opacity: 1, fill: C.sageLight, r: PROB_R };
  }

  // Cumulative resolved-at-choice counts — one entry per choice, never decreases
  const resolvedAtChoice = Array(dims.choices).fill(0);

  // Problem IDs that have ever been active (for entrance animation)
  const everActive = new Set();

  function analyzeTickChange(currTick, prevTick) {
    if (!prevTick) {
      return { eventText: 'No event', eventful: false, density: 0, isDead: false, hasResolution: false };
    }
    const choicesOpenedThisTick = [];
    const choicesResolvedThisTick = new Set();
    let changedChoices = 0;
    let changedProblems = 0;
    let flights = 0;
    let oversights = 0;

    for (let c = 0; c < dims.choices; c++) {
      const prevState = prevTick.choices[c].state;
      const currState = currTick.choices[c].state;
      if (prevState !== currState) changedChoices++;
      if (prevState === 'inactive' && currState === 'active') choicesOpenedThisTick.push(c);
      if (prevState === 'active' && currState === 'resolved') choicesResolvedThisTick.add(c);
    }

    for (let id = 0; id < dims.problems; id++) {
      const pp = prevTick.problems[id];
      const cp = currTick.problems[id];
      if (pp.state !== cp.state) changedProblems++;
      if (pp.attachedTo !== cp.attachedTo) changedProblems++;
      if (pp.state === 'attached' && cp.state === 'floating') {
        if (choicesResolvedThisTick.has(pp.attachedTo)) oversights++;
        else flights++;
      }
    }

    let eventText = 'No event';
    if (choicesResolvedThisTick.size > 0) {
      const choiceIds = Array.from(choicesResolvedThisTick).sort((a, b) => a - b);
      if (choiceIds.length === 1) eventText = `${formatChoiceOpportunityLabel(choiceIds[0])} closed`;
      else eventText = `${formatChoiceOpportunityList(choiceIds, 3)} closed this iteration`;
    } else if (choicesOpenedThisTick.length > 0) {
      const opened = choicesOpenedThisTick.sort((a, b) => a - b);
      if (opened.length === 1) eventText = `${formatChoiceOpportunityLabel(opened[0])} opened`;
      else eventText = `${formatChoiceOpportunityList(opened, 3)} opened this iteration`;
    }

    const problemDenominator = Math.max(1, dims.problems * 2);
    const density = (changedChoices / Math.max(1, dims.choices)) * 0.5 + (changedProblems / problemDenominator) * 0.5;
    const isDead = changedChoices === 0 && changedProblems === 0;
    const eventful = choicesOpenedThisTick.length > 0 || choicesResolvedThisTick.size > 0 || flights > 0 || oversights > 0;

    return { eventText, eventful, density, isDead, hasResolution: choicesResolvedThisTick.size > 0 };
  }

  function computeTickTiming(iterTick, analysis) {
    var base = TIMING.baseLateMs;
    if (iterTick <= 5) base = TIMING.baseEarlyMs;
    else if (iterTick <= 10) base = TIMING.baseMidMs;

    var adjusted = base;
    if (analysis.density >= 0.45) adjusted += TIMING.densitySlowMs;
    else if (analysis.density <= 0.08) adjusted += TIMING.densityFastMs;
    if (analysis.eventful) adjusted += TIMING.eventPauseMs;
    if (analysis.hasResolution) adjusted += TIMING.resolvePauseMs;
    if (analysis.isDead) adjusted += TIMING.deadTickFastMs;

    var tickMs = Math.max(TIMING.minTickMs, Math.min(TIMING.maxTickMs, adjusted));
    var motionMs = Math.max(360, Math.round(tickMs * TIMING.motionFraction));
    return { tickMs, motionMs };
  }

  function renderTick(tickIdx, prevTick, motionBudgetMs) {
    const tick = ticks[tickIdx];
    const motionScale = Math.max(0.5, Math.min(2.5, (motionBudgetMs || 900) / 900));
    function sd(ms) {
      return Math.max(80, Math.round(ms * motionScale));
    }
    const choicesOpenedThisTick = [];
    const choicesResolvedThisTick = new Set();

    svg.selectAll('circle.choice')
      .data(tick.choices)
      .transition()
        .duration(sd(750))
        .ease(d3.easeCubicInOut)
        .attr('stroke', d => {
          if (d.state === 'resolved') return C.inkGhost;
          if (d.state === 'active')   return C.inkFaint;
          return C.inkGhost;
        })
        .attr('stroke-width', d => {
          if (d.state === 'resolved') return CHOICE_STROKE_WIDTH_RESOLVED;
          return CHOICE_STROKE_WIDTH;
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
        text = 'Problem searching for choice opportunity';
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
      for (let c = 0; c < dims.choices; c++) {
        if (prevTick.choices[c].state === 'inactive' && tick.choices[c].state === 'active') {
          choicesOpenedThisTick.push(c);
        }
        if (prevTick.choices[c].state === 'active' && tick.choices[c].state === 'resolved') {
          choicesResolvedThisTick.add(c);
        }
      }
      for (let id = 0; id < dims.problems; id++) {
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

    // Resolution pulse on the CO itself to make closures visually unmissable.
    if (choicesResolvedThisTick.size > 0) {
      var pulseData = Array.from(choicesResolvedThisTick).map(function(choiceId) {
        return choiceCenters[choiceId];
      });

      svg.append('g')
        .attr('class', 'choice-resolve-pulse')
        .selectAll('circle.resolve-pulse')
        .data(pulseData)
        .join('circle')
          .attr('class', 'resolve-pulse')
          .attr('cx', function(d) { return d.x; })
          .attr('cy', function(d) { return d.y; })
          .attr('r', CHOICE_R * 0.95)
          .attr('fill', 'none')
          .attr('stroke', C.sage)
          .attr('stroke-width', 1.8)
          .attr('opacity', 0.9)
          .transition()
            .duration(sd(460))
            .ease(d3.easeCubicOut)
            .attr('r', CHOICE_R * 1.42)
            .attr('stroke-width', 0.9)
            .attr('opacity', 0)
            .remove();
    }

    // Fill level — cumulative count of problems resolved at each choice
    if (prevTick) {
      for (let id = 0; id < dims.problems; id++) {
        if (tick.problems[id].state === 'resolved' && prevTick.problems[id].state !== 'resolved') {
          resolvedAtChoice[tick.problems[id].attachedTo]++;
        }
      }
    }
    svg.selectAll('rect.choice-fill')
      .data(d3.range(dims.choices))
      .transition()
        .duration(sd(750))
        .ease(d3.easeCubicInOut)
        .attr('y',      i => choiceCenters[i].y + CHOICE_R - (resolvedAtChoice[i] / dims.problems) * (CHOICE_R * 2))
        .attr('height', i => (resolvedAtChoice[i] / dims.problems) * (CHOICE_R * 2));

    // Detect problems entering for the first time this tick
    const enteringThisTick = new Set();
    const attachedThisTick = new Set();
    const searchingThisTick = new Set();
    for (let id = 0; id < dims.problems; id++) {
      var currState = tick.problems[id].state;
      var prevState = prevTick ? prevTick.problems[id].state : 'inactive';
      if (currState !== 'inactive' && !everActive.has(id)) {
        enteringThisTick.add(id);
        everActive.add(id);
      }
      if (prevTick && prevState !== 'attached' && currState === 'attached') {
        attachedThisTick.add(id);
      }
      if (prevTick && prevState !== 'floating' && currState === 'floating' && !enteringThisTick.has(id)) {
        searchingThisTick.add(id);
      }
    }

    const allProbs = svg.selectAll('circle.problem').data(d3.range(dims.problems), d => d);

    // Entrance sequence: show clear entering/searching motion before final state
    allProbs.filter(id => enteringThisTick.has(id))
      .each(function(id) {
        const attrs = probAttrs(tick, id);
        const fp = floatPos(id);
        const enterR = Math.max(PROB_R * MOTION.enter.overshootRadius, PROB_R + 1.2);
        d3.select(this).interrupt()
          .attr('cx', fp.x).attr('cy', fp.y).attr('r', 1).attr('opacity', 0).attr('fill', C.rust)
          .transition().duration(sd(MOTION.enter.popInMs)).ease(d3.easeCubicOut)
            .attr('r', enterR).attr('opacity', 0.98).attr('fill', C.rust)
          .transition().duration(sd(MOTION.enter.searchShiftMs)).ease(d3.easeCubicInOut)
            .attr('r', PROB_R).attr('opacity', 0.92)
            .attr('fill', C.gold)
          .transition().duration(sd(MOTION.enter.settleMs)).ease(d3.easeCubicInOut)
            .attr('cx', attrs.x).attr('cy', attrs.y).attr('r', attrs.r)
            .attr('opacity', attrs.opacity).attr('fill', attrs.fill);
      });

    // Attachment signature: searching -> attach gets a brief pull-and-settle
    allProbs.filter(id => attachedThisTick.has(id) && !resolvedThisTick.has(id))
      .each(function(id) {
        const attrs = probAttrs(tick, id);
        const from = prevTick ? probAttrs(prevTick, id) : floatPos(id);
        const overR = Math.max(PROB_R * MOTION.attach.overshootRadius, PROB_R + 0.9);
        d3.select(this).interrupt()
          .attr('cx', from.x).attr('cy', from.y).attr('r', PROB_R).attr('opacity', Math.max(from.opacity || 0.85, 0.85)).attr('fill', C.gold)
          .transition().duration(sd(MOTION.attach.pullMs)).ease(d3.easeCubicOut)
            .attr('cx', attrs.x).attr('cy', attrs.y).attr('r', overR).attr('opacity', 1).attr('fill', attrs.fill)
          .transition().duration(sd(MOTION.attach.holdMs)).ease(d3.easeLinear)
            .attr('r', overR)
          .transition().duration(sd(MOTION.attach.settleMs)).ease(d3.easeCubicInOut)
            .attr('r', attrs.r).attr('opacity', attrs.opacity);
      });

    // Searching signature: brief drift jitter + pulse when newly adrift
    allProbs.filter(id => searchingThisTick.has(id) && !flightSet.has(id) && !oversightSet.has(id))
      .each(function(id) {
        const attrs = probAttrs(tick, id);
        const from = prevTick ? probAttrs(prevTick, id) : floatPos(id);
        const j = MOTION.search.jitterAmp;
        const jx = ((id % 2) ? 1 : -1) * j;
        const jy = ((id % 3) - 1) * (j * 0.6);
        d3.select(this).interrupt()
          .attr('cx', from.x).attr('cy', from.y).attr('r', PROB_R).attr('opacity', Math.max(from.opacity || 0.8, 0.8)).attr('fill', C.gold)
          .transition().duration(sd(MOTION.search.driftMs)).ease(d3.easeCubicInOut)
            .attr('cx', attrs.x + jx).attr('cy', attrs.y + jy).attr('r', PROB_R * 1.12).attr('fill', C.gold).attr('opacity', 0.95)
          .transition().duration(sd(MOTION.search.pulseMs)).ease(d3.easeCubicOut)
            .attr('cx', attrs.x).attr('cy', attrs.y).attr('r', attrs.r).attr('fill', attrs.fill).attr('opacity', attrs.opacity);
      });

    // Resolution exit: move to circle centre, shrink to r:1.5, fill sage, then fade
    allProbs.filter(id => resolvedThisTick.has(id))
      .each(function(id) {
        var centerIdx = prevTick.problems[id].attachedTo;
        var center = choiceCenters[centerIdx] || choiceCenters[0];
        var resolveR = Math.max(sizing.resolveExitRadius * MOTION.resolve.overshootRadius, sizing.resolveExitRadius + 0.8);
        d3.select(this).interrupt()
          .transition().duration(sd(MOTION.resolve.convergeMs)).ease(d3.easeCubicInOut)
            .attr('cx', center.x).attr('cy', center.y).attr('r', resolveR).attr('fill', C.sage).attr('opacity', 0.95)
          .transition().duration(sd(MOTION.resolve.fadeMs)).ease(d3.easeCubicOut)
            .attr('r', sizing.resolveExitRadius)
            .attr('opacity', 0);
      });

    // Flight exit: flash rust, then move to float position
    allProbs.filter(id => flightSet.has(id))
      .each(function(id) {
        const fp = floatPos(id);
        const flightR = Math.max(PROB_R * MOTION.flight.overshootRadius, PROB_R + 1);
        d3.select(this).interrupt()
          .transition().duration(sd(MOTION.flight.flashMs))
            .attr('r', flightR).attr('fill', C.rust).attr('opacity', 1)
          .transition().duration(sd(MOTION.flight.ejectMs)).ease(d3.easeCubicInOut)
            .attr('cx', fp.x).attr('cy', fp.y).attr('r', PROB_R * 0.95)
            .attr('opacity', 0.85).attr('fill', C.inkFaint);
      });

    // Oversight exit: flash slate, then move to float position
    allProbs.filter(id => oversightSet.has(id))
      .each(function(id) {
        const fp = floatPos(id);
        const overR = Math.max(PROB_R * MOTION.oversight.overshootRadius, PROB_R + 1);
        d3.select(this).interrupt()
          .transition().duration(sd(MOTION.oversight.flashMs))
            .attr('r', overR).attr('fill', C.slate).attr('opacity', 1)
          .transition().duration(sd(MOTION.oversight.ejectMs)).ease(d3.easeCubicInOut)
            .attr('cx', fp.x).attr('cy', fp.y).attr('r', PROB_R * 0.95)
            .attr('opacity', 0.85).attr('fill', C.inkFaint);
      });

    // All other problems: deterministic position transition
    allProbs.filter(id =>
      !resolvedThisTick.has(id) &&
      !flightSet.has(id) &&
      !oversightSet.has(id) &&
      !enteringThisTick.has(id) &&
      !attachedThisTick.has(id) &&
      !searchingThisTick.has(id)
    )
      .interrupt()
      .transition()
        .delay(0)
        .duration(sd(900))
        .ease(d3.easeCubicInOut)
        .attr('cx',      id => probAttrs(tick, id).x)
        .attr('cy',      id => probAttrs(tick, id).y)
        .attr('r',       id => probAttrs(tick, id).r)
        .attr('opacity', id => probAttrs(tick, id).opacity)
        .attr('fill',    id => probAttrs(tick, id).fill);

    // Sync pulse class — attached dots breathe, others do not
    allProbs.classed('problem-attached', id => tick.problems[id].state === 'attached');
    allProbs.classed('problem-searching', id => tick.problems[id].state === 'floating');

    // Event ticker lives in top legend; keep external ticker empty
    if (eventTickerEl) eventTickerEl.textContent = '';
  }

  renderTick(0, null, 900);

  let current = 0;

  function stepTick() {
    current++;
    if (current >= ticks.length) return;

    const prevTick = ticks[current - 1];
    const currTick = ticks[current];
    const analysis = analyzeTickChange(currTick, prevTick);
    const timing = computeTickTiming(currTick.tick, analysis);

    // Prime attention before movement.
    setTopLegend(`Iter ${currTick.tick}/${dims.periods}`, analysis.eventText);
    setTimeout(function() {
      renderTick(current, prevTick, timing.motionMs);
    }, TIMING.legendLeadMs);

    if (current === ticks.length - 1) {
      setTimeout(function() {
        if (eventTickerEl) eventTickerEl.textContent = '';
        showEndState(
          pctRes, pctOver, pctFli,
          probResolved, probDisplaced, probAdrift, probInForum, probNeverEntered,
          ticks[ticks.length - 1],
          dims
        );
      }, timing.tickMs + TIMING.finalPauseMs);
      return;
    }

    setTimeout(stepTick, timing.tickMs);
  }

  setTimeout(stepTick, 1000);
}
