'use strict';

const fs = require('fs');
const path = require('path');
const { readCssWithImports } = require('./helpers/read-css-with-imports.js');

const tokensSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'tokens.css'), 'utf8');
const componentsSource = readCssWithImports(path.join(__dirname, '..', 'css', 'components.css'));
const coldThemeSource = fs.readFileSync(
  path.join(__dirname, '..', 'css', 'themes', 'decision-collision-cold.css'),
  'utf8'
);

const REQUIRED_NAV_TOKENS = [
  '--nav-surface',
  '--nav-surface-border',
  '--nav-surface-filter',
  '--nav-menu-surface',
  '--nav-menu-border',
  '--nav-menu-filter',
  '--nav-menu-active-surface',
  '--nav-submenu-surface',
  '--nav-submenu-filter',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testRootTokenDeclarations() {
  REQUIRED_NAV_TOKENS.forEach((token) => {
    assert(
      tokensSource.includes(token + ':'),
      'css/tokens.css is missing required nav token: ' + token
    );
  });
}

function testComponentsConsumeNavTokens() {
  const requiredUsages = [
    { label: '.main-nav background', pattern: /background:\s*var\(--nav-surface\)\s*;/ },
    { label: '.main-nav border', pattern: /border-bottom:\s*[0-9.]+px solid var\(--nav-surface-border\)\s*;/ },
    { label: '.main-nav filter', pattern: /backdrop-filter:\s*var\(--nav-surface-filter\)\s*;/ },
    { label: 'open menu background', pattern: /background:\s*var\(--nav-menu-surface\)\s*;/ },
    { label: 'open menu border', pattern: /border-top:\s*(?:[0-9.]+px solid var\(--nav-menu-border\)|none)\s*;/ },
    { label: 'open menu filter', pattern: /backdrop-filter:\s*var\(--nav-menu-filter\)\s*;/ },
    { label: 'open menu active surface', pattern: /background:\s*var\(--nav-menu-active-surface\)\s*;/ },
    { label: 'submenu background', pattern: /background:\s*var\(--nav-submenu-surface\)\s*;/ },
    { label: 'submenu filter', pattern: /backdrop-filter:\s*var\(--nav-submenu-filter\)\s*;/ },
  ];

  requiredUsages.forEach((usage) => {
    assert(
      usage.pattern.test(componentsSource),
      'css/components.css missing tokenized nav usage: ' + usage.label
    );
  });
}

function testDecisionCollisionColdOverridesTokensOnly() {
  const themeTokenBlockMatch = /html\[data-theme='decision-collision-cold'\]\s*\{([\s\S]*?)\n\}/.exec(
    coldThemeSource
  );
  assert(themeTokenBlockMatch, 'Could not locate token block for decision-collision-cold');

  const tokenBody = themeTokenBlockMatch[1];
  REQUIRED_NAV_TOKENS.forEach((token) => {
    assert(
      tokenBody.includes(token + ':'),
      'decision-collision-cold token block missing nav token override: ' + token
    );
  });

  assert(
    !/\[data-theme='decision-collision-cold'\]\s*\.main-nav\s*\{/.test(coldThemeSource),
    'decision-collision-cold should not override .main-nav directly; use --nav-* tokens'
  );
}

function run() {
  testRootTokenDeclarations();
  testComponentsConsumeNavTokens();
  testDecisionCollisionColdOverridesTokensOnly();
  console.log('PASS: tests/test-nav-theme-contract.js');
}

run();
