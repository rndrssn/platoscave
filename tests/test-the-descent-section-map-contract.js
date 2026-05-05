'use strict';

const fs = require('fs');
const path = require('path');

const htmlSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'ambiguity-clarity', 'section-map', 'index.html'),
  'utf8'
);

const runtimeSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'ambiguity-clarity', 'section-map', 'section-map.js'),
  'utf8'
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testScriptOrderContract() {
  const d3Pos = htmlSource.indexOf('assets/vendor/d3.v7.min.js');
  const navPos = htmlSource.indexOf('js/nav-controller.js');
  const runtimePos = htmlSource.indexOf('./section-map.js');

  assert(d3Pos > -1, 'Expected Document Map page to load local D3');
  assert(navPos > -1, 'Expected Document Map page to load nav controller');
  assert(runtimePos > -1, 'Expected Document Map page to load section-map runtime');
  assert(d3Pos < navPos, 'Expected D3 to load before nav controller');
  assert(navPos < runtimePos, 'Expected nav controller to load before section-map runtime');
}

function testDataContract() {
  const stationCount = (runtimeSource.match(/id:\s*'[^']+'\s*,\s*number:\s*\d+/g) || []).length;
  assert(stationCount === 8, 'Expected exactly 8 Document Map clarity concerns');

  assert(/const state = \{ mode: 'none' \};/.test(runtimeSource), 'Expected default mode to be neutral');
  assert(/anchorFor:\s*'improvement'/.test(runtimeSource), 'Expected improvement anchor concern');
  assert(/anchorFor:\s*'new-feature'/.test(runtimeSource), 'Expected new-feature anchor concern');

  ['narrative', 'brief', 'plan', 'story', 'ticket'].forEach((artifactId) => {
    assert(
      new RegExp(`\\{\\s*id:\\s*'${artifactId}'\\s*,\\s*label:`).test(runtimeSource),
      `Expected artifact '${artifactId}' in ARTIFACTS`
    );
  });
}

function testInteractionContract() {
  assert(/function setMode\(mode\)\s*\{[\s\S]*hideTip\(tooltipRef\);/.test(runtimeSource), 'Expected mode switch to hide any visible tooltip before rerender');
  assert(/data-anchor-mode="improvement"/.test(htmlSource), 'Expected Improvement Opportunity anchor control');
  assert(/data-anchor-mode="new-feature"/.test(htmlSource), 'Expected New Feature anchor control');
  assert(/aria-pressed="false"/.test(htmlSource), 'Expected anchor controls to initialize unpressed');
  assert(/querySelectorAll\('\[data-anchor-mode\]'\)/.test(runtimeSource), 'Expected runtime to bind anchor controls');
  assert(/setAttribute\('aria-pressed'/.test(runtimeSource), 'Expected runtime to update anchor button pressed state');
  assert(!/g\.attr\('tabindex',\s*0\)/.test(runtimeSource), 'Expected SVG rows not to own keyboard button behavior');
  assert(!/g\.on\('click',\s*toggle\);/.test(runtimeSource), 'Expected SVG rows not to own anchor click behavior');
  assert(!/hoverRect\.on\('click',\s*toggle\);/.test(runtimeSource), 'Expected no duplicate click toggle binding on hover rect');
}

function testPageWiringContract() {
  assert(/id="section-map-caption"/.test(htmlSource), 'Expected live caption element');
  assert(/id="section-map-tooltip"/.test(htmlSource), 'Expected tooltip host element');
  assert(/role="img"/.test(htmlSource), 'Expected SVG role img for accessibility');
}

function run() {
  testScriptOrderContract();
  testDataContract();
  testInteractionContract();
  testPageWiringContract();
  console.log('PASS: tests/test-the-descent-section-map-contract.js');
}

run();
