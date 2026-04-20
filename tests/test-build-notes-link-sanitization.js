'use strict';

const path = require('path');
const { sanitizeHref, renderInline } = require(path.join(__dirname, '..', 'scripts', 'build-notes.js'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testSanitizeHref() {
  assert(sanitizeHref('https://example.com') === 'https://example.com', 'Expected https URL to pass');
  assert(sanitizeHref('/notes/test/') === '/notes/test/', 'Expected root-relative URL to pass');
  assert(sanitizeHref('../modules/') === '../modules/', 'Expected relative URL to pass');
  assert(sanitizeHref('#anchor') === '#anchor', 'Expected fragment URL to pass');
  assert(sanitizeHref('mailto:test@example.com') === 'mailto:test@example.com', 'Expected mailto URL to pass');

  assert(sanitizeHref('javascript:alert(1)') === '#', 'Expected javascript URL to be blocked');
  assert(sanitizeHref(' data:text/html,<svg>') === '#', 'Expected data URL to be blocked');
  assert(sanitizeHref('vbscript:msgbox(1)') === '#', 'Expected vbscript URL to be blocked');
  assert(sanitizeHref('ftp://example.com') === '#', 'Expected unsupported scheme to be blocked');
}

function testRenderInlineHrefOutput() {
  const safe = renderInline('[ok](https://example.com)');
  assert(/href="https:\/\/example\.com"/.test(safe), 'Expected safe href to be preserved');
  assert(/target="_blank"/.test(safe), 'Expected external href to open in new tab');
  assert(/rel="noopener noreferrer"/.test(safe), 'Expected external href rel hardening');

  const blocked = renderInline('[x](javascript:alert(1))');
  assert(/href="#"/.test(blocked), 'Expected blocked href to render as #');
  assert(!/javascript:/i.test(blocked), 'Expected blocked scheme to be removed from output');
}

function run() {
  testSanitizeHref();
  testRenderInlineHrefOutput();
  console.log('PASS: tests/test-build-notes-link-sanitization.js');
}

run();
