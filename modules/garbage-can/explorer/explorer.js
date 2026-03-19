'use strict';

/**
 * explorer.js
 * Simulation Explorer page — parameter selection and wiring
 *
 * Dependencies: d3.js, gc-simulation.js, gc-diagnosis.js, gc-viz.js
 */

// ─── Scroll restoration ──────────────────────────────────────────────────────
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ─── Nav toggle ──────────────────────────────────────────────────────────────
var navToggle = document.querySelector('.nav-mobile-toggle');
var navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', function() {
    var isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// ─── Dropdown helpers ─────────────────────────────────────────────────────────
function allDropdownsSelected() {
  var intensity = document.getElementById('panel-a-load').value;
  var inflow    = document.getElementById('panel-a-inflow').value;
  var decision  = document.getElementById('panel-a-decision').value;
  var access    = document.getElementById('panel-a-access').value;
  return intensity !== '' && inflow !== '' && decision !== '' && access !== '';
}

// ─── Diagnosis helper — updates title/body when all dropdowns have a value ────
function updateDiagnosis() {
  if (!allDropdownsSelected()) {
    document.getElementById('explorer-diagnosis').hidden = true;
    document.getElementById('explorer-sim-trigger').hidden = true;
    return;
  }

  var decision = document.getElementById('panel-a-decision').value;
  var access   = document.getElementById('panel-a-access').value;

  var diagnosis = getDiagnosis(decision, access, 0);

  // Strip the trailing percentage sentence — no simulation result yet
  var bodyText = diagnosis.body;
  bodyText = bodyText.replace(/In organisations like yours, roughly.*$/, '').trim();

  document.getElementById('explorer-diagnosis-title').textContent = diagnosis.title;
  document.getElementById('explorer-diagnosis-body').textContent  = bodyText;
  document.getElementById('explorer-diagnosis').hidden = false;
  document.getElementById('explorer-sim-trigger').hidden = false;
}

// ─── Simulation reset ─────────────────────────────────────────────────────────
function resetSimulation() {
  var svg = document.getElementById('viz-svg');
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  document.getElementById('sim-summary').hidden = true;
  document.getElementById('run-sim-btn').hidden = false;
  document.getElementById('replay-btn').hidden = true;
  document.getElementById('stochastic-note').hidden = true;

  if (allDropdownsSelected()) {
    document.getElementById('viz-area').hidden = false;
    drawEmptyState();
  } else {
    document.getElementById('viz-area').hidden = true;
  }
}

// ─── Dropdown change — update diagnosis and reset simulation ──────────────────
['panel-a-load', 'panel-a-inflow', 'panel-a-decision', 'panel-a-access'].forEach(function(id) {
  document.getElementById(id).addEventListener('change', function() {
    updateDiagnosis();
    resetSimulation();
  });
});

// ─── Run simulation button ────────────────────────────────────────────────────
document.getElementById('run-sim-btn').addEventListener('click', async function() {
  var intensity = document.getElementById('panel-a-load').value;
  var inflow    = document.getElementById('panel-a-inflow').value;
  var decision  = document.getElementById('panel-a-decision').value;
  var access    = document.getElementById('panel-a-access').value;
  var runBtn = document.getElementById('run-sim-btn');
  var originalText = runBtn.textContent;

  runBtn.disabled = true;
  runBtn.textContent = 'Running simulation...';
  try {
    var simResult = await runGarbageCanSimulationAsync({
      problemIntensity: intensity,
      problemInflow: inflow,
      decisionStructure: decision,
      accessStructure: access
    });
    runBtn.hidden = true;
    drawViz(simResult);
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = originalText;
  }
});

// ─── Replay button ────────────────────────────────────────────────────────────
document.getElementById('replay-btn').addEventListener('click', async function() {
  var intensity = document.getElementById('panel-a-load').value;
  var inflow    = document.getElementById('panel-a-inflow').value;
  var decision  = document.getElementById('panel-a-decision').value;
  var access    = document.getElementById('panel-a-access').value;
  var replayBtn = document.getElementById('replay-btn');
  var originalText = replayBtn.textContent;

  replayBtn.disabled = true;
  replayBtn.textContent = 'Running simulation...';
  try {
    var newSim = await runGarbageCanSimulationAsync({
      problemIntensity: intensity,
      problemInflow: inflow,
      decisionStructure: decision,
      accessStructure: access
    });
    drawViz(newSim);
  } finally {
    replayBtn.disabled = false;
    replayBtn.textContent = originalText;
  }
});
