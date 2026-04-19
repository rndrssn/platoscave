'use strict';

const fs = require('fs');
const path = require('path');

const htmlSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'the-descent', 'section-map', 'index.html'),
  'utf8'
);

const runtimeSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'the-descent', 'section-map', 'section-map.js'),
  'utf8'
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testScriptOrderContract() {
  const d3Pos = htmlSource.indexOf('assets/vendor/d3.v7.min.js');
  const navPos = htmlSource.indexOf('js/nav-controller.js');
  const runtimePos = htmlSource.indexOf('./section-map.js');

  assert(d3Pos > -1, 'Expected Section Map page to load local D3');
  assert(navPos > -1, 'Expected Section Map page to load nav controller');
  assert(runtimePos > -1, 'Expected Section Map page to load section-map runtime');
  assert(d3Pos < navPos, 'Expected D3 to load before nav controller');
  assert(navPos < runtimePos, 'Expected nav controller to load before section-map runtime');
}

function testDataContract() {
  const stationCount = (runtimeSource.match(/id:\s*'[^']+'\s*,\s*number:\s*\d+/g) || []).length;
  assert(stationCount === 8, 'Expected exactly 8 Section Map stations');

  assert(/const state = \{ mode: 'improvement' \};/.test(runtimeSource), 'Expected default mode to be improvement');
  assert(/anchorFor:\s*'improvement'/.test(runtimeSource), 'Expected improvement anchor station');
  assert(/anchorFor:\s*'new-feature'/.test(runtimeSource), 'Expected new-feature anchor station');

  ['narrative', 'brief', 'plan', 'story', 'ticket'].forEach((artifactId) => {
    assert(
      new RegExp(`\\{\\s*id:\\s*'${artifactId}'\\s*,\\s*label:`).test(runtimeSource),
      `Expected artifact '${artifactId}' in ARTIFACTS`
    );
  });
}

function testInteractionContract() {
  assert(/g\.attr\('tabindex',\s*0\)/.test(runtimeSource), 'Expected toggleable station rows to be keyboard-focusable');
  assert(/g\.on\('click',\s*toggle\);/.test(runtimeSource), 'Expected single click toggle binding on station row group');
  assert(!/hoverRect\.on\('click',\s*toggle\);/.test(runtimeSource), 'Expected no duplicate click toggle binding on hover rect');
  assert(/event\.key === 'Enter' \|\| event\.key === ' '/.test(runtimeSource), 'Expected Enter/Space keyboard toggle support');
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
