'use strict';

/**
 * assess.js
 * Self-Assessment page — questionnaire flow and wiring
 *
 * Dependencies: d3.js, gc-simulation.js, gc-scoring.js, gc-diagnosis.js, gc-viz.js
 */

// ─── Scroll restoration ──────────────────────────────────────────────────────
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ─── Nav toggle ──────────────────────────────────────────────────────────────
document.querySelector('.nav-mobile-toggle').addEventListener('click', function () {
  document.querySelector('.nav-links').classList.toggle('is-open');
});

// ─── Questionnaire collapse/expand ───────────────────────────────────────────
document.getElementById('questionnaire-toggle').addEventListener('click', function () {
  var content = document.getElementById('questionnaire-content');
  content.hidden = !content.hidden;
  this.textContent = content.hidden ? 'Retake assessment' : 'Hide questionnaire';
  if (!content.hidden) {
    document.getElementById('stage-1').classList.remove('stage-collapsed');
    document.getElementById('results-area').classList.remove('is-visible');
    document.getElementById('diagnosis-title').textContent = '';
    document.getElementById('diagnosis-body').textContent = '';
    document.getElementById('diagnosis-links').hidden = true;
    var positioningSvg = document.getElementById('positioning-svg');
    if (positioningSvg) { while (positioningSvg.firstChild) positioningSvg.removeChild(positioningSvg.firstChild); }
    var vizSvg = document.getElementById('viz-svg');
    if (vizSvg) { while (vizSvg.firstChild) vizSvg.removeChild(vizSvg.firstChild); }
    document.getElementById('viz-area').hidden = true;
    document.getElementById('sim-summary').hidden = true;
    document.getElementById('run-sim-btn').hidden = false;
  }
});

// ─── Results mini-nav ────────────────────────────────────────────────────────
document.querySelectorAll('.results-nav-link').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    var targetId = this.getAttribute('data-section');
    document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update active state
    document.querySelectorAll('.results-nav-link').forEach(function(l) {
      l.classList.remove('results-nav-link--active');
    });
    this.classList.add('results-nav-link--active');
  });
});

// ─── Questionnaire step navigation ───────────────────────────────────────────
const Q_GROUPS = [
  { id: 'q-group-1', questions: ['q0', 'q1', 'q2', 'q3', 'q4'], errorId: 'form-error-1', continueId: 'q-continue-1' },
  { id: 'q-group-2', questions: ['q5', 'q6', 'q7'],             errorId: 'form-error-2', continueId: 'q-continue-2' },
  { id: 'q-group-3', questions: ['q8', 'q9', 'q10', 'q11'],     errorId: null,           continueId: null },
];

let currentGroup = 0;

function validateGroup(groupIdx) {
  const group = Q_GROUPS[groupIdx];
  for (let i = 0; i < group.questions.length; i++) {
    if (!document.querySelector(`input[name="${group.questions[i]}"]:checked`)) {
      return false;
    }
  }
  return true;
}

function advanceGroup(fromIdx) {
  const group = Q_GROUPS[fromIdx];
  if (!validateGroup(fromIdx)) {
    if (group.errorId) document.getElementById(group.errorId).hidden = false;
    return;
  }
  if (group.errorId) document.getElementById(group.errorId).hidden = true;

  // Hide current group
  document.getElementById(group.id).hidden = true;

  // Show next group
  currentGroup = fromIdx + 1;
  document.getElementById(Q_GROUPS[currentGroup].id).hidden = false;
  document.getElementById('q-step').textContent = `${currentGroup + 1} of 3`;

  // Scroll to top of next card — offset for fixed nav
  setTimeout(function() {
    var el = document.getElementById(Q_GROUPS[currentGroup].id);
    var navHeight = 72; // 4rem nav bar
    var y = el.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, 50);
}

document.getElementById('q-continue-1').addEventListener('click', function () {
  advanceGroup(0);
});

document.getElementById('q-continue-2').addEventListener('click', function () {
  advanceGroup(1);
});

// Enable submit button when all group 3 questions are answered
Q_GROUPS[2].questions.forEach(function(qName) {
  document.querySelectorAll('input[name="' + qName + '"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
      if (validateGroup(2)) {
        document.getElementById('submit-btn').disabled = false;
      }
    });
  });
});

