'use strict';
var assert = require('assert');
var diag = require('../modules/garbage-can/runtime/gc-diagnosis.js');

var structures = ['unsegmented', 'hierarchical', 'specialized'];
var passed = 0;
var failed = 0;

for (var d of structures) {
  for (var a of structures) {
    var key = d + '/' + a;
    var cluster = diag.DIAGNOSIS_CLUSTERS[key];
    try {
      assert(cluster, 'Missing cluster for ' + key);
      var result = diag.getDiagnosis(d, a, 0.5);
      assert(result.title, 'Empty title for ' + key);
      assert(result.body, 'Empty body for ' + key);
      console.log('PASS: ' + key + ' -> ' + cluster + ' -> "' + result.title + '"');
      passed++;
    } catch (e) {
      console.log('FAIL: ' + key + ' — ' + e.message);
      failed++;
    }
  }
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
