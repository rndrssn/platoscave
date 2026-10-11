// Explorer page wiring: parameter controls and simulation trigger for the Garbage Can module.
'use strict';

/**
 * explorer.js
 * Explore page — parameter selection and wiring
 *
 * Dependencies: d3.js + runtime files from ../runtime/
 */

// ─── Results mini-nav ────────────────────────────────────────────────────────
var resultsNav = document.getElementById('explorer-results-nav');
var resultsNavLinks = Array.from(document.querySelectorAll('.results-nav-link'));
var hasAutoNavigatedToResults = false;
var lastSimulationResult = null;
var simulationRequestVersion = 0;

function setSimError(message) {
  var simError = document.getElementById('explorer-sim-error');
  if (!simError) return;
  if (!message) {
    simError.hidden = true;
    simError.textContent = '';
    return;
  }
  simError.textContent = message;
  simError.hidden = false;
}
// gc-pressure-narrative.js from ../runtime/ is loaded before this file (see index.html script order).
// This wrapper exists to give the call site a named function and a clear dependency contract.
function buildExplorerNarrative(intensity, inflow, decision, access) {
  var narrative = window.buildGcPressureNarrative(intensity, inflow, decision, access);
  var schedules = { light: 'Ongoing issues: 1 per iteration for 20', moderate: 'Planning-period issues: 2 per iteration for 10', heavy: 'Backlog arrives in a burst: 4 per iteration for 5' };
  return {
    problemSummary: intensity.charAt(0).toUpperCase() + intensity.slice(1) + ' difficulty · ' + schedules[inflow],
    coordinationSummary: narrative.coordinationSummary,
    synthesis: 'Watch where problems and participant effort meet. Earlier arrivals can reach opportunities before they close; restricted access can concentrate problems or keep them apart. Compare problems solved with choices closed rather than assuming that more closures mean more resolution.'
  };
}


function setActiveResultsNav(targetId) {
  resultsNavLinks.forEach(function(link) {
    var isActive = link.getAttribute('data-section') === targetId;
    link.classList.toggle('results-nav-link--active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

resultsNavLinks.forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    var targetId = this.getAttribute('data-section');
    var target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveResultsNav(targetId);
  });
});

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
  var pressureBlock = document.getElementById('explorer-pressure-block');
  if (!allDropdownsSelected()) {
    document.getElementById('explorer-diagnosis').hidden = true;
    document.getElementById('explorer-sim-trigger').hidden = true;
    if (pressureBlock) pressureBlock.hidden = true;
    if (resultsNav) resultsNav.hidden = true;
    hasAutoNavigatedToResults = false;
    return;
  }

  var intensity = document.getElementById('panel-a-load').value;
  var inflow   = document.getElementById('panel-a-inflow').value;
  var decision = document.getElementById('panel-a-decision').value;
  var access   = document.getElementById('panel-a-access').value;

  var diagnosis = getDiagnosis(decision, access, 0);
  var narrative = buildExplorerNarrative(intensity, inflow, decision, access);

  // Strip the trailing percentage sentence — no simulation result yet.
  // getDiagnosisPreview() owns this regex (see gc-diagnosis.js).
  var bodyText = getDiagnosisPreview(diagnosis.body);

  document.getElementById('explorer-diagnosis-title').textContent = diagnosis.title;
  document.getElementById('explorer-diagnosis-body').textContent  = bodyText;
  var problemPressureEl = document.getElementById('explorer-problem-pressure');
  var coordinationPressureEl = document.getElementById('explorer-coordination-pressure');
  var comboNarrativeEl = document.getElementById('explorer-combo-narrative');
  if (problemPressureEl) problemPressureEl.textContent = narrative.problemSummary;
  if (coordinationPressureEl) coordinationPressureEl.textContent = narrative.coordinationSummary;
  if (comboNarrativeEl) comboNarrativeEl.textContent = narrative.synthesis;
  if (pressureBlock) pressureBlock.hidden = false;
  document.getElementById('explorer-diagnosis').hidden = false;
  document.getElementById('explorer-sim-trigger').hidden = false;
  if (resultsNav) resultsNav.hidden = false;
  setActiveResultsNav('explorer-diagnosis');

  if (!hasAutoNavigatedToResults) {
    document.getElementById('explorer-diagnosis').scrollIntoView({ behavior: 'smooth', block: 'start' });
    hasAutoNavigatedToResults = true;
  }
}

