'use strict';

(function initMixMapper() {
  var shellEl = document.getElementById('mix-mapper-viz-shell');
  var svgEl = document.getElementById('mix-mapper-svg');
  var tooltipEl = document.getElementById('mix-mapper-tooltip');
  var fallbackEl = document.getElementById('mix-mapper-fallback');
  var legendEl = document.querySelector('.mix-mapper-legend');
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

  function readNumberCssVarFromEl(el, name, fallback) {
    if (!el || typeof window === 'undefined') return fallback;
    var raw = window.getComputedStyle(el).getPropertyValue(name);
    var num = parseFloat(raw);
    return Number.isFinite(num) ? num : fallback;
  }

  function resolveTypography(layout) {
    var viewWidth = layout && Number.isFinite(layout.width) ? Math.max(1, layout.width) : 980;
    var rect = svgEl.getBoundingClientRect();
    var shellWidth = shellEl && shellEl.clientWidth ? shellEl.clientWidth : 0;
    var measuredWidth = rect && Number.isFinite(rect.width) ? rect.width : 0;
    // Use width-driven scale for stable first paint. Height can be transient before first viewBox render.
    var effectiveWidth = Math.max(measuredWidth, shellWidth);
    var widthScale = effectiveWidth > 0 ? (effectiveWidth / viewWidth) : 1;
    var svgScale = clamp(widthScale, 0.25, 2.5);
    var nodeFontScale = clamp(readScopedCssNumber('--mix-map-node-font-scale', 1), 0.6, 1.3);
    var nodeMinPx = layout && layout.compact ? 7.8 : 9.2;

    function pxToUserUnits(px, minPx, maxPx) {
      var targetPx = clamp(px, minPx, maxPx);
      return clamp(targetPx / svgScale, 8, 180);
    }

    return {
      nodeFontU: pxToUserUnits(
        readNumberCssVarFromEl(svgEl, '--mix-map-fs-node-px', 11.2) * nodeFontScale,
        nodeMinPx,
        13.2
      ),
      laneTitleFontU: pxToUserUnits(
        readNumberCssVarFromEl(svgEl, '--mix-map-fs-lane-title-px', 14.8),
        11.2,
        16.2
      ),
      laneSubtitleFontU: pxToUserUnits(
        readNumberCssVarFromEl(svgEl, '--mix-map-fs-lane-subtitle-px', 11.6),
        10,
        14
      ),
      compareFontU: pxToUserUnits(
        readNumberCssVarFromEl(svgEl, '--mix-map-fs-compare-px', 10.2),
        8.4,
        11.4
      )
    };
  }

  function buildColors() {
    var ink = readScopedCssVar('--viz-ink', '#2A2018');
    var sage = readScopedCssVar('--viz-sage', '#4A6741');
    var rust = readScopedCssVar('--viz-rust', '#8B3A2A');
    var text = ink;
    var muted = readScopedCssVar('--viz-ink-mid', '#5C4F3A');
    var inkFaint = readScopedCssVar('--viz-ink-faint', '#7A6E5F');
    var ghost = readScopedCssVar('--viz-ink-ghost', '#B0A490');
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
      nodeFill: 'color-mix(in srgb, ' + ink + ' 18%, ' + panel + ' 82%)',
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
  function dotTooltipHtml(row) {
    if (!row || !row.text) return '';
    var tooltipContent = TOOLTIP.createTooltipContent({});
    var safeText = tooltipContent.escapeHtml(row.text);
    return '<div class="mix-mapper-tooltip-header">' + safeText + '</div>';
  }

  var interactionBindings = INTERACTIONS.createInteractionBindings({
    getMode: function() {
      return state.mode;
    },
    getLinkMode: function(link, fallbackMode) {
      var resolved = resolveLinkMode(link);
      return resolved || fallbackMode || state.mode || 'all';
    },
    showTooltip: showTooltip,
    hideTooltip: hideTooltip,
    linkTooltipHtml: linkTooltipHtml,
    linkAriaLabel: linkAriaLabel,
    tooltipHtml: tooltipHtml,
    dotTooltipHtml: dotTooltipHtml,
    highlightNode: highlightNode,
    clearHighlight: clearHighlight,
    highlightLink: highlightLink,
    clearLinkHighlight: clearLinkHighlight
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
    getTypography: resolveTypography,
    getCurrentRenderStamp: function() {
      return state.renderStamp;
    }
  });

  // Visual scale applied to every stroke-width returned by modePolicy.modeStyle().
  // modePolicy widths are tuned at this scale (0.6×) — do not factor it out of modePolicy
  // without adjusting all width values there to compensate.
  var EDGE_STROKE_SCALE = 0.6;

  var state = {
    mode: 'all',
    activeModes: {
      process: false,
      assumptions: false,
      learning: false
    },
    activeNodeId: null,
    layout: null,
    renderStamp: 0,
    nodeById: Object.create(null),
    linkSel: null,
    linkOverlaySel: null,
    linkHitSel: null,
    nodeSel: null,
    pulseSel: null,
    pulseTimer: null,
    resizeTimer: null,
    fontsSettled: false
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

  function setModeButtonState() {
    var activeList = [];
    modeButtons.forEach(function(button) {
      var buttonMode = button.getAttribute('data-mode');
      var isActive = !!(buttonMode && state.activeModes[buttonMode]);
      if (isActive) activeList.push(buttonMode);
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    if (legendEl) {
      legendEl.setAttribute('data-active-mode', activeList.length ? activeList.join(',') : 'all');
    }
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

    var scrollX = window.pageXOffset || window.scrollX || 0;
    var scrollY = window.pageYOffset || window.scrollY || 0;
    tooltipEl.style.left = String(nextLeft + scrollX) + 'px';
    tooltipEl.style.top = String(nextTop + scrollY) + 'px';
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
    var baseOpacity = modePolicy.pulseOpacityForMode(resolvePulseMode(link), link, prefersReducedMotion);
    if (baseOpacity <= 0) return 0;
    if (!state.activeNodeId) return baseOpacity;
    if (link.source === state.activeNodeId || link.target === state.activeNodeId) {
      return Math.min(0.98, baseOpacity + 0.16);
    }
    return baseOpacity * 0.08;
  }

  function isProcessLayerLink(link) {
    var role = getProcessRole(link);
    return role === 'traditional-flow' || role === 'complexity-flow' || role === 'handoff-rework' || role === 'local-adjust';
  }

  function isAssumptionsLayerLink(link) {
    var role = getAssumptionRole(link);
    return role !== 'context';
  }

  function isLearningLayerLink(link) {
    var role = getLearningRole(link);
    return role === 'learning-loop' || role === 'legacy-upstream';
  }

  function resolveTooltipMode() {
    if (state.mode !== 'all' && state.activeModes[state.mode]) return state.mode;
    if (state.activeModes.process) return 'process';
    if (state.activeModes.assumptions) return 'assumptions';
    if (state.activeModes.learning) return 'learning';
    return 'all';
  }

  function resolveLinkMode(link) {
    if (state.activeModes.process && isProcessLayerLink(link)) return 'process';
    if (state.activeModes.assumptions && isAssumptionsLayerLink(link)) return 'assumptions';
    if (state.activeModes.learning && isLearningLayerLink(link)) return 'learning';
    return 'all';
  }

  function resolvePulseMode(link) {
    if (state.activeModes.learning && isLearningLayerLink(link)) return 'learning';
    return 'all';
  }

  function shouldShowTraditionalAssumptionOverlay(link) {
    return !!(
      state.activeModes.process &&
      state.activeModes.assumptions &&
      link &&
      link.lane === 'traditional' &&
      isAssumptionsLayerLink(link)
    );
  }

  function overlayStyle(link) {
    if (!shouldShowTraditionalAssumptionOverlay(link)) {
      return {
        color: 'transparent',
        width: 0,
        opacity: 0,
        marker: null
      };
    }

    var assumptionStyle = modePolicy.modeStyle('assumptions', link, state.layout);
    return {
      color: assumptionStyle.color,
      width: assumptionStyle.width * 0.66,
      opacity: Math.min(0.78, Math.max(0.42, assumptionStyle.opacity * 0.72)),
      marker: assumptionStyle.marker
    };
  }

  function composedLinkOpacity(link, isConnected) {
    var linkMode = resolveLinkMode(link);
    var base = modePolicy.modeStyle(linkMode, link, state.layout).opacity;
    if (isConnected) return Math.min(1, Math.max(base + 0.24, 0.62));
    return Math.max(0.04, base * 0.35);
  }

  function applyMode(skipTransition) {
    if (!state.linkSel || !state.pulseSel) return;

    var duration = skipTransition ? 0 : 360;
    // resolveTooltipMode() reads state.mode as a tie-breaker before this call overwrites it.
    // The read-then-write order is intentional: it picks the "previously committed mode"
    // to resolve conflicts when multiple legend layers are active simultaneously.
    var tooltipMode = resolveTooltipMode();
    state.mode = tooltipMode;

    setModeButtonState();
    interactionBindings.updateLinkAriaLabels(state, tooltipMode);

    // Update geometry immediately to avoid path-morph jumps between modes.
    state.linkSel.attr('d', function(link) {
      return linkPath(link, state.nodeById, state.layout);
    });
    if (state.linkHitSel) {
      state.linkHitSel.attr('d', function(link) {
        return linkPath(link, state.nodeById, state.layout);
      });
    }
    if (state.linkOverlaySel) {
      state.linkOverlaySel.attr('d', function(link) {
        return linkPath(link, state.nodeById, state.layout);
      });
    }

    state.linkSel
      .transition()
      .duration(duration)
      .attr('stroke', function(link) {
        return modePolicy.modeStyle(resolveLinkMode(link), link, state.layout).color;
      })
      .attr('stroke-width', function(link) {
        return modePolicy.modeStyle(resolveLinkMode(link), link, state.layout).width * EDGE_STROKE_SCALE;
      })
      .attr('opacity', function(link) {
        return modePolicy.modeStyle(resolveLinkMode(link), link, state.layout).opacity;
      })
      .attr('marker-end', function(link) {
        return modePolicy.modeStyle(resolveLinkMode(link), link, state.layout).marker;
      });

    if (state.linkOverlaySel) {
      state.linkOverlaySel
        .transition()
        .duration(duration)
        .attr('stroke', function(link) {
          return overlayStyle(link).color;
        })
        .attr('stroke-width', function(link) {
          return overlayStyle(link).width * EDGE_STROKE_SCALE;
        })
        .attr('opacity', function(link) {
          return overlayStyle(link).opacity;
        })
        .attr('marker-end', function(link) {
          return overlayStyle(link).marker;
        });
    }

    state.pulseSel
      .transition()
      .duration(duration)
      .attr('fill', function(link) {
        return modePolicy.pulseDotColor(resolvePulseMode(link), link);
      })
      .attr('opacity', function(link) {
        return modePolicy.pulseOpacityForMode(resolvePulseMode(link), link, prefersReducedMotion);
      });
  }

  function clearHighlight() {
    state.activeNodeId = null;
    if (!state.nodeSel || !state.linkSel || !state.pulseSel) return;

    state.nodeSel
      .transition()
      .duration(180)
      .style('opacity', 1);

    applyMode(true);
  }

  function highlightLink(link) {
    if (!state.linkSel || !link || !state.layout) return;
    if (getAssumptionRole(link) === 'context') return;
    var hStyle = modePolicy.modeStyle('assumptions', link, state.layout);
    state.linkSel
      .filter(function(l) { return l === link; })
      .interrupt()
      .style('stroke', hStyle.color)
      .style('stroke-width', String(hStyle.width * EDGE_STROKE_SCALE))
      .style('opacity', '1');
  }

  function clearLinkHighlight() {
    if (!state.linkSel) return;
    state.linkSel
      .style('stroke', null)
      .style('stroke-width', null)
      .style('opacity', null);
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
        return composedLinkOpacity(link, isConnected);
      });

    if (state.linkOverlaySel) {
      state.linkOverlaySel
        .transition()
        .duration(120)
        .attr('opacity', function(link) {
          var style = overlayStyle(link);
          if (style.opacity <= 0) return 0;
          var isConnected = link.source === nodeId || link.target === nodeId;
          return isConnected ? style.opacity : Math.max(0.04, style.opacity * 0.25);
        });
    }

    state.pulseSel
      .transition()
      .duration(120)
      .attr('opacity', function(link) {
        if (prefersReducedMotion) return 0;
        var baseOpacity = modePolicy.pulseOpacityForMode(resolvePulseMode(link), link, prefersReducedMotion);
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
          var laneDistance = ((elapsed * modePolicy.pulseSpeedPxPerMs(resolvePulseMode(link), link)) + (link.__cascadePhase || 0)) % link.__cascadeTotal;
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

        var distancePx = modePolicy.pulseDistancePx(elapsed, link, idx, resolvePulseMode(link));

        if (link.__reentryPathNode && link.__reentryPathLength > 0 && link.__reentryAbsorbDistance > 0) {
          var speedPxPerMs = modePolicy.pulseSpeedPxPerMs(resolvePulseMode(link), link);
          var cycleDistance = ((elapsed * speedPxPerMs) + modePolicy.pulsePhaseOffsetPx(idx)) %
            (link.__pathLength + link.__reentryAbsorbDistance + link.__reentryPathLength);
          var baseRadius = state.layout && Number.isFinite(state.layout.pulseRadius)
            ? state.layout.pulseRadius
            : 3.8;

          if (cycleDistance <= link.__pathLength) {
            point = link.__pathNode.getPointAtLength(cycleDistance);
            pulseSel
              .attr('cx', point.x)
              .attr('cy', point.y)
              .attr('r', baseRadius)
              .attr('opacity', opacity);
            return;
          }

          if (cycleDistance <= link.__pathLength + link.__reentryAbsorbDistance) {
            var absorbProgress = (cycleDistance - link.__pathLength) / link.__reentryAbsorbDistance;
            var absorbRadius = baseRadius * (1 + (Math.sin(absorbProgress * Math.PI) * 0.58));
            point = link.__pathNode.getPointAtLength(link.__pathLength);
            pulseSel
              .attr('cx', point.x)
              .attr('cy', point.y)
              .attr('r', absorbRadius)
              .attr('opacity', Math.min(0.98, opacity + 0.18));
            return;
          }

          var reentryDistancePx = cycleDistance - link.__pathLength - link.__reentryAbsorbDistance;
          point = link.__reentryPathNode.getPointAtLength(reentryDistancePx);
          pulseSel
            .attr('cx', point.x)
            .attr('cy', point.y)
            .attr('r', baseRadius)
            .attr('opacity', opacity);
          return;
        }

        point = link.__pathNode.getPointAtLength(distancePx);
        pulseSel
          .attr('cx', point.x)
          .attr('cy', point.y)
          .attr('r', state.layout && Number.isFinite(state.layout.pulseRadius) ? state.layout.pulseRadius : 3.8)
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
      mode: 'all'
    });
    if (!graph) return;

    state.layout = graph.layout;
    state.nodeById = graph.nodeById;
    state.linkSel = graph.linkSel;
    state.linkOverlaySel = graph.linkOverlaySel;
    state.linkHitSel = graph.linkHitSel;
    state.nodeSel = graph.nodeSel;
    state.pulseSel = graph.pulseSel;

    applyMode(true);
    bindPulseAnimation();
  }

  function onResize() {
    if (state.resizeTimer) window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(function() {
      hideTooltip();
      renderGraph();
    }, 120);
  }

  function bindLegendModeButtons() {
    if (!legendEl || typeof legendEl.addEventListener !== 'function') return;
    if (
      legendEl.__mixMapperLegendDelegatedHandler &&
      typeof legendEl.removeEventListener === 'function'
    ) {
      legendEl.removeEventListener('click', legendEl.__mixMapperLegendDelegatedHandler, true);
    }

    var onLegendClick = function(event) {
      var target = event && event.target ? event.target : null;
      var targetEl = target && target.nodeType === 1
        ? target
        : (target && target.parentElement ? target.parentElement : null);
      var button = targetEl && typeof targetEl.closest === 'function'
        ? targetEl.closest('.mix-mapper-legend-btn')
        : null;
      if (!button) return;

      var requestedMode = button.getAttribute('data-mode');
      if (!requestedMode) return;

      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      if (event && typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      else if (event && typeof event.stopPropagation === 'function') event.stopPropagation();

      var nextActive = !state.activeModes[requestedMode];
      state.activeModes[requestedMode] = nextActive;
      state.mode = requestedMode;
      hideTooltip();
      clearHighlight();
      applyMode(false);
    };

    legendEl.__mixMapperLegendDelegatedHandler = onLegendClick;
    legendEl.addEventListener('click', onLegendClick, true);
  }

  bindLegendModeButtons();

  window.addEventListener('resize', onResize);

  if (reducedMotionQuery) {
    var onMotionPrefChanged = function(event) {
      prefersReducedMotion = !!event.matches;
      bindPulseAnimation();
      applyMode(true);
    };

    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', onMotionPrefChanged);
    } else if (typeof reducedMotionQuery.addListener === 'function') {
      reducedMotionQuery.addListener(onMotionPrefChanged);
    }
  }

  renderGraph();

  if (
    typeof document !== 'undefined' &&
    document.fonts &&
    document.fonts.ready &&
    typeof document.fonts.ready.then === 'function'
  ) {
    document.fonts.ready.then(function() {
      if (state.fontsSettled) return;
      state.fontsSettled = true;
      hideTooltip();
      renderGraph();
    }).catch(function() {
      // Ignore font readiness errors; first render already completed.
    });
  }
})();
