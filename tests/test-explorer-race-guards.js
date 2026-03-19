'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { FakeDocument, FakeElement, buildWindow } = require('./helpers/fake-dom');

function setup() {
  const document = new FakeDocument();
  const windowObj = buildWindow(document);

  document.register(new FakeElement('button', { className: 'nav-mobile-toggle' }));
  document.register(new FakeElement('div', { className: 'nav-links' }));

  ['panel-a-load', 'panel-a-inflow', 'panel-a-decision', 'panel-a-access',
   'explorer-diagnosis', 'explorer-sim-trigger', 'explorer-diagnosis-title', 'explorer-diagnosis-body',
   'viz-svg', 'sim-summary', 'run-sim-btn', 'replay-btn', 'stochastic-note', 'viz-area']
    .forEach((id) => document.register(new FakeElement(id === 'run-sim-btn' || id === 'replay-btn' ? 'button' : 'div', { id })));

  const load = document.getElementById('panel-a-load');
  const inflow = document.getElementById('panel-a-inflow');
  const decision = document.getElementById('panel-a-decision');
  const access = document.getElementById('panel-a-access');
  load.value = 'moderate';
  inflow.value = 'moderate';
  decision.value = 'hierarchical';
  access.value = 'hierarchical';

  let resolver;
  let calls = 0;
  const pending = new Promise((resolve) => { resolver = resolve; });

  const context = {
    window: windowObj,
    document,
    history: { scrollRestoration: 'auto' },
    drawEmptyState: function() {},
    drawViz: function() {},
    getDiagnosis: function() { return { title: 't', body: 'b In organisations like yours, roughly 10% of problems remain unresolved.' }; },
    runGarbageCanSimulationAsync: function() {
      calls++;
      return pending;
    },
    setTimeout: function(fn) { fn(); return 0; },
    clearTimeout: function() {},
    console,
  };

  const source = fs.readFileSync(path.join(__dirname, '..', 'modules', 'garbage-can', 'explorer', 'explorer.js'), 'utf8');
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'explorer.js' });

  return { document, callsRef: () => calls, resolve: resolver };
}

async function run() {
  const h = setup();
  const runBtn = h.document.getElementById('run-sim-btn');

  const firstRunPromise = runBtn.listeners.click[0].call(runBtn, { type: 'click', preventDefault: function() {} });
  runBtn.click();

  assert.strictEqual(h.callsRef(), 1, 'second click while disabled should not trigger another run');

  h.resolve({ ticks: [], resolution: 0, oversight: 0, flight: 0, problemResolved: 0, problemDisplaced: 0, problemAdrift: 0, problemInForum: 0 });
  await firstRunPromise;

  assert.strictEqual(runBtn.disabled, false, 'button should re-enable after pending run resolves');

  console.log('PASS: tests/test-explorer-race-guards.js');
}

run().catch((err) => {
  console.error('FAIL: tests/test-explorer-race-guards.js');
  console.error(err);
  process.exit(1);
});
