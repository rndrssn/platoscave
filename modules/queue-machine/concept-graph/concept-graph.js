'use strict';

(function initConceptGraph() {
  if (!window.d3 || !document || typeof document.querySelector !== 'function') return;
  var svgEl = document.querySelector('[data-concept-graph]');
  var fallback = document.querySelector('[data-concept-graph-fallback]');
  if (!svgEl) return;
  if (!window.d3) {
    if (fallback) fallback.hidden = false;
    return;
  }
  var d3 = window.d3;

  var nodes = [
    { id: 'little', label: "Little's Law", short: "Little's Law", group: 'concept', note: 'Average WIP, throughput, and lead time must balance in a stable flow system.' },
    { id: 'lambda', label: 'Throughput / λ', short: 'Throughput', group: 'concept' },
    { id: 'wip', label: 'WIP / L', short: 'WIP', group: 'concept' },
    { id: 'leadTime', label: 'Lead time / W', short: 'Lead time', group: 'concept' },
    { id: 'waitTime', label: 'Queue waiting / Wq', short: 'Waiting', group: 'concept' },
    { id: 'serviceRate', label: 'Service rate / μ', short: 'Service rate', group: 'concept' },
    { id: 'serviceTime', label: 'Service time / E[S]', short: 'Service time', group: 'concept' },
    { id: 'kingman', label: "Kingman's approximation", short: "Kingman", group: 'concept', note: 'Waiting grows from utilization pressure multiplied by arrival and service-time variability.' },
    { id: 'rho', label: 'Utilization ρ', short: 'Utilization ρ', group: 'concept' },
    { id: 'ca', label: 'Arrival variability Ca', short: 'Arrival var.', group: 'concept' },
    { id: 'cs', label: 'Service-time variability Cs', short: 'Service var.', group: 'concept' },
    { id: 'mm1', label: 'M/M/1 baseline', short: 'M/M/1', group: 'concept' },
    { id: 'toc', label: 'Theory of Constraints', short: 'TOC', group: 'concept', note: 'Throughput is governed by the constraint, not by universal local busyness.' },
    { id: 'constraint', label: 'System constraint', short: 'Constraint', group: 'concept' },
    { id: 'subordinate', label: 'Subordinate to constraint', short: 'Subordinate', group: 'concept' },
    { id: 'buffer', label: 'Protective buffer', short: 'Buffer', group: 'concept' },
    { id: 'nonlinearQueue', label: 'Queueing non-linearity', short: 'Queue curve', group: 'concept' },
    { id: 'nonlinearOrg', label: 'Organizational non-linearity', short: 'Org non-linearity', group: 'concept' },
    { id: 'cynefin', label: 'Cynefin: complex domain', short: 'Cynefin', group: 'concept', note: 'A sense-making frame: in complex domains, cause and effect are only coherent in retrospect.' },
    { id: 'probeSense', label: 'Probe-sense-respond', short: 'Probe-sense', group: 'concept' },
    { id: 'localglobal', label: 'Local ≠ global optima', short: 'Local ≠ global', group: 'concept' },
    { id: 'feedback', label: 'Feedback loops', short: 'Feedback loops', group: 'concept' },
    { id: 'pull', label: 'Pull / WIP limit', short: 'Pull / WIP', group: 'concept' },
    { id: 'batches', label: 'Small batches', short: 'Small batches', group: 'concept' },
    { id: 'flowEff', label: 'Flow efficiency', short: 'Flow efficiency', group: 'concept' },
    { id: 'empirical', label: 'Empirical process control', short: 'Empirical', group: 'concept' },
    { id: 'costOfDelay', label: 'Cost of Delay', short: 'Cost of Delay', group: 'concept' },

    { id: 'prReview', label: 'PR review queues', short: 'PR queues', group: 'observation' },
    { id: 'quarterly', label: 'Quarterly demand spikes', short: 'Quarterly spikes', group: 'observation' },
    { id: 'sprintDisrupt', label: 'Sprint disruption', short: 'Sprint disruption', group: 'observation' },
    { id: 'incidentRework', label: 'Incident-driven rework', short: 'Incident rework', group: 'observation' },
    { id: 'longLivedBranches', label: 'Long-lived branches', short: 'Long branches', group: 'observation' },
    { id: 'contextSwitch', label: 'Context-switching tax', short: 'Context switch', group: 'observation' },

    { id: 'idleWaste', label: '"Idle people = waste"', short: 'Idle = waste', group: 'assumption' },
    { id: 'addPeople', label: '"Add people to go faster"', short: 'Add people', group: 'assumption' },
    { id: 'highUtil', label: '"Higher utilization = better"', short: 'High util = better', group: 'assumption' },
    { id: 'bigBatches', label: '"Bigger batches = more efficient"', short: 'Big batches', group: 'assumption' },
    { id: 'morePlanning', label: '"More planning = more predictable"', short: 'More planning', group: 'assumption' },
    { id: 'startEverything', label: '"Start everything early"', short: 'Start early', group: 'assumption' },
    { id: 'fullHandoffs', label: '"Fully load every handoff"', short: 'Load handoffs', group: 'assumption' },
    { id: 'individualTargets', label: '"Optimize individual targets"', short: 'Individual targets', group: 'assumption' },

    { id: 'sBelow100', label: 'Queues appear below 100% load', short: 'Queues <100%', group: 'surprise', note: 'Average spare capacity can still hide local overload when arrivals and service vary.' },
    { id: 'sSlack', label: 'Idle capacity can be productive', short: 'Useful slack', group: 'surprise' },
    { id: 'sStartLess', label: 'Starting less can finish more', short: 'Start less', group: 'surprise' },
    { id: 'sVarDom', label: 'Variability dominates near ρ→1', short: 'Variability dominates', group: 'surprise' },
    { id: 'sLocalLoss', label: 'Local efficiency reduces global flow', short: 'Local hurts global', group: 'surprise' },
    { id: 'sNonConstraint', label: 'A faster non-constraint may not help', short: 'Non-constraint trap', group: 'surprise' },
    { id: 'sBatchCost', label: 'Big batches hide risk until late', short: 'Batch risk', group: 'surprise' },
    { id: 'sUrgency', label: 'Urgency creates more waiting', short: 'Urgency waits', group: 'surprise' },
    { id: 'sConstraintMoves', label: 'The constraint moves', short: 'Constraint moves', group: 'surprise' },
    { id: 'sFeedback', label: 'Fast feedback beats correct prediction', short: 'Feedback beats prediction', group: 'surprise' }
  ];

  var links = [
    { source: 'little', target: 'lambda', kind: 'defines' },
    { source: 'little', target: 'wip', kind: 'defines' },
    { source: 'little', target: 'leadTime', kind: 'defines' },
    { source: 'little', target: 'pull', kind: 'explains' },
    { source: 'wip', target: 'leadTime', kind: 'amplifies' },
    { source: 'wip', target: 'flowEff', kind: 'explains' },
    { source: 'leadTime', target: 'costOfDelay', kind: 'amplifies' },
    { source: 'waitTime', target: 'leadTime', kind: 'amplifies' },
    { source: 'serviceRate', target: 'rho', kind: 'defines' },
    { source: 'lambda', target: 'rho', kind: 'defines' },
    { source: 'serviceTime', target: 'serviceRate', kind: 'defines' },

    { source: 'mm1', target: 'rho', kind: 'explains' },
    { source: 'mm1', target: 'kingman', kind: 'baseline' },
    { source: 'rho', target: 'kingman', kind: 'defines' },
    { source: 'ca', target: 'kingman', kind: 'defines' },
    { source: 'cs', target: 'kingman', kind: 'defines' },
    { source: 'serviceTime', target: 'kingman', kind: 'defines' },
    { source: 'kingman', target: 'waitTime', kind: 'explains' },
    { source: 'kingman', target: 'sBelow100', kind: 'explains' },
    { source: 'kingman', target: 'sVarDom', kind: 'explains' },
    { source: 'rho', target: 'sVarDom', kind: 'amplifies' },
    { source: 'ca', target: 'sBelow100', kind: 'amplifies' },
    { source: 'cs', target: 'sBelow100', kind: 'amplifies' },
    { source: 'ca', target: 'sSlack', kind: 'explains' },
    { source: 'cs', target: 'sSlack', kind: 'explains' },
    { source: 'nonlinearQueue', target: 'kingman', kind: 'explains' },
    { source: 'nonlinearQueue', target: 'sVarDom', kind: 'explains' },
    { source: 'nonlinearQueue', target: 'sBelow100', kind: 'explains' },

    { source: 'cynefin', target: 'probeSense', kind: 'recommends' },
    { source: 'probeSense', target: 'empirical', kind: 'aligns' },
    { source: 'empirical', target: 'feedback', kind: 'uses' },
    { source: 'feedback', target: 'batches', kind: 'explains' },
    { source: 'feedback', target: 'sFeedback', kind: 'explains' },
    { source: 'nonlinearOrg', target: 'cynefin', kind: 'explains' },
    { source: 'nonlinearOrg', target: 'localglobal', kind: 'explains' },
    { source: 'nonlinearOrg', target: 'sLocalLoss', kind: 'explains' },
    { source: 'feedback', target: 'ca', kind: 'modulates' },
    { source: 'feedback', target: 'incidentRework', kind: 'example' },

    { source: 'toc', target: 'constraint', kind: 'defines' },
    { source: 'constraint', target: 'lambda', kind: 'bounds' },
    { source: 'constraint', target: 'serviceRate', kind: 'bounds' },
    { source: 'toc', target: 'localglobal', kind: 'explains' },
    { source: 'toc', target: 'subordinate', kind: 'recommends' },
    { source: 'subordinate', target: 'pull', kind: 'aligns' },
    { source: 'subordinate', target: 'sLocalLoss', kind: 'explains' },
    { source: 'buffer', target: 'constraint', kind: 'protects' },
    { source: 'buffer', target: 'sSlack', kind: 'explains' },
    { source: 'constraint', target: 'sNonConstraint', kind: 'explains' },
    { source: 'constraint', target: 'sConstraintMoves', kind: 'explains' },

    { source: 'pull', target: 'sSlack', kind: 'explains' },
    { source: 'pull', target: 'sStartLess', kind: 'explains' },
    { source: 'pull', target: 'wip', kind: 'modulates' },
    { source: 'pull', target: 'flowEff', kind: 'explains' },
    { source: 'batches', target: 'cs', kind: 'modulates' },
    { source: 'batches', target: 'sBatchCost', kind: 'explains' },
    { source: 'batches', target: 'sFeedback', kind: 'explains' },
    { source: 'costOfDelay', target: 'batches', kind: 'explains' },
    { source: 'costOfDelay', target: 'pull', kind: 'explains' },
    { source: 'costOfDelay', target: 'flowEff', kind: 'explains' },
    { source: 'costOfDelay', target: 'sUrgency', kind: 'explains' },

    { source: 'prReview', target: 'cs', kind: 'example' },
    { source: 'prReview', target: 'waitTime', kind: 'example' },
    { source: 'quarterly', target: 'ca', kind: 'example' },
    { source: 'quarterly', target: 'sBelow100', kind: 'example' },
    { source: 'sprintDisrupt', target: 'ca', kind: 'example' },
    { source: 'sprintDisrupt', target: 'pull', kind: 'mitigates' },
    { source: 'incidentRework', target: 'cs', kind: 'example' },
    { source: 'incidentRework', target: 'sUrgency', kind: 'example' },
    { source: 'longLivedBranches', target: 'batches', kind: 'example' },
    { source: 'longLivedBranches', target: 'cs', kind: 'amplifies' },
    { source: 'longLivedBranches', target: 'feedback', kind: 'delays' },
    { source: 'longLivedBranches', target: 'sBatchCost', kind: 'example' },
    { source: 'contextSwitch', target: 'waitTime', kind: 'amplifies' },
    { source: 'contextSwitch', target: 'flowEff', kind: 'reduces' },
    { source: 'contextSwitch', target: 'pull', kind: 'mitigates' },
    { source: 'contextSwitch', target: 'cs', kind: 'amplifies' },

    { source: 'idleWaste', target: 'sSlack', kind: 'contradicts' },
    { source: 'idleWaste', target: 'buffer', kind: 'contradicts' },
    { source: 'addPeople', target: 'sNonConstraint', kind: 'contradicts' },
    { source: 'addPeople', target: 'constraint', kind: 'contradicts' },
    { source: 'addPeople', target: 'nonlinearOrg', kind: 'contradicts' },
    { source: 'highUtil', target: 'sBelow100', kind: 'contradicts' },
    { source: 'highUtil', target: 'sVarDom', kind: 'contradicts' },
    { source: 'highUtil', target: 'sSlack', kind: 'contradicts' },
    { source: 'bigBatches', target: 'sBatchCost', kind: 'contradicts' },
    { source: 'bigBatches', target: 'batches', kind: 'contradicts' },
    { source: 'bigBatches', target: 'costOfDelay', kind: 'contradicts' },
    { source: 'morePlanning', target: 'probeSense', kind: 'contradicts' },
    { source: 'morePlanning', target: 'empirical', kind: 'contradicts' },
    { source: 'morePlanning', target: 'sFeedback', kind: 'contradicts' },
    { source: 'startEverything', target: 'sStartLess', kind: 'contradicts' },
    { source: 'startEverything', target: 'wip', kind: 'amplifies' },
    { source: 'fullHandoffs', target: 'pull', kind: 'contradicts' },
    { source: 'fullHandoffs', target: 'waitTime', kind: 'amplifies' },
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
    swatch.className = 'queue-machine-concept-detail-swatch queue-machine-concept-detail-swatch--' + d.group;
    var label = document.createElement('span');
    label.className = 'queue-machine-concept-detail-label';
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
    if (group === 'surprise') return 9;
    if (group === 'assumption') return 6.8;
    if (group === 'concept') return 7;
    return 6.4;
  }

  function targetXByGroup(group, width) {
    if (group === 'concept') return width * 0.22;
    if (group === 'assumption') return width * 0.44;
    if (group === 'observation') return width * 0.56;
    return width * 0.78;
  }

  function targetYByGroup(group, height) {
    if (group === 'concept') return height * 0.25;
    if (group === 'assumption') return height * 0.32;
    if (group === 'observation') return height * 0.58;
    return height * 0.48;
  }

  var simulation = null;
  var nudgeTimer = null;
  var lastWidth = 0;
  var lastHeight = 0;
  var resizeTimer = null;

  function render(width) {
    var rect = svgEl.getBoundingClientRect();
    var rendered = Math.max(320, width || rect.width || 720);
    var mobile = rendered < 760;
    var height = mobile
      ? Math.max(720, Math.min(1200, Math.floor(rendered * 2.15)))
      : Math.max(560, Math.min(820, Math.floor(rendered * 0.68)));
    var minX = 12;
    var maxX = rendered - 12;
    var minY = 16;
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

    var prevWidth = lastWidth || rendered;
    var prevHeight = lastHeight || height;

    var nodeData = nodes.map(function(n) {
      var d = Object.assign({}, n);
      var prev = stateById[n.id];
      if (!prev) return d;
      if (typeof prev.x === 'number') d.x = (prev.x / Math.max(1, prevWidth)) * rendered;
      if (typeof prev.y === 'number') d.y = (prev.y / Math.max(1, prevHeight)) * height;
      if (typeof prev.vx === 'number') d.vx = prev.vx;
      if (typeof prev.vy === 'number') d.vy = prev.vy;
      if (typeof prev.fx === 'number') d.fx = (prev.fx / Math.max(1, prevWidth)) * rendered;
      if (typeof prev.fy === 'number') d.fy = (prev.fy / Math.max(1, prevHeight)) * height;
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
        .distance(mobile ? 78 : 118)
        .strength(0.38))
      .force('charge', d3.forceManyBody().strength(mobile ? -250 : -390))
      .force('center', d3.forceCenter(rendered / 2, height / 2))
      .force('collide', d3.forceCollide().radius(function(d) {
        return radiusByGroup(d.group) + (mobile ? 11 : 20);
      }))
      .force('x', d3.forceX(function(d) {
        return targetXByGroup(d.group, rendered);
      }).strength(mobile ? 0.032 : 0.045))
      .force('y', d3.forceY(function(d) {
        return targetYByGroup(d.group, height);
      }).strength(mobile ? 0.016 : 0.024));

    var link = plot.append('g')
      .attr('class', 'queue-machine-concept-links')
      .selectAll('line')
      .data(simulation.force('link').links())
      .join('line')
      .attr('class', function(d) {
        return 'force-graph-link queue-machine-concept-edge queue-machine-concept-edge--' + (d.kind || 'related');
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

    var selections = {
      node: node,
      label: label,
      link: link,
      linkIndex: linkIndex,
      simulation: simulation
    };
    var legendItems = Array.from(document.querySelectorAll('[data-legend-group]'));

    function clearHighlights() {
      if (fgUtils) fgUtils.clearHighlights(selections);
      hideDetail(true);
    }

    function applyFocus(d) {
      if (fgUtils) fgUtils.applyFocus(selections, d);
    }

    function applyLegendFilter(group) {
      var primary = new Set();
      var related = new Set();

      simulation.nodes().forEach(function(n) {
        if (n.group === group) primary.add(n.id);
      });

      simulation.force('link').links().forEach(function(l) {
        var s = (typeof l.source === 'object') ? l.source.id : l.source;
        var t = (typeof l.target === 'object') ? l.target.id : l.target;
        if (primary.has(s) && !primary.has(t)) related.add(t);
        if (primary.has(t) && !primary.has(s)) related.add(s);
      });

      node
        .classed('is-group-focus', function(n) { return primary.has(n.id); })
        .classed('is-related', function(n) { return !primary.has(n.id) && related.has(n.id); })
        .classed('is-dim', function(n) { return !primary.has(n.id) && !related.has(n.id); });

      label
        .classed('is-active', function(n) { return primary.has(n.id); })
        .classed('is-related', function(n) { return !primary.has(n.id) && related.has(n.id); })
        .classed('is-dim', function(n) { return !primary.has(n.id) && !related.has(n.id); });

      link
        .classed('is-related', function(l) {
          var s = (typeof l.source === 'object') ? l.source.id : l.source;
          var t = (typeof l.target === 'object') ? l.target.id : l.target;
          return (primary.has(s) && related.has(t)) || (primary.has(t) && related.has(s));
        })
        .classed('is-dim', function(l) {
          var s = (typeof l.source === 'object') ? l.source.id : l.source;
          var t = (typeof l.target === 'object') ? l.target.id : l.target;
          var touchesPrimary = primary.has(s) || primary.has(t);
          var connectsPrimaryToRelated = (primary.has(s) && related.has(t)) || (primary.has(t) && related.has(s));
          return !touchesPrimary && !connectsPrimaryToRelated;
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
        if (!event.active) simulation.alphaTarget(0.25).restart();
        d.fx = d.x;
        d.fy = d.y;
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
      });

    simulation.on('tick', function() {
      simulation.nodes().forEach(function(d) {
        d.x = Math.max(minX, Math.min(maxX, d.x));
        d.y = Math.max(minY, Math.min(maxY, d.y));
      });

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

      label
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y - radiusByGroup(d.group) - 5; });
    });

    lastWidth = rendered;
    lastHeight = height;

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

  function scheduleRender() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      var width = svgEl.clientWidth || svgEl.getBoundingClientRect().width;
      if (Math.abs(width - lastWidth) < 2) return;
      render(width);
    }, 120);
  }

  render();
  hideDetail(true);
  window.addEventListener('resize', scheduleRender);
})();