// Enable Continue buttons when their group's questions are answered
[0, 1].forEach(function(groupIdx) {
  Q_GROUPS[groupIdx].questions.forEach(function(qName) {
    document.querySelectorAll('input[name="' + qName + '"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        if (validateGroup(groupIdx)) {
          document.getElementById(Q_GROUPS[groupIdx].continueId).disabled = false;
        }
      });
    });
  });
});

// ─── Stage reveal ─────────────────────────────────────────────────────────────
function showStage(id, delay) {
  setTimeout(() => {
    const el = document.getElementById(id);
    el.classList.add('is-visible');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, delay);
}

// ─── Form submission ──────────────────────────────────────────────────────────
document.getElementById('questionnaire').addEventListener('submit', function (e) {
  e.preventDefault();

  const responses = [];
  for (let i = 0; i < 12; i++) {
    const checked = this.querySelector(`input[name="q${i}"]:checked`);
    if (!checked) {
      document.getElementById('form-error').style.display = 'block';
      return;
    }
    responses.push(parseInt(checked.value, 10));
  }
  document.getElementById('form-error').style.display = 'none';

  const scoring = scoreResponses(responses);
  const { energyLoad, decisionStructure, accessStructure, raw } = scoring;

  console.log('Scoring output:', { energyLoad, decisionStructure, accessStructure, raw });

  const simResult = runGarbageCanSimulation({ energyLoad, decisionStructure, accessStructure });
  const { resolution, oversight, flight } = simResult;

  console.log('Simulation output:', { resolution, oversight, flight });

  const cluster   = DIAGNOSIS_CLUSTERS[`${decisionStructure}/${accessStructure}`] || 'cluster-3';
  const diagnosis = getDiagnosis(decisionStructure, accessStructure, flight + oversight);
  const { title } = diagnosis;

  console.log('Diagnosis:', { cluster, title });

  // Reveal results area
  showStage('results-area', 100);

  // Reset and collapse questionnaire
  document.querySelectorAll('#questionnaire input[type="radio"]').forEach(function(r) {
    r.checked = false;
  });
  document.getElementById('q-group-1').hidden = false;
  document.getElementById('q-group-2').hidden = true;
  document.getElementById('q-group-3').hidden = true;
  document.getElementById('q-step').textContent = '1 of 3';
  document.getElementById('q-continue-1').disabled = true;
  document.getElementById('q-continue-2').disabled = true;
  document.getElementById('submit-btn').disabled = true;
  document.getElementById('questionnaire-content').hidden = true;
  document.querySelector('.module-header').style.marginTop = '0';
  document.getElementById('questionnaire-toggle').hidden = false;
  document.getElementById('questionnaire-toggle').textContent = 'Retake assessment';
  document.getElementById('stage-1').classList.add('stage-collapsed');

  // Reset simulation area
  document.getElementById('viz-area').hidden = true;
  document.getElementById('run-sim-btn').hidden = false;
  document.getElementById('sim-summary').hidden = true;
  document.getElementById('replay-btn').hidden = true;
  document.getElementById('stochastic-note').hidden = true;

  // Diagnosis
  setTimeout(() => {
    document.getElementById('diagnosis-title').textContent = diagnosis.title;
    document.getElementById('diagnosis-body').textContent  = diagnosis.body;
    document.getElementById('diagnosis-links').hidden = false;
  }, 300);

  // Positioning
  setTimeout(() => {
    drawPositioning(raw);
    document.getElementById('positioning-caption').textContent =
      `Load: ${energyLoad}; Decision: ${decisionStructure}; Access: ${accessStructure}`;
  }, 500);

  // Show simulation area with empty state immediately
  document.getElementById('viz-area').hidden = false;
  drawEmptyState();

  // Parameters caption
  document.getElementById('viz-caption').textContent =
    `Parameters: ${energyLoad} load; ${decisionStructure} decision; ${accessStructure} access.`;

  // Simulation trigger — runs on button click
  document.getElementById('run-sim-btn').onclick = function () {
    document.getElementById('run-sim-btn').hidden = true;
    drawViz(simResult, energyLoad, decisionStructure, accessStructure);
    setTimeout(function() {
      var el = document.getElementById('viz-svg');
      var navHeight = 72; // 4rem nav bar
      var y = el.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }, 100);
  };

  // Replay button — closure over scoring params
  document.getElementById('replay-btn').onclick = function () {
    const newSim = runGarbageCanSimulation({ energyLoad, decisionStructure, accessStructure });
    drawViz(newSim, energyLoad, decisionStructure, accessStructure);
  };
});
