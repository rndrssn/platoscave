'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

const flowCss = read('css/pages/flow-queuing.css');
const conceptJs = read('modules/flow-queuing/concept-graph/concept-graph.js');
const skillsHtml = read('modules/experience-skill-graph/index.html');

assert(
  flowCss.includes('--force-graph-label-size: 10px;'),
  'Flow & Queuing Concept Map labels should match the Skills graph 10px label size'
);

assert(
  !flowCss.includes('--force-graph-label-size: 15px;'),
  'Flow & Queuing Concept Map labels should not return to oversized 15px labels'
);

assert(
  skillsHtml.includes('var labelFont = smallMobile ? 10 : (mobile ? 10 : 10);'),
  'Skills graph label size reference changed; update the Concept Map label-size contract'
);

assert(
  conceptJs.includes(".attr('class', 'force-graph-label queue-machine-concept-label')"),
  'Concept Map labels should keep using shared force-graph label classes'
);

console.log('PASS: tests/test-flow-queuing-concept-graph-contract.js');
