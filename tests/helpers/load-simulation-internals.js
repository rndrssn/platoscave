'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadSimulationInternals(options) {
  const opts = options || {};
  const sourcePath = path.join(__dirname, '..', '..', 'gc-simulation.js');
  const source = fs.readFileSync(sourcePath, 'utf8');

  const customMath = Object.create(Math);
  if (typeof opts.random === 'function') {
    customMath.random = opts.random;
  }

  const wrapped = source + '\nmodule.exports = {\n  buildAccessMatrices,\n  buildDecisionMatrices,\n  buildEnergyVectors,\n  countDecisionTypes,\n  runGarbageCanSimulation,\n  runGarbageCanSimulationAsync,\n  getGarbageCanDefaults,\n  PERIODS,\n  M,\n  W,\n  V\n};\n';

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
  vm.runInContext(wrapped, context, { filename: 'gc-simulation.js' });
  return context.module.exports;
}

module.exports = { loadSimulationInternals };