// ─── Simulation reset ─────────────────────────────────────────────────────────
function resetSimulation() {
  lastSimulationResult = null;
  simulationRequestVersion++;
  var generateButton = document.getElementById('generate-run-btn');
  if (generateButton) generateButton.hidden = true;
  if (typeof window.stopGcExplorerPlayback === 'function') window.stopGcExplorerPlayback();
  var svg = document.getElementById('viz-svg');
  if (svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }
  setSimError('');

  document.getElementById('sim-summary').hidden = true;
  document.getElementById('run-sim-btn').hidden = false;
  document.getElementById('replay-btn').hidden = true;
  document.getElementById('stochastic-note').hidden = true;

  if (allDropdownsSelected()) {
    document.getElementById('viz-area').hidden = false;
    drawEmptyState();
    setActiveResultsNav('explorer-diagnosis');
  } else {
    document.getElementById('viz-area').hidden = true;
  }
}

// ─── Dropdown change — update diagnosis and reset simulation ──────────────────
['panel-a-load', 'panel-a-inflow', 'panel-a-decision', 'panel-a-access'].forEach(function(id) {
  var select = document.getElementById(id);
  if (!select) return;
  select.addEventListener('change', function() {
    updateDiagnosis();
    resetSimulation();
    setSimError('');
  });
});

// ─── Run simulation button ────────────────────────────────────────────────────
var runSimBtn = document.getElementById('run-sim-btn');
var generateRunBtn = document.getElementById('generate-run-btn');
async function generateSimulation() {
  if (runSimBtn.disabled || (generateRunBtn && generateRunBtn.disabled)) return;
  var requestVersion = ++simulationRequestVersion;
  var intensity = document.getElementById('panel-a-load').value;
  var inflow    = document.getElementById('panel-a-inflow').value;
  var decision  = document.getElementById('panel-a-decision').value;
  var access    = document.getElementById('panel-a-access').value;
  var runBtn = document.getElementById('run-sim-btn');
  var originalText = runBtn.textContent;

  runBtn.disabled = true;
  if (generateRunBtn) generateRunBtn.disabled = true;
  if (replayBtnEl) replayBtnEl.disabled = true;
  runBtn.textContent = 'Running simulation...';
  try {
    var simResult = await runGarbageCanSimulationAsync({
      problemIntensity: intensity,
      problemInflow: inflow,
      decisionStructure: decision,
      accessStructure: access
    });
    if (requestVersion !== simulationRequestVersion) return;
    lastSimulationResult = simResult;
    runBtn.hidden = true;
    drawViz(simResult);
    setTimeout(centerSimulationCanvasInViewport, 80);
    setActiveResultsNav('viz-area');
    setSimError('');
  } catch (error) {
    if (requestVersion !== simulationRequestVersion) return;
    setSimError('Simulation failed. Please try again.');
    throw error;
  } finally {
    runBtn.disabled = false;
    if (generateRunBtn) generateRunBtn.disabled = false;
    if (replayBtnEl) replayBtnEl.disabled = false;
    runBtn.textContent = originalText;
  }
}
if (runSimBtn) runSimBtn.addEventListener('click', generateSimulation);
if (generateRunBtn) generateRunBtn.addEventListener('click', generateSimulation);

// ─── Replay button ────────────────────────────────────────────────────────────
var replayBtnEl = document.getElementById('replay-btn');
if (replayBtnEl) replayBtnEl.addEventListener('click', function() {
  if (!lastSimulationResult || replayBtnEl.disabled) return;
  drawViz(lastSimulationResult);
  setTimeout(centerSimulationCanvasInViewport, 80);
  setSimError('');
});
