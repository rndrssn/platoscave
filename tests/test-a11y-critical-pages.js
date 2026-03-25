'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function has(pattern, source) {
  return pattern.test(source);
}

const assess = read('modules/garbage-can/assess/index.html');
const explorer = read('modules/garbage-can/explorer/index.html');

// Skip link and main landmark
assert(has(/<a[^>]*class="skip-link"[^>]*href="#main-content"/i, assess), 'Assess: missing skip link to #main-content');
assert(has(/<main[^>]*id="main-content"/i, assess), 'Assess: missing main landmark id="main-content"');

assert(has(/<a[^>]*class="skip-link"[^>]*href="#main-content"/i, explorer), 'Explorer: missing skip link to #main-content');
assert(has(/<main[^>]*id="main-content"/i, explorer), 'Explorer: missing main landmark id="main-content"');

// Mobile nav toggle ARIA wiring
assert(has(/<button[^>]*class="nav-mobile-toggle"[^>]*aria-label="Toggle menu"[^>]*aria-controls="primary-nav"[^>]*aria-expanded="false"/i, assess), 'Assess: nav toggle ARIA contract missing');
assert(has(/<button[^>]*class="nav-mobile-toggle"[^>]*aria-label="Toggle menu"[^>]*aria-controls="primary-nav"[^>]*aria-expanded="false"/i, explorer), 'Explorer: nav toggle ARIA contract missing');

// Form semantics
assert(has(/<form[^>]*id="questionnaire"/i, assess), 'Assess: missing questionnaire form');
assert(has(/<fieldset[^>]*class="question-block"/i, assess), 'Assess: missing fieldset question groups');
assert(has(/<legend[^>]*class="question-text"/i, assess), 'Assess: missing legend in question groups');

// Results mini-nav ARIA state seed
assert(has(/results-nav-link--active[^"]*"[^>]*aria-current="(page|location)"/i, assess), 'Assess: results mini-nav missing initial aria-current state');

console.log('PASS: tests/test-a11y-critical-pages.js');
