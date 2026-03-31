'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadSimulationInternals(options) {
  const opts = options || {};
  const simPath = path.join(__dirname, '..', '..', 'modules', 'garbage-can', 'runtime', 'gc-simulation.js');
  const corePath = path.join(__dirname, '..', '..', 'modules', 'garbage-can', 'runtime', 'gc-simulation-core.js');
  const simSource = fs.readFileSync(simPath, 'utf8');
  const coreSource = fs.readFileSync(corePath, 'utf8');

  const customMath = Object.create(Math);
  if (typeof opts.random === 'function') {
    customMath.random = opts.random;
  }

  const wrapped = coreSource + '\n' + simSource + '\nmodule.exports = {\n  buildAccessMatrices,\n  buildDecisionMatrices,\n  buildEnergyVectors,\n  countDecisionTypes,\n  runGarbageCanSimulation,\n  runGarbageCanSimulationAsync,\n  getGarbageCanDefaults,\n  PERIODS,\n  M,\n  W,\n  V\n};\n';

  const context = {
    module: { exports: {} },
    exports: {},
    require,
    console,
    Math: customMath,
    setTimeout,
    clearTimeout,
    window: {},
  };

  vm.createContext(context);
  vm.runInContext(wrapped, context, { filename: 'gc-simulation.bundle.js' });
  return context.module.exports;
}

module.exports = { loadSimulationInternals };
