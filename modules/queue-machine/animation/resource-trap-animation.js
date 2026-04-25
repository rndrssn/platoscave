'use strict';

(function initResourceTrapAnimation() {
  if (!window.d3 || !window.ResourceTrapSimulation || !document || typeof document.querySelector !== 'function') return;

  var svgEl = document.querySelector('[data-resource-trap-viz]');
  if (!svgEl) return;

  var d3 = window.d3;
  var controlsForm = document.querySelector('[data-resource-trap-controls]');
  var simulation = window.ResourceTrapSimulation.simulateResourceTrap();
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var duration = 18000;
  var activeTimer = null;
  var stations = [
    { key: 'a', label: 'A', x: 150 },
    { key: 'b', label: 'B', x: 335 },
    { key: 'c', label: 'C', x: 520 },
    { key: 'done', label: 'Done', x: 710 }
  ];
  var laneLayout = {
    busy: { y: 150 },
    flow: { y: 340 }
  };
  var outputs = {
    busy: {
      done: document.querySelector('[data-output="busy-done"]'),
      utilization: document.querySelector('[data-output="busy-utilization"]'),
      throughput: document.querySelector('[data-output="busy-throughput"]'),
      wip: document.querySelector('[data-output="busy-wip"]'),
      waiting: document.querySelector('[data-output="busy-waiting"]')
    },
    flow: {
      done: document.querySelector('[data-output="flow-done"]'),
      utilization: document.querySelector('[data-output="flow-utilization"]'),
      throughput: document.querySelector('[data-output="flow-throughput"]'),
      wip: document.querySelector('[data-output="flow-wip"]'),
      waiting: document.querySelector('[data-output="flow-waiting"]')
    },
    lesson: document.querySelector('[data-output="flow-lesson"]')
  };
  var controlOutputs = {
    demand: document.querySelector('[data-output="resource-demand"]'),
    burstiness: document.querySelector('[data-output="resource-burstiness"]'),
    taskVariation: document.querySelector('[data-output="resource-task-variation"]'),
    flowWipLimit: document.querySelector('[data-output="resource-flow-wip"]')
  };
  var lessons = [
    'Bursts arrive',
    'WIP piles up',
    'Slack protects flow',
    'Watch throughput'
  ];

  function cssValue(name, fallback) {
    var value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function setText(node, value) {
    if (node) node.textContent = value;
  }

  function formatRate(value) {
    return Number.isFinite(value) ? value.toFixed(2) : '0.00';
  }

  function formatPercent(value) {
    return Number.isFinite(value) ? Math.round(value * 100) + '%' : '0%';
  }

  function wordScale(value) {
    if (value <= 0.25) return 'low';
    if (value <= 0.5) return 'medium';
    if (value <= 0.75) return 'high';
    return 'very high';
  }

  function readControls() {
    if (!controlsForm) return window.ResourceTrapSimulation.DEFAULT_CONTROLS;
    return {
      demand: Number(controlsForm.elements.demand.value),
      burstiness: Number(controlsForm.elements.burstiness.value),
      taskVariation: Number(controlsForm.elements.taskVariation.value),
      flowWipLimit: Number(controlsForm.elements.flowWipLimit.value)
    };
  }

  function updateControlOutputs() {
    var controls = simulation.config.controls;
    setText(controlOutputs.demand, String(simulation.config.arrivals.length));
    setText(controlOutputs.burstiness, wordScale(controls.burstiness));
    setText(controlOutputs.taskVariation, wordScale(controls.taskVariation));
    setText(controlOutputs.flowWipLimit, String(controls.flowWipLimit));
  }

  function resetSimulationFromControls() {
    simulation = window.ResourceTrapSimulation.simulateResourceTrap(readControls());
    updateControlOutputs();
    draw();
  }

  function taskPosition(task, laneY) {
    if (task.state === 'not-arrived') {
      return { x: stations[0].x - 92, y: laneY + (task.jitter * 12), opacity: 0 };
    }
    if (task.state === 'intake') {
      return { x: stations[0].x - 78, y: laneY + (task.jitter * 12), opacity: 0.72 };
    }
    if (task.state === 'done') {
      return { x: stations[3].x + 38, y: laneY + (task.jitter * 12), opacity: 0.18 };
    }
    if (task.state === 'queued') {
      return {
        x: stations[task.station].x - 58 - (Math.max(0, task.queueIndex) * 12),
        y: laneY + (task.jitter * 12),
        opacity: 1
      };
    }

    var station = stations[task.station];
    var nextStation = stations[Math.min(task.station + 1, stations.length - 1)];
    return {
      x: d3.interpolateNumber(station.x - 22, nextStation.x - 38)(task.progress),
      y: laneY + Math.sin(task.progress * Math.PI * 2) * 4 + (task.jitter * 5),
      opacity: 1
    };
  }

  function renderFrame(root, progress) {
    var snapshots = simulation.snapshotsAt(progress);
    setText(outputs.lesson, lessons[Math.min(lessons.length - 1, Math.floor(progress * lessons.length))]);

    simulation.lanes.forEach(function renderLane(lane) {
      var snapshot = snapshots[lane.key];
      var laneOutput = outputs[lane.key];
      var laneGroup = root.select('[data-lane="' + lane.key + '"]');
      var laneY = laneLayout[lane.key].y;

      setText(laneOutput.done, String(snapshot.metrics.done));
      setText(laneOutput.utilization, formatPercent(snapshot.metrics.utilization));
      setText(laneOutput.throughput, formatRate(snapshot.metrics.throughput));
      setText(laneOutput.wip, String(snapshot.metrics.wip));
      setText(laneOutput.waiting, String(snapshot.metrics.waiting));

      laneGroup.selectAll('.queue-machine-resource-station')
        .classed('queue-machine-resource-station--busy', function isBusy(_, index) {
          return Boolean(snapshot.stationBusy[index]);
        });

      laneGroup.selectAll('.queue-machine-resource-item')
        .data(snapshot.tasks, function key(task) { return task.id; })
        .join('circle')
        .attr('class', 'queue-machine-resource-item queue-machine-resource-item--' + lane.key)
        .attr('r', function radius(task) { return task.state === 'intake' ? 6 : 8; })
        .attr('cx', function cx(task) { return taskPosition(task, laneY).x; })
        .attr('cy', function cy(task) { return taskPosition(task, laneY).y; })
        .attr('opacity', function opacity(task) { return taskPosition(task, laneY).opacity; });

      laneGroup.selectAll('.queue-machine-finished-pop')
        .data(snapshot.tasks.filter(function finished(task) { return task.state === 'done'; }), function key(task) { return task.id; })
        .join('circle')
        .attr('class', 'queue-machine-finished-pop queue-machine-finished-pop--' + lane.key)
        .attr('cx', function x(_, index) { return stations[3].x + 18 + (index * 13); })
        .attr('cy', laneY - 34)
        .attr('r', 5);
    });
  }

  function draw() {
    var rect = svgEl.getBoundingClientRect();
    var width = Math.max(720, Math.round(rect.width || 920));
    var height = 500;
    var ink = cssValue('--viz-ink', cssValue('--ink', '#161616'));
    var inkMid = cssValue('--viz-ink-faint', cssValue('--ink-mid', '#555555'));
    var inkGhost = cssValue('--viz-ink-ghost', cssValue('--ink-ghost', '#d8d2c7'));
    var paper = cssValue('--paper', '#f6efe2');
    var svg = d3.select(svgEl).attr('viewBox', '0 0 ' + width + ' ' + height);
    svg.selectAll('*').remove();
    if (activeTimer) {
      activeTimer.stop();
      activeTimer = null;
    }

    var xScale = d3.scaleLinear().domain([0, 840]).range([0, width]);
    var root = svg.append('g').attr('transform', 'translate(' + xScale(22) + ',0) scale(' + ((width - xScale(44)) / 840) + ',1)');

    simulation.lanes.forEach(function drawLane(lane) {
      var laneY = laneLayout[lane.key].y;
      var group = root.append('g').attr('data-lane', lane.key);
      group.append('line')
        .attr('class', 'queue-machine-resource-track')
        .attr('x1', stations[0].x - 92)
        .attr('x2', stations[3].x + 92)
        .attr('y1', laneY)
        .attr('y2', laneY)
        .attr('stroke', inkGhost);
      group.append('text')
        .attr('class', 'queue-machine-resource-title')
        .attr('x', stations[0].x - 94)
        .attr('y', laneY - 72)
        .attr('fill', ink)
        .text(lane.policy.label);
      group.append('text')
        .attr('class', 'queue-machine-resource-subtitle')
        .attr('x', stations[0].x - 94)
        .attr('y', laneY - 52)
        .attr('fill', inkMid)
        .text(lane.policy.mood + ' · WIP limit ' + lane.policy.wipLimit);

      group.selectAll('.queue-machine-resource-station')
        .data(stations)
        .join('g')
        .attr('class', 'queue-machine-resource-station')
        .attr('transform', function transform(station) { return 'translate(' + station.x + ',' + laneY + ')'; })
        .each(function stationEach(station, index) {
          var stationGroup = d3.select(this);
          stationGroup.append('circle')
            .attr('r', index === 3 ? 36 : 32)
            .attr('fill', index === 3 ? paper : 'transparent')
            .attr('stroke', index === 3 ? ink : inkMid)
            .attr('stroke-width', index === 3 ? 2 : 1);
          stationGroup.append('text')
            .attr('class', 'queue-machine-resource-station-label')
            .attr('text-anchor', 'middle')
            .attr('y', 5)
            .attr('fill', index === 3 ? ink : inkMid)
            .text(station.label);
        });
    });

    if (reduceMotion) {
      renderFrame(root, 0.88);
      return;
    }

    activeTimer = d3.timer(function tick(elapsed) {
      var progress = (elapsed % duration) / duration;
      renderFrame(root, progress);
      return false;
    });
  }

  draw();
  updateControlOutputs();
  if (controlsForm) controlsForm.addEventListener('input', resetSimulationFromControls);
  window.addEventListener('resize', draw);
})();
