'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadSimulationModule() {
  const sourcePath = path.join(__dirname, '..', '..', 'gc-simulation.js');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const wrapped = source + '\nmodule.exports = { runGarbageCanSimulation, runGarbageCanSimulationAsync, validateSimulation };\n';

  const context = {
    module: { exports: {} },
    exports: {},
    require,
    console,
    Math,
    setTimeout,
    clearTimeout,
    window: {},
  };

  vm.createContext(context);
  vm.runInContext(wrapped, context, { filename: 'gc-simulation.js' });
  return context.module.exports;
}

module.exports = { loadSimulationModule };
