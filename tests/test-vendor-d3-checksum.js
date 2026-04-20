'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const D3_PATH = path.join(__dirname, '..', 'assets', 'vendor', 'd3.v7.min.js');
const EXPECTED_SHA256 = 'f2094bbf6141b359722c4fe454eb6c4b0f0e42cc10cc7af921fc158fceb86539';

function sha256File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function run() {
  assert(fs.existsSync(D3_PATH), 'Vendored D3 file is missing: ' + D3_PATH);
  const actualSha = sha256File(D3_PATH);
  assert(
    actualSha === EXPECTED_SHA256,
    'Vendored D3 checksum mismatch. Expected ' + EXPECTED_SHA256 + ', got ' + actualSha
  );
  console.log('PASS: tests/test-vendor-d3-checksum.js');
}

run();
