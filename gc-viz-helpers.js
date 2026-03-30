'use strict';

(function(factory) {
  var helpers = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = helpers;
  }
  if (typeof window !== 'undefined') {
    window.GcVizHelpers = helpers;
  }
})(function createGcVizHelpers() {
  function readCssVar(name, fallback) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
    var root = document.documentElement;
    var raw = window.getComputedStyle(root).getPropertyValue(name);
    return raw && raw.trim() ? raw.trim() : fallback;
  }

  function readCssNumber(name, fallback) {
    var parsed = parseFloat(readCssVar(name, String(fallback)));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatChoiceOpportunityLabel(idxZeroBased) {
    return 'CO' + (idxZeroBased + 1);
  }

  function formatChoiceOpportunityList(ids, limit) {
    var max = typeof limit === 'number' ? limit : 3;
    var labels = ids.slice(0, max).map(formatChoiceOpportunityLabel);
    var text = labels.join(', ');
    if (ids.length > max) text += ' · +' + (ids.length - max) + ' more';
    return text;
  }

  function setMultilineLegendText(textSel, lines, lineGapEm) {
    textSel.selectAll('tspan').remove();
    lines.forEach(function(line, idx) {
      textSel.append('tspan')
        .attr('x', textSel.attr('x'))
        .attr('dy', idx === 0 ? 0 : String(lineGapEm) + 'em')
        .text(line);
    });
  }

  function getSimulationDefaultsFromWindow() {
    if (typeof window !== 'undefined' && typeof window.getGarbageCanDefaults === 'function') {
      return window.getGarbageCanDefaults();
    }
    return null;
  }

  function resolveVizDimensions(simResult, options, gcVizDefaults) {
    var defaults = (gcVizDefaults && gcVizDefaults.defaults) || {};
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

  function resolveTextScale(scalePresetOrNumber, gcVizDefaults) {
    if (typeof scalePresetOrNumber === 'number') return scalePresetOrNumber;
    var scales = (gcVizDefaults && gcVizDefaults.textScale) || {};
    return scales[scalePresetOrNumber] || scales.default || 1;
  }

  function getVizSizing() {
    var viewportW = 0;
    if (typeof window !== 'undefined') {
      viewportW = window.innerWidth || 0;
      if (!viewportW && typeof document !== 'undefined' && document.documentElement) {
        viewportW = document.documentElement.clientWidth || 0;
      }
    }
    var isMobile = viewportW > 0 && viewportW <= 640;
    var baseProblemRadius = readCssNumber('--viz-problem-radius', 4.0);
    return {
      isMobile: isMobile,
      problemRadius: isMobile ? baseProblemRadius * 1.15 : baseProblemRadius,
      legendMarkerRadius: isMobile ? 6.4 : 5.8,
      resolveExitRadius: isMobile ? 2.0 : 1.7,
    };
  }

  function resolveVizLayout(mode, sizing, layoutMap) {
    var base = layoutMap[mode] || {};
    return Object.assign({}, base);
  }

  function resolveChoiceFieldBox(layout, sizing, desktopFieldHeightScale) {
    var fieldW = layout.svgW - layout.padH * 2;
    var fieldH = sizing.isMobile ? fieldW : Math.round(fieldW * desktopFieldHeightScale);
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

    var points = [];
    for (var i = 0; i < choiceCount; i++) {
      var idx = i + 1;
      var t = (idx - 0.5) / choiceCount;
      var r = 0.5 * Math.sqrt(t);
      var theta = idx * goldenAngle;
      points.push({
        x: 0.5 + r * Math.cos(theta),
        y: 0.5 + r * Math.sin(theta),
      });
    }

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

  return {
    readCssVar: readCssVar,
    readCssNumber: readCssNumber,
    formatChoiceOpportunityLabel: formatChoiceOpportunityLabel,
    formatChoiceOpportunityList: formatChoiceOpportunityList,
    setMultilineLegendText: setMultilineLegendText,
    getSimulationDefaultsFromWindow: getSimulationDefaultsFromWindow,
    resolveVizDimensions: resolveVizDimensions,
    resolveTextScale: resolveTextScale,
    getVizSizing: getVizSizing,
    resolveVizLayout: resolveVizLayout,
    resolveChoiceFieldBox: resolveChoiceFieldBox,
    buildChoiceCenters: buildChoiceCenters,
  };
});
