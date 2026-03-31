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
      buildNodes: buildNodes,
      nodeShapePath: nodeShapePath,
      connectedNodeIds: connectedNodeIds
    };
  }

  return {
    createNodeUtils: createNodeUtils
  };
}));
