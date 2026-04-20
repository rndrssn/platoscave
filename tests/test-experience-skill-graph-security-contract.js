'use strict';

const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const graphPagePath = path.join(__dirname, '..', 'modules', 'experience-skill-graph', 'index.html');
const source = fs.readFileSync(graphPagePath, 'utf8');

function run() {
  assert(!/nodeDetailEl\.innerHTML\s*=/.test(source), 'Expected no innerHTML assignment for node detail sink');
  assert(/label\.textContent\s*=/.test(source), 'Expected node detail label to use textContent');
  assert(/DETAIL_TYPE_CLASS_BY_TYPE/.test(source), 'Expected explicit swatch class allowlist');
  console.log('PASS: tests/test-experience-skill-graph-security-contract.js');
}

run();
