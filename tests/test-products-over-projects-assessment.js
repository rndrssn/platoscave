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

  // Boundary: highest average just below 1.0 → light
  assert.strictEqual(
    assessment.classify(scores(1, 1, 0)),
    'light',
    'all averages below 1 should classify as light (boundary)'
  );

  // Boundary: control average exactly at high-override threshold → control
  assert.strictEqual(
    assessment.classify(scores(4, 4, 7)),
    'control',
    'control average at 2.33 (>=2.15) should override product/execution'
  );

  // Boundary: product just over asymmetry gap → product
  assert.strictEqual(
    assessment.classify(scores(12, 5, 2)),
    'product',
    'product average clearly above execution by more than 0.35 should classify as product'
  );

  // Boundary: execution just over asymmetry gap → execution
  assert.strictEqual(
    assessment.classify(scores(5, 12, 2)),
    'execution',
    'execution average clearly above product by more than 0.35 should classify as execution'
  );

  // Boundary: gap below 0.35 with both elevated → hybrid
  assert.strictEqual(
    assessment.classify(scores(9, 10, 2)),
    'hybrid',
    'gap less than 0.35 with both averages elevated should classify as hybrid'
  );

  console.log('PASS: tests/test-products-over-projects-assessment.js');
}

run();
