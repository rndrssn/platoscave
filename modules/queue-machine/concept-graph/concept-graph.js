'use strict';

(function initConceptGraph() {
  if (!window.d3 || !document || typeof document.querySelector !== 'function') return;
  var svgEl = document.querySelector('[data-concept-graph]');
  var surface = document.querySelector('.queue-machine-concept-surface');
  var fallback = document.querySelector('[data-concept-graph-fallback]');
  if (!svgEl) return;
  if (!surface) surface = svgEl.parentElement || svgEl;
  if (!window.d3) {
    if (fallback) fallback.hidden = false;
    return;
  }
  var d3 = window.d3;

  var nodes = [
    { id: 'little', label: "Little's Law", short: "Little's Law", group: 'concept', note: 'Average WIP, throughput, and lead time must balance in a stable flow system.' },
    { id: 'throughput', label: 'Throughput', short: 'Throughput', group: 'concept' },
    { id: 'wip', label: 'WIP (L)', short: 'WIP (L)', group: 'concept' },
    { id: 'leadTime', label: 'Lead time (W)', short: 'Lead time (W)', group: 'concept' },
    { id: 'kingman', label: "Kingman's approximation", short: "Kingman", group: 'concept', note: 'Waiting grows from utilization pressure multiplied by arrival and service-time variability.' },
    { id: 'rho', label: 'Utilization (ρ)', short: 'Utilization (ρ)', group: 'concept' },
    { id: 'ca', label: 'Arrival variability (Cₐ)', short: 'Arrival var. (Cₐ)', group: 'concept' },
    { id: 'cs', label: 'Service-time variability (Cₛ)', short: 'Service var. (Cₛ)', group: 'concept' },
    { id: 'toc', label: 'Theory of Constraints', short: 'TOC', group: 'concept', note: 'Throughput is governed by the constraint, not by universal local busyness.' },
    { id: 'constraint', label: 'System constraint', short: 'Constraint', group: 'concept' },
    { id: 'localglobal', label: 'Local ≠ global optima', short: 'Local ≠ global', group: 'concept' },
    { id: 'feedback', label: 'Feedback loops', short: 'Feedback loops', group: 'concept' },
    { id: 'pull', label: 'Pull (WIP limit)', short: 'Pull (WIP)', group: 'concept' },

    { id: 'reviewQueues', label: 'Review queues', short: 'Review queues', group: 'observation' },
    { id: 'demandSpikes', label: 'Demand spikes', short: 'Demand spikes', group: 'observation' },
    { id: 'incidentRework', label: 'Incident-driven rework', short: 'Incident rework', group: 'observation' },
    { id: 'longLivedBranches', label: 'Long-lived branches', short: 'Long branches', group: 'observation' },
    { id: 'contextSwitch', label: 'Context-switching tax', short: 'Context switch', group: 'observation' },

    { id: 'idleWaste', label: '"Idle people = waste"', short: 'Idle = waste', group: 'assumption' },
    { id: 'addPeople', label: '"Add people to go faster"', short: 'Add people', group: 'assumption' },
    { id: 'highUtil', label: '"Higher utilization = better"', short: 'High util = better', group: 'assumption' },
    { id: 'bigBatches', label: '"Bigger batches = more efficient"', short: 'Big batches', group: 'assumption' },
    { id: 'morePlanning', label: '"More upfront planning makes complex work predictable"', short: 'Upfront planning', group: 'assumption' },
    { id: 'pushEverything', label: '"Push everything in early"', short: 'Push early', group: 'assumption' },
    { id: 'individualTargets', label: '"Optimize individual targets"', short: 'Individual targets', group: 'assumption' },

    { id: 'sBelow100', label: 'Queues can appear below 100% average load', short: 'Queues <100%', group: 'surprise', note: 'Average spare capacity can still hide local overload when arrivals and service vary.' },
    { id: 'sSlack', label: 'Slack protects flow', short: 'Slack protects flow', group: 'surprise' },
    { id: 'sStartLess', label: 'Starting less can finish more', short: 'Start less', group: 'surprise' },
    { id: 'sVarDom', label: 'Variability is amplified near ρ→1', short: 'Variability amplifies', group: 'surprise' },
    { id: 'sLocalLoss', label: 'Local efficiency can reduce global flow', short: 'Local can hurt', group: 'surprise' },
    { id: 'sNonConstraint', label: 'A faster non-constraint may not improve throughput', short: 'Non-constraint trap', group: 'surprise' },
    { id: 'sBatchCost', label: 'Big batches hide risk until late', short: 'Batch risk', group: 'surprise' },
    { id: 'sUrgency', label: 'Expedites create hidden waiting', short: 'Expedites wait', group: 'surprise' },
    { id: 'sFeedback', label: 'Fast feedback beats brittle prediction', short: 'Feedback beats prediction', group: 'surprise' }
  ];

  var links = [
    { source: 'little', target: 'throughput' },
    { source: 'little', target: 'wip' },
    { source: 'little', target: 'leadTime' },
    { source: 'little', target: 'pull' },
    { source: 'wip', target: 'leadTime' },
    { source: 'rho', target: 'kingman' },
    { source: 'ca', target: 'kingman' },
    { source: 'cs', target: 'kingman' },
    { source: 'kingman', target: 'leadTime' },
    { source: 'kingman', target: 'sBelow100' },
    { source: 'kingman', target: 'sVarDom' },
    { source: 'rho', target: 'sVarDom' },
    { source: 'wip', target: 'sStartLess' },
    { source: 'ca', target: 'sBelow100' },
    { source: 'cs', target: 'sBelow100' },
    { source: 'ca', target: 'sSlack' },
    { source: 'cs', target: 'sSlack' },
    { source: 'rho', target: 'sSlack' },

    { source: 'feedback', target: 'sFeedback' },
    { source: 'feedback', target: 'ca' },
    { source: 'feedback', target: 'incidentRework' },

    { source: 'toc', target: 'constraint' },
    { source: 'constraint', target: 'throughput' },
    { source: 'toc', target: 'localglobal' },
    { source: 'localglobal', target: 'sLocalLoss' },
    { source: 'toc', target: 'pull' },
    { source: 'constraint', target: 'pull' },
    { source: 'constraint', target: 'sSlack' },
    { source: 'constraint', target: 'sNonConstraint' },

    { source: 'pull', target: 'sSlack' },
    { source: 'pull', target: 'sStartLess' },
    { source: 'pull', target: 'wip' },
    { source: 'rho', target: 'sUrgency' },

    { source: 'reviewQueues', target: 'cs' },
    { source: 'reviewQueues', target: 'leadTime' },
    { source: 'demandSpikes', target: 'ca' },
    { source: 'demandSpikes', target: 'sBelow100' },
    { source: 'incidentRework', target: 'cs' },
    { source: 'incidentRework', target: 'sUrgency' },
    { source: 'longLivedBranches', target: 'cs' },
    { source: 'longLivedBranches', target: 'feedback' },
    { source: 'longLivedBranches', target: 'sBatchCost' },
    { source: 'contextSwitch', target: 'leadTime' },
    { source: 'contextSwitch', target: 'pull' },
    { source: 'contextSwitch', target: 'cs' },

    { source: 'idleWaste', target: 'sSlack', kind: 'contradicts' },
    { source: 'idleWaste', target: 'pull', kind: 'contradicts' },
    { source: 'addPeople', target: 'sNonConstraint', kind: 'contradicts' },
    { source: 'addPeople', target: 'constraint', kind: 'contradicts' },
    { source: 'addPeople', target: 'localglobal', kind: 'contradicts' },
    { source: 'highUtil', target: 'sBelow100', kind: 'contradicts' },
    { source: 'highUtil', target: 'sVarDom', kind: 'contradicts' },
    { source: 'highUtil', target: 'sSlack', kind: 'contradicts' },
    { source: 'bigBatches', target: 'sBatchCost', kind: 'contradicts' },
    { source: 'bigBatches', target: 'feedback', kind: 'contradicts' },
    { source: 'morePlanning', target: 'feedback', kind: 'contradicts' },
    { source: 'morePlanning', target: 'sFeedback', kind: 'contradicts' },
    { source: 'pushEverything', target: 'sStartLess', kind: 'contradicts' },
    { source: 'pushEverything', target: 'wip', kind: 'contradicts' },
    { source: 'pushEverything', target: 'pull', kind: 'contradicts' },
    { source: 'pushEverything', target: 'leadTime', kind: 'contradicts' },
    { source: 'individualTargets', target: 'localglobal', kind: 'contradicts' },
    { source: 'individualTargets', target: 'sLocalLoss', kind: 'contradicts' }
  ];

  var fgUtils = window.ForceGraphUtils;
  var linkIndex = fgUtils ? fgUtils.buildLinkIndex(links) : new Set(links.flatMap(function(l) {
    return [l.source + '|' + l.target, l.target + '|' + l.source];
  }));

  var detailEl = document.querySelector('[data-concept-detail]');
  var activeDetailNode = null;

  function showDetail(d) {
    if (!detailEl) return;
    detailEl.textContent = '';
    var swatch = document.createElement('span');
    swatch.className = 'force-graph-detail-swatch queue-machine-concept-detail-swatch queue-machine-concept-detail-swatch--' + d.group;
    var label = document.createElement('span');
    label.className = 'force-graph-detail-label queue-machine-concept-detail-label';
    label.textContent = d.label;
    detailEl.appendChild(swatch);
    detailEl.appendChild(label);
    if (d.note) {
      var note = document.createElement('span');
      note.className = 'queue-machine-concept-detail-note';
      note.textContent = d.note;
      detailEl.appendChild(note);
    }
    detailEl.classList.add('is-visible');
  }

  function hideDetail(force) {
    if (!detailEl) return;
    if (!force && activeDetailNode) return;
    activeDetailNode = null;
    detailEl.classList.remove('is-visible');
    detailEl.textContent = '';
  }

  function radiusByGroup(group) {
    if (group === 'surprise') return 7.4;
    if (group === 'assumption') return 5.4;
    if (group === 'concept') return 5;
    return 5.2;
  }

  function targetXByGroup(group, width) {
    if (group === 'concept') return width * 0.24;
    if (group === 'assumption') return width * 0.39;
    if (group === 'observation') return width * 0.52;
    return width * 0.68;
  }

  function targetYByGroup(group, height) {
    if (group === 'concept') return height * 0.4;
    if (group === 'assumption') return height * 0.46;
    if (group === 'observation') return height * 0.64;
    return height * 0.55;
  }

  var simulation = null;
  var nudgeTimer = null;
  var activeDragNodeId = null;
  var lastRenderWidth = 0;
  var lastLayoutWidth = 0;
  var lastLayoutHeight = 0;
  var resizeTimer = null;

  function render(renderWidth) {
    var rendered = Math.max(320, renderWidth || surface.clientWidth || 320);
    var mobile = rendered < 760;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth || rendered;
    var constrainedMobile = viewportWidth < 760;
    var height = mobile
      ? Math.max(560, Math.min(980, Math.floor(rendered * 1.65)))
      : Math.max(500, Math.min(820, Math.floor(rendered * 0.72)));
    var prevLayoutWidth = lastLayoutWidth || rendered;
    var prevLayoutHeight = lastLayoutHeight || height;
    var minX = 10;
    var maxX = rendered - 10;
    var minY = 14;
    var maxY = height - 14;

    var stateById = Object.create(null);
    if (simulation) {
      simulation.nodes().forEach(function(d) {
        stateById[d.id] = {
          x: d.x, y: d.y,
          vx: d.vx, vy: d.vy,
          fx: d.fx, fy: d.fy
        };
      });
      simulation.stop();
    }
    if (nudgeTimer) clearInterval(nudgeTimer);

    var nodeData = nodes.map(function(n, index) {
      var d = Object.assign({}, n);
      var prev = stateById[n.id];
      if (!prev) {
        var angle = (index / Math.max(1, nodes.length)) * Math.PI * 2;
        var radius = mobile ? 26 : 34;
        var seededX = targetXByGroup(n.group, rendered) + Math.cos(angle) * radius;
        var seededY = targetYByGroup(n.group, height) + Math.sin(angle) * radius;
        d.x = constrainedMobile ? Math.max(minX, Math.min(maxX, seededX)) : seededX;
        d.y = constrainedMobile ? Math.max(minY, Math.min(maxY, seededY)) : seededY;
        return d;
      }
      if (typeof prev.x === 'number' && typeof prev.y === 'number') {
        var restoredX = (prev.x / Math.max(1, prevLayoutWidth)) * rendered;
        var restoredY = (prev.y / Math.max(1, prevLayoutHeight)) * height;
        d.x = constrainedMobile ? Math.max(minX, Math.min(maxX, restoredX)) : restoredX;
        d.y = constrainedMobile ? Math.max(minY, Math.min(maxY, restoredY)) : restoredY;
      }
      if (typeof prev.vx === 'number') d.vx = prev.vx;
      if (typeof prev.vy === 'number') d.vy = prev.vy;
      if (typeof prev.fx === 'number' && typeof prev.fy === 'number') {
        var restoredFx = (prev.fx / Math.max(1, prevLayoutWidth)) * rendered;
        var restoredFy = (prev.fy / Math.max(1, prevLayoutHeight)) * height;
        d.fx = constrainedMobile ? Math.max(minX, Math.min(maxX, restoredFx)) : restoredFx;
        d.fy = constrainedMobile ? Math.max(minY, Math.min(maxY, restoredFy)) : restoredFy;
      }
      return d;
    });

    var svg = d3.select(svgEl)
      .attr('viewBox', '0 0 ' + rendered + ' ' + height)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.selectAll('*').remove();

    svg.on('click', function(event) {
      if (event.target === svgEl) clearHighlights();
    });

    var plot = svg.append('g').attr('class', 'queue-machine-concept-plot');
    var isCoarsePointer = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    simulation = d3.forceSimulation(nodeData)
      .force('link', d3.forceLink(links.map(function(l) { return Object.assign({}, l); }))
        .id(function(d) { return d.id; })
        .distance(mobile ? 64 : 92)
        .strength(0.46))
      .force('charge', d3.forceManyBody().strength(mobile ? -190 : -300))
      .force('center', d3.forceCenter(rendered / 2, height / 2))
      .force('collide', d3.forceCollide().radius(function(d) {
        return radiusByGroup(d.group) + (mobile ? 10 : 16);
      }))
      .force('x', d3.forceX(function(d) {
        return targetXByGroup(d.group, rendered);
      }).strength(mobile ? 0.052 : 0.068))
      .force('y', d3.forceY(function(d) {
        return targetYByGroup(d.group, height);
      }).strength(mobile ? 0.036 : 0.045));

    var link = plot.append('g')
      .attr('class', 'queue-machine-concept-links')
      .selectAll('line')
      .data(simulation.force('link').links())
      .join('line')
      .attr('class', function(d) {
        return 'force-graph-link queue-machine-concept-edge'
          + (d.kind === 'contradicts' ? ' queue-machine-concept-edge--contradicts' : '');
      });

    var node = plot.append('g')
      .attr('class', 'queue-machine-concept-nodes')
      .selectAll('circle')
      .data(simulation.nodes())
      .join('circle')
      .attr('class', function(d) {
        return 'force-graph-node queue-machine-concept-node queue-machine-concept-node--' + d.group;
      })
      .attr('r', function(d) { return radiusByGroup(d.group); });

    var hitArea = null;
    if (isCoarsePointer) {
      hitArea = plot.append('g')
        .attr('class', 'queue-machine-concept-hitareas')
        .selectAll('circle')
        .data(simulation.nodes())
        .join('circle')
        .attr('class', 'queue-machine-concept-hitarea')
        .attr('r', function(d) { return radiusByGroup(d.group) + 13; });
    }

    var label = plot.append('g')
      .attr('class', 'queue-machine-concept-labels')
      .selectAll('text')
      .data(simulation.nodes())
      .join('text')
      .attr('class', 'force-graph-label queue-machine-concept-label')
      .attr('text-anchor', 'middle')
      .text(function(d) { return mobile ? d.short : d.label; });

    var dragGlow = plot.append('g')
      .attr('class', 'queue-machine-concept-drag-glows')
      .selectAll('circle')
      .data(simulation.nodes())
      .join('circle')
      .attr('class', 'queue-machine-concept-drag-glow')
      .attr('r', function(d) { return radiusByGroup(d.group) + 5.2; });

    var selections = {
      node: node,
      label: label,
      link: link,
      linkIndex: linkIndex,
      simulation: simulation
    };
    var legendItems = Array.from(document.querySelectorAll('[data-legend-group]'));
    var LEGEND_PAIR = {
      assumption: 'surprise',
      surprise: 'assumption',
      concept: 'observation',
      observation: 'concept'
    };

    function clearHighlights() {
      if (fgUtils) {
        fgUtils.clearHighlights(selections);
      } else {
        node.classed('is-dim', false).classed('is-related', false).classed('is-group-focus', false);
        label.classed('is-dim', false).classed('is-related', false).classed('is-active', false);
        link.classed('is-dim', false).classed('is-related', false);
      }
      hideDetail(true);
    }

    function applyFocus(d) {
      node.classed('is-related', false).classed('is-group-focus', false);
      label.classed('is-related', false);
      link.classed('is-related', false);

      node.classed('is-dim', function(n) {
        return n.id !== d.id && !linkIndex.has(d.id + '|' + n.id);
      });
      label.classed('is-dim', function(n) {
        return n.id !== d.id && !linkIndex.has(d.id + '|' + n.id);
      }).classed('is-active', function(n) {
        return n.id === d.id || linkIndex.has(d.id + '|' + n.id);
      });
      link.classed('is-dim', function(l) {
        var s = (typeof l.source === 'object') ? l.source.id : l.source;
        var t = (typeof l.target === 'object') ? l.target.id : l.target;
        return s !== d.id && t !== d.id;
      });
    }

    function applyLegendFilter(group) {
      var paired = LEGEND_PAIR[group] || group;
      var activeGroups = new Set([group, paired]);
      var activeNodes = new Set();

      simulation.nodes().forEach(function(n) {
        if (activeGroups.has(n.group)) activeNodes.add(n.id);
      });

      node
        .classed('is-group-focus', function(n) { return activeNodes.has(n.id); })
        .classed('is-related', false)
        .classed('is-dim', function(n) { return !activeNodes.has(n.id); });

      label
        .classed('is-active', function(n) { return activeNodes.has(n.id); })
        .classed('is-related', false)
        .classed('is-dim', function(n) { return !activeNodes.has(n.id); });

      link
        .classed('is-related', false)
        .classed('is-dim', function(l) {
          var s = (typeof l.source === 'object') ? l.source.id : l.source;
          var t = (typeof l.target === 'object') ? l.target.id : l.target;
          return !(activeNodes.has(s) && activeNodes.has(t));
        });
    }

    var legendCtl = fgUtils && fgUtils.wireLegend(legendItems, {
      onActivate: applyLegendFilter,
      onClear: clearHighlights,
      onPin: applyLegendFilter
    });

    function focusAndShow(d) {
      if (legendCtl && legendCtl.isPinned()) legendCtl.release();
      activeDetailNode = d;
      applyFocus(d);
      showDetail(d);
    }

    var dragBehavior = d3.drag()
      .on('start', function(event, d) {
        focusAndShow(d);
        if (!event.active) simulation.alphaTarget(0.2).restart();
        d.fx = d.x;
        d.fy = d.y;
        activeDragNodeId = d.id;
        d.__dragMoved = false;
        d.__dragStartX = event.x;
        d.__dragStartY = event.y;
      })
      .on('drag', function(event, d) {
        d.fx = event.x;
        d.fy = event.y;
        var dx = Math.abs((event.x || 0) - (d.__dragStartX || 0));
        var dy = Math.abs((event.y || 0) - (d.__dragStartY || 0));
        if (dx > (isCoarsePointer ? 12 : 5) || dy > (isCoarsePointer ? 12 : 5)) {
          d.__dragMoved = true;
        }
      })
      .on('end', function(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        activeDragNodeId = null;
        if (this && typeof this.blur === 'function') this.blur();
        if (d.__dragMoved) {
          clearHighlights();
        } else {
          focusAndShow(d);
        }
      });

    var interactionTarget = (isCoarsePointer && hitArea) ? hitArea : node;
    interactionTarget.call(dragBehavior);

    if (!isCoarsePointer) {
      node
        .on('mouseenter', function(_, d) {
          if (legendCtl && legendCtl.isPinned()) return;
          applyFocus(d);
        })
        .on('mouseleave', function() {
          if (legendCtl && legendCtl.isPinned()) return;
          if (activeDetailNode) return;
          clearHighlights();
        });
    }

    interactionTarget
      .on('click', function(_, d) {
        focusAndShow(d);
      })
      .on('pointerup', function(_, d) {
        if (!d.__dragMoved) focusAndShow(d);
      });

    node
      .attr('tabindex', '0')
      .attr('role', 'button')
      .attr('aria-label', function(d) { return d.label + ' (' + d.group + ')'; })
      .on('keydown', function(event, d) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          focusAndShow(d);
        }
      });

    simulation.on('tick', function() {
      if (constrainedMobile) {
        simulation.nodes().forEach(function(d) {
          d.x = Math.max(minX, Math.min(maxX, d.x));
          d.y = Math.max(minY, Math.min(maxY, d.y));
        });
      }

      link
        .attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

      node
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });

      if (hitArea) {
        hitArea
          .attr('cx', function(d) { return d.x; })
          .attr('cy', function(d) { return d.y; });
      }

      dragGlow
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .classed('is-active', function(d) { return activeDragNodeId === d.id; });

      label
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y - radiusByGroup(d.group) - 5; });
    });

    lastLayoutWidth = rendered;
    lastLayoutHeight = height;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      for (var i = 0; i < 220; i += 1) simulation.tick();
      simulation.stop();
    } else {
      startAmbientNudge();
    }
  }

  function startAmbientNudge() {
    nudgeTimer = setInterval(function() {
      if (!simulation) return;
      simulation.nodes().forEach(function(d) {
        d.vx += (Math.random() * 2 - 1) * 0.018;
        d.vy += (Math.random() * 2 - 1) * 0.018;
      });
      simulation.alphaTarget(0.025).restart();
      setTimeout(function() {
        if (simulation) simulation.alphaTarget(0);
      }, 420);
    }, 2400);
  }

  function scheduleRender(force) {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      var rawWidth = Math.round(surface.clientWidth || 0);
      if (!force && rawWidth > 0 && rawWidth < 280) return;
      var measuredWidth = Math.max(320, rawWidth || lastRenderWidth || 320);
      if (!force && Math.abs(measuredWidth - lastRenderWidth) < 2) return;
      lastRenderWidth = measuredWidth;
      render(measuredWidth);
    }, 120);
  }

  scheduleRender(true);
  hideDetail(true);
  window.addEventListener('resize', function() { scheduleRender(false); });
})();
