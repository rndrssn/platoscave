'use strict';

(function initMixMapperGeometry(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.MixMapperGeometry = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildMixMapperGeometry() {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
    var sourceOrder = Math.max(0, (source.step || 1) - 1);

    if (link.kind === 'learning') {
      var learningBase = laneEdge - (layout.learningArc * 0.9);
      var learningStep = layout.compact ? 12 : 15;
      var learningOrderStep = layout.compact ? 2.8 : 3.6;
      return learningBase - ((span - 1) * learningStep) - (sourceOrder * learningOrderStep);
    }

    var feedbackBase = laneEdge - (layout.feedbackArc * 0.92);
    var feedbackStep = layout.compact ? 9 : 11;
    var feedbackOrderStep = layout.compact ? 2.2 : 2.8;
    return feedbackBase - ((span - 1) * feedbackStep) - (sourceOrder * feedbackOrderStep);
  }

  function traditionalTrackX(link, source, halfNodeW, layout, nodeById) {
    var span = complexityLinkSpan(link, nodeById);
    var laneEdge = source.x + halfNodeW;
    var sourceOrder = Math.max(0, (source.step || 1) - 1);

    if (link.kind === 'learning') {
      var learningBase = laneEdge + (layout.learningArc * 0.9);
      var learningStep = layout.compact ? 12 : 15;
      var extraOutside = link.source === 't6' && link.target === 't3'
        ? (layout.compact ? 14 : 18)
        : 0;
      var learningOrderStep = layout.compact ? 1.8 : 2.4;
      return learningBase + ((span - 1) * learningStep) + extraOutside + (sourceOrder * learningOrderStep);
    }

    var feedbackBase = laneEdge + (layout.feedbackArc * 0.92);
    var feedbackStep = layout.compact ? 9 : 11;
    var feedbackOrderStep = layout.compact ? 2.2 : 2.8;
    return feedbackBase + ((span - 1) * feedbackStep) + (sourceOrder * feedbackOrderStep);
  }

  function laneArcSideSign(lane) {
    return lane === 'complexity' ? -1 : 1;
  }

  function arcPortX(node, halfNodeW) {
    return node.x + (laneArcSideSign(node.lane) * (halfNodeW - 8));
  }

  function arcPortY(node) {
    return node.y;
  }

  function laneArcTrackX(link, source, halfNodeW, layout, nodeById) {
    if (source.lane === 'complexity') {
      return complexityTrackX(link, source, halfNodeW, layout, nodeById);
    }
    return traditionalTrackX(link, source, halfNodeW, layout, nodeById);
  }

  function circularLateralReach(link, source, target, layout, nodeById) {
    var verticalSpan = Math.max(1, Math.abs((source && source.y) - (target && target.y)));
    var span = complexityLinkSpan(link, nodeById);
    var ratio = layout && layout.compact ? 0.56 : 0.64;
    var kindBoost = link && link.kind === 'learning' ? 1.08 : 1;
    var spanBoost = (span - 1) * (layout && layout.compact ? 6 : 8);
    return Math.max(32, (verticalSpan * ratio * kindBoost) + spanBoost);
  }

  function resolveArcCanvasBounds(layout, nodeById, halfNodeW) {
    if (layout && layout.allowArcOverflowX) {
      return { minX: -Infinity, maxX: Infinity };
    }

    var inset = Number.isFinite(layout.arcCanvasInset) && layout.arcCanvasInset >= 0
      ? layout.arcCanvasInset
      : 12;

    if (Number.isFinite(layout.width) && layout.width > 0) {
      return {
        minX: inset,
        maxX: Math.max(inset, layout.width - inset)
      };
    }

    var minNodeX = Infinity;
    var maxNodeX = -Infinity;
    Object.keys(nodeById || {}).forEach(function(nodeId) {
      var node = nodeById[nodeId];
      if (!node || !Number.isFinite(node.x)) return;
      minNodeX = Math.min(minNodeX, node.x);
      maxNodeX = Math.max(maxNodeX, node.x);
    });

    if (!Number.isFinite(minNodeX) || !Number.isFinite(maxNodeX)) {
      return { minX: -Infinity, maxX: Infinity };
    }

    var arcReach = Math.max(
      24,
      Number.isFinite(layout.learningArc) ? layout.learningArc : 190,
      Number.isFinite(layout.feedbackArc) ? layout.feedbackArc : 118
    ) * 1.2;

    return {
      minX: minNodeX - halfNodeW - arcReach,
      maxX: maxNodeX + halfNodeW + arcReach
    };
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

      if (link.kind === 'minor' || link.kind === 'feedback' || link.kind === 'learning') {
        var sourceX = arcPortX(source, halfNodeW);
        var targetX = arcPortX(target, halfNodeW);
        var sourceY = arcPortY(source);
        var targetY = arcPortY(target);
        var rawCurveX = laneArcTrackX(link, source, halfNodeW, layout, nodeById);
        var lateralReach = circularLateralReach(link, source, target, layout, nodeById);
        var curveMinByShape = sourceX - lateralReach;
        var curveMaxByShape = sourceX + lateralReach;
        var shapedCurveX = clamp(rawCurveX, curveMinByShape, curveMaxByShape);
        var bounds = resolveArcCanvasBounds(layout, nodeById, halfNodeW);
        var curveX = clamp(shapedCurveX, bounds.minX, bounds.maxX);

        if (source.lane === 'complexity' && curveX >= sourceX) {
          curveX = Math.max(bounds.minX, sourceX - 1);
        } else if (source.lane === 'traditional' && curveX <= sourceX) {
          curveX = Math.min(bounds.maxX, sourceX + 1);
        }

        return [
          'M', sourceX, sourceY,
          'C', curveX, sourceY,
          curveX, targetY,
          targetX, targetY
        ].join(' ');
      }
    }

    return ['M', source.x, source.y, 'L', target.x, target.y].join(' ');
  }

  function makeMarker(defsSel, id, color) {
    var marker = defsSel.append('marker')
      .attr('id', id)
      .attr('viewBox', '0 -5 10 10')
      .attr('refY', 0)
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto');

    if (id === 'mix-map-arrow-assumption') {
      marker
        .attr('viewBox', '0 -7 14 14')
        .attr('markerWidth', 10.8)
        .attr('markerHeight', 10.8)
        .attr('refX', 10.8);

      marker
        .append('line')
        .attr('x1', 0.9)
        .attr('y1', 0)
        .attr('x2', 4.4)
        .attr('y2', 0)
        .attr('stroke', color)
        .attr('stroke-width', 1.22)
        .attr('stroke-linecap', 'round');

      marker
        .append('circle')
        .attr('cx', 8.4)
        .attr('cy', 0)
        .attr('r', 3.9)
        .attr('fill', color);
      return;
    }

    if (id === 'mix-map-arrow-process-dot') {
      marker
        .attr('viewBox', '0 -6 12 12')
        .attr('markerWidth', 9.2)
        .attr('markerHeight', 9.2)
        .attr('refX', 9.4);

      marker
        .append('line')
        .attr('x1', 0.9)
        .attr('y1', 0)
        .attr('x2', 4.0)
        .attr('y2', 0)
        .attr('stroke', color)
        .attr('stroke-width', 1.22)
        .attr('stroke-linecap', 'round');

      marker
        .append('circle')
        .attr('cx', 7.4)
        .attr('cy', 0)
        .attr('r', 2.9)
        .attr('fill', color);
      return;
    }

    marker
      .attr('refX', 6.7)
      .append('path')
      .attr('d', 'M0,-3.25L7.5,0L0,3.25Z')
      .attr('fill', color);
  }

  return {
    complexityLinkSpan: complexityLinkSpan,
    complexityTrackX: complexityTrackX,
    traditionalTrackX: traditionalTrackX,
    laneArcSideSign: laneArcSideSign,
    arcPortX: arcPortX,
    arcPortY: arcPortY,
    laneArcTrackX: laneArcTrackX,
    linkPath: linkPath,
    makeMarker: makeMarker
  };
}));
