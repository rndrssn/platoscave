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
    var ink = cssValue('--viz-ink', '#161616');
    var inkFaint = cssValue('--viz-ink-faint', '#555555');
    var inkGhost = cssValue('--viz-ink-ghost', '#d8d2c7');
    var rust = cssValue('--viz-rust', '#b54a2a');
    var sage = cssValue('--viz-sage', '#6f7f61');

    chart.append('g')
      .attr('class', 'queue-machine-axis')
      .attr('transform', 'translate(0,' + innerHeight + ')')
      .call(d3Lib.axisBottom(x).tickValues(x.domain().filter(function filter(_, index) { return index % 4 === 3; })).tickSizeOuter(0));
    chart.append('g')
      .attr('class', 'queue-machine-axis')
      .call(d3Lib.axisLeft(y).ticks(4).tickSize(-innerWidth));

    chart.selectAll('.queue-machine-arrival-bar')
      .data(points)
      .join('rect')
      .attr('class', 'queue-machine-arrival-bar')
      .attr('x', function barX(point) { return x(point.bucket); })
      .attr('y', function barY(point) { return y(point.arrivals); })
      .attr('width', x.bandwidth())
      .attr('height', function barHeight(point) { return innerHeight - y(point.arrivals); })
      .attr('fill', function fill(point) { return point.arrivals > point.capacity ? rust : sage; });

    chart.append('path')
      .datum(points)
      .attr('class', 'queue-machine-capacity-line')
      .attr('fill', 'none')
      .attr('stroke', ink)
      .attr('stroke-width', 2)
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
    var inkGhost = cssValue('--viz-ink-ghost', '#d8d2c7');
    var rust = cssValue('--viz-rust', '#b54a2a');

    chart.append('g')
      .attr('class', 'queue-machine-axis')
      .attr('transform', 'translate(0,' + innerHeight + ')')
      .call(d3Lib.axisBottom(x).tickValues(x.domain().filter(function filter(_, index) { return index % 4 === 3; })).tickSizeOuter(0));
    chart.append('g')
      .attr('class', 'queue-machine-axis')
      .call(d3Lib.axisLeft(y).ticks(4).tickSize(-innerWidth));

    chart.selectAll('.queue-machine-backlog-bar')
      .data(points)
      .join('rect')
      .attr('class', 'queue-machine-backlog-bar')
      .attr('x', function barX(point) { return x(point.bucket); })
      .attr('y', function barY(point) { return y(point.backlog); })
      .attr('width', x.bandwidth())
      .attr('height', function barHeight(point) { return innerHeight - y(point.backlog); })
      .attr('fill', rust);

    chart.append('path')
      .datum(points)
      .attr('class', 'queue-machine-backlog-line')
      .attr('fill', 'none')
      .attr('stroke', rust)
      .attr('stroke-width', 2)
      .attr('d', d3Lib.line()
        .x(function lineX(point) { return (x(point.bucket) || 0) + (x.bandwidth() / 2); })
        .y(function lineY(point) { return y(point.backlog); }));

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
      buckets: 24
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
