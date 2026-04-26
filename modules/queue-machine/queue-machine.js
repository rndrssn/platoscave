'use strict';

(function initQueueMachinePage() {
  var model = window.QueueMachineModel;
  if (!model || !document || typeof document.querySelector !== 'function') return;

  var form = document.querySelector('[data-queue-controls]');
  var arrivalInput = document.getElementById('queue-arrival-rate');
  var serviceInput = document.getElementById('queue-service-rate');
  var arrivalVarInput = document.getElementById('queue-arrival-variability');
  var serviceVarInput = document.getElementById('queue-service-variability');
  var arrivalsChart = document.querySelector('[data-queue-arrivals-chart]');
  var backlogChart = document.querySelector('[data-queue-backlog-chart]');
  var statusText = document.querySelector('[data-queue-status]');
  var presetButtons = document.querySelectorAll('[data-queue-preset]');
  var d3Lib = window.d3;

  if (!form || !arrivalInput || !serviceInput || !arrivalVarInput || !serviceVarInput || !arrivalsChart || !backlogChart || !d3Lib) return;

  var sessionSeed = Math.random() * Math.PI * 2;
  var reshuffleButton = document.querySelector('[data-queue-reshuffle]');
  var styleSwitcherButtons = document.querySelectorAll('[data-chart-style]');
  var STYLE_STORAGE_KEY = 'queue-machine-chart-style';
  var allowedStyles = ['p1m1', 'p2m1', 'p3m1', 'p4m2', 'p6m1'];
  var storedStyle = null;
  try { storedStyle = window.localStorage && localStorage.getItem(STYLE_STORAGE_KEY); } catch (e) { storedStyle = null; }
  var currentChartStyle = (allowedStyles.indexOf(storedStyle) >= 0) ? storedStyle : 'p1m1';

  var outputs = {
    arrivalRate: document.querySelector('[data-output="arrival-rate"]'),
    serviceRate: document.querySelector('[data-output="service-rate"]'),
    arrivalCv: document.querySelector('[data-output="arrival-cv"]'),
    serviceCv: document.querySelector('[data-output="service-cv"]'),
    utilization: document.querySelector('[data-output="utilization"]'),
    mm1LeadTime: document.querySelector('[data-output="mm1-lead-time"]'),
    kingmanWait: document.querySelector('[data-output="kingman-wait"]'),
    kingmanLeadTime: document.querySelector('[data-output="kingman-lead-time"]'),
    littleLawWip: document.querySelector('[data-output="little-law-wip"]'),
    variabilityFactor: document.querySelector('[data-output="variability-factor"]')
  };

  function numberFrom(input) {
    return Number(input.value);
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) return 'unstable';
    return value.toFixed(digits);
  }

  function setText(node, value) {
    if (node) node.textContent = value;
  }

  function updateStatus(utilization, stable, timeline) {
    if (!statusText) return;
    if (!stable) {
      statusText.textContent = 'Unstable: arrivals exceed service capacity. Notice how WIP and lead time stop being bounded.';
      return;
    }
    var backlogCopy = ' Peak simulated backlog: ' + formatNumber(timeline.maxBacklog, 1) + ' items.';
    if (timeline.maxBacklog >= 1 && utilization < 0.75) {
      statusText.textContent = 'Surprise: the system is not overloaded on average, but bursty work still creates a queue.' + backlogCopy + ' Utilization stayed at ' + formatNumber(utilization * 100, 1) + '%.';
      return;
    }
    if (utilization >= 0.9) {
      statusText.textContent = 'Near saturation: tiny changes now create disproportionate waiting.' + backlogCopy + ' Try lowering arrivals or variability.';
      return;
    }
    if (utilization >= 0.75) {
      statusText.textContent = 'Strained flow: useful work still exits, but slack is disappearing.' + backlogCopy + ' Utilization did not need to hit 100% for waiting to appear.';
      return;
    }
    statusText.textContent = 'Breathing room: variability can be absorbed before it becomes a queue.' + backlogCopy + ' This is what slack is buying.';
  }

  function setInputs(nextValues) {
    arrivalInput.value = String(nextValues.arrivalRate);
    serviceInput.value = String(nextValues.serviceRate);
    arrivalVarInput.value = String(nextValues.arrivalCv);
    serviceVarInput.value = String(nextValues.serviceCv);
    render();
  }

  function clearSvg(svgEl) {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  }

  function getChartSize(svgEl) {
    var rect = svgEl.getBoundingClientRect();
    return {
      width: Math.max(320, Math.round(rect.width || 640)),
      height: Math.max(220, Math.round(rect.height || 280))
    };
  }

  function cssValue(name, fallback) {
    var value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function drawArrivalMarks(chart, points, x, y, innerHeight) {
    var rustLight = cssValue('--viz-rust-light', 'currentColor');
    var sageLight = cssValue('--viz-sage-light', 'currentColor');
    var slateLight = cssValue('--slate-light', 'currentColor');
    var inkFaintLocal = cssValue('--viz-ink-faint', 'currentColor');
    var bandwidth = x.bandwidth();
    var style = currentChartStyle;
    var isOver = function(p) { return p.arrivals > p.capacity; };

    if (style === 'p1m1') {
      chart.selectAll('.queue-machine-arrival-bar')
        .data(points)
        .join('rect')
        .attr('class', 'queue-machine-arrival-bar')
        .attr('x', function(p) { return x(p.bucket); })
        .attr('y', function(p) { return y(p.arrivals); })
        .attr('width', bandwidth)
        .attr('height', function(p) { return innerHeight - y(p.arrivals); })
        .attr('fill', function(p) { return isOver(p) ? rustLight : sageLight; })
        .attr('fill-opacity', 0.6);
    } else if (style === 'p2m1') {
      chart.selectAll('.queue-machine-arrival-bar')
        .data(points)
        .join('rect')
        .attr('class', 'queue-machine-arrival-bar')
        .attr('x', function(p) { return x(p.bucket); })
        .attr('y', function(p) { return y(p.arrivals); })
        .attr('width', bandwidth)
        .attr('height', function(p) { return innerHeight - y(p.arrivals); })
        .attr('fill', rustLight)
        .attr('fill-opacity', function(p) { return isOver(p) ? 0.78 : 0.32; });
    } else if (style === 'p3m1') {
      // Bottom rect: portion within capacity
      chart.selectAll('.queue-machine-arrival-bar-ok')
        .data(points)
        .join('rect')
        .attr('class', 'queue-machine-arrival-bar-ok')
        .attr('x', function(p) { return x(p.bucket); })
        .attr('y', function(p) { return Math.max(y(p.arrivals), y(p.capacity)); })
        .attr('width', bandwidth)
        .attr('height', function(p) {
          return innerHeight - Math.max(y(p.arrivals), y(p.capacity));
        })
        .attr('fill', sageLight)
        .attr('fill-opacity', 0.5);
      // Top rect: overflow above capacity, only when isOver
      chart.selectAll('.queue-machine-arrival-bar-over')
        .data(points.filter(isOver))
        .join('rect')
        .attr('class', 'queue-machine-arrival-bar-over')
        .attr('x', function(p) { return x(p.bucket); })
        .attr('y', function(p) { return y(p.arrivals); })
        .attr('width', bandwidth)
        .attr('height', function(p) { return y(p.capacity) - y(p.arrivals); })
        .attr('fill', rustLight)
        .attr('fill-opacity', 0.65);
    } else if (style === 'p4m2') {
      // Slate lollipops
      chart.selectAll('.queue-machine-arrival-stick')
        .data(points)
        .join('line')
        .attr('class', 'queue-machine-arrival-stick')
        .attr('x1', function(p) { return x(p.bucket) + bandwidth / 2; })
        .attr('x2', function(p) { return x(p.bucket) + bandwidth / 2; })
        .attr('y1', innerHeight)
        .attr('y2', function(p) { return y(p.arrivals); })
        .attr('stroke', slateLight)
        .attr('stroke-opacity', 0.65)
        .attr('stroke-width', 1);
      chart.selectAll('.queue-machine-arrival-head')
        .data(points)
        .join('circle')
        .attr('class', 'queue-machine-arrival-head')
        .attr('cx', function(p) { return x(p.bucket) + bandwidth / 2; })
        .attr('cy', function(p) { return y(p.arrivals); })
        .attr('r', 2.6)
        .attr('fill', function(p) { return isOver(p) ? rustLight : slateLight; })
        .attr('fill-opacity', 0.9);
    } else if (style === 'p6m1') {
      chart.selectAll('.queue-machine-arrival-bar')
        .data(points)
        .join('rect')
        .attr('class', 'queue-machine-arrival-bar')
        .attr('x', function(p) { return x(p.bucket); })
        .attr('y', function(p) { return y(p.arrivals); })
        .attr('width', bandwidth)
        .attr('height', function(p) { return innerHeight - y(p.arrivals); })
        .attr('fill', function(p) { return isOver(p) ? rustLight : 'transparent'; })
        .attr('fill-opacity', function(p) { return isOver(p) ? 0.6 : 0; })
        .attr('stroke', function(p) { return isOver(p) ? 'transparent' : inkFaintLocal; })
        .attr('stroke-opacity', function(p) { return isOver(p) ? 0 : 0.55; })
        .attr('stroke-width', 1);
    }
  }

  function drawBacklogMarks(chart, points, x, y, innerHeight) {
    var rustLight = cssValue('--viz-rust-light', 'currentColor');
    var slateLight = cssValue('--slate-light', 'currentColor');
    var inkFaintLocal = cssValue('--viz-ink-faint', 'currentColor');
    var bandwidth = x.bandwidth();
    var style = currentChartStyle;

    if (style === 'p4m2') {
      chart.selectAll('.queue-machine-backlog-stick')
        .data(points)
        .join('line')
        .attr('class', 'queue-machine-backlog-stick')
        .attr('x1', function(p) { return x(p.bucket) + bandwidth / 2; })
        .attr('x2', function(p) { return x(p.bucket) + bandwidth / 2; })
        .attr('y1', innerHeight)
        .attr('y2', function(p) { return y(p.backlog); })
        .attr('stroke', slateLight)
        .attr('stroke-opacity', 0.7)
        .attr('stroke-width', 1);
      chart.selectAll('.queue-machine-backlog-head')
        .data(points)
        .join('circle')
        .attr('class', 'queue-machine-backlog-head')
        .attr('cx', function(p) { return x(p.bucket) + bandwidth / 2; })
        .attr('cy', function(p) { return y(p.backlog); })
        .attr('r', 2.6)
        .attr('fill', rustLight)
        .attr('fill-opacity', 0.9);
    } else if (style === 'p6m1') {
      chart.selectAll('.queue-machine-backlog-bar')
        .data(points)
        .join('rect')
        .attr('class', 'queue-machine-backlog-bar')
        .attr('x', function(p) { return x(p.bucket); })
        .attr('y', function(p) { return y(p.backlog); })
        .attr('width', bandwidth)
        .attr('height', function(p) { return innerHeight - y(p.backlog); })
        .attr('fill', 'transparent')
        .attr('stroke', rustLight)
        .attr('stroke-opacity', 0.65)
        .attr('stroke-width', 1);
    } else {
      // p1m1 / p2m1 / p3m1 → solid faded bars
      var opacity = (style === 'p2m1') ? 0.55 : 0.5;
      chart.selectAll('.queue-machine-backlog-bar')
        .data(points)
        .join('rect')
        .attr('class', 'queue-machine-backlog-bar')
        .attr('x', function(p) { return x(p.bucket); })
        .attr('y', function(p) { return y(p.backlog); })
        .attr('width', bandwidth)
        .attr('height', function(p) { return innerHeight - y(p.backlog); })
        .attr('fill', rustLight)
        .attr('fill-opacity', opacity);
    }
  }

  function renderArrivalsChart(timeline) {
    clearSvg(arrivalsChart);
    var size = getChartSize(arrivalsChart);
    var margin = { top: 16, right: 18, bottom: 32, left: 42 };
    var innerWidth = size.width - margin.left - margin.right;
    var innerHeight = size.height - margin.top - margin.bottom;
    var points = timeline.points;
    var maxY = d3Lib.max(points, function maxPoint(point) {
      return Math.max(point.arrivals, point.capacity);
    }) || 1;
    var x = d3Lib.scaleBand().domain(points.map(function key(point) { return point.bucket; })).range([0, innerWidth]).padding(0.16);
    var y = d3Lib.scaleLinear().domain([0, maxY * 1.18]).nice().range([innerHeight, 0]);
    var svg = d3Lib.select(arrivalsChart).attr('viewBox', '0 0 ' + size.width + ' ' + size.height);
    var chart = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    var ink = cssValue('--viz-ink', 'currentColor');
    var inkFaint = cssValue('--viz-ink-faint', 'currentColor');
    var inkGhost = cssValue('--viz-ink-ghost', 'currentColor');
    var rust = cssValue('--viz-rust-light', 'currentColor');
    var sage = cssValue('--viz-sage-light', 'currentColor');

    chart.append('g')
      .attr('class', 'queue-machine-axis')
      .attr('transform', 'translate(0,' + innerHeight + ')')
      .call(d3Lib.axisBottom(x).tickValues(x.domain().filter(function filter(_, index) { return index % 4 === 3; })).tickSizeOuter(0));
    chart.append('g')
      .attr('class', 'queue-machine-axis')
      .call(d3Lib.axisLeft(y).ticks(4).tickSize(0));

    drawArrivalMarks(chart, points, x, y, innerHeight);

    chart.append('path')
      .datum(points)
      .attr('class', 'queue-machine-capacity-line')
      .attr('fill', 'none')
      .attr('stroke', inkFaint)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 4')
      .attr('d', d3Lib.line()
        .x(function lineX(point) { return (x(point.bucket) || 0) + (x.bandwidth() / 2); })
        .y(function lineY(point) { return y(point.capacity); }));

    chart.append('text')
      .attr('class', 'queue-machine-chart-label')
      .attr('x', innerWidth)
      .attr('y', y(timeline.serviceRate))
      .attr('text-anchor', 'end')
      .attr('fill', inkFaint)
      .text('capacity');

    chart.selectAll('.domain').attr('stroke', inkGhost);
  }

  function renderBacklogChart(timeline) {
    clearSvg(backlogChart);
    var size = getChartSize(backlogChart);
    var margin = { top: 16, right: 18, bottom: 32, left: 42 };
    var innerWidth = size.width - margin.left - margin.right;
    var innerHeight = size.height - margin.top - margin.bottom;
    var points = timeline.points;
    var maxY = d3Lib.max(points, function maxPoint(point) { return point.backlog; }) || 1;
    var x = d3Lib.scaleBand().domain(points.map(function key(point) { return point.bucket; })).range([0, innerWidth]).padding(0.16);
    var y = d3Lib.scaleLinear().domain([0, maxY * 1.18]).nice().range([innerHeight, 0]);
    var svg = d3Lib.select(backlogChart).attr('viewBox', '0 0 ' + size.width + ' ' + size.height);
    var chart = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    var inkGhost = cssValue('--viz-ink-ghost', 'currentColor');
    var rust = cssValue('--viz-rust-light', 'currentColor');

    chart.append('g')
      .attr('class', 'queue-machine-axis')
      .attr('transform', 'translate(0,' + innerHeight + ')')
      .call(d3Lib.axisBottom(x).tickValues(x.domain().filter(function filter(_, index) { return index % 4 === 3; })).tickSizeOuter(0));
    chart.append('g')
      .attr('class', 'queue-machine-axis')
      .call(d3Lib.axisLeft(y).ticks(4).tickSize(0));

    drawBacklogMarks(chart, points, x, y, innerHeight);

    chart.selectAll('.domain').attr('stroke', inkGhost);
  }

  function render() {
    var input = {
      arrivalRate: numberFrom(arrivalInput),
      serviceRate: numberFrom(serviceInput),
      arrivalCv: numberFrom(arrivalVarInput),
      serviceCv: numberFrom(serviceVarInput)
    };

    var mm1 = model.calculateMM1(input);
    var kingman = model.calculateKingman(input);
    var little = model.calculateLittleLaw({
      arrivalRate: input.arrivalRate,
      leadTime: kingman.systemLeadTime
    });
    var timeline = model.buildTimeline({
      arrivalRate: input.arrivalRate,
      serviceRate: input.serviceRate,
      arrivalCv: input.arrivalCv,
      serviceCv: input.serviceCv,
      buckets: 24,
      seed: sessionSeed
    });
    var utilizationPercent = mm1.utilization * 100;

    setText(outputs.arrivalRate, formatNumber(input.arrivalRate, 1));
    setText(outputs.serviceRate, formatNumber(input.serviceRate, 1));
    setText(outputs.arrivalCv, formatNumber(input.arrivalCv, 1));
    setText(outputs.serviceCv, formatNumber(input.serviceCv, 1));
    setText(outputs.utilization, formatNumber(utilizationPercent, 1) + '%');
    setText(outputs.mm1LeadTime, formatNumber(mm1.systemLeadTime, 1));
    setText(outputs.kingmanWait, formatNumber(kingman.queueWaitTime, 1));
    setText(outputs.kingmanLeadTime, formatNumber(kingman.systemLeadTime, 1));
    setText(outputs.littleLawWip, formatNumber(little.workInSystem, 1));
    setText(outputs.variabilityFactor, formatNumber(kingman.variabilityFactor, 1));

    renderArrivalsChart(timeline);
    renderBacklogChart(timeline);
    updateStatus(mm1.utilization, mm1.stable, timeline);
  }

  form.addEventListener('input', render);
  window.addEventListener('resize', render);
  if (reshuffleButton) {
    reshuffleButton.addEventListener('click', function onReshuffle() {
      sessionSeed = Math.random() * Math.PI * 2;
      render();
    });
  }

  function applyStyleSwitcherState() {
    styleSwitcherButtons.forEach(function(btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-chart-style') === currentChartStyle ? 'true' : 'false');
    });
  }
  applyStyleSwitcherState();
  styleSwitcherButtons.forEach(function(btn) {
    btn.addEventListener('click', function onStyleClick() {
      var next = btn.getAttribute('data-chart-style');
      if (allowedStyles.indexOf(next) < 0 || next === currentChartStyle) return;
      currentChartStyle = next;
      try { window.localStorage && localStorage.setItem(STYLE_STORAGE_KEY, currentChartStyle); } catch (e) { /* ignore */ }
      applyStyleSwitcherState();
      render();
    });
  });
  presetButtons.forEach(function bindPreset(button) {
    button.addEventListener('click', function onPresetClick() {
      var preset = button.getAttribute('data-queue-preset');
      if (preset === 'breathing') {
        setInputs({ arrivalRate: 0.48, serviceRate: 1.00, arrivalCv: 0.70, serviceCv: 0.80 });
      } else if (preset === 'strained') {
        setInputs({ arrivalRate: 0.78, serviceRate: 1.00, arrivalCv: 1.00, serviceCv: 1.00 });
      } else if (preset === 'saturated') {
        setInputs({ arrivalRate: 0.94, serviceRate: 1.00, arrivalCv: 1.00, serviceCv: 1.00 });
      } else if (preset === 'bursty') {
        setInputs({ arrivalRate: 0.72, serviceRate: 1.00, arrivalCv: 1.65, serviceCv: 1.80 });
      }
    });
  });
  render();
})();
