'use strict';

(function initMixMapperNodeUtils(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.MixMapperNodeUtils = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildMixMapperNodeUtils() {
  function createNodeUtils(deps) {
    deps = deps || {};
    var baseNodes = Array.isArray(deps.baseNodes) ? deps.baseNodes : [];
    var links = Array.isArray(deps.links) ? deps.links : [];
    var clamp = deps.clamp || function(value, min, max) {
      return Math.max(min, Math.min(max, value));
    };

    function longestShortLabelLength() {
      var longest = 0;
      baseNodes.forEach(function(node) {
        var len = String(node && node.shortLabel || '').length;
        if (len > longest) longest = len;
      });
      return Math.max(1, longest);
    }

    function resolveNodeGeometry(layout, typography) {
      var nodeFontU = typography && Number.isFinite(typography.nodeFontU) && typography.nodeFontU > 0
        ? typography.nodeFontU
        : (layout.compact ? 10.8 : 11.4);

      var baseNodeWidth = layout.nodeWidth;
      var fitContentNodeWidth = !!layout.fitContentNodeWidth;
      var nodeWidth = baseNodeWidth;

      if (fitContentNodeWidth) {
        var charWidthU = nodeFontU * 0.62;
        var labelWidthU = longestShortLabelLength() * charWidthU;
        var horizontalPadU = layout.compact ? 16 : 18;
        var requiredNodeWidth = Math.ceil(labelWidthU + horizontalPadU);
        var maxNodeWidthByLane = Math.max(baseNodeWidth, Math.floor(layout.laneGap - (layout.compact ? 14 : 24)));
        nodeWidth = clamp(requiredNodeWidth, baseNodeWidth, maxNodeWidthByLane);
      }

      var laneGap = Math.max(layout.laneGap, nodeWidth + (layout.compact ? 22 : 38));

      return {
        nodeWidth: nodeWidth,
        nodeHeight: layout.nodeHeight,
        laneGap: laneGap,
        nodeFontU: nodeFontU
      };
    }

    function buildNodes(layout) {
      return baseNodes.map(function(baseNode) {
        return {
          id: baseNode.id,
          lane: baseNode.lane,
          step: baseNode.step,
          title: baseNode.title,
          shortLabel: baseNode.shortLabel,
          description: baseNode.description,
          tags: baseNode.tags.slice(),
          width: layout.nodeWidth,
          height: layout.nodeHeight,
          x: layout.laneX[baseNode.lane],
          y: layout.topY + ((baseNode.step - 1) * layout.stepGap)
        };
      });
    }

    function nodeShapePath(node, layout) {
      var w = node && Number.isFinite(node.width) && node.width > 0 ? node.width : layout.nodeWidth;
      var h = node && Number.isFinite(node.height) && node.height > 0 ? node.height : layout.nodeHeight;
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

      var maxRadius = Math.max(4, Math.min(20, halfW - 2, halfH - 2));
      var r = clamp(Math.round(h * 0.2), 4, maxRadius);
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

    function connectedNodeIds(id) {
      var connected = new Set([id]);
      links.forEach(function(link) {
        if (link.source === id || link.target === id) {
          connected.add(link.source);
          connected.add(link.target);
        }
      });
      return connected;
    }

    return {
      resolveNodeGeometry: resolveNodeGeometry,
      buildNodes: buildNodes,
      nodeShapePath: nodeShapePath,
      connectedNodeIds: connectedNodeIds
    };
  }

  return {
    createNodeUtils: createNodeUtils
  };
}));
