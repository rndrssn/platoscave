'use strict';

const fs = require('fs');
const path = require('path');

const vizPath = path.join(__dirname, '..', 'gc-viz.js');
const tokensPath = path.join(__dirname, '..', 'css', 'tokens.css');
const mainCssPath = path.join(__dirname, '..', 'css', 'main.css');

const vizSource = fs.readFileSync(vizPath, 'utf8');
const tokensSource = fs.readFileSync(tokensPath, 'utf8');
const mainCss = fs.readFileSync(mainCssPath, 'utf8');

const REQUIRED_VIZ_TOKENS = [
  '--viz-fs-track-label',
  '--viz-fs-track-end',
  '--viz-fs-label',
  '--viz-fs-legend',
  '--viz-fs-co-label',
  '--viz-fs-top-legend',
  '--viz-lh-top',
  '--viz-lh-legend',
  '--viz-scale',
  '--viz-scale-mobile',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  assert(!/\.attr\(\s*['\"]font-size['\"]/.test(vizSource), 'gc-viz.js should not hardcode font-size via inline D3 attrs');
  assert(!/\.attr\(\s*['\"]font-family['\"]/.test(vizSource), 'gc-viz.js should not hardcode font-family via inline D3 attrs');
  assert(!/function\s+getGarbageCanDefaults\s*\(/.test(vizSource), 'gc-viz.js must not declare getGarbageCanDefaults (reserved for gc-simulation.js)');

  const missing = REQUIRED_VIZ_TOKENS.filter((token) => !tokensSource.includes(token + ':'));
  assert(missing.length === 0, 'Missing required visualization typography tokens: ' + missing.join(', '));

  assert(mainCss.includes("@import url('./gc-viz.css');"), 'css/main.css must import gc-viz.css');

  console.log('PASS: tests/test-gc-viz-typography-contract.js');
}

run();
