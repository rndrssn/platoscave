'use strict';

const assert = require('assert');
const { getDiagnosis } = require('../modules/garbage-can/runtime/gc-diagnosis');

const res0 = getDiagnosis('hierarchical', 'unsegmented', 0);
assert(/0% of problems remain unresolved/.test(res0.body), 'Expected 0% unresolved at unresolvedShare=0');

const resHalf = getDiagnosis('hierarchical', 'unsegmented', 0.5);
assert(/50% of problems remain unresolved/.test(resHalf.body), 'Expected 50% unresolved at unresolvedShare=0.5');

const res1 = getDiagnosis('hierarchical', 'unsegmented', 1);
assert(/100% of problems remain unresolved/.test(res1.body), 'Expected 100% unresolved at unresolvedShare=1');

const fallback = getDiagnosis('invalid', 'invalid', 0.25);
assert.strictEqual(typeof fallback.title, 'string');
assert(fallback.title.length > 0, 'Fallback diagnosis should include title');
assert(/25% of problems remain unresolved/.test(fallback.body), 'Fallback should still interpolate unresolved share');

console.log('PASS: tests/test-gc-diagnosis-share.js');
