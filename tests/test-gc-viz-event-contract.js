'use strict';

const fs = require('fs');
const path = require('path');

const vizPath = path.join(__dirname, '..', 'gc-viz.js');
const source = fs.readFileSync(vizPath, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  assert(
    /function\s+collectChoiceDelta\s*\(/.test(source),
    'Expected shared collectChoiceDelta() helper for CO event semantics'
  );

  assert(
    /prevState === 'inactive' && currState === 'closed'/.test(source),
    'Expected inactive->closed transition handling in CO event semantics'
  );

  assert(
    /opened and closed/.test(source),
    'Expected explicit "opened and closed" legend wording'
  );

  assert(
    /No CO open\/close event/.test(source),
    'Expected explicit no-event wording for CO events'
  );

  console.log('PASS: tests/test-gc-viz-event-contract.js');
}

run();
