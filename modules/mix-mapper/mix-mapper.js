'use strict';

(function initMixMapper() {
  var shellEl = document.getElementById('mix-mapper-viz-shell');
  var svgEl = document.getElementById('mix-mapper-svg');
  var tooltipEl = document.getElementById('mix-mapper-tooltip');
  var fallbackEl = document.getElementById('mix-mapper-fallback');
  var helperEl = document.getElementById('mix-mapper-helper');
  var modeButtons = Array.prototype.slice.call(document.querySelectorAll('.mix-mapper-mode-btn'));

  if (!shellEl || !svgEl || !tooltipEl || !modeButtons.length) return;

  if (typeof d3 === 'undefined') {
    if (fallbackEl) fallbackEl.hidden = false;
    return;
  }

  function readCssVar(name, fallback) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
    var root = document.documentElement;
    var raw = window.getComputedStyle(root).getPropertyValue(name);
    return raw && raw.trim() ? raw.trim() : fallback;
  }

  function readScopedCssVar(name, fallback) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;

    var scopedRaw = '';
    if (svgEl) {
      scopedRaw = window.getComputedStyle(svgEl).getPropertyValue(name) || '';
    }

    var rootRaw = window.getComputedStyle(document.documentElement).getPropertyValue(name) || '';
    var raw = scopedRaw && scopedRaw.trim() ? scopedRaw : rootRaw;
    return raw && raw.trim() ? raw.trim() : fallback;
  }

  function readScopedCssNumber(name, fallback) {
    var raw = readScopedCssVar(name, '');
    var value = parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildColors() {
    var ink = readScopedCssVar('--ink', '#2A2018');
    var sage = readScopedCssVar('--sage', readScopedCssVar('--viz-sage', '#4A6741'));
    var sageLight = readScopedCssVar('--sage-light', readScopedCssVar('--viz-sage-light', '#6B8F62'));
    var text = ink;
    var muted = readScopedCssVar('--ink-mid', '#5C4F3A');
    var ghost = readScopedCssVar('--ink-ghost', '#C8BDA8');
    var panel = readScopedCssVar('--paper', '#FAF8F1');
    var baseViz = readScopedCssVar('--viz-gold', '#B8943A');
    var toggleAccent = readScopedCssVar('--mix-map-accent', readScopedCssVar('--viz-rust-light', baseViz));

    return {
      text: text,
      muted: muted,
      ghost: ghost,
      panel: panel,
      gold: baseViz,
      goldLine: 'color-mix(in srgb, ' + baseViz + ' 80%, ' + panel + ' 20%)',
      goldSoft: 'color-mix(in srgb, ' + baseViz + ' 28%, ' + panel + ' 72%)',
      traditional: ink,
      traditionalSoft: 'color-mix(in srgb, ' + ink + ' 20%, ' + panel + ' 80%)',
      complexity: ink,
      complexitySoft: 'color-mix(in srgb, ' + ink + ' 20%, ' + panel + ' 80%)',
      accent: toggleAccent,
      traditionalArrow: ink,
      complexityArrow: ink,
      accentArrow: 'color-mix(in srgb, ' + toggleAccent + ' 72%, ' + panel + ' 28%)',
      processArrow: ink,
      learningArrow: sageLight,
      assumptionArrow: sage,
      nodeFill: 'color-mix(in srgb, ' + ink + ' 20%, ' + panel + ' 80%)',
      nodeStroke: ink,
      processTraditionalFlow: 'color-mix(in srgb, ' + readScopedCssVar('--mix-map-traditional', readScopedCssVar('--viz-slate', baseViz)) + ' 78%, ' + panel + ' 22%)',
      processComplexityFlow: 'color-mix(in srgb, ' + readScopedCssVar('--mix-map-complexity', readScopedCssVar('--viz-sage', baseViz)) + ' 78%, ' + panel + ' 22%)',
      processAdjust: 'color-mix(in srgb, ' + toggleAccent + ' 58%, ' + panel + ' 42%)',
      processContext: 'color-mix(in srgb, ' + ghost + ' 55%, ' + panel + ' 45%)',
      learningLoop: 'color-mix(in srgb, ' + toggleAccent + ' 88%, ' + panel + ' 12%)',
      learningAdjust: 'color-mix(in srgb, ' + toggleAccent + ' 66%, ' + text + ' 34%)',
      learningContext: 'color-mix(in srgb, ' + ghost + ' 42%, ' + panel + ' 58%)',
      assumptionCertainty: 'color-mix(in srgb, ' + toggleAccent + ' 58%, ' + text + ' 42%)',
      assumptionTest: 'color-mix(in srgb, ' + toggleAccent + ' 84%, ' + panel + ' 16%)',
      assumptionContext: 'color-mix(in srgb, ' + ghost + ' 40%, ' + panel + ' 60%)',
      learningDot: sage,
      dotStroke: sage
    };
  }

  var COLORS = buildColors();
  var BASE_NODES = [
    {
      id: 'c1',
      lane: 'complexity',
      step: 1,
      title: 'Opportunity and Sensing Intake',
      shortLabel: 'Sensing',
      description: 'Surface signals before committing to a predefined solution.',
      tags: ['signals', 'opportunity', 'ambiguity']
    },
    {
      id: 'c2',
      lane: 'complexity',
      step: 2,
      title: 'Strategic and Tactical Portfolio Fit',
      shortLabel: 'Portfolio Fit',
      description: 'Balance investment choices while uncertainty is still high.',
      tags: ['investment', 'optionality', 'uncertainty']
    },
    {
      id: 'c3',
      lane: 'complexity',
      step: 3,
      title: 'Discovery and Framing',
      shortLabel: 'Discovery',
      description: 'Frame the problem and stress-test assumptions with evidence.',
      tags: ['assumptions', 'framing', 'evidence']
    },
    {
      id: 'c4',
      lane: 'complexity',
      step: 4,
      title: 'Solution Exploration, Design and Validation',
      shortLabel: 'Explore and Validate',
      description: 'Explore options in parallel and iterate with feedback.',
      tags: ['options', 'experiments', 'feedback']
    },
    {
      id: 'c5',
      lane: 'complexity',
      step: 5,
      title: 'Delivery Planning and Execute',
      shortLabel: 'Incremental Delivery',
      description: 'Ship in increments while validation continues.',
      tags: ['incremental', 'delivery', 'adaptation']
    },
    {
      id: 'c6',
      lane: 'complexity',
      step: 6,
      title: 'Launch, Measure, Adapt and Change',
      shortLabel: 'Launch and Learn',
      description: 'Use market evidence to reshape upstream choices.',
      tags: ['measurement', 'learning', 'adaptation']
    },
    {
      id: 't1',
      lane: 'traditional',
      step: 1,
      title: 'Request Submission',
      shortLabel: 'Request',
      description: 'Start from stated requirements and requested work.',
      tags: ['request', 'requirements', 'intake']
    },
    {
      id: 't2',
      lane: 'traditional',
      step: 2,
      title: 'Business Case Review',
      shortLabel: 'Business Case',
      description: 'Seek approval before detailed downstream work can proceed.',
      tags: ['approval', 'gate', 'commitment']
    },
    {
      id: 't3',
      lane: 'traditional',
      step: 3,
      title: 'Requirements Gathering and Engineering',
      shortLabel: 'Requirements',
      description: 'Define and stabilize requirements early in the lifecycle.',
      tags: ['specifications', 'freeze', 'handoff']
    },
    {
      id: 't4',
      lane: 'traditional',
      step: 4,
      title: 'Design and Stakeholder Alignment',
      shortLabel: 'Design Alignment',
      description: 'Align architecture and stakeholders before implementation.',
      tags: ['alignment', 'architecture', 'handoff']
    },
    {
      id: 't5',
      lane: 'traditional',
      step: 5,
      title: 'Implementation',
      shortLabel: 'Build',
      description: 'Deliver according to approved scope and sequence.',
      tags: ['plan', 'execution', 'schedule']
    },
    {
      id: 't6',
      lane: 'traditional',
      step: 6,
      title: 'Release and Close Project',
      shortLabel: 'Release and Close',
      description: 'Deploy and close the project cycle.',
      tags: ['deployment', 'closure', 'handoff']
    }
  ];

  var LINKS = [
    { source: 't1', target: 't2', lane: 'traditional', kind: 'primary', semantic: 'approval flow' },
    { source: 't2', target: 't3', lane: 'traditional', kind: 'primary', semantic: 'authorized requirements work' },
    { source: 't3', target: 't4', lane: 'traditional', kind: 'primary', semantic: 'requirements handoff' },
    { source: 't4', target: 't5', lane: 'traditional', kind: 'primary', semantic: 'design-to-build handoff' },
    { source: 't5', target: 't6', lane: 'traditional', kind: 'primary', semantic: 'delivery to release' },
    { source: 't4', target: 't3', lane: 'traditional', kind: 'minor', semantic: 'clarification loop' },
    { source: 't6', target: 't5', lane: 'traditional', kind: 'minor', semantic: 'post-release fixes' },

    { source: 'c1', target: 'c2', lane: 'complexity', kind: 'primary', semantic: 'signals inform investment' },
    { source: 'c2', target: 'c3', lane: 'complexity', kind: 'primary', semantic: 'portfolio shapes framing' },
    { source: 'c3', target: 'c4', lane: 'complexity', kind: 'primary', semantic: 'framing drives exploration' },
    { source: 'c4', target: 'c5', lane: 'complexity', kind: 'primary', semantic: 'validated options enter delivery' },
    { source: 'c5', target: 'c6', lane: 'complexity', kind: 'primary', semantic: 'delivery reaches launch' },
    { source: 'c3', target: 'c2', lane: 'complexity', kind: 'feedback', semantic: 'discovery reshapes portfolio' },
    { source: 'c4', target: 'c3', lane: 'complexity', kind: 'feedback', semantic: 'validation revises framing' },
    { source: 'c5', target: 'c4', lane: 'complexity', kind: 'feedback', semantic: 'delivery reveals design gaps' },
    { source: 'c4', target: 'c2', lane: 'complexity', kind: 'feedback', semantic: 'option evidence alters commitment' },
    { source: 'c6', target: 'c1', lane: 'complexity', kind: 'learning', semantic: 'market evidence updates sensing' },
    { source: 'c6', target: 'c2', lane: 'complexity', kind: 'learning', semantic: 'outcomes reshape investments' },
    { source: 'c6', target: 'c3', lane: 'complexity', kind: 'learning', semantic: 'launch signals reframe discovery' }
  ];
  var COMPLEXITY_LINK_NARRATIVES = {
    'c1>c2:primary': {
      process: 'Signals from sensing feed portfolio choices before delivery commitments are locked.',
      assumptions: 'Assumes intake quality is good enough to rank uncertain opportunities without forcing premature certainty.',
      learning: 'Early signal quality influences where later learning effort is invested.'
    },
    'c2>c3:primary': {
      process: 'Portfolio priorities shape what discovery work starts first and what is deferred.',
      assumptions: 'Assumes teams can hold options open while still narrowing scope for focused discovery.',
      learning: 'Portfolio priorities are expected to evolve when discovery evidence updates option value.'
    },
    'c3>c4:primary': {
      process: 'Discovery outputs move into solution exploration and validation cycles.',
      assumptions: 'Assumes framing is explicit enough to guide experiments without pretending uncertainty is gone.',
      learning: 'What is learned in framing directs which experiments run next.'
    },
    'c4>c5:primary': {
      process: 'Validated options move into incremental delivery planning and execution.',
      assumptions: 'Assumes validation thresholds are credible and tied to outcomes, not just activity completion.',
      learning: 'Delivery scope is expected to reflect evidence from exploration, not only initial intent.'
    },
    'c5>c6:primary': {
      process: 'Delivery increments reach launch and measurement.',
      assumptions: 'Assumes release slices are small enough to attribute outcomes and observe meaningful effects.',
      learning: 'Launch outcomes create the evidence base for system-level adaptation.'
    },
    'c3>c2:feedback': {
      process: 'Discovery sends evidence back to portfolio for re-prioritization.',
      assumptions: 'Assumes decision rights allow portfolio decisions to change when better evidence appears.',
      learning: 'Discovery findings can redirect investment before major build commitments are made.'
    },
    'c4>c3:feedback': {
      process: 'Validation findings loop back to refine discovery framing.',
      assumptions: 'Assumes teams can revise problem framing without excessive coordination friction.',
      learning: 'Experiment results are used to sharpen hypotheses and reduce avoidable waste.'
    },
    'c5>c4:feedback': {
      process: 'Delivery realities return to exploration for design and option adjustments.',
      assumptions: 'Assumes implementation constraints are treated as learning signals, not late-stage exceptions.',
      learning: 'Build feedback informs the next cycle of solution exploration.'
    },
    'c4>c2:feedback': {
      process: 'Option evidence can trigger portfolio-level commitment changes.',
      assumptions: 'Assumes leadership tolerates changing commitments when uncertainty resolves in new directions.',
      learning: 'Strong evidence can move investment posture, not just local feature choices.'
    },
    'c6>c1:learning': {
      process: 'Post-launch signals feed the next sensing cycle.',
      assumptions: 'Assumes post-launch evidence is captured and used to reshape upstream opportunity sensing.',
      learning: 'Market outcomes become inputs for the next round of opportunity discovery.'
    },
    'c6>c2:learning': {
      process: 'Measured outcomes flow back into portfolio balancing.',
      assumptions: 'Assumes portfolio governance can update priorities based on real outcomes rather than sunk plans.',
      learning: 'Outcome signals adjust where effort is amplified, paused, or retired.'
    },
    'c6>c3:learning': {
      process: 'Launch evidence loops into new discovery framing.',
      assumptions: 'Assumes teams revisit earlier framing with fresh evidence instead of defending prior narratives.',
      learning: 'Real-world performance reframes hypotheses for the next discovery cycle.'
    }
  };

  var COMPARISON_ROWS = [
    {
      anchorId: 'c1',
      text: 'Opportunity sensing versus submitted request'
    },
    {
      anchorId: 'c3',
      text: 'Assumptions tested versus requirements stabilized'
    },
    {
      anchorId: 'c6',
      text: 'Upstream learning versus project closure'
    }
  ];
  var COMPARISON_LINE_ROWS = COMPARISON_ROWS.filter(function(row) {
    return row.anchorId !== 'c3';
  });
  var MODE_HELPER_TEXT = {
    process: { label: 'Process', marker: 'line' },
    assumptions: { label: 'Assumptions', marker: 'line' },
    learning: { label: 'Learning', marker: 'dot' }
  };
  var EDGE_STROKE_SCALE = 0.6;

  var state = {
    mode: 'process',
    activeNodeId: null,
    layout: null,
    renderStamp: 0,
    nodeById: Object.create(null),
    linkSel: null,
    nodeSel: null,
    pulseSel: null,
    pulseTimer: null,
    resizeTimer: null
  };

  function refreshColors() {
    COLORS = buildColors();
  }

  var reducedMotionQuery = null;
  var prefersReducedMotion = false;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion = !!reducedMotionQuery.matches;
  }

  function setModeButtonState(activeMode) {
    modeButtons.forEach(function(button) {
      var buttonMode = button.getAttribute('data-mode');
      var isActive = buttonMode === activeMode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function setModeHelperText(mode) {
    if (!helperEl) return;
    var helper = MODE_HELPER_TEXT[mode] || MODE_HELPER_TEXT.process;
    var markerKind = helper.marker === 'dot' ? 'is-dot' : 'is-line';
    helperEl.innerHTML =
      '<span class="mix-mapper-helper-marker ' + markerKind + ' is-' + escapeHtml(mode) + '" aria-hidden="true"></span>' +
      '<span class="mix-mapper-helper-label">' + escapeHtml(helper.label) + '</span>';
  }

  function hideTooltip() {
    tooltipEl.classList.remove('is-visible');
    tooltipEl.setAttribute('aria-hidden', 'true');
  }

  function showTooltip(contentHtml, clientX, clientY) {
    if (!contentHtml) return;
    var viewportWidth = window.innerWidth || 1280;
    var viewportHeight = window.innerHeight || 720;
    var offsetX = 16;
    var offsetY = 14;
    tooltipEl.innerHTML = contentHtml;

    var nextLeft = clientX + offsetX;
    var nextTop = clientY + offsetY;

    var maxLeft = viewportWidth - 320;
    if (nextLeft > maxLeft) nextLeft = Math.max(12, clientX - 304);

    var maxTop = viewportHeight - 140;
    if (nextTop > maxTop) nextTop = Math.max(12, clientY - 124);

    tooltipEl.style.left = String(nextLeft) + 'px';
    tooltipEl.style.top = String(nextTop) + 'px';
    tooltipEl.classList.add('is-visible');
    tooltipEl.setAttribute('aria-hidden', 'false');
  }

  function tooltipHtml(node) {
    var safeTitle = escapeHtml(String(node.step) + '. ' + node.title);
    var safeDesc = escapeHtml(node.description);
    var safeTags = escapeHtml(node.tags.join(' · '));
    return '<strong>' + safeTitle + '</strong><br>' + safeDesc + '<br><span class="mix-mapper-tooltip-tags">' + safeTags + '</span>';
  }

  function modeLabel(mode) {
    if (mode === 'assumptions') return 'Assumptions';
    if (mode === 'learning') return 'Learning';
    return 'Process';
  }

  function linkKey(link) {
    return link.source + '>' + link.target + ':' + link.kind;
  }

  function defaultLinkNarrative(link, mode) {
    if (mode === 'assumptions') {
      if (link.lane === 'traditional' && link.kind === 'primary') {
        return 'Assumes requirements can be known early and remain stable through downstream delivery.';
      }
      if (link.lane === 'traditional') {
        return 'Assumes late changes can be managed as local rework without reframing the full request.';
      }
      if (link.lane === 'complexity' && link.kind === 'primary') {
        return 'Assumes uncertainty is normal and that commitments should stay revisable while evidence matures.';
      }
      return 'Assumes feedback and adaptation are required to keep decisions aligned with reality.';
    }

    if (mode === 'learning') {
      if (link.lane === 'traditional' && link.kind === 'primary') {
        return 'Learning is weakly encoded here; flow emphasizes planned handoff over explicit adaptation.';
      }
      if (link.lane === 'traditional') {
        return 'Learning appears mainly as downstream rework after friction is discovered.';
      }
      if (link.lane === 'complexity' && link.kind === 'primary') {
        return 'Forward flow remains open to updates as new evidence appears.';
      }
      return 'Feedback loops convert outcomes into upstream change.';
    }

    if (link.kind === 'minor' || link.kind === 'feedback' || link.kind === 'learning') {
      return 'This connection represents an adjustment loop around the core sequence.';
    }
    return 'This connection represents a primary handoff in the lifecycle.';
  }

  function complexityLinkNarrative(link, mode) {
    var narratives = COMPLEXITY_LINK_NARRATIVES[linkKey(link)];
    if (narratives) return narratives[mode] || narratives.process || link.semantic || '';
    return defaultLinkNarrative(link, mode);
  }

  function linkTooltipHtml(link, mode, nodeById) {
    var source = nodeById[link.source];
    var target = nodeById[link.target];
    if (!source || !target) return '';

    var title = escapeHtml(source.shortLabel + ' to ' + target.shortLabel);
    var lens = modeLabel(mode);
    var narrative = escapeHtml(complexityLinkNarrative(link, mode));
    var semantic = escapeHtml(link.semantic || '');

    return '<strong>' + title + '</strong><br>' +
      '<span class="mix-mapper-tooltip-tags">' + escapeHtml(lens) + '</span>: ' + narrative +
      '<br><span class="mix-mapper-tooltip-tags">' + semantic + '</span>';
  }

  function linkAriaLabel(link, mode, nodeById) {
    var source = nodeById[link.source];
    var target = nodeById[link.target];
    if (!source || !target) return '';

    return source.shortLabel + ' to ' + target.shortLabel + '. ' +
      modeLabel(mode) + '. ' + complexityLinkNarrative(link, mode);
  }

  function getLayout() {
    var shellWidth = Math.max(320, shellEl.clientWidth || 980);
    var width = clamp(Math.round(shellWidth), 520, 980);
    var compact = width < 700;
    var height = compact
      ? Math.max(920, Math.round(width * 1.42))
      : Math.max(900, Math.round(width * 1.01));

    var laneGap = compact
      ? Math.max(132, Math.round(width * 0.27))
      : Math.max(198, Math.round(width * 0.31));

    var laneCenter = width / 2;
    var laneX = {
      complexity: laneCenter - (laneGap / 2),
      traditional: laneCenter + (laneGap / 2)
    };

    var baseNodeWidth = compact
      ? clamp(laneGap - 34, 126, 162)
      : clamp(laneGap - 42, 162, 196);

    var baseNodeHeight = compact ? 56 : 54;
    var nodeWidthScale = clamp(readScopedCssNumber('--mix-map-node-width-scale', 1), 0.72, 1.35);
    var nodeHeightScale = clamp(readScopedCssNumber('--mix-map-node-height-scale', 1), 0.72, 1.35);
    var nodeWidth = clamp(
      Math.round(baseNodeWidth * nodeWidthScale),
      compact ? 108 : 140,
      compact ? 188 : 224
    );
    var nodeHeight = clamp(
      Math.round(baseNodeHeight * nodeHeightScale * 0.7),
      compact ? 30 : 29,
      compact ? 58 : 56
    );
    var topY = compact ? 142 : 140;
    var bottomPad = compact ? 124 : 110;
    var stepGap = ((height - topY - bottomPad) / 5) * 0.6125;

    return {
      width: width,
      height: height,
      compact: compact,
      laneX: laneX,
      nodeWidth: nodeWidth,
      nodeHeight: nodeHeight,
      topY: topY,
      stepGap: stepGap,
      laneTitleSize: compact ? 17 : 20,
      laneSubtitleSize: compact ? 11.5 : 13,
      edgePrimary: compact ? 2.1 : 2.4,
      edgeSecondary: compact ? 1.55 : 1.8,
      edgeLearning: compact ? 1.75 : 2.05,
      learningArc: compact ? 150 : 190,
      feedbackArc: compact ? 92 : 118,
      pulseRadius: compact ? 3.2 : 3.8
    };
  }

  function fitHeaderLabel(text) {
    return text || '';
  }

  function estimateLabelWidth(labelText, layout) {
    var perCharWidth = layout.compact ? 5.25 : 5.8;
    return String(labelText || '').length * perCharWidth;
  }

  function fitNodeLabelsToWidth(labelSel, layout) {
    var maxLabelWidth = layout.nodeWidth - (layout.compact ? 10 : 12);
    if (maxLabelWidth <= 0) return;

    labelSel.each(function() {
      var labelNode = this;
      labelNode.removeAttribute('textLength');
      labelNode.removeAttribute('lengthAdjust');

      var measuredWidth = 0;
      try {
        measuredWidth = labelNode.getComputedTextLength();
      } catch (error) {
        measuredWidth = 0;
      }

      if (!(measuredWidth > 0)) {
        measuredWidth = estimateLabelWidth(labelNode.textContent, layout);
      }

      if (measuredWidth > maxLabelWidth) {
        labelNode.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        labelNode.setAttribute('textLength', String(maxLabelWidth));
      }
    });
  }

  function scheduleNodeLabelFit(labelSel, layout, renderStamp) {
    var runFit = function() {
      if (renderStamp !== state.renderStamp) return;
      fitNodeLabelsToWidth(labelSel, layout);
    };

    runFit();

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(runFit);
    }

    if (typeof window !== 'undefined') {
      window.setTimeout(runFit, 140);
    }

    if (
      typeof document !== 'undefined' &&
      document.fonts &&
      document.fonts.ready &&
      typeof document.fonts.ready.then === 'function'
    ) {
      document.fonts.ready.then(runFit).catch(function() {
        // Ignore font readiness errors; immediate fit already applied.
      });
    }
  }

  function wrapTextToWidth(textEl, text, maxWidth, lineHeight) {
    textEl.textContent = '';

    var words = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;

    var probe = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    textEl.appendChild(probe);

    var lines = [];
    var lineWords = [];

    words.forEach(function(word) {
      lineWords.push(word);
      probe.textContent = lineWords.join(' ');

      var tooWide = false;
      try {
        tooWide = probe.getComputedTextLength() > maxWidth;
      } catch (error) {
        tooWide = false;
      }

      if (tooWide && lineWords.length > 1) {
        lineWords.pop();
        lines.push(lineWords.join(' '));
        lineWords = [word];
        probe.textContent = lineWords.join(' ');
      }
    });

    if (lineWords.length) lines.push(lineWords.join(' '));
    textEl.removeChild(probe);

    var xValue = textEl.getAttribute('x') || '0';
    lines.forEach(function(line, index) {
      var tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.setAttribute('x', xValue);
      tspan.setAttribute('dy', index === 0 ? '0' : String(lineHeight));
      tspan.textContent = line;
      textEl.appendChild(tspan);

      try {
        if (tspan.getComputedTextLength() > maxWidth) {
          tspan.setAttribute('lengthAdjust', 'spacingAndGlyphs');
          tspan.setAttribute('textLength', String(maxWidth));
        }
      } catch (error) {
        // Ignore measurement issues in browsers that fail SVG text metrics during init.
      }
    });
  }

  function getTextBox(textEl) {
    try {
      return textEl.getBBox();
    } catch (error) {
      return null;
    }
  }

  function layoutComparisonLabels(labelSel, layout, nodeById, compareLineStart, compareLineEnd) {
    var fontSize = layout.compact ? 6.5 : 7.3;
    var lineHeight = fontSize * 1.32;
    var minVerticalGap = layout.compact ? 4 : 5;
    var laneSpan = compareLineEnd - compareLineStart;
    var maxLabelWidth = clamp(
      laneSpan - 8,
      layout.compact ? 112 : 132,
      layout.compact ? 184 : 232
    );

    labelSel
      .attr('x', layout.width / 2)
      .attr('y', function(row) {
        return nodeById[row.anchorId].y;
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', fontSize)
      .attr('font-family', 'var(--mono)')
      .attr('fill', COLORS.muted);

    labelSel.each(function(row) {
      wrapTextToWidth(this, row.text, maxLabelWidth, lineHeight);
    });

    // Keep labels from colliding when wraps create taller blocks.
    var previousBottom = -Infinity;
    labelSel
      .sort(function(a, b) {
        return nodeById[a.anchorId].y - nodeById[b.anchorId].y;
      })
      .each(function(row) {
        var textEl = this;
        var baseY = nodeById[row.anchorId].y;
        textEl.setAttribute('y', String(baseY));

        var box = getTextBox(textEl);
        if (!box) return;

        if (box.y < previousBottom + minVerticalGap) {
          var shiftDown = (previousBottom + minVerticalGap) - box.y;
          textEl.setAttribute('y', String(baseY + shiftDown));
          box = getTextBox(textEl);
        }

        if (box) previousBottom = box.y + box.height;
      });
  }

  function buildNodes(layout) {
    return BASE_NODES.map(function(baseNode) {
      return {
        id: baseNode.id,
        lane: baseNode.lane,
        step: baseNode.step,
        title: baseNode.title,
        shortLabel: baseNode.shortLabel,
        description: baseNode.description,
        tags: baseNode.tags.slice(),
        x: layout.laneX[baseNode.lane],
        y: layout.topY + ((baseNode.step - 1) * layout.stepGap)
      };
    });
  }

  function nodeShapePath(node, layout) {
    var w = layout.nodeWidth;
    var h = layout.nodeHeight;
    var halfW = w / 2;
    var halfH = h / 2;

    if (node.lane === 'traditional') {
      return [
        'M', -halfW, -halfH,
        'L', halfW, -halfH,
        'L', halfW, halfH,
        'L', -halfW, halfH,
        'Z'
      ].join(' ');
    }

    var maxRadius = Math.max(6, Math.min(24, halfW - 2, halfH - 2));
    var r = clamp(Math.round(h * 0.32), 6, maxRadius);
    return [
      'M', (-halfW + r), -halfH,
      'L', (halfW - r), -halfH,
      'Q', halfW, -halfH, halfW, (-halfH + r),
      'L', halfW, (halfH - r),
      'Q', halfW, halfH, (halfW - r), halfH,
      'L', (-halfW + r), halfH,
      'Q', -halfW, halfH, -halfW, (halfH - r),
      'L', -halfW, (-halfH + r),
      'Q', -halfW, -halfH, (-halfW + r), -halfH,
      'Z'
    ].join(' ');
  }

  function complexityLinkSpan(link, nodeById) {
    var source = nodeById[link.source];
    var target = nodeById[link.target];
    if (!source || !target) return 1;
    return Math.max(1, Math.abs(source.step - target.step));
  }

  function complexityTrackX(link, source, halfNodeW, layout, nodeById) {
    var span = complexityLinkSpan(link, nodeById);
    var laneEdge = source.x - halfNodeW;

    if (link.kind === 'learning') {
      var learningBase = laneEdge - (layout.learningArc * 0.9);
      var learningStep = layout.compact ? 12 : 15;
      return learningBase - ((span - 1) * learningStep);
    }

    var feedbackBase = laneEdge - (layout.feedbackArc * 0.92);
    var feedbackStep = layout.compact ? 9 : 11;
    return feedbackBase - ((span - 1) * feedbackStep);
  }

  function complexityPortOffsetY(link, source, target, layout, isSource) {
    var separation = source.step - target.step;

    if (link.kind === 'learning') {
      var learningSpread = layout.compact ? 4.8 : 5.8;
      if (isSource) return clamp((target.step - 2) * learningSpread, -13, 13);
      return clamp((source.step - 4) * learningSpread, -13, 13);
    }

    if (link.kind === 'feedback') {
      var feedbackSpread = layout.compact ? 3.6 : 4.4;
      if (isSource) return clamp(-separation * feedbackSpread, -11, 11);
      return clamp(separation * feedbackSpread, -11, 11);
    }

    return 0;
  }

  function linkPath(link, nodeById, layout) {
    var source = nodeById[link.source];
    var target = nodeById[link.target];
    if (!source || !target) return '';

    var halfNodeW = layout.nodeWidth / 2;
    var halfNodeH = layout.nodeHeight / 2;

    if (source.lane === target.lane) {
      if (link.kind === 'primary') {
        return [
          'M', source.x, source.y + halfNodeH + 4,
          'C', source.x, source.y + halfNodeH + 42,
          target.x, target.y - halfNodeH - 42,
          target.x, target.y - halfNodeH - 4
        ].join(' ');
      }

      if (link.kind === 'minor') {
        var out = source.lane === 'traditional' ? 1 : -1;
        var sourceX = source.x + (out * (halfNodeW - 8));
        var targetX = target.x + (out * (halfNodeW - 8));
        var bendX = source.x + (out * (halfNodeW + layout.feedbackArc));
        return [
          'M', sourceX, source.y,
          'C', bendX, source.y,
          bendX, target.y,
          targetX, target.y
        ].join(' ');
      }

      if (source.lane === 'complexity' && (link.kind === 'feedback' || link.kind === 'learning')) {
        var sideX = source.x - (halfNodeW - 8);
        var targetSideX = target.x - (halfNodeW - 8);
        var sourceY = source.y + complexityPortOffsetY(link, source, target, layout, true);
        var targetY = target.y + complexityPortOffsetY(link, source, target, layout, false);
        var trackX = complexityTrackX(link, source, halfNodeW, layout, nodeById);
        return [
          'M', sideX, sourceY,
          'C', trackX, sourceY,
          trackX, targetY,
          targetSideX, targetY
        ].join(' ');
      }

      if (link.kind === 'feedback') {
        var side = source.lane === 'complexity' ? -1 : 1;
        var feedbackSourceX = source.x + (side * (halfNodeW - 8));
        var feedbackTargetX = target.x + (side * (halfNodeW - 8));
        var feedbackBendX = source.x + (side * (halfNodeW + layout.feedbackArc));
        return [
          'M', feedbackSourceX, source.y,
          'C', feedbackBendX, source.y,
          feedbackBendX, target.y,
          feedbackTargetX, target.y
        ].join(' ');
      }

      if (link.kind === 'learning') {
        var learningSourceX = source.x - (halfNodeW - 12);
        var learningTargetX = target.x - (halfNodeW - 12);
        var curveX = source.x - layout.learningArc;
        return [
          'M', learningSourceX, source.y - 4,
          'C', curveX, source.y - 48,
          curveX, target.y - 30,
          learningTargetX, target.y - 4
        ].join(' ');
      }
    }

    return ['M', source.x, source.y, 'L', target.x, target.y].join(' ');
  }

  function makeMarker(defsSel, id, color) {
    defsSel.append('marker')
      .attr('id', id)
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 6.9)
      .attr('refY', 0)
      .attr('markerWidth', 4.5)
      .attr('markerHeight', 4.5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', color);
  }

  function connectedNodeIds(id) {
    var connected = new Set([id]);
    LINKS.forEach(function(link) {
      if (link.source === id || link.target === id) {
        connected.add(link.source);
        connected.add(link.target);
      }
    });
    return connected;
  }

  function stopPulseAnimation() {
    if (state.pulseTimer) {
      state.pulseTimer.stop();
      state.pulseTimer = null;
    }
  }

  function pulseOpacityForMode(mode, link) {
    if (prefersReducedMotion) return 0;

    if (mode === 'process') {
      return 0;
    }

    if (mode === 'assumptions') {
      return 0;
    }

    if (mode === 'learning') {
      var learningRole = getLearningRole(link);
      if (learningRole === 'learning-loop') return 0.96;
      if (learningRole === 'learning-support') return 0.14;
      return 0;
    }

    return 0;
  }

  function getProcessRole(link) {
    if (link.kind === 'primary' && link.lane === 'traditional') return 'traditional-flow';
    if (link.kind === 'primary' && link.lane === 'complexity') return 'complexity-flow';
    if (link.kind === 'minor' && link.lane === 'traditional') return 'handoff-rework';
    if (link.kind === 'minor') return 'local-adjust';
    return 'adaptive-context';
  }

  function getAssumptionRole(link) {
    if (link.lane === 'traditional' && link.kind === 'primary') return 'certainty';
    if (link.lane === 'complexity' && (link.kind === 'feedback' || link.kind === 'learning')) return 'learning-test';
    return 'context';
  }

  function getLearningRole(link) {
    if (link.lane === 'complexity' && (link.kind === 'feedback' || link.kind === 'learning')) return 'learning-loop';
    if (link.lane === 'complexity' && link.kind === 'primary') return 'learning-support';
    if (link.lane === 'traditional' && link.kind === 'minor') return 'legacy-rework';
    return 'delivery-context';
  }

  function getPulseRole(mode, link) {
    if (mode === 'assumptions') return getAssumptionRole(link);
    if (mode === 'learning') return getLearningRole(link);
    return getProcessRole(link);
  }

  function pulseSpeedPxPerMs(mode, link) {
    var role = getPulseRole(mode, link);

    if (mode === 'assumptions') {
      if (role === 'learning-test') return 0.072;
      if (role === 'certainty') return 0.058;
      return 0.032;
    }

    if (mode === 'learning') {
      if (role === 'learning-loop') return 0.078;
      if (role === 'learning-support') return 0.048;
      return 0.036;
    }

    if (role === 'traditional-flow' || role === 'complexity-flow') return 0.064;
    if (role === 'handoff-rework' || role === 'local-adjust') return 0.048;
    return 0.04;
  }

  function pulsePhaseOffsetPx(idx) {
    return 24 + ((idx * 37) % 211);
  }

  function pulseDistancePx(elapsedMs, link, idx, mode) {
    if (!link.__pathLength || link.__pathLength <= 0) return 0;
    var distance = (elapsedMs * pulseSpeedPxPerMs(mode, link)) + pulsePhaseOffsetPx(idx);
    return distance % link.__pathLength;
  }

  function modeStyle(mode, link, layout) {
    if (mode === 'process') {
      var processRole = getProcessRole(link);
      var processColor = COLORS.processArrow;
      if (processRole === 'traditional-flow') {
        return {
          color: processColor,
          width: layout.edgePrimary + 0.25,
          dash: null,
          opacity: 0.94,
          marker: 'url(#mix-map-arrow-process)'
        };
      }
      if (processRole === 'complexity-flow') {
        return {
          color: processColor,
          width: layout.edgePrimary + 0.25,
          dash: null,
          opacity: 0.94,
          marker: 'url(#mix-map-arrow-process)'
        };
      }
      return {
        color: processColor,
        width: Math.max(0.58, layout.edgeSecondary - 0.54),
        dash: null,
        opacity: 0,
        marker: 'url(#mix-map-arrow-process)'
      };
    }

    if (mode === 'assumptions') {
      var assumptionRole = getAssumptionRole(link);
      var assumptionColor = COLORS.assumptionArrow;
      if (assumptionRole === 'certainty') {
        return {
          color: assumptionColor,
          width: layout.edgePrimary + 0.24,
          dash: null,
          opacity: 0.95,
          marker: 'url(#mix-map-arrow-assumption)'
        };
      }
      if (assumptionRole === 'learning-test') {
        return {
          color: assumptionColor,
          width: layout.edgeLearning + 0.45,
          dash: null,
          opacity: 0.97,
          marker: 'url(#mix-map-arrow-assumption)'
        };
      }
      if (link.lane === 'traditional' && link.kind === 'minor') {
        return {
          color: assumptionColor,
          width: Math.max(0.72, layout.edgeSecondary - 0.08),
          dash: null,
          opacity: 0.46,
          marker: 'url(#mix-map-arrow-assumption)'
        };
      }
      return {
        color: assumptionColor,
        width: Math.max(0.64, layout.edgeSecondary - 0.28),
        dash: null,
        opacity: 0.12,
        marker: 'url(#mix-map-arrow-assumption)'
      };
    }

    if (mode === 'learning') {
      var learningRole = getLearningRole(link);
      var learningColor = COLORS.learningArrow;
      if (learningRole === 'learning-loop') {
        return {
          color: learningColor,
          width: layout.edgeLearning + 0.62,
          dash: null,
          opacity: 0.98,
          marker: 'url(#mix-map-arrow-learning)'
        };
      }
      if (learningRole === 'learning-support') {
        return {
          color: learningColor,
          width: Math.max(0.75, layout.edgeSecondary - 0.16),
          dash: null,
          opacity: 0.28,
          marker: 'url(#mix-map-arrow-learning)'
        };
      }
      if (learningRole === 'legacy-rework') {
        return {
          color: learningColor,
          width: Math.max(0.74, layout.edgeSecondary - 0.12),
          dash: null,
          opacity: 0.42,
          marker: 'url(#mix-map-arrow-learning)'
        };
      }
      return {
        color: learningColor,
        width: Math.max(0.6, layout.edgeSecondary - 0.5),
        dash: null,
        opacity: 0.06,
        marker: 'url(#mix-map-arrow-learning)'
      };
    }

    return modeStyle('process', link, layout);
  }

  function updateLinkAriaLabels(mode) {
    if (!state.linkSel || !state.nodeById) return;
    state.linkSel.attr('aria-label', function(link) {
      return linkAriaLabel(link, mode, state.nodeById);
    });
  }

  function applyMode(mode, skipTransition) {
    if (!state.linkSel || !state.pulseSel) return;

    var duration = skipTransition ? 0 : 360;

    setModeButtonState(mode);
    setModeHelperText(mode);
    updateLinkAriaLabels(mode);

    state.linkSel
      .transition()
      .duration(duration)
      .attr('stroke', function(link) {
        return modeStyle(mode, link, state.layout).color;
      })
      .attr('stroke-width', function(link) {
        return modeStyle(mode, link, state.layout).width * EDGE_STROKE_SCALE;
      })
      .attr('opacity', function(link) {
        return modeStyle(mode, link, state.layout).opacity;
      })
      .attr('marker-end', function(link) {
        return modeStyle(mode, link, state.layout).marker;
      });

    state.pulseSel
      .transition()
      .duration(duration)
      .attr('opacity', function(link) {
        return pulseOpacityForMode(mode, link);
      });
  }

  function clearHighlight() {
    state.activeNodeId = null;
    if (!state.nodeSel || !state.linkSel || !state.pulseSel) return;

    state.nodeSel
      .transition()
      .duration(180)
      .style('opacity', 1);

    applyMode(state.mode, true);
  }

  function highlightLinkOpacity(mode, link, isConnected, layout) {
    var base = modeStyle(mode, link, layout).opacity;

    if (mode === 'process') {
      var processRole = getProcessRole(link);
      if (processRole !== 'traditional-flow' && processRole !== 'complexity-flow') return 0;
    }

    if (!isConnected) {
      return Math.max(0.04, base * 0.35);
    }

    if (mode === 'process' && getProcessRole(link) === 'adaptive-context') {
      return Math.min(0.24, Math.max(base + 0.05, 0.14));
    }

    if (mode === 'assumptions' && getAssumptionRole(link) === 'context') {
      return Math.min(0.2, Math.max(base + 0.04, 0.12));
    }

    if (mode === 'learning' && getLearningRole(link) === 'delivery-context') {
      return Math.min(0.16, Math.max(base + 0.03, 0.09));
    }

    return Math.min(1, Math.max(base + 0.24, 0.62));
  }

  function highlightNode(nodeId) {
    if (!state.nodeSel || !state.linkSel || !state.pulseSel) return;

    state.activeNodeId = nodeId;
    var connected = connectedNodeIds(nodeId);

    state.nodeSel
      .transition()
      .duration(120)
      .style('opacity', function(node) {
        return connected.has(node.id) ? 1 : 0.24;
      });

    state.linkSel
      .transition()
      .duration(120)
      .attr('opacity', function(link) {
        var isConnected = link.source === nodeId || link.target === nodeId;
        return highlightLinkOpacity(state.mode, link, isConnected, state.layout);
      });

    state.pulseSel
      .transition()
      .duration(120)
      .attr('opacity', function(link) {
        if (prefersReducedMotion) return 0;
        var baseOpacity = pulseOpacityForMode(state.mode, link);
        if (baseOpacity <= 0) return 0;
        if (link.source === nodeId || link.target === nodeId) return Math.min(0.98, baseOpacity + 0.16);
        return baseOpacity * 0.08;
      });
  }

  function bindPulseAnimation() {
    stopPulseAnimation();
    if (!state.pulseSel) return;
    if (prefersReducedMotion) {
      state.pulseSel.attr('opacity', 0);
      return;
    }

    state.pulseTimer = d3.timer(function(elapsed) {
      state.pulseSel.each(function(link, idx) {
        if (!link.__pathNode || !link.__pathLength) return;
        var distancePx = pulseDistancePx(elapsed, link, idx, state.mode);
        var point = link.__pathNode.getPointAtLength(distancePx);
        d3.select(this)
          .attr('cx', point.x)
          .attr('cy', point.y);
      });
    });
  }

  function renderGraph() {
    state.renderStamp += 1;
    var renderStamp = state.renderStamp;
    refreshColors();

    var layout = getLayout();
    var nodes = buildNodes(layout);
    var nodeById = Object.create(null);

    nodes.forEach(function(node) {
      nodeById[node.id] = node;
    });

    state.layout = layout;
    state.nodeById = nodeById;

    var svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg
      .attr('viewBox', '0 0 ' + layout.width + ' ' + layout.height)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    var defs = svg.append('defs');
    makeMarker(defs, 'mix-map-arrow-traditional', COLORS.traditionalArrow);
    makeMarker(defs, 'mix-map-arrow-complexity', COLORS.complexityArrow);
    makeMarker(defs, 'mix-map-arrow-process', COLORS.processArrow);
    makeMarker(defs, 'mix-map-arrow-learning', COLORS.learningArrow);
    makeMarker(defs, 'mix-map-arrow-assumption', COLORS.assumptionArrow);

    var bgLayer = svg.append('g').attr('class', 'mix-map-layer mix-map-layer--background');
    var edgeLayer = svg.append('g').attr('class', 'mix-map-layer mix-map-layer--edges');
    var nodeLayer = svg.append('g').attr('class', 'mix-map-layer mix-map-layer--nodes');
    var overlayLayer = svg.append('g').attr('class', 'mix-map-layer mix-map-layer--overlay');

    bgLayer.append('text')
      .attr('x', layout.laneX.complexity)
      .attr('y', 56)
      .attr('text-anchor', 'middle')
      .attr('class', 'mix-map-lane-title')
      .attr('font-size', layout.laneTitleSize)
      .attr('fill', COLORS.text)
      .text('Complexity-Informed');

    bgLayer.append('text')
      .attr('x', layout.laneX.complexity)
      .attr('y', 78)
      .attr('text-anchor', 'middle')
      .attr('class', 'mix-map-lane-subtitle')
      .attr('font-size', layout.laneSubtitleSize)
      .attr('fill', COLORS.muted)
      .text('learning-oriented, uncertainty-aware, adaptive');

    bgLayer.append('text')
      .attr('x', layout.laneX.traditional)
      .attr('y', 56)
      .attr('text-anchor', 'middle')
      .attr('class', 'mix-map-lane-title')
      .attr('font-size', layout.laneTitleSize)
      .attr('fill', COLORS.text)
      .text('Traditional');

    bgLayer.append('text')
      .attr('x', layout.laneX.traditional)
      .attr('y', 78)
      .attr('text-anchor', 'middle')
      .attr('class', 'mix-map-lane-subtitle')
      .attr('font-size', layout.laneSubtitleSize)
      .attr('fill', COLORS.muted)
      .text('phase-gated, requirements-first, linear');

    var linkSel = edgeLayer.selectAll('.mix-map-edge')
      .data(LINKS, function(link) {
        return link.source + '>' + link.target + ':' + link.kind;
      })
      .join('path')
      .attr('class', function(link) {
        return 'mix-map-edge mix-map-edge--' + link.lane + ' mix-map-edge--' + link.kind;
      })
      .attr('d', function(link) {
        return linkPath(link, nodeById, layout);
      })
      .attr('fill', 'none')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('pointer-events', 'stroke')
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', function(link) {
        return linkAriaLabel(link, state.mode, nodeById);
      })
      .on('mousemove', function(event, link) {
        showTooltip(linkTooltipHtml(link, state.mode, nodeById), event.clientX, event.clientY);
      })
      .on('mouseenter', function(event, link) {
        showTooltip(linkTooltipHtml(link, state.mode, nodeById), event.clientX, event.clientY);
      })
      .on('mouseleave', function() {
        hideTooltip();
      })
      .on('focus', function(event, link) {
        var box = this.getBoundingClientRect();
        showTooltip(
          linkTooltipHtml(link, state.mode, nodeById),
          box.left + (box.width / 2),
          box.top + Math.max(10, box.height / 2)
        );
      })
      .on('blur', function(event, link) {
        hideTooltip();
      })
      .on('keydown', function(event, link) {
        if (event.key === 'Escape') {
          hideTooltip();
          this.blur();
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          var box = this.getBoundingClientRect();
          showTooltip(
            linkTooltipHtml(link, state.mode, nodeById),
            box.left + (box.width / 2),
            box.top + Math.max(10, box.height / 2)
          );
        }
      })
      .on('click', function(event, link) {
        showTooltip(linkTooltipHtml(link, state.mode, nodeById), event.clientX, event.clientY);
      });

    var pulseSel = edgeLayer.selectAll('.mix-map-pulse')
      .data(LINKS, function(link) {
        return link.source + '>' + link.target + ':' + link.kind;
      })
      .join('circle')
      .attr('class', 'mix-map-pulse')
      .attr('r', layout.pulseRadius)
      .attr('fill', COLORS.learningDot)
      .attr('stroke', 'none')
      .attr('stroke-width', 0)
      .attr('pointer-events', 'none');

    linkSel.each(function(link) {
      link.__pathNode = this;
      link.__pathLength = 0;
      try {
        link.__pathLength = this.getTotalLength();
      } catch (error) {
        link.__pathLength = 0;
      }
    });

    var nodeSel = nodeLayer.selectAll('.mix-map-node')
      .data(nodes, function(node) {
        return node.id;
      })
      .join('g')
      .attr('class', function(node) {
        return 'mix-map-node mix-map-node--' + node.lane;
      })
      .attr('transform', function(node) {
        return 'translate(' + node.x + ',' + node.y + ')';
      })
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', function(node) {
        return node.step + '. ' + node.title;
      })
      .on('mousemove', function(event, node) {
        showTooltip(tooltipHtml(node), event.clientX, event.clientY);
      })
      .on('mouseenter', function(event, node) {
        highlightNode(node.id);
        showTooltip(tooltipHtml(node), event.clientX, event.clientY);
      })
      .on('mouseleave', function() {
        hideTooltip();
        clearHighlight();
      })
      .on('focus', function(event, node) {
        var box = this.getBoundingClientRect();
        highlightNode(node.id);
        showTooltip(tooltipHtml(node), box.left + (box.width / 2), box.top + 8);
      })
      .on('blur', function() {
        hideTooltip();
        clearHighlight();
      })
      .on('keydown', function(event) {
        if (event.key === 'Escape') {
          hideTooltip();
          clearHighlight();
          this.blur();
        }
      });

    nodeSel.append('path')
      .attr('d', function(node) {
        return nodeShapePath(node, layout);
      })
      .attr('fill', COLORS.nodeFill)
      .attr('stroke', COLORS.nodeStroke)
      .attr('stroke-width', 2.4);

    var nodeLabelSel = nodeSel.append('text')
      .attr('class', 'mix-map-node-label gc-viz__legend-text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('pointer-events', 'none')
      .text(function(node) {
        return fitHeaderLabel(node.shortLabel);
      });

    scheduleNodeLabelFit(nodeLabelSel, layout, renderStamp);

    var compareLineStart = layout.laneX.complexity + (layout.nodeWidth / 2) + 18;
    var compareLineEnd = layout.laneX.traditional - (layout.nodeWidth / 2) - 18;

    overlayLayer.selectAll('.mix-map-compare-line')
      .data(COMPARISON_LINE_ROWS)
      .join('line')
      .attr('class', 'mix-map-compare-line')
      .attr('x1', compareLineStart)
      .attr('x2', compareLineEnd)
      .attr('y1', function(row) {
        return nodeById[row.anchorId].y;
      })
      .attr('y2', function(row) {
        return nodeById[row.anchorId].y;
      })
      .attr('stroke', COLORS.goldLine)
      .attr('stroke-width', 0.7);

    var compareLabelSel = overlayLayer.selectAll('.mix-map-compare-label')
      .data(COMPARISON_ROWS)
      .join('text')
      .attr('class', 'mix-map-compare-label');

    layoutComparisonLabels(compareLabelSel, layout, nodeById, compareLineStart, compareLineEnd);

    state.linkSel = linkSel;
    state.nodeSel = nodeSel;
    state.pulseSel = pulseSel;

    applyMode(state.mode, true);
    bindPulseAnimation();
  }

  function onResize() {
    if (state.resizeTimer) window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(function() {
      hideTooltip();
      renderGraph();
    }, 120);
  }

  modeButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      var nextMode = button.getAttribute('data-mode');
      if (!nextMode || nextMode === state.mode) return;
      state.mode = nextMode;
      hideTooltip();
      clearHighlight();
      applyMode(state.mode, false);
    });
  });

  window.addEventListener('resize', onResize);

  if (reducedMotionQuery) {
    var onMotionPrefChanged = function(event) {
      prefersReducedMotion = !!event.matches;
      bindPulseAnimation();
      applyMode(state.mode, true);
    };

    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', onMotionPrefChanged);
    } else if (typeof reducedMotionQuery.addListener === 'function') {
      reducedMotionQuery.addListener(onMotionPrefChanged);
    }
  }

  renderGraph();
})();
