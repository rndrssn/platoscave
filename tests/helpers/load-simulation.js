'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadSimulationModule() {
  const simPath = path.join(__dirname, '..', '..', 'gc-simulation.js');
  const corePath = path.join(__dirname, '..', '..', 'gc-simulation-core.js');
  const simSource = fs.readFileSync(simPath, 'utf8');
  const coreSource = fs.readFileSync(corePath, 'utf8');
  const wrapped = coreSource + '\n' + simSource + '\nmodule.exports = { runGarbageCanSimulation, runGarbageCanSimulationAsync, validateSimulation, getGarbageCanDefaults };\n';

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
  vm.runInContext(wrapped, context, { filename: 'gc-simulation.bundle.js' });
  return context.module.exports;
}

module.exports = { loadSimulationModule };
