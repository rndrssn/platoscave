'use strict';

const assert = require('assert');
const path = require('path');

const assessment = require(path.join(
  __dirname,
  '..',
  'modules',
  'products-over-projects',
  'assessment',
  'products-over-projects-assessment.js'
));

function scores(product, execution, control) {
  return {
    product,
    execution,
    control,
    counts: {
      product: 5,
      execution: 5,
      control: 3,
    },
  };
}

function run() {
  assert.strictEqual(
    assessment.classify(scores(11, 4, 2)),
    'product',
    'high residual product uncertainty should classify as product-mode risk'
  );
  assert.strictEqual(
    assessment.classify(scores(4, 11, 2)),
    'execution',
    'high residual execution uncertainty should classify as project/program risk'
  );
  assert.strictEqual(
    assessment.classify(scores(10, 9, 2)),
    'hybrid',
    'high product and execution uncertainty should classify as hybrid governance'
  );
  assert.strictEqual(
    assessment.classify(scores(5, 4, 8)),
    'control',
    'high hazard/control exposure should override normal product/project classification'
  );
  assert.strictEqual(
    assessment.classify(scores(2, 2, 1)),
    'light',
    'low residual uncertainty should classify as lightweight execution'
  );

  console.log('PASS: tests/test-products-over-projects-assessment.js');
}

run();
