'use strict';

(function initMixMapperModePolicy(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.MixMapperModePolicy = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildMixMapperModePolicy() {
  function createModePolicy(deps) {
    deps = deps || {};
    var getColors = typeof deps.getColors === 'function' ? deps.getColors : function() {
      return {};
    };
    var getProcessRole = deps.getProcessRole || function() {
      return 'adaptive-context';
    };
    var getAssumptionRole = deps.getAssumptionRole || function() {
      return 'context';
    };
    var getLearningRole = deps.getLearningRole || function() {
      return 'delivery-context';
    };
    var linkKey = deps.linkKey || function(link) {
      return String(link && link.source || '') + '>' + String(link && link.target || '') + ':' + String(link && link.kind || '');
    };

    function pulseOpacityForMode(mode, link, prefersReducedMotion) {
      if (prefersReducedMotion) return 0;

      var learningRole = getLearningRole(link);
      var processRole = getProcessRole(link);
      var assumptionRole = getAssumptionRole(link);
      var basePulse = 0;
      if (learningRole === 'learning-loop') basePulse = 0.34;
      if (learningRole === 'learning-support') basePulse = 0.2;
      if (learningRole === 'legacy-upstream') {
        basePulse = (mode === 'assumptions' || mode === 'learning') ? 0.54 : 0.14;
      }

      if (mode === 'all') {
        return basePulse;
      }

      if (mode === 'process') {
        if (
          processRole === 'traditional-flow' ||
          processRole === 'complexity-flow' ||
          processRole === 'handoff-rework' ||
          processRole === 'local-adjust'
        ) {
          return basePulse;
        }
        return Math.min(0.12, Math.max(0, basePulse * 0.36));
      }

      if (mode === 'assumptions') {
        if (assumptionRole !== 'context') return basePulse;
        return Math.min(0.12, Math.max(0, basePulse * 0.34));
      }

      if (mode === 'learning') {
        if (learningRole === 'learning-loop') return 0.96;
        if (learningRole === 'legacy-upstream') return 0.6;
        return Math.min(0.12, Math.max(0, basePulse * 0.35));
      }

      return 0;
    }

    function pulseJitterFactor(link, mode) {
      if (mode !== 'learning') return 1;
      var key = linkKey(link);
      var hash = 0;
      for (var i = 0; i < key.length; i += 1) {
        hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
      }
      var normalized = ((hash >>> 0) % 1000) / 1000;
      return 0.88 + (normalized * 0.24);
    }

    function pulseSpeedPxPerMs(mode, link) {
      var learningRole = getLearningRole(link);
      var processRole = getProcessRole(link);
      var jitter = pulseJitterFactor(link, 'learning');

      if (learningRole === 'learning-loop') return 0.05 * jitter;
      if (learningRole === 'legacy-upstream') return 0.02 * jitter;
      if (learningRole === 'learning-support') return 0.012 * jitter;

      if (processRole === 'handoff-rework' || processRole === 'local-adjust') return 0.018 * jitter;
      if (processRole === 'traditional-flow' || processRole === 'complexity-flow') return 0.012 * jitter;
      return 0.016 * jitter;
    }

    function pulsePhaseOffsetPx(idx) {
      return 24 + ((idx * 37) % 211);
    }

    function pulseDistancePx(elapsedMs, link, idx, mode) {
      if (!link.__pathLength || link.__pathLength <= 0) return 0;
      var distance = (elapsedMs * pulseSpeedPxPerMs(mode, link)) + pulsePhaseOffsetPx(idx);
      return distance % link.__pathLength;
    }

    function pulseDotColor(mode, link) {
      var COLORS = getColors();
      if (mode === 'all' || mode === 'process' || mode === 'assumptions') return COLORS.inkFaint;
      if (mode === 'learning') {
        var learningRole = getLearningRole(link);
        return (learningRole === 'learning-loop' || learningRole === 'legacy-upstream')
          ? COLORS.learningDot
          : COLORS.inkFaint;
      }
      return COLORS.inkFaint;
    }

    function isForwardFlowLink(link) {
      var processRole = getProcessRole(link);
      return processRole === 'traditional-flow' || processRole === 'complexity-flow';
    }

    function assignForwardCascadeMeta(links, nodeById) {
      var forwardByLane = {
        traditional: [],
        complexity: []
      };

      links.forEach(function(link) {
        link.__cascadeOffset = null;
        link.__cascadeTotal = null;
        link.__cascadePhase = 0;
        if (!isForwardFlowLink(link)) return;
        if (!link.__pathLength || link.__pathLength <= 0) return;
        if (!forwardByLane[link.lane]) return;
        forwardByLane[link.lane].push(link);
      });

      Object.keys(forwardByLane).forEach(function(lane) {
        var laneLinks = forwardByLane[lane];
        if (!laneLinks.length) return;

        laneLinks.sort(function(a, b) {
          var aStep = nodeById[a.source] ? nodeById[a.source].step : 0;
          var bStep = nodeById[b.source] ? nodeById[b.source].step : 0;
          return aStep - bStep;
        });

        var laneTotal = 0;
        laneLinks.forEach(function(link) {
          link.__cascadeOffset = laneTotal;
          laneTotal += link.__pathLength;
        });

        var phaseSeed = lane === 'traditional' ? laneTotal * 0.33 : 0;
        laneLinks.forEach(function(link) {
          link.__cascadeTotal = Math.max(1, laneTotal);
          link.__cascadePhase = phaseSeed;
        });
      });
    }

    function modeStyle(mode, link, layout) {
      var COLORS = getColors();

      if (mode === 'all') {
        var neutralColor = COLORS.processArrow;
        if (link.kind === 'learning') {
          return {
            color: neutralColor,
            width: Math.max(0.7, layout.edgeLearning - 0.06),
            opacity: 0.44,
            marker: 'url(#mix-map-arrow-process)'
          };
        }
        if (link.kind === 'feedback') {
          return {
            color: neutralColor,
            width: Math.max(0.68, layout.edgeSecondary - 0.04),
            opacity: 0.34,
            marker: 'url(#mix-map-arrow-process)'
          };
        }
        return {
          color: neutralColor,
          width: Math.max(0.68, layout.edgePrimary - 0.16),
          opacity: 0.38,
          marker: link.lane === 'complexity'
            ? 'url(#mix-map-arrow-process)'
            : 'url(#mix-map-arrow-process-dot)'
        };
      }

      if (mode === 'process') {
        var processRole = getProcessRole(link);
        var processColor = COLORS.rust;
        var processFaintColor = COLORS.inkFaint;
        if (processRole === 'traditional-flow') {
          return {
            color: processColor,
            width: layout.edgePrimary + 0.25,
            opacity: 0.94,
            marker: 'url(#mix-map-arrow-process-active)'
          };
        }
        if (processRole === 'complexity-flow') {
          return {
            color: processColor,
            width: layout.edgePrimary + 0.25,
            opacity: 0.94,
            marker: 'url(#mix-map-arrow-process-active)'
          };
        }
        if (processRole === 'handoff-rework' || processRole === 'local-adjust') {
          return {
            color: processColor,
            width: Math.max(0.62, layout.edgeSecondary - 0.26),
            opacity: 0.78,
            marker: 'url(#mix-map-arrow-process-active)'
          };
        }
        return {
          color: processFaintColor,
          width: Math.max(0.58, layout.edgeSecondary - 0.54),
          opacity: 0.24,
          marker: link.lane === 'complexity'
            ? 'url(#mix-map-arrow-ink-faint)'
            : 'url(#mix-map-arrow-assumption)'
        };
      }

      if (mode === 'assumptions') {
        var assumptionRole = getAssumptionRole(link);
        var assumptionColor = COLORS.assumptionArrow;
        var assumptionMarker = link.lane === 'complexity'
          ? 'url(#mix-map-arrow-assumption-triangle)'
          : 'url(#mix-map-arrow-assumption)';
        if (assumptionRole === 'certainty') {
          return {
            color: assumptionColor,
            width: layout.edgePrimary + 0.12,
            opacity: 0.95,
            marker: assumptionMarker
          };
        }
        if (assumptionRole === 'learning-test') {
          return {
            color: assumptionColor,
            width: layout.edgeLearning + 0.28,
            opacity: 0.97,
            marker: assumptionMarker
          };
        }
        if (assumptionRole === 'certainty-revisit') {
          return {
            color: COLORS.learningArrow,
            width: Math.max(0.82, layout.edgeLearning - 0.06),
            opacity: 0.74,
            marker: assumptionMarker
          };
        }
        if (link.lane === 'traditional' && link.kind === 'minor') {
          return {
            color: assumptionColor,
            width: Math.max(0.64, layout.edgeSecondary - 0.14),
            opacity: 0.46,
            marker: assumptionMarker
          };
        }
        return {
          color: COLORS.inkFaint,
          width: Math.max(0.58, layout.edgeSecondary - 0.34),
          opacity: 0.24,
          marker: link.lane === 'complexity'
            ? 'url(#mix-map-arrow-ink-faint)'
            : 'url(#mix-map-arrow-process-dot)'
        };
      }

      if (mode === 'learning') {
        var learningRole = getLearningRole(link);
        var learningColor = COLORS.learningArrow;
        var complexityLearningMarker = 'url(#mix-map-arrow-learning)';
        if (learningRole === 'learning-loop') {
          return {
            color: learningColor,
            width: layout.edgeLearning + 0.62,
            opacity: 0.98,
            marker: complexityLearningMarker
          };
        }
        if (learningRole === 'learning-support') {
          return {
            color: COLORS.inkFaint,
            width: Math.max(0.75, layout.edgeSecondary - 0.16),
            opacity: 0.24,
            marker: link.lane === 'complexity'
              ? 'url(#mix-map-arrow-ink-faint)'
              : 'url(#mix-map-arrow-process-dot)'
          };
        }
        if (learningRole === 'legacy-upstream') {
          return {
            color: learningColor,
            width: Math.max(0.82, layout.edgeLearning - 0.06),
            opacity: 0.74,
            marker: 'url(#mix-map-arrow-assumption)'
          };
        }
        return {
          color: COLORS.inkFaint,
          width: Math.max(0.6, layout.edgeSecondary - 0.5),
          opacity: 0.22,
          marker: link.lane === 'complexity'
            ? 'url(#mix-map-arrow-ink-faint)'
            : 'url(#mix-map-arrow-learning)'
        };
      }

      return modeStyle('process', link, layout);
    }

    function highlightLinkOpacity(mode, link, isConnected, layout) {
      var base = modeStyle(mode, link, layout).opacity;

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

    return {
      pulseOpacityForMode: pulseOpacityForMode,
      pulseJitterFactor: pulseJitterFactor,
      pulseSpeedPxPerMs: pulseSpeedPxPerMs,
      pulsePhaseOffsetPx: pulsePhaseOffsetPx,
      pulseDistancePx: pulseDistancePx,
      pulseDotColor: pulseDotColor,
      isForwardFlowLink: isForwardFlowLink,
      assignForwardCascadeMeta: assignForwardCascadeMeta,
      modeStyle: modeStyle,
      highlightLinkOpacity: highlightLinkOpacity
    };
  }

  return {
    createModePolicy: createModePolicy
  };
}));
