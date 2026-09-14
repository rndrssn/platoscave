// Interdependence cost visualisation: renders the Design Structure Matrix rework scenario and its explicit assumptions.
'use strict';

(function initInterdependenceCostPage() {
  var model = window.InterdependenceCostModel;
  var d3Lib = window.d3;
  var lab = document.querySelector('[data-cost-lab]');
  if (!model || !lab) return;

  var controls = {
    dependence: document.getElementById('cost-dependence'),
    retraction: document.getElementById('cost-retraction'),
    latency: document.getElementById('cost-latency'),
    releaseRate: document.getElementById('cost-release-rate'),
    feedbackGain: document.getElementById('cost-feedback-gain'),
    exchanges: document.getElementById('cost-exchanges'),
    coordinationCost: document.getElementById('cost-coordination-cost')
  };
  var outputs = {
    dependence: lab.querySelector('[data-output="dependence"]'),
    retraction: lab.querySelector('[data-output="retraction"]'),
    latency: lab.querySelector('[data-output="latency"]'),
    releaseRate: lab.querySelector('[data-output="release-rate"]'),
    feedbackGain: lab.querySelector('[data-output="feedback-gain"]'),
    exchanges: lab.querySelector('[data-output="exchanges"]'),
    coordinationCost: lab.querySelector('[data-output="coordination-cost"]')
  };
  var title = lab.querySelector('[data-cost-title]');
  var summary = lab.querySelector('[data-cost-summary]');
  var planOutput = lab.querySelector('[data-cost-plan]');
  var fitOutput = lab.querySelector('[data-cost-fit]');
  var mismatchOutput = lab.querySelector('[data-cost-mismatch]');
  var chart = lab.querySelector('[data-cost-chart]');
  var fallback = lab.querySelector('[data-cost-fallback]');
  var resizeTimer = null;

  function inputValues() {
    return {
      dependence: Number(controls.dependence.value),
      retraction: Number(controls.retraction.value),
      latency: Number(controls.latency.value),
      releaseRate: Number(controls.releaseRate.value),
      feedbackGain: Number(controls.feedbackGain.value),
      exchanges: Number(controls.exchanges.value),
      coordinationCost: Number(controls.coordinationCost.value)
    };
  }

  function format(value) {
    return Math.round(value).toLocaleString();
  }

  function renderReadout(scenario) {
    var totals = scenario.totals;
    var ratio = totals.mismatch / totals.fit;
    if (title) title.textContent = scenario.mismatchSeed < 0.01 ? 'No retractive work is included in this scenario' : 'Delayed adjustment reaches ' + ratio.toFixed(1) + '× the short-loop scenario';
    if (summary) summary.textContent = scenario.mismatchSeed < 0.01
      ? 'No work is set to retract, so the only additional effort is the short-loop coordination effort.'
      : 'The delayed path starts with ' + format(scenario.mismatchSeed) + ' index units of exposed work, compared with ' + format(scenario.fitSeed) + ' under a one-week adjustment loop. Feedback passes ' + Math.round(scenario.spectralRadius * 100) + '% of rework to the counterpart activity in each round.';
    if (planOutput) planOutput.textContent = format(totals.planned);
    if (fitOutput) fitOutput.textContent = format(totals.fit);
    if (mismatchOutput) mismatchOutput.textContent = format(totals.mismatch);
  }

  function cssValue(name, fallbackValue) {
    var value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallbackValue;
  }

  function renderChart(scenario) {
    if (!chart || !d3Lib) return;
    var rect = chart.getBoundingClientRect();
    var width = Math.max(300, Math.round(rect.width || 680));
    var height = 360;
    var margin = { top: 66, right: 20, bottom: 42, left: 48 };
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;
    var maxValue = d3Lib.max(scenario.series, function(point) { return Math.max(point.planned, point.fit, point.mismatch); }) || 100;
    var x = d3Lib.scaleLinear().domain([0, scenario.input.exchanges]).range([0, innerWidth]);
    var y = d3Lib.scaleLinear().domain([0, maxValue * 1.1]).nice().range([innerHeight, 0]);
    var svg = d3Lib.select(chart).attr('viewBox', '0 0 ' + width + ' ' + height);
    svg.selectAll('*').remove();
    var plot = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    var inkGhost = cssValue('--ink-ghost', '#c8bda8');
    var inkFaint = cssValue('--ink-faint', '#8a806f');
    var sage = cssValue('--sage', '#788b5a');
    var rust = cssValue('--rust', '#a34b38');
    var slate = cssValue('--slate', '#58727d');
    var series = [
      { key: 'planned', label: 'Direct plan · B', color: slate },
      { key: 'fit', label: 'Short loop · C_short', color: sage },
      { key: 'mismatch', label: 'Delayed adjustment · C_delayed', color: rust }
    ];

    plot.append('g').attr('class', 'interdependence-chart-axis').attr('transform', 'translate(0,' + innerHeight + ')').call(d3Lib.axisBottom(x).ticks(scenario.input.exchanges).tickFormat(function(value) { return value === 0 ? 'Discovery' : value; }).tickSizeOuter(0));
    plot.append('g').attr('class', 'interdependence-chart-axis').call(d3Lib.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(function(value) { return value; }));
    plot.selectAll('.domain').attr('stroke', inkGhost);
    plot.selectAll('.tick line').attr('stroke', inkGhost).attr('stroke-opacity', 0.55);
    plot.selectAll('.tick text').attr('fill', inkFaint);
    plot.append('text').attr('class', 'interdependence-chart-axis-label').attr('x', innerWidth / 2).attr('y', innerHeight + 38).attr('text-anchor', 'middle').attr('fill', inkFaint).text('Rework-propagation round (k)');
    plot.append('text').attr('class', 'interdependence-chart-axis-label').attr('transform', 'rotate(-90)').attr('x', -innerHeight / 2).attr('y', -36).attr('text-anchor', 'middle').attr('fill', inkFaint).text('Cumulative effort index (direct plan = 100)');

    series.forEach(function(definition) {
      plot.append('path').datum(scenario.series).attr('fill', 'none').attr('stroke', definition.color).attr('stroke-width', 2).attr('d', d3Lib.line().x(function(point) { return x(point.exchange); }).y(function(point) { return y(point[definition.key]); }));
      plot.selectAll('.dot-' + definition.key).data(scenario.series).join('circle').attr('class', 'dot-' + definition.key).attr('cx', function(point) { return x(point.exchange); }).attr('cy', function(point) { return y(point[definition.key]); }).attr('r', 2.7).attr('fill', definition.color);
    });

    var legend = svg.append('g').attr('class', 'interdependence-chart-legend').attr('transform', 'translate(' + margin.left + ',14)');
    series.forEach(function(definition, index) {
      var item = legend.append('g').attr('transform', 'translate(0,' + (index * 16) + ')');
      item.append('line').attr('x1', 0).attr('x2', 16).attr('stroke', definition.color).attr('stroke-width', 2);
      item.append('text').attr('x', 22).attr('y', 3).attr('fill', inkFaint).text(definition.label);
    });
  }

  function render() {
    var values = inputValues();
    Object.keys(values).forEach(function(key) {
      if (outputs[key]) outputs[key].textContent = values[key];
      var suffix = controls[key].getAttribute('data-value-suffix');
      controls[key].setAttribute('aria-valuetext', values[key] + (suffix.charAt(0) === '%' ? '' : ' ') + suffix);
    });
    var scenario = model.buildScenario(values);
    renderReadout(scenario);
    if (d3Lib && chart) {
      if (fallback) fallback.hidden = true;
      renderChart(scenario);
    }
  }

  Object.keys(controls).forEach(function(key) { controls[key].addEventListener('input', render); });
  window.addEventListener('resize', function() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(render, 120);
  });
  render();
}());
