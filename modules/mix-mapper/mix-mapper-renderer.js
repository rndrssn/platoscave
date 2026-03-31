'use strict';

(function initMixMapperRenderer(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.MixMapperRenderer = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildMixMapperRenderer() {
  function createRenderer(deps) {
    deps = deps || {};

    var d3Lib = deps.d3 || (typeof d3 !== 'undefined' ? d3 : null);
    var svgEl = deps.svgEl || null;
    var links = Array.isArray(deps.links) ? deps.links : [];
    var comparisonRows = Array.isArray(deps.comparisonRows) ? deps.comparisonRows : [];
    var comparisonLineRows = Array.isArray(deps.comparisonLineRows) ? deps.comparisonLineRows : [];
    var layoutUtils = deps.layoutUtils;
    var nodeUtils = deps.nodeUtils;
    var modePolicy = deps.modePolicy;
    var interactionBindings = deps.interactionBindings;
    var linkPath = deps.linkPath || function() {
      return '';
    };
    var makeMarker = deps.makeMarker || function() {};
    var getColors = typeof deps.getColors === 'function' ? deps.getColors : function() {
      return {};
    };
    var getTypography = typeof deps.getTypography === 'function' ? deps.getTypography : function() {
      return {};
    };
    var getCurrentRenderStamp = typeof deps.getCurrentRenderStamp === 'function'
      ? deps.getCurrentRenderStamp
      : function() {
        return 0;
      };

    function renderGraph(params) {
      params = params || {};
      if (!d3Lib || !svgEl || !layoutUtils || !nodeUtils || !modePolicy || !interactionBindings) return null;

      var shellEl = params.shellEl;
      var mode = params.mode || 'all';
      var renderStamp = params.renderStamp || 0;
      if (!shellEl) return null;

      var svg = d3Lib.select(svgEl);
      svg.selectAll('*').remove();

      var COLORS = getColors();
      var layout = layoutUtils.getLayout(shellEl);
      svg
        .attr('viewBox', '0 0 ' + layout.width + ' ' + layout.height)
        .attr('preserveAspectRatio', 'xMidYMid meet');
      var typography = getTypography(layout) || {};
      if (nodeUtils && typeof nodeUtils.resolveNodeGeometry === 'function') {
        var geometry = nodeUtils.resolveNodeGeometry(layout, typography) || null;
        if (geometry) {
          if (Number.isFinite(geometry.nodeWidth) && geometry.nodeWidth > 0) {
            layout.nodeWidth = geometry.nodeWidth;
          }
          if (Number.isFinite(geometry.nodeHeight) && geometry.nodeHeight > 0) {
            layout.nodeHeight = geometry.nodeHeight;
          }
          if (Number.isFinite(geometry.laneGap) && geometry.laneGap > 0 && geometry.laneGap !== layout.laneGap) {
            var maxLaneGap = Math.max(layout.laneGap, Math.min(geometry.laneGap, layout.width - (layout.compact ? 72 : 110)));
            layout.laneGap = maxLaneGap;
            var laneCenter = layout.width / 2;
            layout.laneX = {
              complexity: laneCenter - (layout.laneGap / 2),
              traditional: laneCenter + (layout.laneGap / 2)
            };
          }
          if (Number.isFinite(geometry.nodeFontU) && geometry.nodeFontU > 0) {
            typography.nodeFontU = geometry.nodeFontU;
          }
        }
      }
      var nodes = nodeUtils.buildNodes(layout);
      var nodeById = Object.create(null);

      nodes.forEach(function(node) {
        nodeById[node.id] = node;
      });

      var defs = svg.append('defs');
      makeMarker(defs, 'mix-map-arrow-traditional', COLORS.traditionalArrow);
      makeMarker(defs, 'mix-map-arrow-complexity', COLORS.complexityArrow);
      makeMarker(defs, 'mix-map-arrow-process', COLORS.processArrow);
      makeMarker(defs, 'mix-map-arrow-process-dot', COLORS.processArrow);
      makeMarker(defs, 'mix-map-arrow-process-active', COLORS.rust);
      makeMarker(defs, 'mix-map-arrow-learning', COLORS.learningArrow);
      makeMarker(defs, 'mix-map-arrow-assumption', COLORS.assumptionArrow);
      makeMarker(defs, 'mix-map-arrow-assumption-triangle', COLORS.assumptionArrow);
      makeMarker(defs, 'mix-map-arrow-ink-faint', COLORS.inkFaint);

      var bgLayer = svg.append('g').attr('class', 'mix-map-layer mix-map-layer--background');
      var edgeLayer = svg.append('g').attr('class', 'mix-map-layer mix-map-layer--edges');
      var nodeLayer = svg.append('g').attr('class', 'mix-map-layer mix-map-layer--nodes');
      var overlayLayer = svg.append('g').attr('class', 'mix-map-layer mix-map-layer--overlay');

      var complexityTitleSel = bgLayer.append('text')
        .attr('x', layout.laneX.complexity)
        .attr('y', 56)
        .attr('text-anchor', 'middle')
        .attr('class', 'mix-map-lane-title')
        .attr('fill', COLORS.text);

      var complexitySubtitleSel = bgLayer.append('text')
        .attr('x', layout.laneX.complexity)
        .attr('y', 78)
        .attr('text-anchor', 'middle')
        .attr('class', 'mix-map-lane-subtitle')
        .attr('fill', COLORS.muted);

      layoutUtils.layoutLaneHeaderText(
        complexityTitleSel,
        complexitySubtitleSel,
        layout,
        'Complexity-Informed',
        'learning-oriented, uncertainty-aware, adaptive',
        typography
      );

      var traditionalTitleSel = bgLayer.append('text')
        .attr('x', layout.laneX.traditional)
        .attr('y', 56)
        .attr('text-anchor', 'middle')
        .attr('class', 'mix-map-lane-title')
        .attr('fill', COLORS.text);

      var traditionalSubtitleSel = bgLayer.append('text')
        .attr('x', layout.laneX.traditional)
        .attr('y', 78)
        .attr('text-anchor', 'middle')
        .attr('class', 'mix-map-lane-subtitle')
        .attr('fill', COLORS.muted);

      layoutUtils.layoutLaneHeaderText(
        traditionalTitleSel,
        traditionalSubtitleSel,
        layout,
        'Traditional',
        'phase-gated, requirements-first, linear',
        typography
      );

      var linkSel = edgeLayer.selectAll('.mix-map-edge')
        .data(links, function(link) {
          return link.source + '>' + link.target + ':' + link.kind;
        })
        .join('path')
        .attr('class', function(link) {
          return 'mix-map-edge mix-map-edge--' + link.lane + ' mix-map-edge--' + link.kind;
        })
        .attr('d', function(link) {
          return linkPath(link, nodeById, layout, mode);
        })
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('pointer-events', 'none')
        .attr('aria-hidden', 'true');

      var linkOverlaySel = edgeLayer.selectAll('.mix-map-edge-overlay')
        .data(links, function(link) {
          return link.source + '>' + link.target + ':' + link.kind;
        })
        .join('path')
        .attr('class', function(link) {
          return 'mix-map-edge-overlay mix-map-edge-overlay--' + link.lane + ' mix-map-edge-overlay--' + link.kind;
        })
        .attr('d', function(link) {
          return linkPath(link, nodeById, layout, mode);
        })
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('pointer-events', 'none')
        .attr('aria-hidden', 'true')
        .attr('opacity', 0);

      var linkHitSel = edgeLayer.selectAll('.mix-map-edge-hit')
        .data(links, function(link) {
          return link.source + '>' + link.target + ':' + link.kind;
        })
        .join('path')
        .attr('class', 'mix-map-edge-hit')
        .attr('d', function(link) {
          return linkPath(link, nodeById, layout, mode);
        })
        .attr('fill', 'none')
        .attr('stroke', 'transparent')
        .attr('stroke-opacity', 0)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-width', Math.max(14, layout.edgePrimary * 6))
        .attr('pointer-events', 'stroke');

      interactionBindings.bindLinkInteractions(linkHitSel, nodeById);

      var pulseSel = edgeLayer.selectAll('.mix-map-pulse')
        .data(links, function(link) {
          return link.source + '>' + link.target + ':' + link.kind;
        })
        .join('circle')
        .attr('class', 'mix-map-pulse')
        .attr('r', layout.pulseRadius)
        .attr('fill', function(link) {
          return modePolicy.pulseDotColor(mode, link);
        })
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
      modePolicy.assignForwardCascadeMeta(links, nodeById);

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
        });

      interactionBindings.bindNodeInteractions(nodeSel);

      nodeSel.append('path')
        .attr('d', function(node) {
          return nodeUtils.nodeShapePath(node, layout);
        })
        .attr('fill', COLORS.nodeFill)
        .attr('stroke', COLORS.nodeStroke)
        .attr('stroke-width', Number.isFinite(layout.nodeStrokeWidth) ? layout.nodeStrokeWidth : 1.35);

      var nodeLabelSel = nodeSel.append('text')
        .attr('class', 'mix-map-node-label gc-viz__legend-text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('pointer-events', 'none')
        .attr('font-size', function() {
          return (typography && Number.isFinite(typography.nodeFontU) && typography.nodeFontU > 0)
            ? typography.nodeFontU
            : null;
        })
        .attr('data-base-font-u', function() {
          return (typography && Number.isFinite(typography.nodeFontU) && typography.nodeFontU > 0)
            ? String(typography.nodeFontU)
            : '';
        })
        .text(function(node) {
          return layoutUtils.fitHeaderLabel(node.shortLabel);
        })
        .attr('data-label-full', function(node) {
          return layoutUtils.fitHeaderLabel(node.shortLabel);
        });

      layoutUtils.scheduleNodeLabelFit(nodeLabelSel, layout, renderStamp, getCurrentRenderStamp);

      var compareLineStart = layout.laneX.complexity + (layout.nodeWidth / 2) + 18;
      var compareLineEnd = layout.laneX.traditional - (layout.nodeWidth / 2) - 18;

      overlayLayer.selectAll('.mix-map-compare-line')
        .data([])
        .join('line');

      var compareHighlightLayer = overlayLayer.selectAll('.mix-map-layer--compare-highlight')
        .data([null])
        .join('g')
        .attr('class', 'mix-map-layer mix-map-layer--compare-highlight')
        .attr('pointer-events', 'none');

      var compareLabelSel = overlayLayer.selectAll('.mix-map-compare-label')
        .data(comparisonRows)
        .join('text')
        .attr('class', 'mix-map-compare-label');

      layoutUtils.layoutComparisonLabels(compareLabelSel, layout, nodeById, compareLineStart, compareLineEnd, typography);
      layoutUtils.renderComparisonHighlights(compareHighlightLayer, compareLabelSel);

      return {
        layout: layout,
        nodeById: nodeById,
        linkSel: linkSel,
        linkOverlaySel: linkOverlaySel,
        linkHitSel: linkHitSel,
        nodeSel: nodeSel,
        pulseSel: pulseSel
      };
    }

    return {
      renderGraph: renderGraph
    };
  }

  return {
    createRenderer: createRenderer
  };
}));
