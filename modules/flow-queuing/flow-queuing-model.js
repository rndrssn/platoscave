'use strict';

(function initQueueMachineModel(root) {
  function finiteNumber(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function calculateLittleLaw(input) {
    var arrivalRate = finiteNumber(input && input.arrivalRate, 0);
    var leadTime = finiteNumber(input && input.leadTime, 0);
    return {
      arrivalRate: arrivalRate,
      leadTime: leadTime,
      workInSystem: arrivalRate * leadTime
    };
  }

  function calculateMM1(input) {
    var arrivalRate = finiteNumber(input && input.arrivalRate, 0);
    var serviceRate = finiteNumber(input && input.serviceRate, 1);
    if (serviceRate <= 0) {
      throw new Error('serviceRate must be greater than zero');
    }

    var utilization = arrivalRate / serviceRate;
    var stable = arrivalRate >= 0 && utilization < 1;
    if (!stable) {
      return {
        arrivalRate: arrivalRate,
        serviceRate: serviceRate,
        utilization: utilization,
        stable: false,
        systemLeadTime: Infinity,
        queueWaitTime: Infinity,
        workInSystem: Infinity,
        workInQueue: Infinity
      };
    }

    return {
      arrivalRate: arrivalRate,
      serviceRate: serviceRate,
      utilization: utilization,
      stable: true,
      systemLeadTime: 1 / (serviceRate - arrivalRate),
      queueWaitTime: utilization / (serviceRate - arrivalRate),
      workInSystem: utilization / (1 - utilization),
      workInQueue: (utilization * utilization) / (1 - utilization)
    };
  }

  function calculateKingman(input) {
    var arrivalRate = finiteNumber(input && input.arrivalRate, 0);
    var serviceRate = finiteNumber(input && input.serviceRate, 1);
    var arrivalCv = clamp(finiteNumber(input && input.arrivalCv, 1), 0, 3);
    var serviceCv = clamp(finiteNumber(input && input.serviceCv, 1), 0, 3);
    var mm1 = calculateMM1({ arrivalRate: arrivalRate, serviceRate: serviceRate });
    var serviceTime = serviceRate > 0 ? 1 / serviceRate : Infinity;
    var variabilityFactor = ((arrivalCv * arrivalCv) + (serviceCv * serviceCv)) / 2;

    if (!mm1.stable) {
      return {
        arrivalRate: arrivalRate,
        serviceRate: serviceRate,
        arrivalCv: arrivalCv,
        serviceCv: serviceCv,
        utilization: mm1.utilization,
        variabilityFactor: variabilityFactor,
        stable: false,
        serviceTime: serviceTime,
        queueWaitTime: Infinity,
        systemLeadTime: Infinity,
        workInSystem: Infinity
      };
    }

    var utilizationMultiplier = mm1.utilization / (1 - mm1.utilization);
    var queueWaitTime = utilizationMultiplier * variabilityFactor * serviceTime;
    var systemLeadTime = queueWaitTime + serviceTime;

    return {
      arrivalRate: arrivalRate,
      serviceRate: serviceRate,
      arrivalCv: arrivalCv,
      serviceCv: serviceCv,
      utilization: mm1.utilization,
      variabilityFactor: variabilityFactor,
      stable: true,
      serviceTime: serviceTime,
      queueWaitTime: queueWaitTime,
      systemLeadTime: systemLeadTime,
      workInSystem: arrivalRate * systemLeadTime
    };
  }

  function variabilityWave(index, length, variability, seed) {
    var s = finiteNumber(seed, 0);
    var phase = (Math.PI * 2 * index) / length + s;
    var fastPhase = (Math.PI * 10 * index) / length + (s * 1.7);
    var burstPulse = Math.pow(Math.max(0, Math.sin(phase - 0.8 + (s * 0.5))), 2.6);
    var wave = (Math.sin(phase) * 0.55) + (Math.sin(fastPhase + 1.2) * 0.22) + (burstPulse * 1.25);
    return Math.max(0.05, 1 + (variability * wave));
  }

  function normalizeSeries(rawValues, targetMean) {
    var total = rawValues.reduce(function sum(acc, value) {
      return acc + value;
    }, 0);
    var average = total / rawValues.length;
    if (average <= 0) return rawValues.map(function fallback() { return targetMean; });
    return rawValues.map(function scale(value) {
      return (value / average) * targetMean;
    });
  }

  function buildTimeline(input) {
    var buckets = Math.max(8, Math.min(48, Math.round(finiteNumber(input && input.buckets, 24))));
    var arrivalRate = finiteNumber(input && input.arrivalRate, 0);
    var serviceRate = finiteNumber(input && input.serviceRate, 1);
    var arrivalCv = clamp(finiteNumber(input && input.arrivalCv, 1), 0, 3);
    var serviceCv = clamp(finiteNumber(input && input.serviceCv, 1), 0, 3);
    var seed = finiteNumber(input && input.seed, 0);
    var arrivalVariability = Math.max(0, arrivalCv - 0.2);
    var serviceVariability = Math.max(0, serviceCv - 0.2) * 0.28;
    var rawArrivals = [];
    var rawCapacity = [];
    var backlog = 0;
    var totalBacklog = 0;
    var maxBacklog = 0;

    for (var i = 0; i < buckets; i += 1) {
      rawArrivals.push(arrivalRate * variabilityWave(i, buckets, arrivalVariability, seed));
      rawCapacity.push(serviceRate / variabilityWave(i + 5, buckets, serviceVariability, seed * 0.41));
    }

    var arrivals = normalizeSeries(rawArrivals, arrivalRate);
    var capacity = normalizeSeries(rawCapacity, serviceRate);
    var points = arrivals.map(function point(arrivalsValue, index) {
      var serviceCapacity = capacity[index];
      var beforeService = backlog + arrivalsValue;
      var served = Math.min(beforeService, serviceCapacity);
      backlog = Math.max(0, beforeService - served);
      totalBacklog += backlog;
      maxBacklog = Math.max(maxBacklog, backlog);
      return {
        bucket: index + 1,
        arrivals: arrivalsValue,
        capacity: serviceCapacity,
        served: served,
        backlog: backlog
      };
    });

    return {
      buckets: buckets,
      arrivalRate: arrivalRate,
      serviceRate: serviceRate,
      utilization: serviceRate > 0 ? arrivalRate / serviceRate : Infinity,
      averageBacklog: totalBacklog / buckets,
      maxBacklog: maxBacklog,
      points: points
    };
  }

  var api = {
    calculateLittleLaw: calculateLittleLaw,
    calculateMM1: calculateMM1,
    calculateKingman: calculateKingman,
    buildTimeline: buildTimeline
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.QueueMachineModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
