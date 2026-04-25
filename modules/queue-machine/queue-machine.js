'use strict';

(function initQueueMachinePage() {
  var model = window.QueueMachineModel;
  if (!model || !document || typeof document.querySelector !== 'function') return;

  var form = document.querySelector('[data-queue-controls]');
  var arrivalInput = document.getElementById('queue-arrival-rate');
  var serviceInput = document.getElementById('queue-service-rate');
  var arrivalVarInput = document.getElementById('queue-arrival-variability');
  var serviceVarInput = document.getElementById('queue-service-variability');
  var queueTrack = document.querySelector('[data-queue-track]');
  var station = document.querySelector('[data-queue-station]');
  var statusText = document.querySelector('[data-queue-status]');

  if (!form || !arrivalInput || !serviceInput || !arrivalVarInput || !serviceVarInput || !queueTrack) return;

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

  function updateQueueDots(workInSystem, utilization) {
    var safeWip = Number.isFinite(workInSystem) ? workInSystem : 24;
    var dotCount = Math.max(1, Math.min(28, Math.round(safeWip)));
    queueTrack.textContent = '';

    for (var i = 0; i < dotCount; i += 1) {
      var dot = document.createElement('span');
      dot.className = 'queue-machine-dot';
      dot.setAttribute('aria-hidden', 'true');
      if (i > 14) dot.classList.add('queue-machine-dot--overflow');
      queueTrack.appendChild(dot);
    }

    queueTrack.dataset.load = utilization >= 0.9 ? 'critical' : utilization >= 0.75 ? 'strained' : 'flowing';
  }

  function updateStation(utilization) {
    if (!station) return;
    station.dataset.load = utilization >= 0.9 ? 'critical' : utilization >= 0.75 ? 'strained' : 'flowing';
  }

  function updateStatus(utilization, stable) {
    if (!statusText) return;
    if (!stable) {
      statusText.textContent = 'Arrivals exceed service capacity. The queue is mathematically unstable.';
      return;
    }
    if (utilization >= 0.9) {
      statusText.textContent = 'Near saturation: small changes now create disproportionate waiting time.';
      return;
    }
    if (utilization >= 0.75) {
      statusText.textContent = 'Strained flow: useful work still exits, but slack is disappearing.';
      return;
    }
    statusText.textContent = 'Flow has breathing room. Variability can be absorbed before it becomes a queue.';
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
    var utilizationPercent = mm1.utilization * 100;

    setText(outputs.arrivalRate, formatNumber(input.arrivalRate, 2));
    setText(outputs.serviceRate, formatNumber(input.serviceRate, 2));
    setText(outputs.arrivalCv, formatNumber(input.arrivalCv, 2));
    setText(outputs.serviceCv, formatNumber(input.serviceCv, 2));
    setText(outputs.utilization, formatNumber(utilizationPercent, 1) + '%');
    setText(outputs.mm1LeadTime, formatNumber(mm1.systemLeadTime, 2));
    setText(outputs.kingmanWait, formatNumber(kingman.queueWaitTime, 2));
    setText(outputs.kingmanLeadTime, formatNumber(kingman.systemLeadTime, 2));
    setText(outputs.littleLawWip, formatNumber(little.workInSystem, 2));
    setText(outputs.variabilityFactor, formatNumber(kingman.variabilityFactor, 2));

    updateQueueDots(kingman.workInSystem, mm1.utilization);
    updateStation(mm1.utilization);
    updateStatus(mm1.utilization, mm1.stable);
  }

  form.addEventListener('input', render);
  render();
})();
