'use strict';

const assert = require('assert');
const path = require('path');

const {
  calculateLittleLaw,
  calculateMM1,
  calculateKingman,
} = require(path.join(__dirname, '..', 'modules', 'queue-machine', 'queue-machine-model.js'));

function nearlyEqual(actual, expected, epsilon, label) {
  assert(
    Math.abs(actual - expected) <= epsilon,
    label + ': expected ' + expected + ', received ' + actual
  );
}

function run() {
  const little = calculateLittleLaw({ arrivalRate: 4, leadTime: 2.5 });
  nearlyEqual(little.workInSystem, 10, 1e-12, 'Little Law L = lambda W');

  const mm1 = calculateMM1({ arrivalRate: 0.8, serviceRate: 1 });
  assert.strictEqual(mm1.stable, true, 'M/M/1 should be stable below capacity');
  nearlyEqual(mm1.utilization, 0.8, 1e-12, 'M/M/1 utilization');
  nearlyEqual(mm1.systemLeadTime, 5, 1e-12, 'M/M/1 W = 1 / (mu - lambda)');
  nearlyEqual(mm1.queueWaitTime, 4, 1e-12, 'M/M/1 Wq = rho / (mu - lambda)');
  nearlyEqual(mm1.workInSystem, 4, 1e-12, 'M/M/1 L = rho / (1 - rho)');
  nearlyEqual(mm1.workInQueue, 3.2, 1e-12, 'M/M/1 Lq = rho squared / (1 - rho)');

  const unstable = calculateMM1({ arrivalRate: 1.1, serviceRate: 1 });
  assert.strictEqual(unstable.stable, false, 'M/M/1 should be unstable at or above capacity');
  assert.strictEqual(unstable.systemLeadTime, Infinity, 'unstable M/M/1 lead time should be infinite');

  const kingman = calculateKingman({
    arrivalRate: 0.8,
    serviceRate: 1,
    arrivalCv: 1,
    serviceCv: 1,
  });
  nearlyEqual(kingman.variabilityFactor, 1, 1e-12, 'Kingman variability factor for M/M/1-like CVs');
  nearlyEqual(kingman.queueWaitTime, 4, 1e-12, 'Kingman Wq with ca=cs=1 equals M/M/1 queue wait');
  nearlyEqual(kingman.systemLeadTime, 5, 1e-12, 'Kingman W = Wq + E[S]');
  nearlyEqual(kingman.workInSystem, 4, 1e-12, 'Kingman L from Little Law');

  const lowerVariability = calculateKingman({
    arrivalRate: 0.8,
    serviceRate: 1,
    arrivalCv: 0.5,
    serviceCv: 0.5,
  });
  assert(
    lowerVariability.queueWaitTime < kingman.queueWaitTime,
    'Lower variability should reduce Kingman queue wait at fixed utilization'
  );

  console.log('PASS: tests/test-queue-machine-model.js');
}

run();
