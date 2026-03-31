'use strict';

(function(factory) {
  var config = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
  }
  if (typeof window !== 'undefined') {
    window.GcSimulationConfig = config;
  }
})(function createGcSimulationConfig() {
  var PERIODS = 20;   // simulation time ticks
  var V = 10;         // number of decision makers
  var M = 10;         // number of choice opportunities
  var W = 20;         // number of problems
  var SOL_COEFF = 0.6;  // energy scaling coefficient
  var ITERATIONS = 100; // Monte Carlo iterations per run

  var NET_ENERGY_LOADS = {
    light: 0.9,
    moderate: 1.6,
    heavy: 2.4,
  };

  var PROBLEM_INFLOW_SCHEDULES = {
    light: Array.from({ length: PERIODS }, function() { return 1; }),
    moderate: Array.from({ length: PERIODS }, function(_, t) { return t < 10 ? 2 : 0; }),
    heavy: Array.from({ length: PERIODS }, function(_, t) { return t < 5 ? 4 : 0; }),
  };

  var STATE_INACTIVE = -2;
  var STATE_ACTIVE = -1;
  var STATE_RESOLVED = -3;

  return {
    PERIODS: PERIODS,
    V: V,
    M: M,
    W: W,
    SOL_COEFF: SOL_COEFF,
    ITERATIONS: ITERATIONS,
    NET_ENERGY_LOADS: NET_ENERGY_LOADS,
    PROBLEM_INFLOW_SCHEDULES: PROBLEM_INFLOW_SCHEDULES,
    STATE_INACTIVE: STATE_INACTIVE,
    STATE_ACTIVE: STATE_ACTIVE,
    STATE_RESOLVED: STATE_RESOLVED,
  };
});
