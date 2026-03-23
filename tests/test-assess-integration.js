'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { FakeDocument, FakeElement, buildWindow } = require('./helpers/fake-dom');

function loadAssessWithHarness(harness) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'modules', 'garbage-can', 'assess', 'assess.js'), 'utf8');
  const context = {
    window: harness.window,
    document: harness.document,
    history: { scrollRestoration: 'auto' },
    scoreResponses: harness.scoreResponses,
    getDiagnosis: harness.getDiagnosis,
    drawPositioning: harness.drawPositioning,
    drawEmptyState: harness.drawEmptyState,
    drawViz: harness.drawViz,
    runGarbageCanSimulationAsync: harness.runGarbageCanSimulationAsync,
    setTimeout: function(fn) { fn(); return 0; },
    clearTimeout: function() {},
    console,
  };

  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'assess.js' });
}

function makeAssessHarness() {
  const document = new FakeDocument();
  const windowObj = buildWindow(document);

  document.register(new FakeElement('button', { className: 'nav-mobile-toggle' }));
  document.register(new FakeElement('div', { className: 'nav-links' }));

  const ids = [
    'questionnaire-toggle', 'questionnaire-content', 'stage-1', 'results-area',
    'diagnosis-title', 'diagnosis-body', 'diagnosis-links', 'positioning-svg', 'viz-svg',
    'diagnosis-pressure-block', 'diagnosis-problem-pressure', 'diagnosis-coordination-pressure', 'diagnosis-pressure-narrative',
    'viz-area', 'sim-summary', 'run-sim-btn', 'replay-btn', 'stochastic-note', 'q-step',
    'q-group-1', 'q-group-2', 'q-group-3', 'q-continue-1', 'q-continue-2', 'submit-btn',
    'form-error-1', 'form-error-2', 'form-error', 'questionnaire', 'positioning-caption', 'viz-caption'
  ];

  ids.forEach((id) => {
    const tag = (id === 'questionnaire') ? 'form' : (id.includes('btn') || id.includes('continue') || id.includes('toggle')) ? 'button' : 'div';
    document.register(new FakeElement(tag, { id }));
  });

  document.getElementById('questionnaire-toggle').hidden = true;
  document.getElementById('diagnosis-pressure-block').hidden = true;
  document.getElementById('q-group-2').hidden = true;
  document.getElementById('q-group-3').hidden = true;
  document.getElementById('q-continue-1').disabled = true;
  document.getElementById('q-continue-2').disabled = true;
  document.getElementById('submit-btn').disabled = true;
  document.getElementById('form-error-1').hidden = true;
  document.getElementById('form-error-2').hidden = true;
  document.getElementById('form-error').hidden = true;
  document.getElementById('run-sim-btn').textContent = 'See how decisions play out';
  document.getElementById('replay-btn').textContent = 'Run simulation again';

  for (let i = 0; i < 12; i++) {
    document.register(new FakeElement('input', { id: 'q' + i + '-1', name: 'q' + i, value: '3', checked: false }));
  }

  let drawEmptyCalls = 0;
  let drawVizCalls = 0;
  let drawPositioningCalls = 0;
  let runImpl = function() {
    return Promise.resolve({ problemResolved: 0, ticks: [] });
  };

  return {
    document,
    window: windowObj,
    setRunImpl: function(fn) { runImpl = fn; },
    get drawVizCalls() { return drawVizCalls; },
    get drawEmptyCalls() { return drawEmptyCalls; },
    get drawPositioningCalls() { return drawPositioningCalls; },
    scoreResponses: function() {
      return {
        energyLoad: 'moderate',
        decisionStructure: 'hierarchical',
        accessStructure: 'hierarchical',
        raw: { energyScore: 3, decisionScore: 3, accessScore: 3 }
      };
    },
    getDiagnosis: function(_d, _a, unresolvedShare) {
      const pct = Math.round(unresolvedShare * 100);
      return {
        title: 'Diag',
        body: 'Body. In organisations like yours, roughly ' + pct + '% of problems remain unresolved.'
      };
    },
    drawPositioning: function() { drawPositioningCalls++; },
    drawEmptyState: function() { drawEmptyCalls++; },
    drawViz: function() { drawVizCalls++; },
    runGarbageCanSimulationAsync: function(params) { return runImpl(params); }
  };
}

async function run() {
  const h = makeAssessHarness();
  loadAssessWithHarness(h);

  const form = h.document.getElementById('questionnaire');
  const formError = h.document.getElementById('form-error');

  form.dispatchEvent({ type: 'submit', preventDefault: function() {} });
  assert.strictEqual(formError.hidden, false, 'form error should show when incomplete');

  for (let i = 0; i < 12; i++) {
    h.document.querySelector('input[name="q' + i + '"]').checked = true;
  }

  form.dispatchEvent({ type: 'submit', preventDefault: function() {} });

  assert.strictEqual(formError.hidden, true, 'form error should hide when complete');
  assert.strictEqual(h.document.getElementById('questionnaire-content').hidden, true, 'questionnaire should collapse after submit');
  assert.strictEqual(h.document.getElementById('questionnaire-toggle').hidden, false, 'retake toggle should appear after submit');
  assert.strictEqual(typeof h.document.getElementById('run-sim-btn').onclick, 'function', 'run button handler should be bound after submit');
  assert.strictEqual(h.document.getElementById('diagnosis-pressure-block').hidden, false, 'diagnosis pressure block should be visible after submit');
  assert(h.document.getElementById('diagnosis-problem-pressure').textContent.length > 0, 'problem pressure should be populated');
  assert(h.document.getElementById('diagnosis-coordination-pressure').textContent.length > 0, 'coordination pressure should be populated');
  assert(h.document.getElementById('diagnosis-pressure-narrative').textContent.length > 0, 'pressure narrative should be populated');
  assert(!/^Parameters:/.test(h.document.getElementById('viz-caption').textContent || ''), 'viz caption should not use raw Parameters label');
  assert(h.drawEmptyCalls > 0, 'empty state should be drawn after submit');
  assert(h.drawPositioningCalls > 0, 'positioning should be drawn after submit');

  const runBtn = h.document.getElementById('run-sim-btn');
  h.setRunImpl(function() {
    return Promise.resolve({
      problemResolved: 5,
      problemDisplaced: 3,
      problemAdrift: 4,
      problemInForum: 8,
      ticks: [{}, {}],
      resolution: 0.2,
      oversight: 0.5,
      flight: 0.3,
    });
  });

  await runBtn.onclick();
  assert.strictEqual(runBtn.disabled, false, 'run button should re-enable after success');
  assert.strictEqual(runBtn.hidden, true, 'run button should hide after success');
  assert.strictEqual(h.drawVizCalls, 1, 'drawViz should be called once after success');

  runBtn.hidden = false;
  h.setRunImpl(function() {
    return Promise.reject(new Error('sim failed'));
  });

  await assert.rejects(runBtn.onclick(), /sim failed/);
  assert.strictEqual(runBtn.disabled, false, 'run button should re-enable after failure');
  assert.strictEqual(runBtn.textContent, 'See how decisions play out', 'run button text should restore after failure');

  console.log('PASS: tests/test-assess-integration.js');
}

run().catch((err) => {
  console.error('FAIL: tests/test-assess-integration.js');
  console.error(err);
  process.exit(1);
});
