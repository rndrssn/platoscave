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

  var api = {
    calculateLittleLaw: calculateLittleLaw,
    calculateMM1: calculateMM1,
    calculateKingman: calculateKingman
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.QueueMachineModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
