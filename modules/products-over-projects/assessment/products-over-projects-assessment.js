'use strict';

(function initProductsOverProjectsAssessment(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  factory().init(root.document);
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildProductsOverProjectsAssessment() {
  var RESULT_COPY = {
    product: {
      title: 'Product uncertainty dominates',
      body: 'Treat discovery as a risk treatment. Reduce value, usability, feasibility, viability, and outcome uncertainty before converting the work into fixed-scope delivery governance.'
    },
    execution: {
      title: 'Execution risk dominates',
      body: 'Project or program governance is likely appropriate. Emphasize dependency management, planning, validation, readiness, and transition controls for a substantially known change.'
    },
    hybrid: {
      title: 'Hybrid governance is indicated',
      body: 'Separate assumption learning from delivery coordination. Use product-mode to reduce unresolved value and outcome uncertainty while project or program controls manage dependencies, sequencing, and readiness.'
    },
    control: {
      title: 'Formal risk/control governance is required',
      body: 'Hazard, assurance, or residual-acceptance exposure is high. Product learning and project delivery should operate inside explicit risk appetite, control design, evidence, authorization, and monitoring obligations.'
    },
    light: {
      title: 'Lightweight execution may be sufficient',
      body: 'Residual uncertainty appears low across product, execution, and control families. Use proportionate governance: clear ownership, acceptance criteria, basic quality checks, and monitoring for change in risk profile.'
    }
  };

  function readScores(form) {
    var scores = {
      product: 0,
      execution: 0,
      control: 0,
      counts: {
        product: 0,
        execution: 0,
        control: 0
      }
    };
    var inputs = form.querySelectorAll('input[type="range"][data-risk]');
    inputs.forEach(function(input) {
      var family = input.getAttribute('data-risk');
      var value = Number(input.value) || 0;
      if (!Object.prototype.hasOwnProperty.call(scores, family)) return;
      scores[family] += value;
      scores.counts[family] += 1;
    });
    return scores;
  }

  function average(scores, family) {
    return scores.counts[family] ? scores[family] / scores.counts[family] : 0;
  }

  function classify(scores) {
    var productAverage = average(scores, 'product');
    var executionAverage = average(scores, 'execution');
    var controlAverage = average(scores, 'control');
    var highest = Math.max(productAverage, executionAverage, controlAverage);

    // All averages below 1/3 of scale maximum — proportionate lightweight governance
    if (highest < 1) return 'light';
    // High harm/assurance exposure overrides product-vs-project arbitration
    if (controlAverage >= 2.15) return 'control';
    // Both product and execution high and similarly sized — separate learning from delivery
    if (productAverage >= 1.6 && executionAverage >= 1.6 && Math.abs(productAverage - executionAverage) < 0.45) {
      return 'hybrid';
    }
    // Product clearly dominates — 0.35 gap chosen to require material, not marginal, difference
    if (productAverage > executionAverage + 0.35) return 'product';
    // Execution clearly dominates — same 0.35 gap
    if (executionAverage > productAverage + 0.35) return 'execution';
    // Control is competitive with the leading family — formal framework warranted
    if (controlAverage >= 1.6 && controlAverage >= Math.max(productAverage, executionAverage) - 0.15) return 'control';
    return 'hybrid';
  }

  function updateOutputs(form) {
    var inputs = form.querySelectorAll('input[type="range"]');
    inputs.forEach(function(input) {
      var output = form.querySelector('output[for="' + input.id + '"]');
      if (output) output.textContent = input.value;
    });
  }

  function renderResult(doc, scores) {
    var kind = classify(scores);
    var copy = RESULT_COPY[kind];
    var title = doc.getElementById('risk-result-title');
    var body = doc.getElementById('risk-result-body');
    var productScore = doc.getElementById('risk-product-score');
    var executionScore = doc.getElementById('risk-execution-score');
    var controlScore = doc.getElementById('risk-control-score');

    if (title) title.textContent = copy.title;
    if (body) body.textContent = copy.body;
    if (productScore) productScore.textContent = scores.product + '/' + (scores.counts.product * 3);
    if (executionScore) executionScore.textContent = scores.execution + '/' + (scores.counts.execution * 3);
    if (controlScore) controlScore.textContent = scores.control + '/' + (scores.counts.control * 3);
  }

  function init(doc) {
    if (!doc) return;
    var form = doc.getElementById('risk-assessment');
    if (!form) return;

    function update() {
      updateOutputs(form);
      renderResult(doc, readScores(form));
    }

    form.addEventListener('input', update);
    update();
  }

  return {
    classify: classify,
    readScores: readScores,
    init: init
  };
}));
