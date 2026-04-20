'use strict';

const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function assertPinnedAction(workflowSource, actionName, workflowPath) {
  const escaped = actionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('uses:\\s*' + escaped + '@([a-f0-9]{40})');
  assert(re.test(workflowSource), workflowPath + ' must pin ' + actionName + ' to a commit SHA');
}

function testPageShellCsp() {
  const source = read('scripts/lib/page-shell.js');
  assert(
    source.includes('meta http-equiv="Content-Security-Policy"'),
    'Expected page-shell to include a Content-Security-Policy meta tag'
  );
  assert(source.includes("default-src \\'self\\'"), 'Expected CSP to define default-src self');
  assert(source.includes("script-src \\'self\\'"), 'Expected CSP to define script-src self');
}

function testWorkflowPinning() {
  const ci = read('.github/workflows/ci.yml');
  const deploy = read('.github/workflows/deploy.yml');

  assertPinnedAction(ci, 'actions/checkout', '.github/workflows/ci.yml');
  assertPinnedAction(ci, 'actions/setup-node', '.github/workflows/ci.yml');

  assertPinnedAction(deploy, 'actions/checkout', '.github/workflows/deploy.yml');
  assertPinnedAction(deploy, 'actions/setup-node', '.github/workflows/deploy.yml');
  assertPinnedAction(deploy, 'actions/configure-pages', '.github/workflows/deploy.yml');
  assertPinnedAction(deploy, 'actions/upload-pages-artifact', '.github/workflows/deploy.yml');
  assertPinnedAction(deploy, 'actions/deploy-pages', '.github/workflows/deploy.yml');
}

function run() {
  testPageShellCsp();
  testWorkflowPinning();
  console.log('PASS: tests/test-security-hardening-contract.js');
}

run();
