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
    { id: 'little', label: "Little's Law", short: "Little's Law", group: 'concept' },
    { id: 'kingman', label: "Kingman's approximation", short: "Kingman", group: 'concept' },
    { id: 'rho', label: 'Utilization ρ', short: 'Utilization ρ', group: 'concept' },
    { id: 'cv', label: 'Variability (Ca, Cs)', short: 'Variability', group: 'concept' },
    { id: 'mm1', label: 'M/M/1 baseline', short: 'M/M/1', group: 'concept' },
    { id: 'toc', label: 'Theory of Constraints', short: 'TOC', group: 'concept' },
    { id: 'nonlinear', label: 'Non-linearity', short: 'Non-linearity', group: 'concept' },
    { id: 'cynefin', label: 'Cynefin: complex domain', short: 'Cynefin', group: 'concept' },
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
    { id: 'idleWaste', label: '"Idle people = waste"', short: 'Idle = waste', group: 'observation' },
    { id: 'addPeople', label: '"Add people to go faster"', short: 'Add people', group: 'observation' },
    { id: 'highUtil', label: '"Higher utilization = better"', short: 'High util = better', group: 'observation' },
    { id: 'bigBatches', label: '"Bigger batches = more efficient"', short: 'Big batches', group: 'observation' },
    { id: 'morePlanning', label: '"More planning = more predictable"', short: 'More planning', group: 'observation' },

    { id: 's72', label: '72% load still queues', short: '72% still queues', group: 'surprise' },
    { id: 'sSlack', label: 'Slack protects flow', short: 'Slack protects flow', group: 'surprise' },
    { id: 'sVarDom', label: 'Variability dominates near ρ→1', short: 'Variability dominates', group: 'surprise' },
    { id: 'sLocalLoss', label: 'Local efficiency reduces global flow', short: 'Local hurts global', group: 'surprise' },
    { id: 'sBatchCost', label: 'Big batches cost more than they save', short: 'Big batches cost', group: 'surprise' }
  ];

  var links = [
    { source: 'little', target: 'rho' },
    { source: 'little', target: 'pull' },
    { source: 'mm1', target: 'rho' },
    { source: 'mm1', target: 'kingman' },
    { source: 'rho', target: 'kingman' },
    { source: 'cv', target: 'kingman' },
    { source: 'kingman', target: 's72' },
    { source: 'kingman', target: 'sVarDom' },
    { source: 'rho', target: 'sVarDom' },
    { source: 'cv', target: 's72' },
    { source: 'cv', target: 'sSlack' },

    { source: 'nonlinear', target: 'kingman' },
    { source: 'nonlinear', target: 'sVarDom' },
    { source: 'nonlinear', target: 's72' },
    { source: 'nonlinear', target: 'sLocalLoss' },
    { source: 'cynefin', target: 'nonlinear' },
    { source: 'cynefin', target: 'empirical' },
    { source: 'cynefin', target: 'addPeople', kind: 'contradicts' },
    { source: 'localglobal', target: 'sLocalLoss' },
    { source: 'localglobal', target: 'idleWaste', kind: 'contradicts' },
    { source: 'localglobal', target: 'highUtil', kind: 'contradicts' },
    { source: 'feedback', target: 'cv' },
    { source: 'feedback', target: 'incidentRework' },

    { source: 'toc', target: 'localglobal' },
    { source: 'toc', target: 'sLocalLoss' },
    { source: 'toc', target: 'pull' },
    { source: 'toc', target: 'rho' },
    { source: 'toc', target: 'idleWaste', kind: 'contradicts' },
    { source: 'toc', target: 'highUtil', kind: 'contradicts' },

    { source: 'pull', target: 'sSlack' },
    { source: 'pull', target: 'flowEff' },
    { source: 'batches', target: 'cv' },
    { source: 'batches', target: 'sBatchCost' },
    { source: 'empirical', target: 'batches' },

    { source: 'costOfDelay', target: 'batches' },
    { source: 'costOfDelay', target: 'pull' },
    { source: 'costOfDelay', target: 'flowEff' },
    { source: 'costOfDelay', target: 'cv' },
    { source: 'costOfDelay', target: 'toc' },

    { source: 'prReview', target: 'cv' },
    { source: 'prReview', target: 'rho' },
    { source: 'quarterly', target: 'cv' },
    { source: 'sprintDisrupt', target: 'cv' },
    { source: 'sprintDisrupt', target: 'pull' },
    { source: 'incidentRework', target: 'cv' },

    { source: 'longLivedBranches', target: 'batches' },
    { source: 'longLivedBranches', target: 'cv' },
    { source: 'longLivedBranches', target: 'feedback' },
    { source: 'longLivedBranches', target: 'sBatchCost' },

    { source: 'contextSwitch', target: 'little' },
    { source: 'contextSwitch', target: 'flowEff' },
    { source: 'contextSwitch', target: 'pull' },
    { source: 'contextSwitch', target: 'cv' },

    { source: 'idleWaste', target: 'sLocalLoss', kind: 'contradicts' },
    { source: 'idleWaste', target: 'sSlack', kind: 'contradicts' },
    { source: 'addPeople', target: 'nonlinear', kind: 'contradicts' },
    { source: 'addPeople', target: 'flowEff', kind: 'contradicts' },
    { source: 'addPeople', target: 'toc', kind: 'contradicts' },
    { source: 'addPeople', target: 'cv', kind: 'contradicts' },
    { source: 'addPeople', target: 'sLocalLoss', kind: 'contradicts' },
    { source: 'highUtil', target: 's72', kind: 'contradicts' },
    { source: 'highUtil', target: 'sVarDom', kind: 'contradicts' },

    { source: 'bigBatches', target: 'sBatchCost', kind: 'contradicts' },
    { source: 'bigBatches', target: 'batches', kind: 'contradicts' },
    { source: 'bigBatches', target: 'costOfDelay', kind: 'contradicts' },

    { source: 'morePlanning', target: 'cynefin', kind: 'contradicts' },
    { source: 'morePlanning', target: 'empirical', kind: 'contradicts' },
    { source: 'morePlanning', target: 'nonlinear', kind: 'contradicts' }
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
    if (group === 'concept') return 7;
    return 6.4;
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
      ? Math.max(560, Math.min(900, Math.floor(rendered * 1.4)))
      : Math.max(440, Math.min(660, Math.floor(rendered * 0.58)));
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
        .distance(mobile ? 66 : 106)
        .strength(0.38))
      .force('charge', d3.forceManyBody().strength(mobile ? -220 : -330))
      .force('center', d3.forceCenter(rendered / 2, height / 2))
      .force('collide', d3.forceCollide().radius(function(d) {
        return radiusByGroup(d.group) + (mobile ? 11 : 20);
      }))
      .force('x', d3.forceX(function(d) {
        if (d.group === 'concept') return rendered * 0.26;
        if (d.group === 'observation') return rendered * 0.5;
        return rendered * 0.74;
      }).strength(mobile ? 0.032 : 0.045))
      .force('y', d3.forceY(function(d) {
        if (d.group === 'concept') return height * 0.17;
        if (d.group === 'observation') return height * 0.39;
        return height * 0.63;
      }).strength(mobile ? 0.016 : 0.024));

    var link = plot.append('g')
      .attr('class', 'queue-machine-concept-links')
      .selectAll('line')
      .data(simulation.force('link').links())
      .join('line')
      .attr('class', 'force-graph-link queue-machine-concept-edge');

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
      if (!fgUtils) return;
      fgUtils.applyLegendFilter(selections, function(n) { return n.group === group; }, { includeRelated: false });
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
