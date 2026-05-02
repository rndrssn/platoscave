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

    if (highest < 1) return 'light';
    if (controlAverage >= 2.15) return 'control';
    if (productAverage >= 1.6 && executionAverage >= 1.6 && Math.abs(productAverage - executionAverage) < 0.45) {
      return 'hybrid';
    }
    if (productAverage > executionAverage + 0.35) return 'product';
    if (executionAverage > productAverage + 0.35) return 'execution';
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
    if (productScore) productScore.textContent = scores.product + '/15';
    if (executionScore) executionScore.textContent = scores.execution + '/15';
    if (controlScore) controlScore.textContent = scores.control + '/9';
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
