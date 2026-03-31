'use strict';

(function initMixMapper() {
  var shellEl = document.getElementById('mix-mapper-viz-shell');
  var svgEl = document.getElementById('mix-mapper-svg');
  var tooltipEl = document.getElementById('mix-mapper-tooltip');
  var fallbackEl = document.getElementById('mix-mapper-fallback');
  var modeButtons = Array.prototype.slice.call(document.querySelectorAll('.mix-mapper-legend-btn'));

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

  function buildColors() {
    var ink = readScopedCssVar('--ink', '#2A2018');
    var sage = readScopedCssVar('--sage', readScopedCssVar('--viz-sage', '#4A6741'));
    var rust = readScopedCssVar('--rust', readScopedCssVar('--viz-rust', '#9A4F2F'));
    var text = ink;
    var muted = readScopedCssVar('--ink-mid', '#5C4F3A');
    var inkFaint = readScopedCssVar('--ink-faint', '#8E816D');
    var ghost = readScopedCssVar('--ink-ghost', '#C8BDA8');
    var panel = readScopedCssVar('--paper', '#FAF8F1');
    var baseViz = readScopedCssVar('--viz-gold', '#B8943A');
    var toggleAccent = readScopedCssVar('--mix-map-accent', readScopedCssVar('--viz-rust-light', baseViz));

    return {
      text: text,
      muted: muted,
      inkFaint: inkFaint,
      rust: rust,
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
      learningArrow: sage,
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
  var DATA = (typeof window !== 'undefined' && window.MixMapperData) ? window.MixMapperData : null;
  var SEMANTICS = (typeof window !== 'undefined' && window.MixMapperSemantics) ? window.MixMapperSemantics : null;
  var GEOMETRY = (typeof window !== 'undefined' && window.MixMapperGeometry) ? window.MixMapperGeometry : null;
  var LAYOUT_UTILS = (typeof window !== 'undefined' && window.MixMapperLayoutUtils) ? window.MixMapperLayoutUtils : null;
  var NODE_UTILS = (typeof window !== 'undefined' && window.MixMapperNodeUtils) ? window.MixMapperNodeUtils : null;
  var MODE_POLICY = (typeof window !== 'undefined' && window.MixMapperModePolicy) ? window.MixMapperModePolicy : null;
  var TOOLTIP = (typeof window !== 'undefined' && window.MixMapperTooltip) ? window.MixMapperTooltip : null;
  var INTERACTIONS = (typeof window !== 'undefined' && window.MixMapperInteractions) ? window.MixMapperInteractions : null;
  var RENDERER = (typeof window !== 'undefined' && window.MixMapperRenderer) ? window.MixMapperRenderer : null;

  if (!DATA || !SEMANTICS || !GEOMETRY || !LAYOUT_UTILS || !NODE_UTILS || !MODE_POLICY || !TOOLTIP || !INTERACTIONS || !RENDERER) {
    if (fallbackEl) fallbackEl.hidden = false;
    return;
  }

  var BASE_NODES = DATA.BASE_NODES;
  var LINKS = DATA.LINKS;
  var COMPLEXITY_LINK_NARRATIVES = DATA.COMPLEXITY_LINK_NARRATIVES;
  var COMPARISON_ROWS = DATA.COMPARISON_ROWS;
  var COMPARISON_LINE_ROWS = COMPARISON_ROWS.filter(function(row) {
    return row.anchorId !== 'c3';
  });
  var modeLabel = SEMANTICS.modeLabel;
  var linkKey = SEMANTICS.linkKey;
  var getProcessRole = SEMANTICS.getProcessRole;
  var getAssumptionRole = SEMANTICS.getAssumptionRole;
  var getLearningRole = SEMANTICS.getLearningRole;
  var linkPath = GEOMETRY.linkPath;
  var makeMarker = GEOMETRY.makeMarker;
  var modePolicy = MODE_POLICY.createModePolicy({
    getColors: function() {
      return COLORS;
    },
    getProcessRole: getProcessRole,
    getAssumptionRole: getAssumptionRole,
    getLearningRole: getLearningRole,
    linkKey: linkKey
  });
  var layoutUtils = LAYOUT_UTILS.createLayoutUtils({
    clamp: clamp,
    readScopedCssNumber: readScopedCssNumber,
    getColors: function() {
      return COLORS;
    }
  });
  var nodeUtils = NODE_UTILS.createNodeUtils({
    baseNodes: BASE_NODES,
    links: LINKS,
    clamp: clamp
  });

  function complexityLinkNarrative(link, mode) {
    return SEMANTICS.complexityLinkNarrative(link, mode, COMPLEXITY_LINK_NARRATIVES);
  }

  var tooltipContent = TOOLTIP.createTooltipContent({
    modeLabel: modeLabel,
    complexityLinkNarrative: complexityLinkNarrative
  });
  var tooltipHtml = tooltipContent.tooltipHtml;
  var linkTooltipHtml = tooltipContent.linkTooltipHtml;
  var linkAriaLabel = tooltipContent.linkAriaLabel;
  var interactionBindings = INTERACTIONS.createInteractionBindings({
    getMode: function() {
      return state.mode;
    },
    showTooltip: showTooltip,
    hideTooltip: hideTooltip,
    linkTooltipHtml: linkTooltipHtml,
    linkAriaLabel: linkAriaLabel,
    tooltipHtml: tooltipHtml,
    highlightNode: highlightNode,
    clearHighlight: clearHighlight
  });
  var renderer = RENDERER.createRenderer({
    d3: d3,
    svgEl: svgEl,
    links: LINKS,
    comparisonRows: COMPARISON_ROWS,
    comparisonLineRows: COMPARISON_LINE_ROWS,
    layoutUtils: layoutUtils,
    nodeUtils: nodeUtils,
    modePolicy: modePolicy,
    interactionBindings: interactionBindings,
    linkPath: linkPath,
    makeMarker: makeMarker,
    getColors: function() {
      return COLORS;
    },
    getCurrentRenderStamp: function() {
      return state.renderStamp;
    }
  });

  var EDGE_STROKE_SCALE = 0.6;

  var state = {
    mode: 'all',
    activeNodeId: null,
    layout: null,
    renderStamp: 0,
    nodeById: Object.create(null),
    linkSel: null,
    linkHitSel: null,
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

  function hideTooltip() {
    tooltipEl.classList.remove('is-visible');
    tooltipEl.setAttribute('aria-hidden', 'true');
  }

  function showTooltip(contentHtml, clientX, clientY, options) {
    if (!contentHtml) return;
    options = options || {};
    var anchorMode = options.anchorMode || 'pointer';
    var viewportWidth = window.innerWidth || 1280;
    var viewportHeight = window.innerHeight || 720;
    var viewportPad = 10;
    var offsetX = anchorMode === 'focus' ? 10 : 8;
    var offsetY = anchorMode === 'focus' ? 10 : 8;
    tooltipEl.innerHTML = contentHtml;

    var tooltipWidth = Math.max(132, Math.min(tooltipEl.offsetWidth || 216, viewportWidth - (viewportPad * 2)));
    var tooltipHeight = Math.max(52, Math.min(tooltipEl.offsetHeight || 92, viewportHeight - (viewportPad * 2)));
    var rightX = clientX + offsetX;
    var leftX = clientX - tooltipWidth - offsetX;
    var belowY = clientY + offsetY;
    var aboveY = clientY - tooltipHeight - offsetY;
    var nextLeft = rightX;
    var nextTop = belowY;

    if (nextLeft + tooltipWidth > viewportWidth - viewportPad && leftX >= viewportPad) {
      nextLeft = leftX;
    }
    if (nextTop + tooltipHeight > viewportHeight - viewportPad && aboveY >= viewportPad) {
      nextTop = aboveY;
    }

    nextLeft = clamp(nextLeft, viewportPad, viewportWidth - tooltipWidth - viewportPad);
    nextTop = clamp(nextTop, viewportPad, viewportHeight - tooltipHeight - viewportPad);

    tooltipEl.style.left = String(nextLeft) + 'px';
    tooltipEl.style.top = String(nextTop) + 'px';
    tooltipEl.classList.add('is-visible');
    tooltipEl.setAttribute('aria-hidden', 'false');
  }

  function stopPulseAnimation() {
    if (state.pulseTimer) {
      state.pulseTimer.stop();
      state.pulseTimer = null;
    }
  }

  function pulseOpacityWithFocus(link) {
    if (prefersReducedMotion) return 0;
    var baseOpacity = modePolicy.pulseOpacityForMode(state.mode, link, prefersReducedMotion);
    if (baseOpacity <= 0) return 0;
    if (!state.activeNodeId) return baseOpacity;
    if (link.source === state.activeNodeId || link.target === state.activeNodeId) {
      return Math.min(0.98, baseOpacity + 0.16);
    }
    return baseOpacity * 0.08;
  }

  function applyMode(mode, skipTransition) {
    if (!state.linkSel || !state.pulseSel) return;

    var duration = skipTransition ? 0 : 360;

    setModeButtonState(mode);
    interactionBindings.updateLinkAriaLabels(state, mode);

    // Update geometry immediately to avoid path-morph jumps between modes.
    state.linkSel.attr('d', function(link) {
      return linkPath(link, state.nodeById, state.layout, mode);
    });
    if (state.linkHitSel) {
      state.linkHitSel.attr('d', function(link) {
        return linkPath(link, state.nodeById, state.layout, mode);
      });
    }

    state.linkSel
      .transition()
      .duration(duration)
      .attr('stroke', function(link) {
        return modePolicy.modeStyle(mode, link, state.layout).color;
      })
      .attr('stroke-width', function(link) {
        return modePolicy.modeStyle(mode, link, state.layout).width * EDGE_STROKE_SCALE;
      })
      .attr('opacity', function(link) {
        return modePolicy.modeStyle(mode, link, state.layout).opacity;
      })
      .attr('marker-end', function(link) {
        return modePolicy.modeStyle(mode, link, state.layout).marker;
      });

    state.pulseSel
      .transition()
      .duration(duration)
      .attr('fill', function(link) {
        return modePolicy.pulseDotColor(mode, link);
      })
      .attr('opacity', function(link) {
        return modePolicy.pulseOpacityForMode(mode, link, prefersReducedMotion);
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

  function highlightNode(nodeId) {
    if (!state.nodeSel || !state.linkSel || !state.pulseSel) return;

    state.activeNodeId = nodeId;
    var connected = nodeUtils.connectedNodeIds(nodeId);

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
        return modePolicy.highlightLinkOpacity(state.mode, link, isConnected, state.layout);
      });

    state.pulseSel
      .transition()
      .duration(120)
      .attr('opacity', function(link) {
        if (prefersReducedMotion) return 0;
        var baseOpacity = modePolicy.pulseOpacityForMode(state.mode, link, prefersReducedMotion);
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
        var pulseSel = d3.select(this);
        var opacity = pulseOpacityWithFocus(link);
        var point;

        if (modePolicy.isForwardFlowLink(link) && link.__cascadeTotal && link.__cascadeOffset !== null) {
          var laneDistance = ((elapsed * modePolicy.pulseSpeedPxPerMs(state.mode, link)) + (link.__cascadePhase || 0)) % link.__cascadeTotal;
          var localDistance = laneDistance - link.__cascadeOffset;
          if (localDistance < 0 || localDistance > link.__pathLength) {
            point = link.__pathNode.getPointAtLength(0);
            pulseSel
              .attr('cx', point.x)
              .attr('cy', point.y)
              .attr('opacity', 0);
            return;
          }
          point = link.__pathNode.getPointAtLength(localDistance);
          pulseSel
            .attr('cx', point.x)
            .attr('cy', point.y)
            .attr('opacity', opacity);
          return;
        }

        var distancePx = modePolicy.pulseDistancePx(elapsed, link, idx, state.mode);
        point = link.__pathNode.getPointAtLength(distancePx);
        pulseSel
          .attr('cx', point.x)
          .attr('cy', point.y)
          .attr('opacity', opacity);
      });
    });
  }

  function renderGraph() {
    state.renderStamp += 1;
    var renderStamp = state.renderStamp;
    refreshColors();
    var graph = renderer.renderGraph({
      shellEl: shellEl,
      renderStamp: renderStamp,
      mode: state.mode
    });
    if (!graph) return;

    state.layout = graph.layout;
    state.nodeById = graph.nodeById;
    state.linkSel = graph.linkSel;
    state.linkHitSel = graph.linkHitSel;
    state.nodeSel = graph.nodeSel;
    state.pulseSel = graph.pulseSel;

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

  interactionBindings.bindModeButtons(modeButtons, function(nextMode) {
    state.mode = nextMode === state.mode ? 'all' : nextMode;
    hideTooltip();
    clearHighlight();
    applyMode(state.mode, false);
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
