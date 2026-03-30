'use strict';

const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'mix-mapper.js'),
  'utf8'
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testAssumptionRoleClassifierExists() {
  assert(
    /function\s+getAssumptionRole\s*\(link\)\s*\{/.test(source),
    'Expected getAssumptionRole(link) helper'
  );
  assert(
    /if\s*\(link\.lane === 'traditional' && link\.kind === 'primary'\)\s*return 'certainty';/.test(source),
    'Expected traditional primary links to map to certainty role'
  );
  assert(
    /if\s*\(link\.lane === 'complexity' && \(link\.kind === 'feedback' \|\| link\.kind === 'learning'\)\)\s*return 'learning-test';/.test(source),
    'Expected complexity feedback\/learning links to map to learning-test role'
  );
}

function testAssumptionsModeUsesUnifiedModeColor() {
  assert(
    /var assumptionColor = COLORS\.assumptionArrow;/.test(source),
    'Expected assumptions mode to use one unified assumptions color'
  );
  assert(
    /marker:\s*'url\(#mix-map-arrow-assumption\)'/.test(source),
    'Expected assumptions mode to use dedicated assumption arrow marker'
  );
}

function testAssumptionMarkerDefined() {
  assert(
    /makeMarker\(defs,\s*'mix-map-arrow-assumption',\s*COLORS\.assumptionArrow\);/.test(source),
    'Expected assumption marker definition in renderGraph()'
  );
}

function testAssumptionsModeDisablesPulse() {
  assert(
    /if\s*\(mode === 'assumptions'\)\s*\{\s*return 0;\s*\}/.test(source),
    'Expected assumptions mode pulse logic to be disabled'
  );
}

function run() {
  testAssumptionRoleClassifierExists();
  testAssumptionsModeUsesUnifiedModeColor();
  testAssumptionMarkerDefined();
  testAssumptionsModeDisablesPulse();
  console.log('PASS: tests/test-mix-mapper-assumptions-contract.js');
}

run();
