'use strict';

const fs = require('fs');
const path = require('path');

const vizPath = path.join(__dirname, '..', 'gc-viz.js');
const source = fs.readFileSync(vizPath, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  assert(/const\s+CHOICE_RADIUS\s*=\s*30\s*;/.test(source), 'Expected CHOICE_RADIUS constant set to 30');

  const refs = source.match(/choiceRadius:\s*CHOICE_RADIUS/g) || [];
  assert(refs.length === 2, `Expected exactly 2 CHOICE_RADIUS references in VIZ_LAYOUT, got ${refs.length}`);

  const literalRadius = source.match(/choiceRadius:\s*\d+/g) || [];
  assert(literalRadius.length === 0, `Found literal choiceRadius values: ${literalRadius.join(', ')}`);

  console.log('PASS: tests/test-gc-viz-contract.js');
}

run();
